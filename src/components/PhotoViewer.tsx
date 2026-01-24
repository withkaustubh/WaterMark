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
    runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

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
    const scale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(0);
    const [showControls, setShowControls] = useState(true);

    // Animate opacity when visible changes
    useEffect(() => {
        if (visible) {
            opacity.value = withTiming(1, { duration: 300 });
            scale.value = 1;
            translateX.value = 0;
            translateY.value = 0;
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

    const handleDelete = () => {
        if (onDelete) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onDelete();
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
            <Animated.View style={[styles.container, containerStyle]}>
                {/* Image */}
                <Pressable style={StyleSheet.absoluteFill} onPress={toggleControls}>
                    <Animated.View style={[styles.imageContainer, imageStyle]}>
                        <Image
                            source={{ uri: photoUri }}
                            style={styles.image}
                            resizeMode="contain"
                        />
                    </Animated.View>
                </Pressable>

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
                                <Pressable style={styles.actionButton} onPress={handleDelete}>
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
});
