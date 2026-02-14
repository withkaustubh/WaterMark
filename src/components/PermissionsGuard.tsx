import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, AppState, Dimensions } from 'react-native';
import { useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface PermissionsGuardProps {
    children: React.ReactNode;
}

export default function PermissionsGuard({ children }: PermissionsGuardProps) {
    const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
    const { hasPermission: hasMicrophonePermission, requestPermission: requestMicrophonePermission } = useMicrophonePermission();
    const [mediaLibraryStatus, requestMediaLibraryPermission] = MediaLibrary.usePermissions();
    const [locationStatus, requestLocationPermission] = Location.useForegroundPermissions();

    const [allGranted, setAllGranted] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    const checkPermissions = useCallback(async () => {
        // If hooks haven't initialized yet
        if (!mediaLibraryStatus || !locationStatus) return;

        const camera = hasCameraPermission;
        const mic = hasMicrophonePermission;
        const media = mediaLibraryStatus.granted;
        const location = locationStatus.granted;

        if (camera && mic && media && location) {
            setAllGranted(true);
        } else {
            setAllGranted(false);
        }
        setIsChecking(false);
    }, [hasCameraPermission, hasMicrophonePermission, mediaLibraryStatus, locationStatus]);

    useEffect(() => {
        checkPermissions();
    }, [checkPermissions]);

    // Re-check on app foreground (in case user changed visual settings)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                checkPermissions();
            }
        });
        return () => subscription.remove();
    }, [checkPermissions]);

    const handleGrantable = async () => {
        // Request sequentially
        if (!hasCameraPermission) await requestCameraPermission();
        if (!hasMicrophonePermission) await requestMicrophonePermission();
        if (!mediaLibraryStatus?.granted && mediaLibraryStatus?.canAskAgain) await requestMediaLibraryPermission();
        if (!locationStatus?.granted && locationStatus?.canAskAgain) await requestLocationPermission();

        checkPermissions();
    };

    const openSettings = () => {
        Linking.openSettings();
    };

    if (isChecking) {
        return <View style={styles.container} />; // Or a loading spinner
    }

    if (allGranted) {
        return <>{children}</>;
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1a1a1a', '#000000']}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="camera-outline" size={32} color="#007AFF" style={styles.icon} />
                    <Ionicons name="location-outline" size={32} color="#34C759" style={styles.icon} />
                    <Ionicons name="images-outline" size={32} color="#FF9500" style={styles.icon} />
                </View>

                <Text style={styles.title}>Welcome to WaterMark</Text>
                <Text style={styles.description}>
                    To provide the best experience, we need access to your camera, location, and photos to create beautiful watermarked images.
                </Text>

                <View style={styles.statusContainer}>
                    <PermissionItem
                        label="Camera"
                        granted={hasCameraPermission}
                        icon="camera"
                    />
                    <PermissionItem
                        label="Location"
                        granted={locationStatus?.granted ?? false}
                        icon="location"
                    />
                    <PermissionItem
                        label="Photos"
                        granted={mediaLibraryStatus?.granted ?? false}
                        icon="images"
                    />
                    <PermissionItem
                        label="Microphone"
                        granted={hasMicrophonePermission}
                        icon="mic"
                    />
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleGrantable}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#007AFF', '#0056b3']}
                        style={styles.gradientButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.buttonText}>Grant All Permissions</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={openSettings} style={styles.linkButton}>
                    <Text style={styles.linkText}>Open Settings manually</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function PermissionItem({ label, granted, icon }: { label: string, granted: boolean, icon: keyof typeof Ionicons.glyphMap }) {
    return (
        <View style={styles.permissionItem}>
            <View style={styles.permissionLeft}>
                <Ionicons name={icon} size={20} color={granted ? "#34C759" : "#8E8E93"} />
                <Text style={[styles.permissionLabel, granted && styles.permissionLabelGranted]}>
                    {label}
                </Text>
            </View>
            <Ionicons
                name={granted ? "checkmark-circle" : "ellipse-outline"}
                size={24}
                color={granted ? "#34C759" : "#3A3A3C"}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        width: width * 0.85,
        alignItems: 'center',
    },
    iconContainer: {
        flexDirection: 'row',
        marginBottom: 32,
        gap: 16,
    },
    icon: {
        opacity: 0.9,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 16,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    description: {
        fontSize: 16,
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 24,
    },
    statusContainer: {
        width: '100%',
        backgroundColor: 'rgba(28, 28, 30, 0.6)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 32,
    },
    permissionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    permissionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    permissionLabel: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '500',
    },
    permissionLabelGranted: {
        color: '#fff',
    },
    button: {
        width: '100%',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    gradientButton: {
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
    },
    linkButton: {
        marginTop: 20,
        padding: 10,
    },
    linkText: {
        color: '#007AFF',
        fontSize: 15,
    }
});
