import { useRef, useState, useCallback } from 'react';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { SoundManager } from '../utils/SoundManager';
import { Photo } from '../utils/PhotoManager';

export function useCameraController(
    onPhotoCaptured: (path: string) => void,
    setLatestPhoto: (photo: Photo) => void,
) {
    // Device & Position
    const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back');
    const device = useCameraDevice(cameraPosition, {
        physicalDevices: [
            'ultra-wide-angle-camera',
            'wide-angle-camera',
            'telephoto-camera',
        ],
    });

    // Camera ref
    const camera = useRef<Camera>(null);

    // Camera state
    const [flash, setFlash] = useState<'auto' | 'on' | 'off'>('off');
    const [isTorchOn, setTorchOn] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [shutterFlashTrigger, setShutterFlashTrigger] = useState(0);

    // Handlers
    const toggleFlash = useCallback(() => {
        setFlash(current => {
            if (current === 'auto') return 'on';
            if (current === 'on') return 'off';
            return 'auto';
        });
    }, []);

    const toggleTorch = useCallback(() => {
        setTorchOn(torchOn => !torchOn);
    }, []);

    const toggleCamera = useCallback(() => {
        setCameraPosition(p => (p === 'back' ? 'front' : 'back'));
    }, []);

    const takePhoto = useCallback(async () => {
        if (!cameraReady || !camera.current || isCapturing) return;

        setIsCapturing(true);

        // 1. Immediate Feedback (Visual & Audio)
        setShutterFlashTrigger(prev => prev + 1);
        SoundManager.playShutterSound(); // Fire & Forget

        // 2. Capture
        try {
            const photo = await camera.current.takePhoto({
                flash: flash,
                enableShutterSound: false, // We handle sound manually
            });

            console.log('Photo captured:', photo.path);

            // 3. Optimistic Update
            const tempPhoto: Photo = {
                id: `temp-${Date.now()}`,
                uri: `file://${photo.path}`,
                filename: 'capturing...',
                creationTime: new Date().toLocaleString(),
            };

            setLatestPhoto(tempPhoto);
            setIsCapturing(false);

            // 4. Process in background
            onPhotoCaptured(photo.path);
        } catch (error) {
            console.error('Failed to take photo:', error);
            setIsCapturing(false);
        }
    }, [cameraReady, isCapturing, flash, onPhotoCaptured, setLatestPhoto]);

    return {
        camera,
        device,
        cameraPosition,
        flash,
        toggleFlash,
        isTorchOn,
        toggleTorch,
        cameraReady,
        setCameraReady,
        isCapturing,
        toggleCamera,
        takePhoto,
        shutterFlashTrigger,
    };
}
