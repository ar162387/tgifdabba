import DailyMenu from '../models/DailyMenu.js';
import Item from '../models/Item.js';
import logger from '../utils/logger.js';

export const getAllDailyMenus = async (req, res, next) => {
  try {
    const dailyMenus = await DailyMenu.find()
      .populate('items', 'name price active')
      .populate('sections.itemIds', 'name price active imageUrl')
      .sort({ dayOfWeek: 1 });

    res.json({
      success: true,
      data: dailyMenus
    });
  } catch (error) {
    logger.error('Get daily menus error', error);
    next(error);
  }
};

export const getDailyMenuByDay = async (req, res, next) => {
  try {
    const { day } = req.params;
    const dailyMenu = await DailyMenu.findOne({ dayOfWeek: day })
      .populate('items', 'name description price allergens active')
      .populate('sections.itemIds', 'name description price allergens active imageUrl');

    if (!dailyMenu) {
      return res.status(404).json({
        success: false,
        message: 'Daily menu not found for this day'
      });
    }

    res.json({
      success: true,
      data: dailyMenu
    });
  } catch (error) {
    logger.error('Get daily menu error', error);
    next(error);
  }
};

export const createDailyMenu = async (req, res, next) => {
  try {
    const { dayOfWeek, items, sections } = req.body;

    // Check if menu already exists for this day
    const existingMenu = await DailyMenu.findOne({ dayOfWeek });
    if (existingMenu) {
      return res.status(400).json({
        success: false,
        message: 'Daily menu already exists for this day'
      });
    }

    // Validate that all items exist (allow inactive items for CMS)
    if (items && items.length > 0) {
      const itemIds = items.map(item => item._id || item);
      const validItems = await Item.find({ _id: { $in: itemIds } });
      if (validItems.length !== itemIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Some items are invalid'
        });
      }
    }

    // Validate items in sections (allow inactive items for CMS)
    if (sections && sections.length > 0) {
      const allSectionItemIds = sections.flatMap(section => section.itemIds || []);
      if (allSectionItemIds.length > 0) {
        const validItems = await Item.find({ _id: { $in: allSectionItemIds } });
        if (validItems.length !== allSectionItemIds.length) {
          return res.status(400).json({
            success: false,
            message: 'Some items in sections are invalid'
          });
        }
      }
    }

    const dailyMenu = new DailyMenu({
      dayOfWeek,
      items: items || [],
      sections: sections || []
    });

    await dailyMenu.save();
    await dailyMenu.populate('items', 'name price active');
    await dailyMenu.populate('sections.itemIds', 'name price active imageUrl');

    logger.info('Daily menu created', { dayOfWeek, menuId: dailyMenu._id });

    res.status(201).json({
      success: true,
      message: 'Daily menu created successfully',
      data: dailyMenu
    });
  } catch (error) {
    logger.error('Create daily menu error', error);
    next(error);
  }
};

export const updateDailyMenu = async (req, res, next) => {
  try {
    const { items, sections, published } = req.body;
    logger.info('Update daily menu request', { 
      menuId: req.params.id, 
      items: items?.length || 0, 
      sections: sections?.length || 0,
      sectionsData: sections 
    });

    // Validate items if provided (allow inactive items for CMS)
    if (items && items.length > 0) {
      const itemIds = items.map(item => item._id || item);
      const validItems = await Item.find({ _id: { $in: itemIds } });
      if (validItems.length !== itemIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Some items are invalid'
        });
      }
    }

    // Validate items in sections if provided
    if (sections && sections.length > 0) {
      const allSectionItemIds = sections.flatMap(section => section.itemIds || []);
      logger.info('Validating section items', { 
        allSectionItemIds, 
        count: allSectionItemIds.length 
      });
      
      if (allSectionItemIds.length > 0) {
        const validItems = await Item.find({ _id: { $in: allSectionItemIds } });
        logger.info('Validation result', { 
          validItemsCount: validItems.length, 
          requestedCount: allSectionItemIds.length,
          validItemIds: validItems.map(item => item._id.toString())
        });
        
        if (validItems.length !== allSectionItemIds.length) {
          // Find which items are invalid
          const validItemIds = validItems.map(item => item._id.toString());
          const invalidItemIds = allSectionItemIds.filter(id => !validItemIds.includes(id.toString()));
          
          logger.error('Item validation failed', {
            validItemsCount: validItems.length,
            requestedCount: allSectionItemIds.length,
            validItemIds: validItemIds,
            requestedItemIds: allSectionItemIds.map(id => id.toString()),
            invalidItemIds: invalidItemIds.map(id => id.toString())
          });
          return res.status(400).json({
            success: false,
            message: 'Some items in sections are invalid',
            invalidItemIds: invalidItemIds.map(id => id.toString())
          });
        }
      }
    }

    // Prepare update data - only update fields that are provided
    const updateData = {};
    if (items !== undefined) updateData.items = items;
    if (sections !== undefined) updateData.sections = sections;
    if (published !== undefined) updateData.published = published;

    logger.info('Updating daily menu with data', updateData);

    const dailyMenu = await DailyMenu.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('items', 'name price active')
      .populate('sections.itemIds', 'name price active imageUrl');

    if (!dailyMenu) {
      return res.status(404).json({
        success: false,
        message: 'Daily menu not found'
      });
    }

    logger.info('Daily menu updated', { menuId: dailyMenu._id, dayOfWeek: dailyMenu.dayOfWeek });

    res.json({
      success: true,
      message: 'Daily menu updated successfully',
      data: dailyMenu
    });
  } catch (error) {
    logger.error('Update daily menu error', { 
      error: error.message, 
      stack: error.stack,
      menuId: req.params.id,
      body: req.body
    });
    
    // If it's a validation error, return a more specific message
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    next(error);
  }
};

export const deleteDailyMenu = async (req, res, next) => {
  try {
    const dailyMenu = await DailyMenu.findByIdAndDelete(req.params.id);

    if (!dailyMenu) {
      return res.status(404).json({
        success: false,
        message: 'Daily menu not found'
      });
    }

    logger.info('Daily menu deleted', { menuId: dailyMenu._id, dayOfWeek: dailyMenu.dayOfWeek });

    res.json({
      success: true,
      message: 'Daily menu deleted successfully'
    });
  } catch (error) {
    logger.error('Delete daily menu error', error);
    next(error);
  }
};

export const publishDailyMenu = async (req, res, next) => {
  try {
    const dailyMenu = await DailyMenu.findByIdAndUpdate(
      req.params.id,
      { published: true },
      { new: true, runValidators: true }
    )
      .populate('items', 'name price active')
      .populate('sections.itemIds', 'name price active imageUrl');

    if (!dailyMenu) {
      return res.status(404).json({
        success: false,
        message: 'Daily menu not found'
      });
    }

    logger.info('Daily menu published', { menuId: dailyMenu._id, dayOfWeek: dailyMenu.dayOfWeek });

    res.json({
      success: true,
      message: 'Daily menu published successfully',
      data: dailyMenu
    });
  } catch (error) {
    logger.error('Publish daily menu error', error);
    next(error);
  }
};
