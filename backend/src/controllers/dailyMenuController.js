import DailyMenu from '../models/DailyMenu.js';
import Item from '../models/Item.js';
import logger from '../utils/logger.js';

export const getAllDailyMenus = async (req, res, next) => {
  try {
    const dailyMenus = await DailyMenu.find()
      .populate('items', 'name price active')
      .populate('sections.items', 'name price active')
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
      .populate('sections.items', 'name description price allergens active');

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

    // Validate that all items exist and are active
    if (items && items.length > 0) {
      const itemIds = items.map(item => item._id || item);
      const validItems = await Item.find({ _id: { $in: itemIds }, active: true });
      if (validItems.length !== itemIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Some items are invalid or inactive'
        });
      }
    }

    const dailyMenu = new DailyMenu({
      dayOfWeek,
      items: items || [],
      sections: sections || []
    });

    await dailyMenu.save();
    await dailyMenu.populate('items', 'name price active');
    await dailyMenu.populate('sections.items', 'name price active');

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

    // Validate items if provided
    if (items && items.length > 0) {
      const itemIds = items.map(item => item._id || item);
      const validItems = await Item.find({ _id: { $in: itemIds }, active: true });
      if (validItems.length !== itemIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Some items are invalid or inactive'
        });
      }
    }

    const dailyMenu = await DailyMenu.findByIdAndUpdate(
      req.params.id,
      { items, sections, published },
      { new: true, runValidators: true }
    )
      .populate('items', 'name price active')
      .populate('sections.items', 'name price active');

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
    logger.error('Update daily menu error', error);
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
      .populate('sections.items', 'name price active');

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
