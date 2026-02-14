import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    runOnJS
} from 'react-native-reanimated';

interface ShutterFlashProps {
    trigger: number; // Increment to trigger animation
    onAnimationEnd?: () => void;
}

export default function ShutterFlash({ trigger, onAnimationEnd }: ShutterFlashProps) {
    const opacity = useSharedValue(0);

    const style = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    useEffect(() => {
        if (trigger > 0) {
            opacity.value = withSequence(
                withTiming(1, { duration: 50 }), // Fast flash in
                withTiming(0, { duration: 150 }, (finished) => { // Slightly slower fade out
                    if (finished && onAnimationEnd) {
                        runOnJS(onAnimationEnd)();
                    }
                })
            );
        }
    }, [trigger]);

    return (
        <Animated.View
            style={[styles.overlay, style]}
            pointerEvents="none"
        />
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'black', // Keeping it classic black shutter
        zIndex: 9999,
    },
});
