import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { Camera, useCameraPermission, useCameraDevice } from "react-native-vision-camera"
import { useIsFocused } from "@react-navigation/native";
import { useAppState } from "@react-native-community/hooks";
import PermissionPage from "../src/components/PermissionPage";
import NoCameraDeviceError from "../src/components/NoCameraDeviceError";
import { useRef, useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInLeft,
} from 'react-native-reanimated';
import CaptureButton from "../src/components/CaptureButton";
import PhotoThumbnail from "../src/components/PhotoThumbnail";
import GalleryModal, { Photo } from "../src/components/GalleryModal";
import { PhotoManager } from "../src/utils/PhotoManager";

export default function Index() {
  const device = useCameraDevice('back', {
    physicalDevices: [
      'ultra-wide-angle-camera',
      'wide-angle-camera',
      'telephoto-camera'
    ]
  })
  const { hasPermission, requestPermission } = useCameraPermission()
  const isFocused = useIsFocused()
  const appState = useAppState()
  const isActive = isFocused && appState === "active"
  const camera = useRef<Camera>(null)
  const hasFlash = device?.hasFlash
  const hasTorch = device?.hasTorch
  const [flash, setFlash] = useState<'auto' | 'on' | 'off'>('auto')
  const [isTorchOn, setTorchOn] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [latestPhoto, setLatestPhoto] = useState<Photo | null>(null)
  const [allPhotos, setAllPhotos] = useState<Photo[]>([])
  const [showGallery, setShowGallery] = useState(false)

  // Load photos on mount
  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    const photos = await PhotoManager.getPhotos();
    setAllPhotos(photos);
    const latest = await PhotoManager.getLatestPhoto();
    setLatestPhoto(latest);
  };

  const toggleFlash = () => {
    setFlash(current => {
      if (current === 'auto') return 'on'
      if (current === 'on') return 'off'
      return 'auto'
    })
  }

  const toggleTorch = () => {
    setTorchOn(torchOn => !torchOn)
  }

  const takePhoto = async () => {
    if (!cameraReady || !camera.current || isCapturing) return

    setIsCapturing(true)

    try {
      const photo = await camera.current.takePhoto({
        flash: flash,
        enableShutterSound: true,
      })

      console.log('Photo captured:', photo.path)

      // Save photo
      const savedPhoto = await PhotoManager.savePhoto(photo.path);
      setLatestPhoto(savedPhoto);

      // Reload all photos
      await loadPhotos();

    } catch (error) {
      console.error('Failed to take photo:', error)
    } finally {
      setIsCapturing(false)
    }
  }

  const handleGalleryOpen = () => {
    setShowGallery(true);
  };

  const handleGalleryClose = () => {
    setShowGallery(false);
  };

  const handleDeletePhoto = async (photoId: string) => {
    await PhotoManager.deletePhoto(photoId);
    await loadPhotos();
  };

  const handleSharePhoto = async (photoUri: string) => {
    await PhotoManager.sharePhoto(photoUri);
  };

  if (!hasPermission) return <PermissionPage />
  if (device == null) return <NoCameraDeviceError />

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        device={device}
        style={StyleSheet.absoluteFill}
        isActive={isActive}
        onPreviewStarted={() => {
          console.log('Preview started!')
          setCameraReady(true)
        }}
        onPreviewStopped={() => {
          console.log('Preview stopped!')
          setCameraReady(false)
        }}
        androidPreviewViewType="texture-view"
        torch={isTorchOn ? 'on' : 'off'}
        photo={true}
      />

      {/* Top Control Bar */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(600)}
        style={styles.topBar}
      >
        {/* Flash Control */}
        {hasFlash && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleFlash}
          >
            <Ionicons
              name={
                flash === 'auto' ? 'flash' :
                  flash === 'on' ? 'flash' :
                    'flash-off'
              }
              size={28}
              color="white"
            />
            <Text style={styles.controlLabel}>
              {flash === 'auto' ? 'Auto' : flash === 'on' ? 'On' : 'Off'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Torch Control */}
        {hasTorch && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleTorch}
          >
            <Ionicons
              name={isTorchOn ? 'flashlight' : 'flashlight-outline'}
              size={28}
              color={isTorchOn ? '#FFD700' : 'white'}
            />
            <Text style={styles.controlLabel}>
              {isTorchOn ? 'On' : 'Off'}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Bottom Control Bar */}
      <Animated.View
        entering={FadeInUp.delay(300).duration(600)}
        style={styles.bottomBar}
      >
        {/* Photo Thumbnail */}
        <View style={styles.thumbnailContainer}>
          <PhotoThumbnail
            photoUri={latestPhoto?.uri || null}
            onPress={handleGalleryOpen}
            isLoading={isCapturing}
          />
        </View>

        {/* Capture Button */}
        <CaptureButton
          onPress={takePhoto}
          disabled={!cameraReady}
          isCapturing={isCapturing}
        />

        {/* Spacer for symmetry */}
        <View style={styles.spacer} />
      </Animated.View>

      {/* Gallery Modal */}
      <GalleryModal
        visible={showGallery}
        onClose={handleGalleryClose}
        photos={allPhotos}
        onDeletePhoto={handleDeletePhoto}
        onSharePhoto={handleSharePhoto}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  controlButton: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    minWidth: 80,
  },
  controlLabel: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacer: {
    width: 60,
  },
});
