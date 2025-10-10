// Re-export types
export type { Region, Province, City, Barangay } from '../types/location';

// Re-export complete data
export { philippineLocations } from '../constants/philippineLocations';

// Import for helper functions
import { philippineLocations } from '../constants/philippineLocations';

/**
 * Get all region names
 */
export const getRegions = (): string[] => {
  return philippineLocations.map((r) => r.name);
};

/**
 * Get all provinces for a specific region (by region name)
 */
export const getProvincesByRegion = (regionName: string): string[] => {
  const region = philippineLocations.find((r) => r.name === regionName);
  return region ? region.provinces.map((p) => p.name) : [];
};

/**
 * Get all cities/municipalities for a specific province (by province name)
 */
export const getCitiesByProvince = (
  regionName: string,
  provinceName: string
): string[] => {
  const region = philippineLocations.find((r) => r.name === regionName);
  if (!region) return [];

  const province = region.provinces.find((p) => p.name === provinceName);
  return province ? province.cities.map((c) => c.name) : [];
};

/**
 * Get all barangays for a specific city (by city name)
 */
export const getBarangaysByCity = (
  regionName: string,
  provinceName: string,
  cityName: string
): string[] => {
  const region = philippineLocations.find((r) => r.name === regionName);
  if (!region) return [];

  const province = region.provinces.find((p) => p.name === provinceName);
  if (!province) return [];

  const city = province.cities.find((c) => c.name === cityName);
  return city ? city.barangays.map((b) => b.name) : [];
};
