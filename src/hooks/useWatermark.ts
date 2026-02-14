import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationManager, LocationData } from '../utils/LocationManager';
import { SoundManager, ShutterSound } from '../utils/SoundManager';
import { DEFAULT_WATERMARK_COLOR } from '../constants/Colors';

const SETTINGS_KEY = 'watermark_settings';
const SAVE_DEBOUNCE_MS = 500;

export function useWatermark() {
    // Location state
    const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
    const [isLocating, setIsLocating] = useState(true);

    // Watermark preferences
    const [watermarkEnabled, setWatermarkEnabled] = useState(true);
    const [watermarkColor, setWatermarkColor] = useState(DEFAULT_WATERMARK_COLOR);

    // Sound preference
    const [selectedSound, setSelectedSound] = useState<ShutterSound>('shutter1');

    // Settings panel
    const [showSettings, setShowSettings] = useState(false);

    // Persistence internals
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    // ── Location Setup (S5 fix: isMounted guard) ─────────────────────
    useEffect(() => {
        let isMounted = true;
        let unsubscribe: (() => void) | undefined;

        const setupLocation = async () => {
            const granted = await LocationManager.requestPermissions();
            if (!isMounted) return;

            if (granted) {
                const initialLoc = await LocationManager.getCurrentLocation();
                if (!isMounted) return;

                if (initialLoc) {
                    setCurrentLocation(initialLoc);
                }
                setIsLocating(false);

                // Subscribe for updates
                const unsub = await LocationManager.subscribeToLocationUpdates((loc) => {
                    if (isMounted) setCurrentLocation(loc);
                });
                if (isMounted) {
                    unsubscribe = unsub;
                } else {
                    // Component unmounted while awaiting — clean up immediately
                    unsub();
                }
            } else {
                setIsLocating(false);
            }
        };

        setupLocation();

        return () => {
            isMounted = false;
            if (unsubscribe) unsubscribe();
        };
    }, []);

    // ── Load Settings ───────────────────────────────────────────────
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

    // ── Save Settings (C1 fix: debounced) ───────────────────────────
    useEffect(() => {
        if (!settingsLoaded) return;

        // Clear any pending save
        if (saveTimer.current) clearTimeout(saveTimer.current);

        saveTimer.current = setTimeout(async () => {
            try {
                await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({
                    watermarkEnabled,
                    watermarkColor,
                    selectedSound,
                }));
            } catch (e) {
                console.error('Failed to save settings', e);
            }
        }, SAVE_DEBOUNCE_MS);

        return () => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
        };
    }, [watermarkEnabled, watermarkColor, selectedSound, settingsLoaded]);

    // Wrapped setter that keeps SoundManager in sync
    const updateSelectedSound = useCallback((sound: ShutterSound) => {
        setSelectedSound(sound);
        SoundManager.setSound(sound);
    }, []);

    // Stable toggle (M1 fix)
    const toggleSettings = useCallback(() => {
        setShowSettings(s => !s);
    }, []);

    return {
        currentLocation,
        isLocating,
        watermarkEnabled,
        setWatermarkEnabled,
        watermarkColor,
        setWatermarkColor,
        selectedSound,
        setSelectedSound: updateSelectedSound,
        showSettings,
        toggleSettings,
    };
}
