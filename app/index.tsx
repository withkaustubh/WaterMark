import { View, StyleSheet, AppState, StatusBar } from "react-native";
import { Camera } from "react-native-vision-camera";
import { useIsFocused } from "@react-navigation/native";
import PermissionsGuard from "../src/components/PermissionsGuard";
import NoCameraDeviceError from "../src/components/NoCameraDeviceError";
import React, { useState, useEffect } from "react";
import Animated from 'react-native-reanimated';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import GalleryModal from "../src/components/GalleryModal";
import PhotoViewer from "../src/components/PhotoViewer";
import { useKeepAwake } from 'expo-keep-awake';
import Watermark from "../src/components/Watermark";

// Components
import TopControlBar from "../src/components/TopControlBar";
import BottomControlBar from "../src/components/BottomControlBar";
import SettingsPanel from "../src/components/SettingsPanel";
import FocusRing from "../src/components/FocusRing";
import ShutterFlash from "../src/components/ShutterFlash";

// Hooks
import { useGalleryManagement } from "../src/hooks/useGalleryManagement";
import { useCameraController } from "../src/hooks/useCameraController";
import { useWatermark } from "../src/hooks/useWatermark";
import { useCameraGestures } from "../src/hooks/useCameraGestures";
import { usePhotoProcessing } from "../src/hooks/usePhotoProcessing";

const ReanimatedCamera = Animated.createAnimatedComponent(Camera);

export default function Index() {
  useKeepAwake();

  // App State
  const isFocused = useIsFocused();
  const [appState, setAppState] = useState(AppState.currentState);
  const isActive = isFocused && appState === "active";

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState);
    });
    return () => {
      subscription.remove();
    };
  }, []);

  // Gallery
  const {
    allPhotos,
    latestPhoto,
    setLatestPhoto,
    showGallery,
    setShowGallery,
    viewingPhoto,
    setViewingPhoto,
    loadPhotos,
    loadMorePhotos,
    deletePhoto,
    deletePhotos,
    sharePhoto,
    sortAscending,
    setSortAscending,
  } = useGalleryManagement();

  // Watermark & Settings
  const {
    currentLocation,
    isLocating,
    watermarkEnabled,
    setWatermarkEnabled,
    watermarkColor,
    setWatermarkColor,
    selectedSound,
    setSelectedSound,
    showSettings,
    toggleSettings,
  } = useWatermark();

  // Photo Processing
  const { processAndSave } = usePhotoProcessing(
    watermarkEnabled,
    watermarkColor,
    currentLocation,
    setLatestPhoto,
    loadPhotos,
  );

  // Camera Controller
  const {
    camera,
    device,
    flash,
    toggleFlash,
    isTorchOn,
    toggleTorch,
    cameraReady,
    setCameraReady,
    isCapturing,
    toggleCamera,
    takePhoto,
    shutterFlashTrigger,
  } = useCameraController(processAndSave, setLatestPhoto);

  // Gestures
  const {
    composedGesture,
    animatedProps,
    focusX,
    focusY,
    focusOpacity,
    focusScale,
  } = useCameraGestures(device, cameraReady, camera);

  // Render
  if (device == null) return <NoCameraDeviceError />;

  return (
    <PermissionsGuard>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.container}>
          <GestureDetector gesture={composedGesture}>
            <View style={StyleSheet.absoluteFill}>
              <ReanimatedCamera
                ref={camera}
                device={device}
                style={StyleSheet.absoluteFill}
                isActive={isActive}
                onPreviewStarted={() => setCameraReady(true)}
                onPreviewStopped={() => setCameraReady(false)}
                androidPreviewViewType="texture-view"
                torch={isTorchOn ? 'on' : 'off'}
                photo={true}
                animatedProps={animatedProps}
              />

              {/* Live Watermark Overlay */}
              {watermarkEnabled && (
                <Watermark
                  location={currentLocation?.formatted}
                  address={currentLocation?.address}
                  color={watermarkColor}
                  isLocating={isLocating}
                />
              )}

              <FocusRing
                focusX={focusX}
                focusY={focusY}
                focusOpacity={focusOpacity}
                focusScale={focusScale}
              />

              <ShutterFlash trigger={shutterFlashTrigger} />
            </View>
          </GestureDetector>

          {/* UI Overlay */}
          <TopControlBar
            hasFlash={device.hasFlash}
            hasTorch={device.hasTorch}
            flash={flash}
            toggleFlash={toggleFlash}
            isTorchOn={isTorchOn}
            toggleTorch={toggleTorch}
            showSettings={showSettings}
            toggleSettings={toggleSettings}
          />

          <SettingsPanel
            visible={showSettings}
            watermarkEnabled={watermarkEnabled}
            setWatermarkEnabled={setWatermarkEnabled}
            watermarkColor={watermarkColor}
            setWatermarkColor={setWatermarkColor}
            selectedSound={selectedSound}
            setSelectedSound={setSelectedSound}
          />

          <BottomControlBar
            latestPhotoUri={latestPhoto?.uri || null}
            onGalleryOpen={() => setShowGallery(true)}
            isCapturing={isCapturing}
            onCapture={takePhoto}
            cameraReady={cameraReady}
            onFlipCamera={toggleCamera}
          />

          {/* Modals */}
          <GalleryModal
            visible={showGallery}
            onClose={() => setShowGallery(false)}
            photos={allPhotos}
            onDeletePhotos={deletePhotos}
            onSharePhoto={sharePhoto}
            onViewPhoto={setViewingPhoto}
            onLoadMore={loadMorePhotos}
            sortAscending={sortAscending}
            onSortChange={setSortAscending}
          />

          <PhotoViewer
            visible={viewingPhoto !== null}
            photoUri={viewingPhoto?.uri || null}
            onClose={() => setViewingPhoto(null)}
            onDelete={async () => {
              if (viewingPhoto) await deletePhoto(viewingPhoto.id);
            }}
            onShare={async () => {
              if (viewingPhoto) await sharePhoto(viewingPhoto.uri);
            }}
          />
        </View>
      </GestureHandlerRootView>
    </PermissionsGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});