import { Pressable, View, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSpring,
    Easing,
    cancelAnimation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';

interface CaptureButtonProps {
    onPress: () => void;
    disabled?: boolean;
    isCapturing?: boolean;
}

export default function CaptureButton({ onPress, disabled = false, isCapturing = false }: CaptureButtonProps) {
    // Shared values for animations
    const rotation = useSharedValue(0);
    const scale = useSharedValue(1);
    const innerScale = useSharedValue(1);
    const progress = useSharedValue(0);

    // Idle rotation animation - continuous subtle rotation
    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(360, {
                duration: 10000,
                easing: Easing.linear,
            }),
            -1, // infinite repeat
            false
        );

        return () => {
            cancelAnimation(rotation);
        };
    }, []);

    // Capture progress animation
    useEffect(() => {
        if (isCapturing) {
            progress.value = withTiming(1, { duration: 800 });
        } else {
            progress.value = withTiming(0, { duration: 300 });
        }
    }, [isCapturing]);

    const handlePressIn = () => {
        if (disabled) return;

        // Haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Expand outer ring
        scale.value = withSpring(1.15, {
            damping: 10,
            stiffness: 300,
        });

        // Shrink inner circle
        innerScale.value = withSpring(0.85, {
            damping: 10,
            stiffness: 300,
        });
    };

    const handlePressOut = () => {
        if (disabled) return;

        // Return to normal
        scale.value = withSpring(1, {
            damping: 12,
            stiffness: 400,
        });

        innerScale.value = withSpring(1, {
            damping: 12,
            stiffness: 400,
        });
    };

    const handlePress = () => {
        if (disabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onPress();
    };

    // Animated styles
    const outerRingStyle = useAnimatedStyle(() => ({
        transform: [
            { rotate: `${rotation.value}deg` },
            { scale: scale.value },
        ],
        opacity: disabled ? 0.5 : 1,
    }));

    const innerCircleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: innerScale.value }],
    }));

    const progressStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
        transform: [{ scale: progress.value }],
    }));

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            disabled={disabled}
            style={styles.container}
        >
            {/* Outer Ring with Rotating Gradient */}
            <Animated.View style={[styles.outerRing, outerRingStyle]}>
                <LinearGradient
                    colors={Colors.captureRingGradient as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientRing}
                />
            </Animated.View>

            {/* Progress Indicator */}
            {isCapturing && (
                <Animated.View style={[styles.progressRing, progressStyle]} />
            )}

            {/* Inner Circle */}
            <Animated.View style={[styles.innerCircle, innerCircleStyle]} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    outerRing: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 4,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    gradientRing: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 40,
    },
    progressRing: {
        position: 'absolute',
        width: 84,
        height: 84,
        borderRadius: 42,
        borderWidth: 3,
        borderColor: Colors.pink,
        backgroundColor: 'transparent',
    },
    innerCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});
