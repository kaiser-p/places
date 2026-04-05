import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { cities, landmarks } from '../data/mockData';
import worldData from '../data/world.json';
import { FeatureCollection, Geometry } from 'geojson';

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const visitedCountryCodes = cities.map(c => c.countryCode);

    // Initialize MapLibre with Raster Tiles for maximum reliability
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'raster-tiles': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          },
          'visited-countries-geo': {
            type: 'geojson',
            data: worldData as FeatureCollection<Geometry, any>
          }
        },
        layers: [
          {
            id: 'raster-layer',
            type: 'raster',
            source: 'raster-tiles',
            minzoom: 0,
            maxzoom: 22
          },
          // Visited Countries Highlight (using high-res 50m GeoJSON)
          {
            id: 'visited-countries-highlight',
            type: 'fill',
            source: 'visited-countries-geo',
            filter: ['in', ['get', 'ISO_A3'], ['literal', visitedCountryCodes]],
            paint: {
              'fill-color': '#10b981',
              'fill-opacity': 0.3
            }
          },
          {
            id: 'visited-countries-outline',
            type: 'line',
            source: 'visited-countries-geo',
            filter: ['in', ['get', 'ISO_A3'], ['literal', visitedCountryCodes]],
            paint: {
              'line-color': '#10b981',
              'line-width': 1.5,
              'line-opacity': 0.5
            }
          }
        ]
      },
      center: [0, 20],
      zoom: 1.5
    });

    // Expose map to window for testing
    (window as any).map = map.current;

    map.current.on('error', (e) => console.error('MapLibre error:', e));

    map.current.on('load', () => {
      if (!map.current) return;

      // Add Landmarks
      landmarks.forEach((landmark) => {
        const el = document.createElement('div');
        el.className = 'landmark-marker cursor-pointer';
        el.style.width = '6px';
        el.style.height = '6px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = 'silver';
        el.style.boxShadow = '0 0 4px rgba(192, 192, 192, 0.6)';

        new maplibregl.Marker({ element: el })
          .setLngLat([landmark.coords[1], landmark.coords[0]])
          .setPopup(new maplibregl.Popup({ offset: 10 }).setHTML(`<b>${landmark.name}</b><br>Landmark`))
          .addTo(map.current!);
      });

      // Add Cities
      cities.forEach((city) => {
        const el = document.createElement('div');
        el.className = 'city-marker cursor-pointer';
        el.style.width = '10px';
        el.style.height = '10px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = 'orange';
        el.style.boxShadow = '0 0 8px rgba(249, 115, 22, 0.6)';

        new maplibregl.Marker({ element: el })
          .setLngLat([city.coords[1], city.coords[0]])
          .setPopup(new maplibregl.Popup({ offset: 10 }).setHTML(`<b>${city.name}</b><br>City`))
          .addTo(map.current!);
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return <div ref={mapContainer} className="map-container" />;
};

export default Map;
