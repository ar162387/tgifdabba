import rateLimit from 'express-rate-limit';
import { config } from '../../config.js';

// General API rate limiting
export const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for contact form
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 contact submissions per hour
  message: {
    success: false,
    message: 'Too many contact submissions, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for order creation
export const createOrder = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 order creations per 15 minutes
  message: {
    success: false,
    message: 'Too many order attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General rate limiting for other endpoints
export const general = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Lenient rate limiting for notification endpoints
export const notificationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per minute
  message: {
    success: false,
    message: 'Too many notification requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Very lenient rate limiting for realtime/notification data
export const realtimeLimiter = rateLimit({
  windowMs: 3 * 60 * 1000, // 1 minute
  max: 180, // limit each IP to 60 requests per minute
  message: {
    success: false,
    message: 'Too many realtime requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
