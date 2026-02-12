import { useState, useEffect, useCallback } from 'react';
import { PhotoManager, Photo } from '../utils/PhotoManager';

export const useGalleryManagement = () => {
    const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
    const [latestPhoto, setLatestPhoto] = useState<Photo | null>(null);
    const [showGallery, setShowGallery] = useState(false);
    const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);

    const [hasNextPage, setHasNextPage] = useState(false);
    const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const loadPhotos = useCallback(async () => {
        const hasPermission = await PhotoManager.requestPermissions();
        if (!hasPermission) return;

        const { assets, endCursor: newCursor, hasNextPage: next } = await PhotoManager.getPhotos(20);
        setAllPhotos(assets);
        setEndCursor(newCursor);
        setHasNextPage(next);

        const latest = await PhotoManager.getLatestPhoto();
        setLatestPhoto(latest);
    }, []);

    const loadMorePhotos = async () => {
        if (!hasNextPage || isLoadingMore) return;

        setIsLoadingMore(true);
        const { assets, endCursor: newCursor, hasNextPage: next } = await PhotoManager.getPhotos(20, endCursor);

        setAllPhotos(prev => [...prev, ...assets]);
        setEndCursor(newCursor);
        setHasNextPage(next);
        setIsLoadingMore(false);
    };

    useEffect(() => {
        loadPhotos();
    }, [loadPhotos]);

    const deletePhoto = async (photoId: string) => {
        await PhotoManager.deletePhoto(photoId);
        await loadPhotos();

        // If we deleted the currently viewed photo, close viewer
        if (viewingPhoto && viewingPhoto.id === photoId) {
            setViewingPhoto(null);
        }
    };

    const sharePhoto = async (photoUri: string) => {
        await PhotoManager.sharePhoto(photoUri);
    };

    return {
        allPhotos,
        latestPhoto,
        setLatestPhoto, // Exported to allow optimistic updates from camera
        showGallery,
        setShowGallery,
        viewingPhoto,
        setViewingPhoto,
        loadPhotos,
        loadMorePhotos,
        deletePhoto,
        sharePhoto
    };
};
