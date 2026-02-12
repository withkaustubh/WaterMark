import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DEFAULT_WATERMARK_COLOR } from '../constants/Colors';

interface WatermarkProps {
    date?: string;
    location?: string;
    address?: string;
    scale?: number; // For adjusting size if baked image is different resolution
    color?: string;
}

const Watermark = ({ date, location, address, scale = 1, color = DEFAULT_WATERMARK_COLOR }: WatermarkProps) => {
    // Default to now if no date provided
    const displayDate = date || new Date().toLocaleString();

    return (
        <View style={[styles.container, { transform: [{ scale }] }]}>
            <View style={[styles.glassContainer, { borderLeftColor: color }]}>
                {/* Branding */}
                <Text style={styles.brandText}>Shot on WaterMark</Text>

                {/* Metadata */}
                <View style={styles.metadataContainer}>
                    <Text style={styles.metaText}>{displayDate}</Text>
                    {location && (
                        <Text style={styles.metaText}>{location}</Text>
                    )}
                    {address && (
                        <Text style={styles.metaText}>{address}</Text>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        alignItems: 'flex-start',
    },
    // Using a simpler semi-transparent background for broader compatibility
    // and better readability on varied backgrounds
    glassContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: DEFAULT_WATERMARK_COLOR, // Gold accent
    },
    brandText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    metadataContainer: {
        flexDirection: 'column',
    },
    metaText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 10,
        fontWeight: '500',
        marginTop: 1,
    }
});

export default Watermark;
