import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role
    });

    logger.info('User logged in successfully', { email: user.email });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    logger.error('Login error', error);
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate a new token for token refresh
    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role
    });

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    logger.error('Get user profile error', error);
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update email if provided
    if (email && email !== user.email) {
      user.email = email;
    }

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to change password'
        });
      }

      const isValidPassword = await user.comparePassword(currentPassword);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      user.passwordHash = await User.hashPassword(newPassword);
    }

    await user.save();

    logger.info('User profile updated', { userId: user._id });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user.toJSON()
    });
  } catch (error) {
    logger.error('Update profile error', error);
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // We could implement token blacklisting here if needed
    logger.info('User logged out', { userId: req.user.userId });

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    logger.error('Logout error', error);
    next(error);
  }
};
