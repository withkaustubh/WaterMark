import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export interface Photo {
    id: string;
    uri: string;
    filename: string;
    creationTime?: string;
}

class PhotoManagerClass {
    private readonly ALBUM_NAME = 'WaterMark';

    /**
     * Convert MediaLibrary Asset to Photo interface
     */
    private assetToPhoto(asset: MediaLibrary.Asset): Photo {
        return {
            id: asset.id,
            uri: asset.uri,
            filename: asset.filename,
            creationTime: new Date(asset.creationTime).toLocaleString(),
        };
    }

    /**
     * Request necessary permissions for gallery access
     */
    async requestPermissions(): Promise<boolean> {
        try {
            const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();

            if (status === 'denied' && !canAskAgain) {
                Alert.alert('Permission Required', 'Please enable gallery access in system settings.');
            }

            return status === 'granted';
        } catch (error) {
            console.error("Permission Error:", error);
            return false;
        }
    }

    /**
     * Saves a photo to the permanent app gallery and returns it as Photo
     */
    async saveToGallery(localUri: string): Promise<Photo | null> {
        try {
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) return null;

            // Ensure the URI has proper file:// prefix
            const formattedUri = localUri.startsWith('file://') ? localUri : `file://${localUri}`;

            // 1. Create the asset
            const asset = await MediaLibrary.createAssetAsync(formattedUri);

            // 2. Find or create the specific album
            let album = await MediaLibrary.getAlbumAsync(this.ALBUM_NAME);

            if (!album) {
                // copyAsset: true avoids the "modify/delete" permission prompt on newer Android
                await MediaLibrary.createAlbumAsync(this.ALBUM_NAME, asset, true);
            } else {
                // copy: true avoids the "modify/delete" permission prompt on newer Android
                await MediaLibrary.addAssetsToAlbumAsync([asset], album, true);
            }

            // 3. Return as Photo interface
            return this.assetToPhoto(asset);
        } catch (error) {
            console.error("Save to Gallery Failed:", error);
            Alert.alert("Error", "Could not save photo to gallery.");
            return null;
        }
    }

    /**
     * Fetches all photos from the WaterMark album as Photo array
     * Note: Caller should ensure permissions are granted before calling
     */
    async getPhotos(first: number = 20, after?: string): Promise<{ assets: Photo[], endCursor?: string, hasNextPage: boolean }> {
        try {
            const album = await MediaLibrary.getAlbumAsync(this.ALBUM_NAME);
            if (!album) return { assets: [], hasNextPage: false };

            const result = await MediaLibrary.getAssetsAsync({
                album: album,
                sortBy: [[MediaLibrary.SortBy.creationTime, false]],
                first: first,
                after: after,
                mediaType: [MediaLibrary.MediaType.photo],
            });

            return {
                assets: result.assets.map(asset => this.assetToPhoto(asset)),
                endCursor: result.endCursor,
                hasNextPage: result.hasNextPage
            };
        } catch (error) {
            console.error("Fetch Photos Failed:", error);
            return { assets: [], hasNextPage: false };
        }
    }

    /**
     * Gets the latest photo from the WaterMark album
     * Note: Caller should ensure permissions are granted before calling
     */
    async getLatestPhoto(): Promise<Photo | null> {
        try {
            const album = await MediaLibrary.getAlbumAsync(this.ALBUM_NAME);
            if (!album) return null;

            const result = await MediaLibrary.getAssetsAsync({
                album: album,
                sortBy: [[MediaLibrary.SortBy.creationTime, false]],
                first: 1,
                mediaType: [MediaLibrary.MediaType.photo],
            });

            if (result.assets.length > 0) {
                return this.assetToPhoto(result.assets[0]);
            }

            return null;
        } catch (error) {
            console.error("Get Latest Photo Failed:", error);
            return null;
        }
    }

    /**
     * Deletes a photo from the system gallery
     */
    async deletePhoto(assetId: string): Promise<boolean> {
        try {
            const success = await MediaLibrary.deleteAssetsAsync([assetId]);
            return success;
        } catch (error) {
            console.error("Delete Failed:", error);
            return false;
        }
    }

    /**
     * Share a photo using the native system share sheet
     */
    async sharePhoto(uri: string): Promise<void> {
        try {
            const available = await Sharing.isAvailableAsync();
            if (!available) {
                Alert.alert('Error', 'Sharing is not supported on this device');
                return;
            }

            // Ensure URI is shared correctly (adding file:// prefix if missing)
            const formattedUri = uri.startsWith('file://') ? uri : `file://${uri}`;
            await Sharing.shareAsync(formattedUri);
        } catch (error) {
            console.error("Share Failed:", error);
            Alert.alert("Error", "Could not share photo.");
        }
    }
}

export const PhotoManager = new PhotoManagerClass();