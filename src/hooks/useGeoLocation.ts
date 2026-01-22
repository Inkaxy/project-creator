import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface LocationValidation {
  isValid: boolean;
  distance: number | null;
  allowedRadius: number | null;
  message?: string;
}

// Haversine formula to calculate distance between two GPS coordinates
function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Hook for fetching work location based on user's department
export function useWorkLocation(departmentId?: string | null) {
  return useQuery({
    queryKey: ["work-location", departmentId],
    queryFn: async () => {
      if (!departmentId) return null;

      // First get the department's location_id
      const { data: dept, error: deptError } = await supabase
        .from("departments")
        .select("location_id")
        .eq("id", departmentId)
        .single();

      if (deptError || !dept?.location_id) return null;

      // Then get the location details
      const { data: location, error: locError } = await supabase
        .from("locations")
        .select("*")
        .eq("id", dept.location_id)
        .single();

      if (locError) return null;

      return location;
    },
    enabled: !!departmentId,
  });
}

// Hook for checking if GPS is required for an employee
export function useGpsRequired(employeeId?: string) {
  return useQuery({
    queryKey: ["gps-required", employeeId],
    queryFn: async () => {
      if (!employeeId) return false;

      const { data, error } = await supabase
        .from("employee_details")
        .select("gps_required, allow_mobile_clock")
        .eq("employee_id", employeeId)
        .maybeSingle();

      if (error || !data) return false;

      return {
        gpsRequired: data.gps_required ?? false,
        allowMobileClock: data.allow_mobile_clock ?? true,
      };
    },
    enabled: !!employeeId,
  });
}

// Main hook for geolocation functionality
export function useGeoLocation() {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentPosition = useCallback((): Promise<GeoPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation støttes ikke av din nettleser"));
        return;
      }

      setIsLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPosition = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setPosition(newPosition);
          setIsLoading(false);
          resolve(newPosition);
        },
        (err) => {
          let errorMessage = "Kunne ikke hente posisjon";
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = "Tilgang til posisjon ble nektet";
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = "Posisjon er ikke tilgjengelig";
              break;
            case err.TIMEOUT:
              errorMessage = "Tidsavbrudd ved henting av posisjon";
              break;
          }
          setError(errorMessage);
          setIsLoading(false);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  const validatePosition = useCallback(
    (
      userPosition: GeoPosition,
      workLocation: { gps_lat: number; gps_lng: number; gps_radius: number }
    ): LocationValidation => {
      const distance = calculateHaversineDistance(
        userPosition.latitude,
        userPosition.longitude,
        workLocation.gps_lat,
        workLocation.gps_lng
      );

      const isValid = distance <= workLocation.gps_radius;

      return {
        isValid,
        distance: Math.round(distance),
        allowedRadius: workLocation.gps_radius,
        message: isValid
          ? `Du er ${Math.round(distance)}m fra arbeidsplassen`
          : `Du er ${Math.round(distance)}m unna. Tillatt avstand er ${workLocation.gps_radius}m`,
      };
    },
    []
  );

  return {
    position,
    error,
    isLoading,
    getCurrentPosition,
    validatePosition,
  };
}

// Combined hook that handles full GPS validation flow
export function useGpsValidation() {
  const { user, profile } = useAuth();
  const { data: workLocation, isLoading: loadingLocation } = useWorkLocation(profile?.department_id);
  const { data: gpsSettings, isLoading: loadingSettings } = useGpsRequired(user?.id);
  const { position, error, isLoading, getCurrentPosition, validatePosition } = useGeoLocation();

  const [validationResult, setValidationResult] = useState<LocationValidation | null>(null);

  // Extract gpsRequired safely - gpsSettings can be false or an object
  const gpsRequiredValue = typeof gpsSettings === 'object' && gpsSettings !== null 
    ? gpsSettings.gpsRequired 
    : false;

  const validate = useCallback(async (): Promise<LocationValidation> => {
    // If GPS is not required or no work location, allow clock-in
    if (!gpsRequiredValue || !workLocation?.gps_lat || !workLocation?.gps_lng) {
      return { isValid: true, distance: null, allowedRadius: null };
    }

    try {
      const pos = await getCurrentPosition();
      const result = validatePosition(pos, {
        gps_lat: workLocation.gps_lat,
        gps_lng: workLocation.gps_lng,
        gps_radius: workLocation.gps_radius || 100,
      });
      setValidationResult(result);
      return result;
    } catch (err) {
      // If we can't get position but GPS is required, block
      return {
        isValid: false,
        distance: null,
        allowedRadius: workLocation.gps_radius || 100,
        message: error || "Kunne ikke verifisere posisjon",
      };
    }
  }, [gpsRequiredValue, workLocation, getCurrentPosition, validatePosition, error]);

  return {
    gpsRequired: gpsRequiredValue,
    hasWorkLocation: !!(workLocation?.gps_lat && workLocation?.gps_lng),
    workLocation,
    position,
    validationResult,
    isLoading: loadingLocation || loadingSettings || isLoading,
    error,
    validate,
  };
}
