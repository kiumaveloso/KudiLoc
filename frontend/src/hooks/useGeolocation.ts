// ---------------------------------------------------------------------------
// Geolocation hook – gets the user's current GPS position.
// Falls back to Luanda center if geolocation is unavailable.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from 'react';

/** Default center: Luanda, Angola */
const DEFAULT_LAT = -8.8383;
const DEFAULT_LNG = 13.2344;

interface GeoState {
  latitude: number;
  longitude: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useGeolocation(): GeoState {
  const [latitude, setLatitude] = useState(DEFAULT_LAT);
  const [longitude, setLongitude] = useState(DEFAULT_LNG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada pelo navegador');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLoading(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setError('Não foi possível obter a sua localização. A usar Luanda como padrão.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  return { latitude, longitude, loading, error, refresh: locate };
}
