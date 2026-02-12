export const Colors = {
    // Base Colors
    background: '#050510', // Very dark blue/black
    surface: 'rgba(20, 20, 40, 0.8)', // Glassy dark blue

    // Theme Palette
    darkBlue: '#0F2027',
    purple: '#8E2DE2',
    pink: '#FF00CC',
    cyan: '#00F0FF',

    // Gradients
    // A vibrant cycle: Pink -> Purple -> Blue -> Cyan -> Pink
    captureRingGradient: [
        '#FF00CC', // Neon Pink
        '#8E2DE2', // Purple
        '#4A00E0', // Deep Blue
        '#00C9FF', // Cyan
        '#FF00CC', // Back to Pink for smooth loop
    ],

    // UI Elements
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    border: 'rgba(255, 255, 255, 0.2)',
    active: '#FF00CC',
    success: '#00FF99',
    gold: '#FFD700',
    error: '#FF3B30',
};

export const WATERMARK_COLORS = [
    Colors.gold, // Gold
    '#FF4444', // Red
    '#4444FF', // Blue
    '#FFFFFF', // White
    '#000000', // Black
];

export const DEFAULT_WATERMARK_COLOR = Colors.gold;
