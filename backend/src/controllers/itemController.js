import Item from '../models/Item.js';
import logger from '../utils/logger.js';

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

    if (active !== undefined) {
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
    const item = new Item(req.body);
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
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
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
    const item = await Item.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    logger.info('Item deleted', { itemId: item._id, name: item.name });

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    logger.error('Delete item error', error);
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
