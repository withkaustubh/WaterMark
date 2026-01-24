// PhotoManager utility for handling photo operations
// This is a simplified version that works with local file system
// For full functionality, install: expo-media-library, expo-file-system, expo-sharing

import { Platform } from 'react-native';

export interface Photo {
    id: string;
    uri: string;
    filename: string;
    creationTime?: number;
}

class PhotoManagerClass {
    private photos: Photo[] = [];

    /**
     * Save a photo to the local storage
     * In production, this should save to the device gallery using expo-media-library
     */
    async savePhoto(photoPath: string): Promise<Photo> {
        const photo: Photo = {
            id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            uri: `file://${photoPath}`,
            filename: `WaterMark_${Date.now()}.jpg`,
            creationTime: Date.now(),
        };

        this.photos.unshift(photo); // Add to beginning
        return photo;
    }

    /**
     * Get all saved photos
     * In production, this should query expo-media-library
     */
    async getPhotos(): Promise<Photo[]> {
        return [...this.photos];
    }

    /**
     * Get the most recent photo
     */
    async getLatestPhoto(): Promise<Photo | null> {
        return this.photos[0] || null;
    }

    /**
     * Delete a photo by ID
     * In production, this should delete from device gallery
     */
    async deletePhoto(photoId: string): Promise<void> {
        const index = this.photos.findIndex(p => p.id === photoId);
        if (index !== -1) {
            this.photos.splice(index, 1);
        }
    }

    /**
     * Request media library permissions
     * For production use with expo-media-library:
     * 
     * import * as MediaLibrary from 'expo-media-library';
     * 
     * async requestPermissions(): Promise<boolean> {
     *   const { status } = await MediaLibrary.requestPermissionsAsync();
     *   return status === 'granted';
     * }
     */
    async requestPermissions(): Promise<boolean> {
        // Return true for development
        // In production, implement actual permission request
        return true;
    }

    /**
     * Save photo to device gallery (production implementation)
     * Requires expo-media-library and expo-file-system
     * 
     * Example implementation:
     * 
     * import * as MediaLibrary from 'expo-media-library';
     * import * as FileSystem from 'expo-file-system';
     * 
     * async saveToGallery(photoPath: string): Promise<void> {
     *   const permission = await this.requestPermissions();
     *   if (!permission) throw new Error('Permission denied');
     *   
     *   const asset = await MediaLibrary.createAssetAsync(photoPath);
     *   const album = await MediaLibrary.getAlbumAsync('WaterMark');
     *   
     *   if (album == null) {
     *     await MediaLibrary.createAlbumAsync('WaterMark', asset, false);
     *   } else {
     *     await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
     *   }
     * }
     */
    async saveToGallery(photoPath: string): Promise<void> {
        console.log('Photo would be saved to gallery:', photoPath);
        // Implement with expo-media-library when packages are installed
    }

    /**
     * Share a photo using the system share sheet
     * Requires expo-sharing
     * 
     * Example implementation:
     * 
     * import * as Sharing from 'expo-sharing';
     * 
     * async sharePhoto(photoUri: string): Promise<void> {
     *   if (!(await Sharing.isAvailableAsync())) {
     *     alert('Sharing is not available on this device');
     *     return;
     *   }
     *   await Sharing.shareAsync(photoUri);
     * }
     */
    async sharePhoto(photoUri: string): Promise<void> {
        console.log('Photo would be shared:', photoUri);
        // Implement with expo-sharing when packages are installed
    }

    /**
     * Clear all photos from memory
     * Useful for testing
     */
    clearAll(): void {
        this.photos = [];
    }
}

export const PhotoManager = new PhotoManagerClass();
