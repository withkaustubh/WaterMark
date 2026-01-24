import {
    Modal,
    View,
    StyleSheet,
    Text,
    FlatList,
    Pressable,
    Image,
    Alert,
    Dimensions,
    StatusBar,
} from 'react-native';
import { useEffect, useState } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface Photo {
    id: string;
    uri: string;
    filename: string;
    creationTime?: number;
}

interface GalleryModalProps {
    visible: boolean;
    onClose: () => void;
    photos: Photo[];
    onDeletePhoto?: (photoId: string) => void;
    onSharePhoto?: (photoUri: string) => void;
    onViewPhoto?: (photo: Photo) => void;
}

export default function GalleryModal({
    visible,
    onClose,
    photos,
    onDeletePhoto,
    onSharePhoto,
    onViewPhoto,
}: GalleryModalProps) {
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const backdropOpacity = useSharedValue(0);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    useEffect(() => {
        if (visible) {
            // Slide up animation
            translateY.value = withSpring(0, {
                damping: 30,
                stiffness: 300,
            });
            backdropOpacity.value = withTiming(1, { duration: 300 });
        } else {
            // Slide down animation
            translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
            backdropOpacity.value = withTiming(0, { duration: 250 });
        }
    }, [visible]);

    const modalStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }));

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () => {
            runOnJS(onClose)();
        });
        backdropOpacity.value = withTiming(0, { duration: 250 });
    };

    const handlePhotoPress = (photo: Photo) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (onViewPhoto) {
            onViewPhoto(photo);
        }
    };

    const handlePhotoLongPress = (photo: Photo) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Toggle selection on long press
        setSelectedPhoto(selectedPhoto === photo.id ? null : photo.id);
    };

    const handleDelete = () => {
        if (!selectedPhoto || !onDeletePhoto) return;

        Alert.alert(
            'Delete Photo',
            'Are you sure you want to delete this photo?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        onDeletePhoto(selectedPhoto);
                        setSelectedPhoto(null);
                    },
                },
            ]
        );
    };

    const handleShare = () => {
        if (!selectedPhoto || !onSharePhoto) return;
        const photo = photos.find(p => p.id === selectedPhoto);
        if (photo) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onSharePhoto(photo.uri);
        }
    };

    const renderPhoto = ({ item }: { item: Photo }) => {
        const isSelected = selectedPhoto === item.id;

        return (
            <PhotoGridItem
                photo={item}
                isSelected={isSelected}
                onPress={() => handlePhotoPress(item)}
                onLongPress={() => handlePhotoLongPress(item)}
            />
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={80} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>No photos yet</Text>
            <Text style={styles.emptySubtext}>Capture some amazing shots!</Text>
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            <View style={styles.container}>
                {/* Backdrop */}
                <Animated.View style={[styles.backdrop, backdropStyle]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
                </Animated.View>

                {/* Modal Content */}
                <Animated.View style={[styles.modal, modalStyle]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Gallery</Text>
                        <Pressable onPress={handleClose} style={styles.closeButton}>
                            <Ionicons name="close" size={28} color="white" />
                        </Pressable>
                    </View>

                    {/* Photo Grid */}
                    <FlatList
                        data={photos}
                        renderItem={renderPhoto}
                        keyExtractor={(item) => item.id}
                        numColumns={3}
                        contentContainerStyle={styles.gridContent}
                        ListEmptyComponent={renderEmptyState}
                        showsVerticalScrollIndicator={false}
                    />

                    {/* Action Bar */}
                    {selectedPhoto && (
                        <View style={styles.actionBar}>
                            {onSharePhoto && (
                                <Pressable style={styles.actionButton} onPress={handleShare}>
                                    <Ionicons name="share-outline" size={24} color="white" />
                                    <Text style={styles.actionText}>Share</Text>
                                </Pressable>
                            )}
                            {onDeletePhoto && (
                                <Pressable style={styles.actionButton} onPress={handleDelete}>
                                    <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                                    <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
                                </Pressable>
                            )}
                        </View>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
}

// Photo Grid Item Component
interface PhotoGridItemProps {
    photo: Photo;
    isSelected: boolean;
    onPress: () => void;
    onLongPress: () => void;
}

function PhotoGridItem({ photo, isSelected, onPress, onLongPress }: PhotoGridItemProps) {
    const scale = useSharedValue(1);

    const handlePressIn = () => {
        scale.value = withSpring(0.95, {
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

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.gridItem}
        >
            <Animated.View style={animatedStyle}>
                <Image source={{ uri: photo.uri }} style={styles.gridImage} />
                {isSelected && (
                    <View style={styles.selectedOverlay}>
                        <Ionicons name="checkmark-circle" size={32} color="#007AFF" />
                    </View>
                )}
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    modal: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: SCREEN_HEIGHT * 0.85,
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
    },
    closeButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    gridContent: {
        padding: 8,
        paddingBottom: 100,
    },
    gridItem: {
        flex: 1,
        margin: 4,
        aspectRatio: 1,
        maxWidth: '31%',
    },
    gridImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    selectedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 122, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 3,
        borderColor: '#007AFF',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.6)',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.4)',
        marginTop: 8,
    },
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 20,
        paddingHorizontal: 20,
        backgroundColor: '#2C2C2E',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
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
