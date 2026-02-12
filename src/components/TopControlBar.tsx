import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '../constants/Colors';

interface TopControlBarProps {
    hasFlash: boolean | undefined;
    hasTorch: boolean | undefined;
    flash: 'auto' | 'on' | 'off';
    toggleFlash: () => void;
    isTorchOn: boolean;
    toggleTorch: () => void;
    showSettings: boolean;
    toggleSettings: () => void;
}

const TopControlBar = ({
    hasFlash,
    hasTorch,
    flash,
    toggleFlash,
    isTorchOn,
    toggleTorch,
    showSettings,
    toggleSettings
}: TopControlBarProps) => {

    return (
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
                        color={isTorchOn ? Colors.gold : 'white'}
                    />
                    <Text style={styles.controlLabel}>
                        {isTorchOn ? 'On' : 'Off'}
                    </Text>
                </TouchableOpacity>
            )}

            {/* Settings Button */}
            <TouchableOpacity
                style={styles.controlButton}
                onPress={toggleSettings}
            >
                <Ionicons
                    name="settings-outline"
                    size={28}
                    color={showSettings ? Colors.gold : 'white'}
                />
                <Text style={styles.controlLabel}>Settings</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
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
});

export default TopControlBar;
