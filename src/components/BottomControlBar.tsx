import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import PhotoThumbnail from './PhotoThumbnail';
import CaptureButton from './CaptureButton';


interface BottomControlBarProps {
    latestPhotoUri: string | null;
    onGalleryOpen: () => void;
    isCapturing: boolean;
    onCapture: () => void;
    cameraReady: boolean;
    onFlipCamera: () => void;
}

const BottomControlBar = React.memo(({
    latestPhotoUri,
    onGalleryOpen,
    isCapturing,
    onCapture,
    cameraReady,
    onFlipCamera
}: BottomControlBarProps) => {

    return (
        <Animated.View
            entering={FadeInUp.delay(300).duration(600)}
            style={styles.bottomBar}
        >
            {/* Photo Thumbnail */}
            <View style={styles.thumbnailContainer}>
                <PhotoThumbnail
                    photoUri={latestPhotoUri}
                    onPress={onGalleryOpen}
                    isLoading={isCapturing}
                />
            </View>

            {/* Capture Button */}
            <CaptureButton
                onPress={onCapture}
                disabled={!cameraReady}
                isCapturing={isCapturing}
            />

            {/* Flip Camera Button */}
            <TouchableOpacity
                style={styles.thumbnailContainer}
                onPress={onFlipCamera}
                activeOpacity={0.7}
            >
                <View style={styles.flipButton}>
                    <Ionicons name="camera-reverse" size={28} color="white" />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    bottomBar: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 40,
        zIndex: 10,
    },
    thumbnailContainer: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    flipButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',

    },
});

export default BottomControlBar;
