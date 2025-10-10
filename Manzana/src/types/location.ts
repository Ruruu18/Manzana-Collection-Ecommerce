// TypeScript interfaces for Philippine location data

export interface Barangay {
  name: string;
}

export interface City {
  name: string;
  barangays: Barangay[];
}

export interface Province {
  name: string;
  cities: City[];
}

export interface Region {
  name: string;
  code: string;
  provinces: Province[];
}
