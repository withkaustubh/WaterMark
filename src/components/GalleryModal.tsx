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
    FadeIn,
    FadeOut,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Photo } from '../utils/PhotoManager';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GalleryModalProps {
    visible: boolean;
    onClose: () => void;
    photos: Photo[];
    onDeletePhotos?: (photoIds: string[]) => void;
    onSharePhoto?: (photoUri: string) => void;
    onViewPhoto?: (photo: Photo) => void;
    onLoadMore?: () => void;
    sortAscending?: boolean;
    onSortChange?: (ascending: boolean) => void;
}

export default function GalleryModal({
    visible,
    onClose,
    photos,
    onDeletePhotos,
    onSharePhoto,
    onViewPhoto,
    onLoadMore,
    sortAscending = true,
    onSortChange,
}: GalleryModalProps) {
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const backdropOpacity = useSharedValue(0);
    const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
    const isSelectionMode = selectedPhotos.size > 0;
    const [showSortMenu, setShowSortMenu] = useState(false);

    // Delete Confirmation State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const deleteTranslateY = useSharedValue(200);

    useEffect(() => {
        if (showDeleteConfirm) {
            deleteTranslateY.value = withTiming(0, { duration: 200 }); // Slightly faster for 'quick' feel
        } else {
            deleteTranslateY.value = withTiming(200, { duration: 200 });
        }
    }, [showDeleteConfirm]);

    const deleteConfirmStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: deleteTranslateY.value }],
    }));

    useEffect(() => {
        if (visible) {
            // Slide up animation
            translateY.value = withSpring(0, {
                damping: 50,
                stiffness: 400,
            });
            backdropOpacity.value = withTiming(1, { duration: 300 });
        } else {
            // Slide down animation
            translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
            backdropOpacity.value = withTiming(0, { duration: 250 });
            setShowSortMenu(false); // Close sort menu when closing modal
            setSelectedPhotos(new Set()); // Reset selection on close
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

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedPhotos);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedPhotos(newSet);
    };

    const handlePhotoPress = (photo: Photo) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (isSelectionMode) {
            toggleSelection(photo.id);
        } else if (onViewPhoto) {
            onViewPhoto(photo);
        }
    };

    const handlePhotoLongPress = (photo: Photo) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        toggleSelection(photo.id);
    };

    const handleDelete = () => {
        if (selectedPhotos.size === 0 || !onDeletePhotos) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (onDeletePhotos) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onDeletePhotos(Array.from(selectedPhotos));
            setSelectedPhotos(new Set());
            setShowDeleteConfirm(false);
        }
    };

    const handleShare = () => {
        if (selectedPhotos.size === 0 || !onSharePhoto) return;
        // Share logic for multiple? 
        // If single, use original. If multiple, maybe loop or not supported yet?
        // Let's stick to first one for now or loop if API supports.
        // PhotoManager.sharePhoto expects string.
        // For now take the first one or iterate.
        const firstId = Array.from(selectedPhotos)[0];
        const photo = photos.find(p => p.id === firstId);
        if (photo) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onSharePhoto(photo.uri);
        }
    };

    const cancelSelection = () => {
        setSelectedPhotos(new Set());
    };

    const renderPhoto = ({ item }: { item: Photo }) => {
        const isSelected = selectedPhotos.has(item.id);

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

    const toggleSortMenu = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowSortMenu(!showSortMenu);
    };

    const handleSortChange = (ascending: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (onSortChange) {
            onSortChange(ascending);
        }
        setShowSortMenu(false);
    };

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
                        <View style={styles.headerActions}>
                            <Pressable onPress={toggleSortMenu} style={styles.iconButton}>
                                <Ionicons name="filter" size={24} color="white" />
                            </Pressable>
                        </View>
                        <Text style={styles.title}>Gallery</Text>
                        <Pressable onPress={handleClose} style={styles.closeButton}>
                            <Ionicons name="close" size={28} color="white" />
                        </Pressable>
                    </View>

                    {/* Sort Menu Dropdown */}
                    {showSortMenu && (
                        <Animated.View
                            entering={FadeIn.duration(200)}
                            exiting={FadeOut.duration(200)}
                            style={styles.sortMenu}
                        >
                            <Pressable
                                style={[styles.sortOption, sortAscending && styles.sortOptionSelected]}
                                onPress={() => handleSortChange(true)}
                            >
                                <Text style={[styles.sortOptionText, sortAscending && styles.sortOptionTextSelected]}>
                                    Oldest First
                                </Text>
                                {sortAscending && <Ionicons name="checkmark" size={20} color="#007AFF" />}
                            </Pressable>
                            <View style={styles.sortDivider} />
                            <Pressable
                                style={[styles.sortOption, !sortAscending && styles.sortOptionSelected]}
                                onPress={() => handleSortChange(false)}
                            >
                                <Text style={[styles.sortOptionText, !sortAscending && styles.sortOptionTextSelected]}>
                                    Newest First
                                </Text>
                                {!sortAscending && <Ionicons name="checkmark" size={20} color="#007AFF" />}
                            </Pressable>
                        </Animated.View>
                    )}

                    {/* Photo Grid */}
                    <FlatList
                        data={photos}
                        renderItem={renderPhoto}
                        keyExtractor={(item) => item.id}
                        numColumns={3}
                        contentContainerStyle={styles.gridContent}
                        ListEmptyComponent={renderEmptyState}
                        showsVerticalScrollIndicator={false}
                        onEndReached={onLoadMore}
                        onEndReachedThreshold={0.5}
                    />

                    {/* Action Bar */}
                    {isSelectionMode && (
                        <View style={styles.actionBar}>
                            {onSharePhoto && (
                                <Pressable style={styles.actionButton} onPress={handleShare}>
                                    <Ionicons name="share-outline" size={24} color="white" />
                                    <Text style={styles.actionText}>Share</Text>
                                </Pressable>
                            )}
                            {onDeletePhotos && (
                                <Pressable style={styles.actionButton} onPress={handleDelete}>
                                    <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                                    <Text style={[styles.actionText, { color: '#FF3B30' }]}>
                                        Delete ({selectedPhotos.size})
                                    </Text>
                                </Pressable>
                            )}
                        </View>
                    )}

                    {/* Delete Confirmation Overlay */}
                    {showDeleteConfirm && (
                        <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowDeleteConfirm(false)}>
                            <View style={StyleSheet.absoluteFill} />
                        </Pressable>
                    )}

                    {/* Custom Delete Confirmation Slide-Up */}
                    <Animated.View style={[styles.deleteConfirmation, deleteConfirmStyle]}>
                        <View style={styles.deleteConfirmContent}>
                            <Text style={styles.deleteConfirmTitle}>
                                Delete {selectedPhotos.size} selected item{selectedPhotos.size > 1 ? 's' : ''}?
                            </Text>
                            <Text style={styles.deleteConfirmSub}>These items will be permanently deleted.</Text>

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
                </Animated.View>
            </View >
        </Modal >
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
        zIndex: 10,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: -1,
    },
    closeButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    sortMenu: {
        position: 'absolute',
        top: 70,
        left: 20,
        width: 200,
        backgroundColor: '#2C2C2E',
        borderRadius: 12,
        padding: 8,
        zIndex: 100,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    sortOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    sortOptionSelected: {
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
    },
    sortOptionText: {
        fontSize: 16,
        color: 'white',
    },
    sortOptionTextSelected: {
        color: '#007AFF',
        fontWeight: '600',
    },
    sortDivider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginVertical: 4,
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
        textAlign: 'center',
    },
    deleteConfirmSub: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 14,
        marginBottom: 24,
        textAlign: 'center',
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
