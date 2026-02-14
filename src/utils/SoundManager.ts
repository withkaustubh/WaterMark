import { createAudioPlayer, AudioPlayer } from 'expo-audio';

// Map of sound files
const SOUND_FILES = {
    'shutter1': require('../../assets/sounds/shutter1.mp3'),
    'shutter2': require('../../assets/sounds/shutter2.mp3'),
    'shutter3': require('../../assets/sounds/shutter3.mp3'),
};

export type ShutterSound = keyof typeof SOUND_FILES;

export const SOUND_OPTIONS: { id: ShutterSound; label: string }[] = [
    { id: 'shutter1', label: 'Classic' },
    { id: 'shutter2', label: 'Modern' },
    { id: 'shutter3', label: 'Soft' },
];

class SoundManagerClass {
    private player: AudioPlayer | null = null;
    private currentSound: ShutterSound = 'shutter1';

    constructor() {
        // expo-audio's AudioPlayer automatically handles audio session configuration
        // (playsInSilentModeIOS, ducking, etc.) — no separate configureAudio needed.
    }

    async setSound(soundType: ShutterSound) {
        this.currentSound = soundType;
    }

    async getSound() {
        return this.currentSound;
    }

    async playShutterSound() {
        // Fire and forget - don't await this in critical path
        this._playInternal();
    }

    private async _playInternal() {
        try {
            // If a player exists and is playing, stop it and remove it
            if (this.player) {
                try {
                    this.player.remove();
                } catch (e) {
                    // Ignore cleanup errors
                }
                this.player = null;
            }

            const source = SOUND_FILES[this.currentSound];
            this.player = createAudioPlayer(source);

            // Ensure volume is max
            this.player.volume = 1.0;
            this.player.play();

            // Set up a cleanup when done
            this.player.addListener('playbackStatusUpdate', (status) => {
                if (status.didJustFinish) {
                    this.player?.remove();
                    this.player = null;
                }
            });

        } catch (error) {
            console.error('Failed to play sound', error);
        }
    }
}

export const SoundManager = new SoundManagerClass();
