import { useCallback, useRef, useEffect } from 'react';
import { PhotoManager, Photo } from '../utils/PhotoManager';
import { SkiaPhotoProcessor } from '../utils/SkiaPhotoProcessor';
import { LocationData } from '../utils/LocationManager';

const MAX_CONCURRENT_PROCESSING = 3;

export function usePhotoProcessing(
    watermarkEnabled: boolean,
    watermarkColor: string,
    currentLocation: LocationData | null,
    setLatestPhoto: (photo: Photo) => void,
    loadPhotos: () => void,
) {
    // C2 fix: Use refs to always read the latest values inside the async callback,
    // avoiding stale closures when location/settings update after the callback was created.
    const watermarkEnabledRef = useRef(watermarkEnabled);
    const watermarkColorRef = useRef(watermarkColor);
    const locationRef = useRef(currentLocation);

    useEffect(() => { watermarkEnabledRef.current = watermarkEnabled; }, [watermarkEnabled]);
    useEffect(() => { watermarkColorRef.current = watermarkColor; }, [watermarkColor]);
    useEffect(() => { locationRef.current = currentLocation; }, [currentLocation]);

    // S1 fix: Concurrency guard to prevent processing overload from rapid capture spam
    const processingCount = useRef(0);

    const processAndSave = useCallback(
        async (originalPath: string) => {
            // Drop if too many concurrent processing tasks
            if (processingCount.current >= MAX_CONCURRENT_PROCESSING) {
                console.warn('Processing queue full, dropping photo:', originalPath);
                return;
            }

            processingCount.current++;
            try {
                let finalPath = originalPath;

                // Read latest values from refs (not stale closure)
                const enabled = watermarkEnabledRef.current;
                const color = watermarkColorRef.current;
                const location = locationRef.current;

                if (enabled) {
                    const processedUri = await SkiaPhotoProcessor.processPhoto({
                        uri: `file://${originalPath}`,
                        date: new Date().toLocaleString(),
                        location: location?.formatted,
                        address: location?.address,
                        watermarkColor: color,
                    });
                    if (processedUri) {
                        finalPath = processedUri;
                    }
                }

                const savedPhoto = await PhotoManager.saveToGallery(finalPath);
                if (savedPhoto) {
                    setLatestPhoto(savedPhoto);
                    loadPhotos();
                }
            } catch (err) {
                console.error('Processing failed:', err);
            } finally {
                processingCount.current--;
            }
        },
        [setLatestPhoto, loadPhotos],
    );

    return { processAndSave };
}
