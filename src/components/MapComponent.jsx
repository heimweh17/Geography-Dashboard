import React, { useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Circle,
  FeatureGroup,
  Polyline,
} from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import 'leaflet.heat';
import { MAP_TILE_ATTRIBUTION, MAP_TILE_URL } from '../config/mapTiles';

import { iconForPlace, locationIcon } from '../config/cartography';

// ====== HELPERS ======
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center)) {
      map.flyTo(center, 13);
    }
  }, [center, map]);
  return null;
};

const HeatmapLayer = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (!points || !points.length) return;
    const heat = L.heatLayer(points, { radius: 25, blur: 15, gradient: { 0.25: "#c5d6b0", 0.55: "#83a47c", 0.8: "#48856c", 1: "#194c3d" } }).addTo(map);
    return () => {
      map.removeLayer(heat);
    };
  }, [points, map]);
  return null;
};

// ====== MAIN COMPONENT ======
const MapComponent = ({
  center,
  data,
  isHeatmapMode,
  searchRadius,
  onShapeCreated,
  onShapeDeleted,
  customPolygon,
  userLocation,
  onMarkerClick,
  routeData,
  onClearRoute,
  savedPlaceView 
}) => {
  const safeData = Array.isArray(data) ? data : [];

  const heatPoints = safeData
    .map((item) => {
      const lat = item.lat ?? item.center?.lat;
      const lon = item.lon ?? item.center?.lon;
      if (typeof lat !== 'number' || typeof lon !== 'number') return null;
      return [lat, lon, 1];
    })
    .filter(Boolean);

  const featureGroupRef = useRef(null);

  // 清理画的区域（比如重新搜索城市时）
  useEffect(() => {
    if (!customPolygon && featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
    }
  }, [customPolygon]);

  const handleCreated = (e) => {
    const layer = e.layer;
    if (featureGroupRef.current) {
      const layers = featureGroupRef.current.getLayers();
      if (layers.length > 1) {
        layers.forEach((l) => {
          if (l !== layer) featureGroupRef.current.removeLayer(l);
        });
      }
    }
    onShapeCreated(e);
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution={MAP_TILE_ATTRIBUTION}
          url={MAP_TILE_URL}
        />

        <MapUpdater center={center} />

        {/* DRAWING CONTROLS */}
        <FeatureGroup ref={featureGroupRef}>
          <EditControl
            position="topright"
            onCreated={handleCreated}
            onDeleted={onShapeDeleted}
            draw={{
              rectangle: false,
              polygon: { shapeOptions: { color: '#326b58' } },
              circle: false,
              circlemarker: false,
              marker: false,
              polyline: false,
            }}
          />
        </FeatureGroup>

        {/* SEARCH RADIUS */}
        {/* SEARCH RADIUS - Hide when viewing saved place */}
        {!customPolygon && center && !savedPlaceView && (
          <Circle
            center={center}
            radius={searchRadius}
            pathOptions={{
              color: '#326b58',
              fillOpacity: 0.05,
              weight: 1,
              dashArray: '5, 5',
            }}
          />
        )}
        {/* USER LOCATION */}
        {userLocation && Array.isArray(userLocation) && (
          <Marker position={userLocation} icon={locationIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {/* ROUTE LINE */}
        {routeData && routeData.coordinates && (
          <Polyline
            positions={routeData.coordinates}
            color="#755b39"
            weight={4}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}

        {/* HEATMAP / MARKERS */}
        {isHeatmapMode ? (
          <HeatmapLayer points={heatPoints} />
        ) : (
          safeData.map((item) => {
            const tags = item.tags || {};
            const lat = item.lat ?? item.center?.lat;
            const lon = item.lon ?? item.center?.lon;

            if (typeof lat !== 'number' || typeof lon !== 'number') {
              // 数据如果没有坐标，就跳过这条，避免崩
              return null;
            }

            return (
              <Marker
                key={item.id}
                position={[lat, lon]}
                icon={iconForPlace(tags)}
                eventHandlers={{
                  click: () => onMarkerClick(item, false),
                }}
              >
                <Popup>
                  <div className="font-sans min-w-[150px]">
                    <h3 className="font-bold text-base">
                      {tags.name || 'Unnamed'}
                    </h3>
                    {tags.cuisine && (
                      <p className="text-xs text-mineral-500 mb-1">
                        {tags.cuisine}
                      </p>
                    )}
                    <button
                      className="mt-2 w-full bg-forest-600 hover:bg-forest-700 text-white text-xs py-1.5 px-2 rounded transition"
                      onClick={() => onMarkerClick(item, true)}
                    >
                      Get Route
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })
        )}
      </MapContainer>

      {/* ROUTE INFO BOX */}
      {routeData && (
        <div className="absolute bottom-6 right-4 z-[1000] bg-white dark:bg-mineral-800 p-4 rounded-lg shadow-xl border-l-4 border-forest-500 w-64 animate-fade-in-up">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-mineral-800 dark:text-white">Trip Info</h4>
            <button
              onClick={onClearRoute}
              className="text-mineral-400 hover:text-red-500 transition"
            >
              ✕
            </button>
          </div>
          <div className="flex justify-between text-sm text-mineral-600 dark:text-mineral-300">
            <span>Drive Time:</span>
            <span className="tabular-nums font-bold">
              {Math.round(routeData.duration / 60)} min
            </span>
          </div>
          <div className="flex justify-between text-sm text-mineral-600 dark:text-mineral-300 mt-1">
            <span>Distance:</span>
            <span className="tabular-nums font-bold">
              {(routeData.distance / 1000).toFixed(1)} km
            </span>
          </div>
          <button
            onClick={onClearRoute}
            className="w-full mt-3 bg-red-100 text-red-700 text-xs py-1 rounded hover:bg-red-200"
          >
            Clear Route
          </button>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
