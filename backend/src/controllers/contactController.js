import Contact from '../models/Contact.js';
import logger from '../utils/logger.js';

export const getAllContacts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, read, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = {};

    // Build read filter
    if (read !== undefined) {
      query.read = read === 'true';
    }

    // Build search query
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const contacts = await Contact.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Contact.countDocuments(query);

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    logger.error('Get contacts error', error);
    next(error);
  }
};

export const getContactById = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    logger.error('Get contact error', error);
    next(error);
  }
};

export const markContactAsRead = async (req, res, next) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    logger.info('Contact marked as read', { contactId: contact._id });

    res.json({
      success: true,
      message: 'Contact marked as read',
      data: contact
    });
  } catch (error) {
    logger.error('Mark contact as read error', error);
    next(error);
  }
};

export const respondToContact = async (req, res, next) => {
  try {
    const { response } = req.body;

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { 
        response,
        responded: true,
        read: true
      },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    logger.info('Contact response added', { contactId: contact._id });

    res.json({
      success: true,
      message: 'Response added successfully',
      data: contact
    });
  } catch (error) {
    logger.error('Respond to contact error', error);
    next(error);
  }
};

export const deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    logger.info('Contact deleted', { contactId: contact._id });

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    logger.error('Delete contact error', error);
    next(error);
  }
};

export const getContactStats = async (req, res, next) => {
  try {
    const totalContacts = await Contact.countDocuments();
    const unreadContacts = await Contact.countDocuments({ read: false });
    const respondedContacts = await Contact.countDocuments({ responded: true });

    const stats = {
      totalContacts,
      unreadContacts,
      respondedContacts,
      pendingResponse: totalContacts - respondedContacts
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Get contact stats error', error);
    next(error);
  }
};
