import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dmd858nl3',
  api_key: '594893595198927',
  api_secret: 'NjSjRKjMXiIbupROQTXZSqMnf3k',
  secure: true
});

/**
 * Upload image to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} folder - The folder to upload to (optional)
 * @returns {Promise<Object>} - Upload result with public_id and secure_url
 */
export const uploadImage = async (fileBuffer, folder = 'items') => {
  try {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'center' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            logger.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            logger.info('Image uploaded successfully:', { public_id: result.public_id });
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              width: result.width,
              height: result.height
            });
          }
        }
      ).end(fileBuffer);
    });
  } catch (error) {
    logger.error('Upload image error:', error);
    throw error;
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteImage = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error('Public ID is required for deletion');
    }

    const result = await cloudinary.uploader.destroy(publicId);
    logger.info('Image deleted successfully:', { public_id: publicId, result });
    return result;
  } catch (error) {
    logger.error('Delete image error:', error);
    throw error;
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - The Cloudinary URL
 * @returns {string|null} - The public ID or null if not found
 */
export const extractPublicId = (url) => {
  if (!url) return null;
  
  try {
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    const publicId = filename.split('.')[0];
    return publicId;
  } catch (error) {
    logger.error('Error extracting public ID:', error);
    return null;
  }
};

export default cloudinary;
