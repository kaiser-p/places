import { useEffect, useRef, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import worldData from '../data/world.json';
import type { FeatureCollection, Geometry, Feature, Polygon, MultiPolygon } from 'geojson';
import { union, featureCollection } from '@turf/turf';
import type { City, Landmark } from '../data/mockData';

interface MapProps {
  isHomogenous: boolean;
  showLabels: boolean;
  cities: City[];
  landmarks: Landmark[];
}

const Map = ({ isHomogenous, showLabels, cities, landmarks }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Memoize visited country codes and merged geometry
  const visitedCountryCodes = useMemo(() => 
    Array.from(new Set(cities.map(c => c.countryCode).filter(Boolean))),
  [cities]);

  const mergedVisitedGeo = useMemo(() => {
    const visitedFeatures = (worldData as FeatureCollection<Geometry, any>).features.filter(
      f => visitedCountryCodes.includes(f.properties?.ISO_A3) || 
           visitedCountryCodes.includes(f.properties?.ISO_A2) ||
           visitedCountryCodes.includes(f.properties?.ADM0_A3) ||
           visitedCountryCodes.includes(f.properties?.SOV_A3) ||
           (f.properties?.SOVEREIGNT === 'France' && visitedCountryCodes.includes('FR'))
    );
    if (visitedFeatures.length === 0) return null;
    if (visitedFeatures.length === 1) return visitedFeatures[0] as Feature<Polygon | MultiPolygon, any>;
    // Turf 7+ union takes a featureCollection
    return union(featureCollection(visitedFeatures as Feature<Polygon | MultiPolygon, any>[]));
  }, [visitedCountryCodes]);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const highlightFilter = ['any', 
      ['in', ['get', 'ISO_A3'], ['literal', visitedCountryCodes]],
      ['in', ['get', 'ISO_A2'], ['literal', visitedCountryCodes]],
      ['in', ['get', 'ADM0_A3'], ['literal', visitedCountryCodes]],
      ['in', ['get', 'SOV_A3'], ['literal', visitedCountryCodes]]
    ] as any;

    // Specific hack for France in filters
    if (visitedCountryCodes.includes('FR') || visitedCountryCodes.includes('FRA')) {
      highlightFilter.push(['==', ['get', 'SOVEREIGNT'], 'France']);
    }

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
            ...(isHomogenous ? {} : { filter: highlightFilter }),
            paint: {
              'fill-color': '#10b981',
              'fill-opacity': 0.3
            }
          },
          {
            id: 'visited-countries-outline',
            type: 'line',
            source: 'visited-countries-geo',
            ...(isHomogenous ? {} : { filter: highlightFilter }),
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

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when cities or landmarks change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add Landmarks
    landmarks.forEach((landmark) => {
      const el = document.createElement('div');
      el.className = 'landmark-marker cursor-pointer';
      el.style.width = '6px';
      el.style.height = '6px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = 'silver';
      el.style.boxShadow = '0 0 4px rgba(192, 192, 192, 0.6)';

      const hoverPopup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 10,
        className: 'marker-hover-popup'
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([landmark.coords[1], landmark.coords[0]])
        .addTo(map.current!);
      
      el.addEventListener('mouseenter', () => {
        hoverPopup.setLngLat([landmark.coords[1], landmark.coords[0]])
          .setHTML(`<div class="text-xs font-bold px-1">${landmark.name}</div>`)
          .addTo(map.current!);
      });

      el.addEventListener('mouseleave', () => {
        hoverPopup.remove();
      });

      el.addEventListener('click', () => {
        new maplibregl.Popup({ offset: 10 })
          .setLngLat([landmark.coords[1], landmark.coords[0]])
          .setHTML(`<b>${landmark.name}</b><br>Landmark`)
          .addTo(map.current!);
      });
      
      markersRef.current.push(marker);
    });

    // Add Cities
    cities.forEach((city) => {
      const el = document.createElement('div');
      el.className = 'city-marker cursor-pointer';
      
      const sizePx = city.size === 'large' ? '10px' : city.size === 'small' ? '4px' : '7px';
      const offset = city.size === 'large' ? 12 : city.size === 'small' ? 8 : 10;

      el.style.width = sizePx;
      el.style.height = sizePx;
      el.style.borderRadius = '50%';
      el.style.background = 'radial-gradient(circle, #ffe066 40%, #f97316 100%)';
      el.style.boxShadow = `0 0 ${city.size === 'large' ? '4px' : city.size === 'small' ? '2px' : '3px'} rgba(249, 115, 22, 0.7)`;

      // Ensure small markers are still easily clickable
      if (city.size === 'small') {
        el.style.border = '4px solid transparent';
        el.style.backgroundClip = 'padding-box';
      }

      const hoverPopup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: offset,
        className: 'marker-hover-popup'
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([city.coords[1], city.coords[0]])
        .addTo(map.current!);

      el.addEventListener('mouseenter', () => {
        hoverPopup.setLngLat([city.coords[1], city.coords[0]])
          .setHTML(`<div class="text-xs font-bold px-1">${city.name}</div>`)
          .addTo(map.current!);
      });

      el.addEventListener('mouseleave', () => {
        hoverPopup.remove();
      });

      el.addEventListener('click', () => {
        new maplibregl.Popup({ offset: offset })
          .setLngLat([city.coords[1], city.coords[0]])
          .setHTML(`<b>${city.name}</b><br>City`)
          .addTo(map.current!);
      });
      
      markersRef.current.push(marker);
    });
  }, [cities, landmarks]);

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

  // Update styling and data when homogenous mode changes or cities change
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
        // Support ISO_A3, ISO_A2, and ADM0_A3 (for dataset inconsistencies like France)
        const filter = ['any', 
          ['in', ['get', 'ISO_A3'], ['literal', visitedCountryCodes]],
          ['in', ['get', 'ISO_A2'], ['literal', visitedCountryCodes]],
          ['in', ['get', 'ADM0_A3'], ['literal', visitedCountryCodes]]
        ] as maplibregl.FilterSpecification;
        map.current.setFilter('visited-countries-highlight', filter);
        map.current.setFilter('visited-countries-outline', filter);
        map.current.setPaintProperty('visited-countries-outline', 'line-opacity', 0.5);
      }
    }
  }, [isHomogenous, mergedVisitedGeo, visitedCountryCodes]);

  return <div ref={mapContainer} className="map-container" />;
};

export default Map;
