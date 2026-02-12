import * as Location from 'expo-location';

export interface LocationData {
    latitude: number;
    longitude: number;
    formatted: string;
    address?: string; // Added address field
}

export class LocationManager {
    static async requestPermissions(): Promise<boolean> {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            return status === 'granted';
        } catch (error) {
            console.error("Location Permission Error:", error);
            return false;
        }
    }

    static async getCurrentLocation(): Promise<LocationData | null> {
        try {
            // Check permissions again to be safe
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status !== 'granted') return null;

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const address = await this.getAddressFromCoords(location.coords.latitude, location.coords.longitude);

            return {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                formatted: this.formatCoordinates(location.coords.latitude, location.coords.longitude),
                address: address
            };
        } catch (error) {
            console.error("Get Location Error:", error);
            return null;
        }
    }

    static async subscribeToLocationUpdates(callback: (loc: LocationData) => void): Promise<() => void> {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
            console.warn("Location permission not granted for subscription");
            return () => { };
        }

        const subscription = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 5000, // Update every 5 seconds
                distanceInterval: 10, // Update every 10 meters
            },
            async (location) => {
                const address = await this.getAddressFromCoords(location.coords.latitude, location.coords.longitude);
                callback({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    formatted: this.formatCoordinates(location.coords.latitude, location.coords.longitude),
                    address: address
                });
            }
        );

        return () => subscription.remove();
    }

    private static async getAddressFromCoords(lat: number, lon: number): Promise<string | undefined> {
        try {
            const addresses = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
            if (addresses && addresses.length > 0) {
                const addr = addresses[0];
                // Construct a readable address string
                // Example: "San Francisco, CA, USA" or "123 Main St, Springfield"

                // Filter out null/undefined parts
                const parts = [
                    addr.city || addr.subregion || addr.district,
                    addr.region || addr.isoCountryCode,
                    addr.country
                ].filter(part => part);

                // Remove duplicates (e.g. sometimes city and district are same)
                return [...new Set(parts)].join(', ');
            }
        } catch (error) {
            console.warn("Reverse geocode failed:", error);
        }
        return undefined;
    }

    private static formatCoordinates(lat: number, lon: number): string {
        const latDir = lat >= 0 ? "N" : "S";
        const lonDir = lon >= 0 ? "E" : "W";
        return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
    }
}
