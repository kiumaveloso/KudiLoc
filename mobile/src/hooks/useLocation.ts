// ---------------------------------------------------------------------------
// Hook to get user's current GPS location with permission handling
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';
import pt from '../constants/strings';

interface LocationState {
  latitude: number;
  longitude: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Default to Luanda center if location is unavailable or outside Angola
const DEFAULT_LATITUDE = -8.8383;
const DEFAULT_LONGITUDE = 13.2344;

// Angola bounding box — if GPS returns something outside this, use Luanda default
// (iOS simulator defaults to Apple Park, Cupertino which is outside Angola)
const isInAngola = (lat: number, lon: number) =>
  lat >= -18.5 && lat <= -4.0 && lon >= 11.0 && lon <= 24.5;

export function useLocation(): LocationState {
  const [latitude, setLatitude] = useState(DEFAULT_LATITUDE);
  const [longitude, setLongitude] = useState(DEFAULT_LONGITUDE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyCoords = (lat: number, lon: number) => {
    if (isInAngola(lat, lon)) {
      setLatitude(lat);
      setLongitude(lon);
    } else {
      setLatitude(DEFAULT_LATITUDE);
      setLongitude(DEFAULT_LONGITUDE);
    }
  };

  const fetchLocation = async () => {
    setLoading(true);
    setError(null);

    // On web, use browser Geolocation API directly for reliability
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          applyCoords(pos.coords.latitude, pos.coords.longitude);
          setLoading(false);
        },
        () => {
          setError(pt.locationDenied);
          setLoading(false);
        },
        { timeout: 10000, maximumAge: 60000 },
      );
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError(pt.locationDenied);
        if (Platform.OS !== 'web') {
          Alert.alert(pt.locationPermissionTitle, pt.locationPermissionMessage);
        }
        setLoading(false);
        return;
      }

      // Get initial position with high accuracy
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      applyCoords(loc.coords.latitude, loc.coords.longitude);
      setLoading(false);

      // Watch for continuous position updates
      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (pos) => applyCoords(pos.coords.latitude, pos.coords.longitude),
      );
      return sub;
    } catch {
      setError(pt.locationUnavailable);
      setLoading(false);
    }
  };

  useEffect(() => {
    let sub: Location.LocationSubscription | undefined;
    fetchLocation().then((s) => { sub = s as any; });
    return () => { sub?.remove(); };
  }, []);

  return { latitude, longitude, loading, error, refresh: fetchLocation };
}
