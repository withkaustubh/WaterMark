import { Text, View, StyleSheet } from "react-native";
import { Camera, useCameraPermission, useCameraDevice } from "react-native-vision-camera"
import { useIsFocused } from "@react-navigation/native";
import { useAppState } from "@react-native-community/hooks";
import PermissionPage from "../src/components/PermissionPage";
import NoCameraDeviceError from "../src/components/NoCameraDeviceError";
import { useRef, useState } from "react";

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
  const torch = device?.hasTorch
  const [flash, setFlash] = useState<'on' | 'off'>('off')
  const [istorchOn, setTorchOn] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)

  const toggleFlash = () => {
    setFlash(flash => (flash === 'on' ? 'off' : 'on'))
  }

  const toggleTorch = () => {
    setTorchOn(torchOn => !torchOn)
  }

  const takePhoto = async () => {
    if (!cameraReady || !camera.current) return
    await camera.current.takePhoto()
  }

  if (!hasPermission) return <PermissionPage />
  if (device == null) return <NoCameraDeviceError />

  return (
    <Camera
      ref={camera}
      device={device}
      style={StyleSheet.absoluteFill}
      isActive={isActive}
      onPreviewStarted={() => {
        console.log('Preview started!')
        setCameraReady(true)
      }
      }
      onPreviewStopped={() => {
        console.log('Preview stopped!')
        setCameraReady(false)
      }}
      androidPreviewViewType="texture-view"
      torch={istorchOn ? 'on' : 'off'}
    />


  );
}
