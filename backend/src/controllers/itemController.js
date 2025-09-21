import Item from '../models/Item.js';
import DailyMenu from '../models/DailyMenu.js';
import logger from '../utils/logger.js';
import { uploadImage, deleteImage, extractPublicId } from '../services/cloudinaryService.js';

export const getAllItems = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, active } = req.query;
    const query = {};

    // Build search query
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // For CMS: Don't filter by active status - show all items
    // For public API: Filter by active status if specified
    if (active !== undefined && !req.headers['x-cms-request']) {
      query.active = active === 'true';
    }

    console.log('Query being executed:', query);
    const items = await Item.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Item.countDocuments(query);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    logger.error('Get items error', error);
    next(error);
  }
};

export const getItemById = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    logger.error('Get item error', error);
    next(error);
  }
};

export const createItem = async (req, res, next) => {
  try {
    let imageData = null;
    
    // Handle image upload if file is present
    if (req.file) {
      try {
        imageData = await uploadImage(req.file.buffer);
        logger.info('Image uploaded for new item', { public_id: imageData.public_id });
      } catch (uploadError) {
        logger.error('Image upload failed during item creation', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload image'
        });
      }
    }

    // Parse allergens if it's a JSON string
    let allergens = req.body.allergens;
    if (typeof allergens === 'string') {
      try {
        allergens = JSON.parse(allergens);
      } catch (error) {
        logger.error('Failed to parse allergens:', error);
        allergens = [];
      }
    }

    const itemData = {
      ...req.body,
      active: req.body.active === 'true', // Convert string to boolean
      allergens: allergens,
      ...(imageData && {
        imageUrl: imageData.secure_url,
        imagePublicId: imageData.public_id
      })
    };

    const item = new Item(itemData);
    await item.save();

    logger.info('Item created', { itemId: item._id, name: item.name });

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: item
    });
  } catch (error) {
    logger.error('Create item error', error);
    next(error);
  }
};

export const updateItem = async (req, res, next) => {
  try {
    const existingItem = await Item.findById(req.params.id);
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    let imageData = null;
    let oldImagePublicId = existingItem.imagePublicId;

    // Handle image upload if new file is present
    if (req.file) {
      try {
        imageData = await uploadImage(req.file.buffer);
        logger.info('New image uploaded for item update', { public_id: imageData.public_id });
      } catch (uploadError) {
        logger.error('Image upload failed during item update', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload image'
        });
      }
    }

    // Parse allergens if it's a JSON string
    let allergens = req.body.allergens;
    if (typeof allergens === 'string') {
      try {
        allergens = JSON.parse(allergens);
      } catch (error) {
        logger.error('Failed to parse allergens:', error);
        allergens = [];
      }
    }

    const updateData = {
      ...req.body,
      active: req.body.active === 'true', // Convert string to boolean
      allergens: allergens,
      ...(imageData && {
        imageUrl: imageData.secure_url,
        imagePublicId: imageData.public_id
      })
    };

    // Handle image removal
    console.log('Remove image flag:', req.body.removeImage);
    
    let item;
    
    if (req.body.removeImage === 'true') {
      console.log('Removing image for item:', req.params.id);
      // Use $unset to completely remove the image fields
      item = await Item.findByIdAndUpdate(
        req.params.id,
        { 
          ...updateData,
          $unset: { imageUrl: 1, imagePublicId: 1 }
        },
        { new: true, runValidators: true }
      );
    } else {
      item = await Item.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );
    }

    // Delete old image from Cloudinary if new image was uploaded or image is being removed
    if ((imageData || req.body.removeImage === 'true') && oldImagePublicId) {
      try {
        await deleteImage(oldImagePublicId);
        logger.info('Old image deleted from Cloudinary', { 
          public_id: oldImagePublicId,
          reason: imageData ? 'replaced' : 'removed'
        });
      } catch (deleteError) {
        logger.error('Failed to delete old image from Cloudinary', deleteError);
        // Don't fail the request if old image deletion fails
      }
    }

    logger.info('Item updated', { itemId: item._id, name: item.name });

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: item
    });
  } catch (error) {
    logger.error('Update item error', error);
    next(error);
  }
};

export const deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if item is used in any daily menu sections
    const dailyMenusWithItem = await DailyMenu.find({
      $or: [
        { items: item._id },
        { 'sections.itemIds': item._id }
      ]
    }).populate('sections.itemIds', 'name');

    const affectedMenus = [];
    
    if (dailyMenusWithItem.length > 0) {
      // Remove item from all daily menu sections and items arrays
      for (const menu of dailyMenusWithItem) {
        let menuUpdated = false;
        
        // Remove from main items array
        if (menu.items.includes(item._id)) {
          menu.items = menu.items.filter(id => !id.equals(item._id));
          menuUpdated = true;
        }
        
        // Remove from all sections
        menu.sections.forEach(section => {
          if (section.itemIds.includes(item._id)) {
            section.itemIds = section.itemIds.filter(id => !id.equals(item._id));
            menuUpdated = true;
          }
        });
        
        if (menuUpdated) {
          await menu.save();
          affectedMenus.push({
            dayOfWeek: menu.dayOfWeek,
            sections: menu.sections.filter(section => section.itemIds.length > 0)
          });
          logger.info('Item removed from daily menu', { 
            itemId: item._id, 
            itemName: item.name,
            menuId: menu._id,
            dayOfWeek: menu.dayOfWeek
          });
        }
      }
    }

    // Delete image from Cloudinary if it exists
    if (item.imagePublicId) {
      try {
        await deleteImage(item.imagePublicId);
        logger.info('Image deleted from Cloudinary', { public_id: item.imagePublicId });
      } catch (deleteError) {
        logger.error('Failed to delete image from Cloudinary', deleteError);
        // Don't fail the request if image deletion fails
      }
    }

    // Delete the item from database
    await Item.findByIdAndDelete(req.params.id);

    logger.info('Item deleted', { 
      itemId: item._id, 
      name: item.name,
      affectedMenus: affectedMenus.length
    });

    res.json({
      success: true,
      message: 'Item deleted successfully',
      data: {
        affectedMenus: affectedMenus,
        message: affectedMenus.length > 0 
          ? `Item was removed from ${affectedMenus.length} daily menu(s) before deletion`
          : 'Item was not used in any daily menus'
      }
    });
  } catch (error) {
    logger.error('Delete item error', error);
    next(error);
  }
};

export const checkItemUsage = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if item is used in any daily menu sections
    const dailyMenusWithItem = await DailyMenu.find({
      $or: [
        { items: item._id },
        { 'sections.itemIds': item._id }
      ]
    }).select('dayOfWeek sections.name sections.itemIds');

    const affectedMenus = dailyMenusWithItem.map(menu => ({
      dayOfWeek: menu.dayOfWeek,
      sections: menu.sections
        .filter(section => section.itemIds.some(id => id.equals(item._id)))
        .map(section => section.name)
    }));

    res.json({
      success: true,
      data: {
        itemId: item._id,
        itemName: item.name,
        isUsed: affectedMenus.length > 0,
        affectedMenus: affectedMenus
      }
    });
  } catch (error) {
    logger.error('Check item usage error', error);
    next(error);
  }
};

export const toggleItemStatus = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    item.active = !item.active;
    await item.save();

    logger.info('Item status toggled', { itemId: item._id, active: item.active });

    res.json({
      success: true,
      message: `Item ${item.active ? 'activated' : 'deactivated'} successfully`,
      data: item
    });
  } catch (error) {
    logger.error('Toggle item status error', error);
    next(error);
  }
};
