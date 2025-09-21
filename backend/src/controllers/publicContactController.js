import Contact from '../models/Contact.js';
import logger from '../utils/logger.js';

export const submitContact = async (req, res, next) => {
  try {
    const { name, phone, message } = req.body;

    // Validate required fields
    if (!name || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name and message are required'
      });
    }

    // Create new contact
    const contact = new Contact({
      name,
      phone: phone || '',
      message
    });

    await contact.save();

    logger.info('New contact submitted', { 
      contactId: contact._id, 
      name, 
      phone: phone || 'no phone provided'
    });

    res.status(201).json({
      success: true,
      message: 'Contact submitted successfully',
      data: {
        id: contact._id
      }
    });
  } catch (error) {
    logger.error('Submit contact error', error);
    next(error);
  }
};
