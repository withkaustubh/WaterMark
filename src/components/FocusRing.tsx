import React from 'react';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import { Colors } from '../constants/Colors';

interface FocusRingProps {
    focusX: SharedValue<number>;
    focusY: SharedValue<number>;
    focusOpacity: SharedValue<number>;
    focusScale: SharedValue<number>;
}

const FocusRing = ({ focusX, focusY, focusOpacity, focusScale }: FocusRingProps) => {

    const focusStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        left: focusX.value - 25, // Center the 50x50 ring
        top: focusY.value - 25,
        width: 50,
        height: 50,
        borderWidth: 2,
        borderColor: Colors.gold,
        borderRadius: 25,
        opacity: focusOpacity.value,
        transform: [{ scale: focusScale.value }],
    }));

    return <Animated.View style={focusStyle} pointerEvents="none" />;
};

export default FocusRing;
