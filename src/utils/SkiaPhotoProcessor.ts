import { Skia, ImageFormat, ClipOp, matchFont } from "@shopify/react-native-skia";
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { Buffer } from 'buffer';
import { DEFAULT_WATERMARK_COLOR } from '../constants/Colors';

export interface ProcessRequest {
    uri: string;
    location?: string;
    address?: string;
    date?: string;
    watermarkColor?: string;
}

export class SkiaPhotoProcessor {
    static async processPhoto(request: ProcessRequest): Promise<string | null> {
        try {
            console.log("Starting Skia Processing:", request.uri);

            // 1. Load Original Image Data
            const fileContent = await FileSystem.readAsStringAsync(request.uri, {
                encoding: 'base64',
            });
            const imageData = Skia.Data.fromBase64(fileContent);
            const image = Skia.Image.MakeImageFromEncoded(imageData);

            if (!image) {
                console.error("Failed to load image into Skia");
                return null;
            }

            const width = image.width();
            const height = image.height();
            console.log(`Image Loaded: ${width}x${height}`);

            // 2. Create Surface
            const surface = Skia.Surface.Make(width, height);
            if (!surface) {
                console.error("Failed to create Skia surface");
                return null;
            }

            const canvas = surface.getCanvas();

            // 3. Draw Original Image
            canvas.drawImage(image, 0, 0);

            // 4. Draw Watermark
            // Calculate scale based on a reference width (e.g., standard phone width ~400px)
            // If image is 4000px wide, scale is 10.
            const baseWidth = 400;
            const scale = width / baseWidth;

            const padding = 20 * scale;
            const bottomMargin = 20 * scale;

            // Box Styles
            const boxPaddingV = 8 * scale;
            const boxPaddingH = 12 * scale;
            const borderRadius = 8 * scale;
            const borderLeftWidth = 3 * scale;

            // Font Sizes
            const brandFontSize = 16 * scale;
            const metaFontSize = 10 * scale;

            // Paint Setup
            const paint = Skia.Paint();
            paint.setAntiAlias(true);

            // Fonts
            const fontFamily = Platform.select({ ios: "System", default: "sans-serif" });

            const brandFont = matchFont({ fontFamily, fontSize: brandFontSize });
            const metaFont = matchFont({ fontFamily, fontSize: metaFontSize });

            if (!brandFont || !metaFont) {
                console.error("Skia: Failed to load system fonts");
                return null;
            }

            // Measure Text
            const brandText = "Shot on WaterMark";
            const dateText = request.date || new Date().toLocaleString();
            const locationText = request.location || "";

            // Note: measureText returns SkRect (bounds) in this version
            const brandBounds = brandFont.measureText(brandText);
            const dateBounds = metaFont.measureText(dateText);
            const locBounds = locationText ? metaFont.measureText(locationText) : { width: 0 };
            const addrBounds = request.address ? metaFont.measureText(request.address) : { width: 0 };

            // Extract width from SkRect (assuming .width property exists, or use generic fallback)
            const brandWidth = (brandBounds as any).width || 0;
            const dateWidth = (dateBounds as any).width || 0;
            const locWidth = (locBounds as any).width || 0;
            const addrWidth = (addrBounds as any).width || 0;

            const maxTextWidth = Math.max(brandWidth, dateWidth, locWidth, addrWidth);

            // Box Dimensions
            const boxWidth = maxTextWidth + (boxPaddingH * 2) + borderLeftWidth;

            // Approx line heights
            const brandHeight = brandFontSize * 1.2;
            const metaHeight = metaFontSize * 1.2;
            let contentHeight = brandHeight + metaHeight;
            if (locationText) contentHeight += metaHeight;
            if (request.address) contentHeight += metaHeight;

            const boxHeight = contentHeight + (boxPaddingV * 2);

            // Position (Bottom Left)
            const x = padding;
            const y = height - bottomMargin - boxHeight;

            // A. Draw Semi-Transparent Background
            paint.setColor(Skia.Color("rgba(0, 0, 0, 0.4)"));
            const rect = Skia.XYWHRect(x, y, boxWidth, boxHeight);
            const rrect = Skia.RRectXY(rect, borderRadius, borderRadius);
            canvas.drawRRect(rrect, paint);

            // B. Draw Left Border (Accent)
            const accentColor = request.watermarkColor || DEFAULT_WATERMARK_COLOR;
            paint.setColor(Skia.Color(accentColor));

            const borderRect = Skia.XYWHRect(x, y, borderLeftWidth, boxHeight);

            canvas.save();
            // Clip to the main rounded rect so the left border is also rounded/contained
            canvas.clipRRect(rrect, ClipOp.Intersect, true);
            canvas.drawRect(borderRect, paint);
            canvas.restore();

            // C. Draw Text
            paint.setColor(Skia.Color("white"));

            // Text Positions
            let textY = y + boxPaddingV + brandFontSize; // Baseline approx

            // Brand
            canvas.drawText(brandText, x + boxPaddingH + borderLeftWidth, textY, paint, brandFont);

            textY += metaHeight; // Move down

            // Meta: Date
            paint.setColor(Skia.Color("rgba(255, 255, 255, 0.8)"));
            canvas.drawText(dateText, x + boxPaddingH + borderLeftWidth, textY, paint, metaFont);

            if (locationText) {
                textY += metaHeight;
                canvas.drawText(locationText, x + boxPaddingH + borderLeftWidth, textY, paint, metaFont);
            }

            if (request.address) {
                textY += metaHeight;
                canvas.drawText(request.address, x + boxPaddingH + borderLeftWidth, textY, paint, metaFont);
            }

            // 5. Save Output
            const resultImage = surface.makeImageSnapshot();
            const resultData = resultImage.encodeToBytes(ImageFormat.JPEG, 90);
            if (!resultData) {
                console.error("Failed to encode image");
                return null;
            }

            // @ts-ignore: FileSystem type mismatch suppression
            const cacheDir = FileSystem.cacheDirectory;
            const processedUri = (cacheDir || '') + `watermark_${Date.now()}.jpg`;

            // Convert Uint8Array to Base64
            const base64Data = Buffer.from(resultData).toString('base64');

            await FileSystem.writeAsStringAsync(processedUri, base64Data, {
                encoding: 'base64',
            });

            console.log("Processed Photo Saved:", processedUri);
            return processedUri;

        } catch (error) {
            console.error("Skia Processing Error:", error);
            return null;
        }
    }
}

