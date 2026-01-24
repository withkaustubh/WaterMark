import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Linking, Alert, TouchableOpacity } from 'react-native';
import { useCameraPermission } from 'react-native-vision-camera';

export default function PermissionPage() {
    const { requestPermission } = useCameraPermission();

    const handlePermission = useCallback(async () => {
        const result = await requestPermission();
        if (!result) {
            Alert.alert(
                "Permission Required",
                "Camera permission is required to use this app. Please enable it in settings.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Open Settings", onPress: () => Linking.openSettings() }
                ]
            );
        }
    }, [requestPermission]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Camera Access Needed</Text>
            <Text style={styles.description}>
                WaterMark needs access to your camera to frame and capture your photos.
            </Text>
            <TouchableOpacity onPress={handlePermission} style={styles.button} activeOpacity={0.8}>
                <Text style={styles.buttonText}>Grant Access</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000', // Dark theme background
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#a1a1a1',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 24,
        maxWidth: '80%',
    },
    button: {
        backgroundColor: '#007AFF', // iOS blue, can be customized
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
    }
});
