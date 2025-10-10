import { philippineLocations } from '../constants/philippineLocations';
import type { Region, Province, City, Barangay } from '../types/location';

/**
 * Helper functions for working with Philippine location data
 */

/**
 * Get all regions
 */
export const getRegions = (): Region[] => {
  return philippineLocations;
};

/**
 * Find a region by code
 */
export const getRegionByCode = (code: string): Region | undefined => {
  return philippineLocations.find(r => r.code === code);
};

/**
 * Find a region by name
 */
export const getRegionByName = (name: string): Region | undefined => {
  return philippineLocations.find(r =>
    r.name.toLowerCase().includes(name.toLowerCase())
  );
};

/**
 * Get all provinces from all regions
 */
export const getAllProvinces = (): Province[] => {
  return philippineLocations.flatMap(r => r.provinces);
};

/**
 * Get provinces from a specific region
 */
export const getProvincesByRegion = (regionCode: string): Province[] => {
  const region = getRegionByCode(regionCode);
  return region?.provinces || [];
};

/**
 * Find a province by name (searches all regions)
 */
export const getProvinceByName = (name: string): Province | undefined => {
  for (const region of philippineLocations) {
    const province = region.provinces.find(p =>
      p.name.toLowerCase().includes(name.toLowerCase())
    );
    if (province) return province;
  }
  return undefined;
};

/**
 * Get all cities/municipalities from all provinces
 */
export const getAllCities = (): City[] => {
  return philippineLocations.flatMap(r =>
    r.provinces.flatMap(p => p.cities)
  );
};

/**
 * Get cities from a specific province
 */
export const getCitiesByProvince = (provinceName: string): City[] => {
  const province = getProvinceByName(provinceName);
  return province?.cities || [];
};

/**
 * Find a city by name (searches all provinces)
 */
export const getCityByName = (name: string): City | undefined => {
  for (const region of philippineLocations) {
    for (const province of region.provinces) {
      const city = province.cities.find(c =>
        c.name.toLowerCase().includes(name.toLowerCase())
      );
      if (city) return city;
    }
  }
  return undefined;
};

/**
 * Get barangays from a specific city
 */
export const getBarangaysByCity = (cityName: string): Barangay[] => {
  const city = getCityByName(cityName);
  return city?.barangays || [];
};

/**
 * Search for locations by query string
 */
export const searchLocations = (query: string) => {
  const lowerQuery = query.toLowerCase();
  const results = {
    regions: [] as Region[],
    provinces: [] as Province[],
    cities: [] as City[],
    barangays: [] as Barangay[],
  };

  philippineLocations.forEach(region => {
    if (region.name.toLowerCase().includes(lowerQuery)) {
      results.regions.push(region);
    }

    region.provinces.forEach(province => {
      if (province.name.toLowerCase().includes(lowerQuery)) {
        results.provinces.push(province);
      }

      province.cities.forEach(city => {
        if (city.name.toLowerCase().includes(lowerQuery)) {
          results.cities.push(city);
        }

        city.barangays.forEach(barangay => {
          if (barangay.name.toLowerCase().includes(lowerQuery)) {
            results.barangays.push(barangay);
          }
        });
      });
    });
  });

  return results;
};

/**
 * Get location hierarchy (region > province > city > barangay)
 */
export const getLocationHierarchy = (
  barangayName?: string,
  cityName?: string,
  provinceName?: string,
  regionCode?: string
) => {
  let region: Region | undefined;
  let province: Province | undefined;
  let city: City | undefined;
  let barangay: Barangay | undefined;

  if (regionCode) {
    region = getRegionByCode(regionCode);
  }

  if (provinceName) {
    province = getProvinceByName(provinceName);
    if (province && !region) {
      // Find the region containing this province
      region = philippineLocations.find(r =>
        r.provinces.some(p => p.name === province!.name)
      );
    }
  }

  if (cityName) {
    city = getCityByName(cityName);
    if (city && !province) {
      // Find the province containing this city
      for (const r of philippineLocations) {
        for (const p of r.provinces) {
          if (p.cities.some(c => c.name === city!.name)) {
            province = p;
            region = r;
            break;
          }
        }
        if (province) break;
      }
    }
  }

  if (barangayName && city) {
    barangay = city.barangays.find(b =>
      b.name.toLowerCase() === barangayName.toLowerCase()
    );
  }

  return { region, province, city, barangay };
};

/**
 * Format location as complete address string
 */
export const formatAddress = (
  barangay?: string,
  city?: string,
  province?: string,
  region?: string
): string => {
  const parts = [barangay, city, province, region].filter(Boolean);
  return parts.join(', ');
};
