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
        // Initialize if needed
    }

    async setSound(soundType: ShutterSound) {
        this.currentSound = soundType;
        // Optionally preload
        // await this.unloadSound();
        // await this.loadSound(soundType);
    }

    async getSound() {
        return this.currentSound;
    }

    async playShutterSound() {
        try {
            // Unload previous sound to free resources
            if (this.player) {
                this.player.remove();
                this.player = null;
            }

            const source = SOUND_FILES[this.currentSound];
            this.player = createAudioPlayer(source);

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
