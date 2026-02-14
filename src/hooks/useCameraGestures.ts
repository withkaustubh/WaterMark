import React, { useEffect, useCallback } from 'react';
import { Camera, CameraDevice } from 'react-native-vision-camera';
import Animated, {
    useSharedValue,
    withSequence,
    withTiming,
    withSpring,
    runOnJS,
    useAnimatedProps,
} from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

export function useCameraGestures(
    device: CameraDevice | undefined,
    cameraReady: boolean,
    cameraRef: React.RefObject<Camera | null>,
) {
    // Focus animation values
    const focusX = useSharedValue(0);
    const focusY = useSharedValue(0);
    const focusOpacity = useSharedValue(0);
    const focusScale = useSharedValue(1);

    // Zoom values
    const zoom = useSharedValue(device?.neutralZoom ?? 1);
    const startZoom = useSharedValue(0);

    // Reset zoom when device changes
    useEffect(() => {
        zoom.value = device?.neutralZoom ?? 1;
    }, [device?.neutralZoom, zoom]);

    // Focus handler
    const handleFocus = useCallback(
        async (x: number, y: number) => {
            if (!cameraReady || !cameraRef.current) return;

            // Visual
            focusX.value = x;
            focusY.value = y;
            focusOpacity.value = 1;
            focusScale.value = 1.5;

            // Animate
            focusScale.value = withSpring(1, { damping: 10, stiffness: 200 });
            focusOpacity.value = withSequence(
                withTiming(1, { duration: 200 }),
                withTiming(0, { duration: 800 }),
            );

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            try {
                await cameraRef.current.focus({ x, y });
            } catch (e) {
                console.log('Focus failed:', e);
            }
        },
        [cameraReady, cameraRef, focusX, focusY, focusOpacity, focusScale],
    );

    // Gestures
    const tapGesture = Gesture.Tap().onStart((e) => {
        runOnJS(handleFocus)(e.x, e.y);
    });

    const pinchGesture = Gesture.Pinch()
        .onStart(() => {
            startZoom.value = zoom.value;
        })
        .onUpdate((e) => {
            const newZoom = startZoom.value * e.scale;
            const minZoom = device?.minZoom ?? 1;
            const maxZoom = Math.min(device?.maxZoom ?? 5, 20);
            zoom.value = Math.max(minZoom, Math.min(newZoom, maxZoom));
        });

    const composedGesture = Gesture.Simultaneous(tapGesture, pinchGesture);

    const animatedProps = useAnimatedProps(() => ({
        zoom: zoom.value,
    }));

    return {
        composedGesture,
        animatedProps,
        focusX,
        focusY,
        focusOpacity,
        focusScale,
    };
}
