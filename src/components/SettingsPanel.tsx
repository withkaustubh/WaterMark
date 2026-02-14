import React from 'react';
import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Colors, WATERMARK_COLORS } from '../constants/Colors';
import { ShutterSound, SOUND_OPTIONS } from '../utils/SoundManager';

interface SettingsPanelProps {
    visible: boolean;
    watermarkEnabled: boolean;
    setWatermarkEnabled: (enabled: boolean) => void;
    watermarkColor: string;
    setWatermarkColor: (color: string) => void;
    selectedSound: ShutterSound;
    setSelectedSound: (sound: ShutterSound) => void;
}

const SettingsPanel = ({
    visible,
    watermarkEnabled,
    setWatermarkEnabled,
    watermarkColor,
    setWatermarkColor,
    selectedSound,
    setSelectedSound
}: SettingsPanelProps) => {
    if (!visible) return null;

    return (
        <Animated.View
            entering={FadeIn.duration(200)}
            style={styles.settingsPanel}
        >
            <BlurView intensity={30} tint="dark" style={styles.settingsBlur}>

                {/* Toggle Watermark */}
                <View style={styles.settingRow}>
                    <Text style={styles.settingText}>Enable Watermark</Text>
                    <Switch
                        value={watermarkEnabled}
                        onValueChange={setWatermarkEnabled}
                        trackColor={{ false: "#767577", true: Colors.gold }}
                        thumbColor={watermarkEnabled ? "#f4f3f4" : "#f4f3f4"}
                    />
                </View>

                {/* Shutter Sound Selection */}
                <View style={[styles.settingRow, { flexDirection: 'column', alignItems: 'flex-start', gap: 10 }]}>
                    <Text style={styles.settingText}>Shutter Sound</Text>
                    <View style={styles.soundRow}>
                        {SOUND_OPTIONS.map((option) => (
                            <Pressable
                                key={option.id}
                                onPress={() => setSelectedSound(option.id)}
                                style={[
                                    styles.soundButton,
                                    selectedSound === option.id && styles.activeSoundButton
                                ]}
                            >
                                <Text style={[
                                    styles.soundButtonText,
                                    selectedSound === option.id && styles.activeSoundButtonText
                                ]}>
                                    {option.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Color Picker (Only if enabled) */}
                {watermarkEnabled && (
                    <View style={[styles.settingRow, { flexDirection: 'column', alignItems: 'flex-start', gap: 10 }]}>
                        <Text style={styles.settingText}>Watermark Color</Text>
                        <View style={styles.colorRow}>
                            {WATERMARK_COLORS.map((color) => (
                                <Pressable
                                    key={color}
                                    onPress={() => setWatermarkColor(color)}
                                    style={[
                                        styles.colorCircle,
                                        { backgroundColor: color },
                                        watermarkColor === color && styles.activeColorCircle
                                    ]}
                                />
                            ))}
                        </View>
                    </View>
                )}
            </BlurView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    settingsPanel: {
        position: 'absolute',
        top: 130, // Below top bar
        left: 20,
        right: 20,
        borderRadius: 15,
        overflow: 'hidden',
        zIndex: 20,
    },
    settingsBlur: {
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    settingText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    colorRow: {
        flexDirection: 'row',
        gap: 15,
    },
    colorCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    activeColorCircle: {
        borderColor: 'white',
        transform: [{ scale: 1.2 }],
    },
    soundRow: {
        flexDirection: 'row',
        gap: 10,
        flexWrap: 'wrap',
    },
    soundButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    activeSoundButton: {
        backgroundColor: Colors.active,
        borderColor: Colors.active,
    },
    soundButtonText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
    },
    activeSoundButtonText: {
        color: 'white',
        fontWeight: 'bold',
    }
});

export default SettingsPanel;
