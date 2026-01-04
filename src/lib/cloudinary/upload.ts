/**
 * Cloudinary Upload Service
 * Handles avatar image uploads to Cloudinary
 */

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload avatar image to Cloudinary.
 * @param base64Data - Base64 encoded image data (with or without data URI prefix)
 * @param playerAddress - Player's wallet address (used for unique naming)
 * @returns Secure URL of the uploaded image
 */
export async function uploadAvatar(
    base64Data: string,
    playerAddress: string
): Promise<string> {
    // Ensure the data has proper prefix for Cloudinary
    const dataUri = base64Data.startsWith('data:')
        ? base64Data
        : `data:image/png;base64,${base64Data}`;

    // Generate a unique public ID based on player address
    const publicId = `kaspaclash/avatars/${sanitizeAddress(playerAddress)}`;

    try {
        const result = await cloudinary.uploader.upload(dataUri, {
            public_id: publicId,
            overwrite: true,
            resource_type: 'image',
            transformation: [
                { width: 256, height: 256, crop: 'fill', gravity: 'face' },
                { quality: 'auto', fetch_format: 'auto' },
            ],
        });

        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload avatar image');
    }
}

/**
 * Delete avatar image from Cloudinary.
 * @param playerAddress - Player's wallet address
 */
export async function deleteAvatar(playerAddress: string): Promise<void> {
    const publicId = `kaspaclash/avatars/${sanitizeAddress(playerAddress)}`;

    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        // Don't throw - deletion failure is not critical
    }
}

/**
 * Sanitize wallet address for use as Cloudinary public ID.
 * Removes special characters that could cause issues.
 */
function sanitizeAddress(address: string): string {
    return address.replace(/[^a-zA-Z0-9]/g, '_');
}

export { cloudinary };
