import { Pressable, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useEffect, useState, useRef } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withRepeat,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface PhotoThumbnailProps {
    photoUri: string | null;
    onPress: () => void;
    isLoading?: boolean;
}

export default function PhotoThumbnail({ photoUri, onPress, isLoading = false }: PhotoThumbnailProps) {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0);
    const translateX = useSharedValue(-50);
    const rotateY = useSharedValue(0);
    const shimmerTranslate = useSharedValue(-100);
    const [hasAppeared, setHasAppeared] = useState(false);
    const previousPhotoUri = useRef<string | null>(null);

    // Entrance animation when photo appears
    useEffect(() => {
        if (photoUri && !hasAppeared) {
            opacity.value = withTiming(1, { duration: 300 });
            translateX.value = withSpring(0, {
                damping: 30,
                stiffness: 200,
            });
            setHasAppeared(true);
        }
    }, [photoUri, hasAppeared]);

    // Flip animation when photo updates (not on first appearance)
    useEffect(() => {
        if (photoUri && hasAppeared && previousPhotoUri.current !== null && previousPhotoUri.current !== photoUri) {
            rotateY.value = withSequence(
                withTiming(90, { duration: 100 }),
                withTiming(0, { duration: 100 })
            );
        }
        previousPhotoUri.current = photoUri;
    }, [photoUri, hasAppeared]);

    // Shimmer animation when loading
    useEffect(() => {
        if (isLoading) {
            shimmerTranslate.value = withRepeat(
                withTiming(100, {
                    duration: 1500,
                    easing: Easing.linear,
                }),
                -1,
                false
            );
        }
    }, [isLoading]);

    const handlePressIn = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        scale.value = withSpring(0.9, {
            damping: 10,
            stiffness: 300,
        });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, {
            damping: 12,
            stiffness: 400,
        });
    };

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
    };

    const containerStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { scale: scale.value },
        ],
        opacity: opacity.value,
    }));

    const imageStyle = useAnimatedStyle(() => ({
        transform: [{ rotateY: `${rotateY.value}deg` }],
    }));

    const shimmerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shimmerTranslate.value }],
    }));

    if (!photoUri && !isLoading) return null;

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            disabled={!photoUri}
        >
            <Animated.View style={[styles.container, containerStyle]}>
                {photoUri ? (
                    <Animated.View style={imageStyle}>
                        <Image source={{ uri: photoUri }} style={styles.image} contentFit="cover" />
                    </Animated.View>
                ) : (
                    <View style={styles.placeholder}>
                        {isLoading && (
                            <Animated.View style={[styles.shimmer, shimmerStyle]}>
                                <View style={styles.shimmerGradient} />
                            </Animated.View>
                        )}
                    </View>
                )}
                <View style={styles.border} />
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 60,
        height: 60,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 14,
    },
    placeholder: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    border: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    shimmer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        left: '-100%',
    },
    shimmerGradient: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        opacity: 0.5,
    },
});
