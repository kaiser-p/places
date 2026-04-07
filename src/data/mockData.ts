export interface City {
  name: string;
  coords: [number, number];
  countryCode: string;
  size?: 'small' | 'medium' | 'large';
}

export interface Landmark {
  name: string;
  coords: [number, number];
}

export const cities: City[] = [
  { name: "Paris", coords: [48.8566, 2.3522], countryCode: "FRA", size: 'large' },
  { name: "Tokyo", coords: [35.6762, 139.6503], countryCode: "JPN", size: 'large' },
  { name: "New York", coords: [40.7128, -74.006], countryCode: "USA", size: 'large' },
  { name: "Berlin", coords: [52.52, 13.405], countryCode: "DEU", size: 'large' },
  { name: "London", coords: [51.5074, -0.1278], countryCode: "GBR", size: 'large' },
  { name: "Rome", coords: [41.9028, 12.4964], countryCode: "ITA", size: 'medium' },
  { name: "Zurich", coords: [47.3769, 8.5417], countryCode: "CHE", size: 'medium' },
  { name: "Vienna", coords: [48.2082, 16.3738], countryCode: "AUT", size: 'medium' },
];

export const landmarks: Landmark[] = [
  { name: "Eiffel Tower", coords: [48.8584, 2.2945] },
  { name: "Senso-ji Temple", coords: [35.7148, 139.7967] },
  { name: "Statue of Liberty", coords: [40.6892, -74.0445] },
  { name: "Brandenburg Gate", coords: [52.5163, 13.3777] },
  { name: "Tower Bridge", coords: [51.5055, -0.0754] },
  { name: "Colosseum", coords: [41.8902, 12.4922] },
];
