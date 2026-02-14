import { View, StyleSheet, AppState } from "react-native";
import { Camera, useCameraPermission, useCameraDevice } from "react-native-vision-camera"
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from "@react-navigation/native";
import PermissionsGuard from "../src/components/PermissionsGuard";
import NoCameraDeviceError from "../src/components/NoCameraDeviceError";
import React, { useRef, useState, useEffect } from "react";
import Animated, {
  useSharedValue,
  withSequence,
  withTiming,
  withSpring,
  runOnJS,
  useAnimatedProps,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import GalleryModal from "../src/components/GalleryModal";
import PhotoViewer from "../src/components/PhotoViewer";
import { PhotoManager, Photo } from "../src/utils/PhotoManager";
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import Watermark from "../src/components/Watermark";
import { LocationManager, LocationData } from "../src/utils/LocationManager";
import { SkiaPhotoProcessor } from "../src/utils/SkiaPhotoProcessor";
import { DEFAULT_WATERMARK_COLOR } from "../src/constants/Colors";

import { SoundManager, ShutterSound } from "../src/utils/SoundManager";

// Components
import TopControlBar from "../src/components/TopControlBar";
import BottomControlBar from "../src/components/BottomControlBar";
import SettingsPanel from "../src/components/SettingsPanel";
import FocusRing from "../src/components/FocusRing";
import ShutterFlash from "../src/components/ShutterFlash";

// Hooks
import { useGalleryManagement } from "../src/hooks/useGalleryManagement";

const ReanimatedCamera = Animated.createAnimatedComponent(Camera);

export default function Index() {
  useKeepAwake();

  // 1. Device & Permissions
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back');
  const device = useCameraDevice(cameraPosition, {
    physicalDevices: [
      'ultra-wide-angle-camera',
      'wide-angle-camera',
      'telephoto-camera'
    ]
  });
  // Permissions handled by PermissionsGuard
  const isFocused = useIsFocused();
  const [appState, setAppState] = useState(AppState.currentState);
  const isActive = isFocused && appState === "active";

  // 2. State & Refs
  const camera = useRef<Camera>(null);


  // Camera State
  const [flash, setFlash] = useState<'auto' | 'on' | 'off'>('off');
  const [isTorchOn, setTorchOn] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Watermark State
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [watermarkColor, setWatermarkColor] = useState(DEFAULT_WATERMARK_COLOR);
  const [selectedSound, setSelectedSound] = useState<ShutterSound>('shutter1');
  const [showSettings, setShowSettings] = useState(false);
  const [shutterFlashTrigger, setShutterFlashTrigger] = useState(0);

  // Gallery Hook
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
    setSortAscending
  } = useGalleryManagement();

  // Focus & Zoom Animation Values
  const focusX = useSharedValue(0);
  const focusY = useSharedValue(0);
  const focusOpacity = useSharedValue(0);
  const focusScale = useSharedValue(1);

  const zoom = useSharedValue(device?.neutralZoom ?? 1);
  const startZoom = useSharedValue(0);

  // Reset zoom when device changes
  useEffect(() => {
    zoom.value = device?.neutralZoom ?? 1;
  }, [device?.neutralZoom, zoom]);

  // 3. Effects

  // Monitor app state
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState);
    });
    return () => {
      subscription.remove();
    };
  }, []);

  // Location Setup
  // Location Setup
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupLocation = async () => {
      const granted = await LocationManager.requestPermissions();
      if (granted) {
        // Initial fetch for immediate display
        const initialLoc = await LocationManager.getCurrentLocation();
        if (initialLoc) {
          setCurrentLocation(initialLoc);
        }
        setIsLocating(false);

        // Subscribe for updates
        unsubscribe = await LocationManager.subscribeToLocationUpdates((loc) => {
          setCurrentLocation(loc);
        });
      } else {
        setIsLocating(false);
      }
    };

    setupLocation();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Persistence Logic
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const SETTINGS_KEY = 'watermark_settings';

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem(SETTINGS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.watermarkEnabled !== undefined) setWatermarkEnabled(parsed.watermarkEnabled);
          if (parsed.watermarkColor) setWatermarkColor(parsed.watermarkColor);
          if (parsed.selectedSound) {
            setSelectedSound(parsed.selectedSound);
            SoundManager.setSound(parsed.selectedSound);
          }
        }
      } catch (e) {
        console.error('Failed to load settings', e);
      } finally {
        setSettingsLoaded(true);
      }
    };
    loadSettings();
  }, []);

  // Save settings
  useEffect(() => {
    if (!settingsLoaded) return;

    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({
          watermarkEnabled,
          watermarkColor,
          selectedSound
        }));
      } catch (e) {
        console.error('Failed to save settings', e);
      }
    };
    saveSettings();
  }, [watermarkEnabled, watermarkColor, selectedSound, settingsLoaded]);

  // 4. Handlers

  const toggleFlash = () => {
    setFlash(current => {
      if (current === 'auto') return 'on';
      if (current === 'on') return 'off';
      return 'auto';
    });
  };

  const toggleTorch = () => {
    setTorchOn(torchOn => !torchOn);
  };

  const toggleCamera = () => {
    setCameraPosition(p => (p === 'back' ? 'front' : 'back'));
  };

  const takePhoto = async () => {
    if (!cameraReady || !camera.current || isCapturing) return;

    setIsCapturing(true);

    // 1. Immediate Feedback (Visual & Audio)
    setShutterFlashTrigger(prev => prev + 1);
    SoundManager.playShutterSound(); // Fire & Forget

    // 2. Capture
    try {
      const photo = await camera.current.takePhoto({
        flash: flash,
        enableShutterSound: false, // We handle sound manually
      });

      console.log('Photo captured:', photo.path);

      // 3. Optimistic Update
      const tempPhoto: Photo = {
        id: `temp-${Date.now()}`,
        uri: `file://${photo.path}`,
        filename: 'capturing...',
        creationTime: new Date().toLocaleString()
      };

      setLatestPhoto(tempPhoto);

      // Allow next capture sooner? 
      // Keeping isCapturing true until save might be safer for file integrity, 
      // but feels slower. Let's release it early for "Pro" feel, 
      // assuming proper queueing. For now, we release after basic capture.
      setIsCapturing(false);

      // 4. Process in background
      processAndSave(photo.path);

    } catch (error) {
      console.error('Failed to take photo:', error);
      setIsCapturing(false);
    }
  };

  const processAndSave = async (originalPath: string) => {
    try {
      let finalPath = originalPath;

      if (watermarkEnabled) {
        const processedUri = await SkiaPhotoProcessor.processPhoto({
          uri: `file://${originalPath}`,
          date: new Date().toLocaleString(),
          location: currentLocation?.formatted,
          address: currentLocation?.address,
          watermarkColor: watermarkColor
        });
        if (processedUri) {
          finalPath = processedUri;
        }
      }

      const savedPhoto = await PhotoManager.saveToGallery(finalPath);
      if (savedPhoto) {
        setLatestPhoto(savedPhoto);
        loadPhotos();
      }
    } catch (err) {
      console.error("Processing failed:", err);
    }
  };

  const handleFocus = async (x: number, y: number) => {
    if (!cameraReady || !camera.current) return;

    // Visual
    focusX.value = x;
    focusY.value = y;
    focusOpacity.value = 1;
    focusScale.value = 1.5;

    // Animate
    focusScale.value = withSpring(1, { damping: 10, stiffness: 200 });
    focusOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 800 })
    );

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await camera.current.focus({ x, y });
    } catch (e) {
      console.log("Focus failed:", e);
    }
  };

  const tapGesture = Gesture.Tap()
    .onStart((e) => {
      runOnJS(handleFocus)(e.x, e.y);
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      startZoom.value = zoom.value;
    })
    .onUpdate((e) => {
      const newZoom = startZoom.value * e.scale;
      // Clamp zoom level
      const minZoom = device?.minZoom ?? 1;
      const maxZoom = Math.min(device?.maxZoom ?? 5, 20); // Cap at 20x to prevent crazy zoom

      zoom.value = Math.max(minZoom, Math.min(newZoom, maxZoom));
    });

  const composedGesture = Gesture.Simultaneous(tapGesture, pinchGesture);

  const animatedProps = useAnimatedProps(() => ({
    zoom: zoom.value,
  }));

  // 5. Render
  if (device == null) return <NoCameraDeviceError />;

  return (
    <PermissionsGuard>
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
            toggleSettings={() => setShowSettings(!showSettings)}
          />

          <SettingsPanel
            visible={showSettings}
            watermarkEnabled={watermarkEnabled}
            setWatermarkEnabled={setWatermarkEnabled}
            watermarkColor={watermarkColor}
            setWatermarkColor={setWatermarkColor}
            selectedSound={selectedSound}
            setSelectedSound={(sound) => {
              setSelectedSound(sound);
              SoundManager.setSound(sound);
            }}
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

          {/* Hidden Processor */}

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