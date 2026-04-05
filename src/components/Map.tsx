import { useEffect, useRef, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { cities, landmarks } from '../data/mockData';
import worldData from '../data/world.json';
import type { FeatureCollection, Geometry, Feature, Polygon, MultiPolygon } from 'geojson';
import { union, featureCollection } from '@turf/turf';

interface MapProps {
  isHomogenous: boolean;
  showLabels: boolean;
}

const Map = ({ isHomogenous, showLabels }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  // Memoize visited country codes and merged geometry
  const visitedCountryCodes = useMemo(() => 
    Array.from(new Set(cities.map(c => c.countryCode))),
  []);

  const mergedVisitedGeo = useMemo(() => {
    const visitedFeatures = (worldData as FeatureCollection<Geometry, any>).features.filter(
      f => visitedCountryCodes.includes(f.properties?.ISO_A3)
    );
    // Turf 7+ union takes a featureCollection
    return union(featureCollection(visitedFeatures as Feature<Polygon | MultiPolygon, any>[]));
  }, [visitedCountryCodes]);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // Initialize MapLibre with Raster Tiles for maximum reliability
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'raster-tiles-labels': {
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
          'raster-tiles-nolabels': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png',
              'https://b.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png',
              'https://c.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png',
              'https://d.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png'
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          },
          'visited-countries-geo': {
            type: 'geojson',
            data: (isHomogenous && mergedVisitedGeo)
              ? { type: 'FeatureCollection', features: [mergedVisitedGeo] } as FeatureCollection
              : (worldData as FeatureCollection<Geometry, any>)
          }
        },
        layers: [
          {
            id: 'raster-layer-nolabels',
            type: 'raster',
            source: 'raster-tiles-nolabels',
            minzoom: 0,
            maxzoom: 22,
            layout: { visibility: showLabels ? 'none' : 'visible' }
          },
          {
            id: 'raster-layer-labels',
            type: 'raster',
            source: 'raster-tiles-labels',
            minzoom: 0,
            maxzoom: 22,
            layout: { visibility: showLabels ? 'visible' : 'none' }
          },
          // Visited Countries Highlight
          {
            id: 'visited-countries-highlight',
            type: 'fill',
            source: 'visited-countries-geo',
            filter: isHomogenous ? undefined : ['in', ['get', 'ISO_A3'], ['literal', visitedCountryCodes]],
            paint: {
              'fill-color': '#10b981',
              'fill-opacity': 0.3
            }
          },
          {
            id: 'visited-countries-outline',
            type: 'line',
            source: 'visited-countries-geo',
            filter: isHomogenous ? undefined : ['in', ['get', 'ISO_A3'], ['literal', visitedCountryCodes]],
            paint: {
              'line-color': '#10b981',
              'line-width': 1.5,
              'line-opacity': isHomogenous ? 0 : 0.5
            }
          }
        ]
      },
      center: [0, 20],
      zoom: 1.5
    });

    // Expose map to window for testing
    (window as any).map = map.current;

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

  // Update styling when labels toggle changes
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      map.current.setLayoutProperty(
        'raster-layer-nolabels',
        'visibility',
        showLabels ? 'none' : 'visible'
      );
      map.current.setLayoutProperty(
        'raster-layer-labels',
        'visibility',
        showLabels ? 'visible' : 'none'
      );
    }
  }, [showLabels]);

  // Update styling and data when homogenous mode changes
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      const source = map.current.getSource('visited-countries-geo') as maplibregl.GeoJSONSource;
      if (!source) return;

      if (isHomogenous && mergedVisitedGeo) {
        source.setData({
          type: 'FeatureCollection',
          features: [mergedVisitedGeo]
        });
        map.current.setFilter('visited-countries-highlight', null);
        map.current.setFilter('visited-countries-outline', null);
        map.current.setPaintProperty('visited-countries-outline', 'line-opacity', 0);
      } else {
        source.setData(worldData as FeatureCollection<Geometry, any>);
        const filter = ['in', ['get', 'ISO_A3'], ['literal', visitedCountryCodes]] as maplibregl.FilterSpecification;
        map.current.setFilter('visited-countries-highlight', filter);
        map.current.setFilter('visited-countries-outline', filter);
        map.current.setPaintProperty('visited-countries-outline', 'line-opacity', 0.5);
      }
    }
  }, [isHomogenous, mergedVisitedGeo, visitedCountryCodes]);

  return <div ref={mapContainer} className="map-container" />;
};

export default Map;
