import {
    Modal,
    View,
    StyleSheet,
    Pressable,
    Image,
    Dimensions,
    Text,
} from 'react-native';
import { useState, useEffect } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withDecay,
    cancelAnimation,
    runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PhotoViewerProps {
    visible: boolean;
    photoUri: string | null;
    onClose: () => void;
    onDelete?: () => void;
    onShare?: () => void;
}

export default function PhotoViewer({
    visible,
    photoUri,
    onClose,
    onDelete,
    onShare,
}: PhotoViewerProps) {
    const scale = useSharedValue(1); // Main scale (used for entrance + zoom)
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0); // Pan X
    const translateY = useSharedValue(0); // Pan Y
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);
    const opacity = useSharedValue(0);
    const [showControls, setShowControls] = useState(true);

    // Delete Confirmation State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const deleteTranslateY = useSharedValue(200);

    useEffect(() => {
        if (showDeleteConfirm) {
            deleteTranslateY.value = withTiming(0, { duration: 250 });
        } else {
            deleteTranslateY.value = withTiming(200, { duration: 200 });
        }
    }, [showDeleteConfirm]);

    const deleteConfirmStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: deleteTranslateY.value }],
    }));

    // Animate opacity when visible changes
    useEffect(() => {
        if (visible) {
            opacity.value = withTiming(1, { duration: 300 });
            scale.value = 1;
            savedScale.value = 1;
            translateX.value = 0;
            translateY.value = 0;
            savedTranslateX.value = 0;
            savedTranslateY.value = 0;
        } else {
            opacity.value = withTiming(0, { duration: 200 });
        }
    }, [visible]);

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        opacity.value = withTiming(0, { duration: 200 }, () => {
            runOnJS(onClose)();
        });
    };

    const handleDeletePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (onDelete) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onDelete();
            setShowDeleteConfirm(false);
            handleClose();
        }
    };

    const handleShare = () => {
        if (onShare) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onShare();
        }
    };

    const toggleControls = () => {
        setShowControls(!showControls);
    };

    // Gestures
    const pinchGesture = Gesture.Pinch()
        .onUpdate((e) => {
            scale.value = savedScale.value * e.scale;
        })
        .onEnd(() => {
            if (scale.value < 1) {
                scale.value = withSpring(1);
                savedScale.value = 1;
            } else {
                savedScale.value = scale.value;
            }
        });

    const panGesture = Gesture.Pan()
        .maxPointers(1)
        .onStart(() => {
            cancelAnimation(translateX);
            cancelAnimation(translateY);
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        })
        .onUpdate((e) => {
            if (scale.value > 1) {
                // Calculate max translation based on scale to keep image on screen
                const maxTranslateX = (SCREEN_WIDTH * (scale.value - 1)) / 2;
                const maxTranslateY = (SCREEN_HEIGHT * (scale.value - 1)) / 2;

                const nextX = savedTranslateX.value + e.translationX;
                const nextY = savedTranslateY.value + e.translationY;

                // Hard clamp during drag for direct control
                translateX.value = Math.min(Math.max(nextX, -maxTranslateX), maxTranslateX);
                translateY.value = Math.min(Math.max(nextY, -maxTranslateY), maxTranslateY);
            }
        })
        .onEnd((e) => {
            if (scale.value > 1) {
                const maxTranslateX = (SCREEN_WIDTH * (scale.value - 1)) / 2;
                const maxTranslateY = (SCREEN_HEIGHT * (scale.value - 1)) / 2;

                translateX.value = withDecay({
                    velocity: e.velocityX,
                    clamp: [-maxTranslateX, maxTranslateX],
                    rubberBandEffect: true,
                });

                translateY.value = withDecay({
                    velocity: e.velocityY,
                    clamp: [-maxTranslateY, maxTranslateY],
                    rubberBandEffect: true,
                });
            }
        });

    // Double tap to zoom
    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
            if (scale.value > 1.5) {
                scale.value = withSpring(1);
                savedScale.value = 1;
                translateX.value = withSpring(0);
                translateY.value = withSpring(0);
                savedTranslateX.value = 0;
                savedTranslateY.value = 0;
            } else {
                scale.value = withSpring(2.5);
                savedScale.value = 2.5;
            }
        });

    // Single tap to toggle controls
    const singleTapGesture = Gesture.Tap()
        .onEnd(() => {
            runOnJS(toggleControls)();
        });

    const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);
    const tapGestures = Gesture.Exclusive(doubleTapGesture, singleTapGesture);
    const allGestures = Gesture.Race(composedGesture, tapGestures);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const imageStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    if (!photoUri) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            <GestureHandlerRootView style={{ flex: 1 }}>
                <Animated.View style={[styles.container, containerStyle]}>
                    {/* Image with Gestures */}
                    <GestureDetector gesture={allGestures}>
                        <Animated.View style={[styles.imageContainer, { width: SCREEN_WIDTH, height: SCREEN_HEIGHT }]}>
                            <Animated.View style={[imageStyle, { flex: 1, width: '100%', height: '100%' }]}>
                                <Image
                                    source={{ uri: photoUri }}
                                    style={styles.image}
                                    resizeMode="contain"
                                />
                            </Animated.View>
                        </Animated.View>
                    </GestureDetector>

                    {/* Controls */}
                    {showControls && (
                        <>
                            {/* Top Bar */}
                            <Animated.View style={styles.topBar} entering={undefined}>
                                <Pressable style={styles.iconButton} onPress={handleClose}>
                                    <Ionicons name="close" size={28} color="white" />
                                </Pressable>
                            </Animated.View>

                            {/* Bottom Bar */}
                            <Animated.View style={styles.bottomBar} entering={undefined}>
                                {onShare && (
                                    <Pressable style={styles.actionButton} onPress={handleShare}>
                                        <Ionicons name="share-outline" size={28} color="white" />
                                        <Text style={styles.actionText}>Share</Text>
                                    </Pressable>
                                )}
                                {onDelete && (
                                    <Pressable style={styles.actionButton} onPress={handleDeletePress}>
                                        <Ionicons name="trash-outline" size={28} color="#FF3B30" />
                                        <Text style={[styles.actionText, { color: '#FF3B30' }]}>
                                            Delete
                                        </Text>
                                    </Pressable>
                                )}
                            </Animated.View>
                        </>
                    )}
                </Animated.View>
            </GestureHandlerRootView>
            {/* Delete Confirmation Overlay */}
            {showDeleteConfirm && (
                <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowDeleteConfirm(false)}>
                    <View style={StyleSheet.absoluteFill} />
                </Pressable>
            )}

            {/* Custom Delete Confirmation Slide-Up */}
            <Animated.View style={[styles.deleteConfirmation, deleteConfirmStyle]}>
                <View style={styles.deleteConfirmContent}>
                    <Text style={styles.deleteConfirmTitle}>Delete 1 selected item?</Text>
                    <Text style={styles.deleteConfirmSub}>This item will be permanently deleted.</Text>

                    <View style={styles.deleteActionRow}>
                        <Pressable
                            style={[styles.confirmButton, styles.cancelButton]}
                            onPress={() => setShowDeleteConfirm(false)}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.confirmButton, styles.deleteButton]}
                            onPress={confirmDelete}
                        >
                            <Text style={styles.deleteText}>Delete</Text>
                        </Pressable>
                    </View>
                </View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
    topBar: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        paddingHorizontal: 20,
        zIndex: 10,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 40,
        zIndex: 10,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    actionText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        marginLeft: 8,
    },
    deleteConfirmation: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        padding: 24,
        zIndex: 100,
        elevation: 10,
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    deleteConfirmContent: {
        alignItems: 'center',
    },
    deleteConfirmTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    deleteConfirmSub: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 14,
        marginBottom: 24,
    },
    deleteActionRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    deleteButton: {
        backgroundColor: '#FF3B30',
    },
    cancelText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    deleteText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    }
});
