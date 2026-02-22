/**
 * MapView — Interactive Leaflet map showing the trip route.
 *
 * Displays: route polyline, current/pickup/dropoff markers,
 *           fuel stop markers, and rest stop markers.
 */
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// ---------------------------------------------------------------------------
// Custom marker icons
// ---------------------------------------------------------------------------
const createIcon = (emoji, size = 32) => {
  return L.divIcon({
    html: `<div style="font-size:${size}px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">${emoji}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

const icons = {
  current: createIcon('📍', 28),
  pickup: createIcon('📦', 28),
  dropoff: createIcon('🏁', 28),
  fuel: createIcon('⛽', 24),
  rest: createIcon('🛏️', 24),
  restart: createIcon('🔄', 24),
};

// ---------------------------------------------------------------------------
// Component to fit map bounds to route
// ---------------------------------------------------------------------------
function FitBounds({ geometry }) {
  const map = useMap();

  useEffect(() => {
    if (geometry && geometry.length > 0) {
      const bounds = L.latLngBounds(geometry.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [geometry, map]);

  return null;
}

// ---------------------------------------------------------------------------
// MapView component
// ---------------------------------------------------------------------------
export default function MapView({ tripData }) {
  const defaultCenter = [20.5937, 78.9629]; // India center
  const defaultZoom = 5;

  if (!tripData) {
    return (
      <div className="glass-card overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-surface-700/50">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-white">Route Map</h3>
        </div>
        <div className="h-[450px] relative">
          <MapContainer center={defaultCenter} zoom={defaultZoom} className="h-full w-full" scrollWheelZoom={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          </MapContainer>
          {/* Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-surface-900/40 backdrop-blur-sm z-[1000]">
            <div className="text-center">
              <p className="text-surface-400 text-sm">Submit a trip to see the route</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { route_geometry, current_location, pickup_location, dropoff_location, stops } = tripData;

  // Route polyline coordinates
  const routePositions = route_geometry?.map(([lat, lng]) => [lat, lng]) || [];

  // Filter stops by type
  const fuelStops = stops?.filter((s) => s.stop_type === 'fuel') || [];
  const restStops = stops?.filter((s) => s.stop_type === 'rest') || [];

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-white">Route Map</h3>
        </div>
        {/* Legend */}
        <div className="hidden md:flex items-center gap-4 text-xs text-surface-400">
          <span className="flex items-center gap-1">📍 Start</span>
          <span className="flex items-center gap-1">📦 Pickup</span>
          <span className="flex items-center gap-1">🏁 Dropoff</span>
          <span className="flex items-center gap-1">⛽ Fuel</span>
          <span className="flex items-center gap-1">🛏️ Rest</span>
        </div>
      </div>

      {/* Map */}
      <div className="h-[450px]">
        <MapContainer center={defaultCenter} zoom={defaultZoom} className="h-full w-full" scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <FitBounds geometry={route_geometry} />

          {/* Route polyline */}
          {routePositions.length > 0 && (
            <Polyline
              positions={routePositions}
              pathOptions={{
                color: '#6366f1',
                weight: 4,
                opacity: 0.8,
                dashArray: null,
              }}
            />
          )}

          {/* Current location marker */}
          {current_location && (
            <Marker position={[current_location.latitude, current_location.longitude]} icon={icons.current}>
              <Popup>
                <strong>📍 Start:</strong> {current_location.name}
              </Popup>
            </Marker>
          )}

          {/* Pickup marker */}
          {pickup_location && (
            <Marker position={[pickup_location.latitude, pickup_location.longitude]} icon={icons.pickup}>
              <Popup>
                <strong>📦 Pickup:</strong> {pickup_location.name}
              </Popup>
            </Marker>
          )}

          {/* Dropoff marker */}
          {dropoff_location && (
            <Marker position={[dropoff_location.latitude, dropoff_location.longitude]} icon={icons.dropoff}>
              <Popup>
                <strong>🏁 Dropoff:</strong> {dropoff_location.name}
              </Popup>
            </Marker>
          )}

          {/* Fuel stops */}
          {fuelStops.map((stop, idx) => (
            <Marker key={`fuel-${idx}`} position={[stop.latitude, stop.longitude]} icon={icons.fuel}>
              <Popup>
                <strong>⛽ {stop.name}</strong>
                <br />
                {stop.distance_from_start_km?.toFixed(0)} km from start
              </Popup>
            </Marker>
          ))}

          {/* Rest stops */}
          {restStops.map((stop, idx) => (
            <Marker key={`rest-${idx}`} position={[stop.latitude, stop.longitude]} icon={icons.rest}>
              <Popup>
                <strong>🛏️ {stop.name}</strong>
                <br />
                {stop.distance_from_start_km?.toFixed(0)} km from start
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Stats bar */}
      {tripData.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-surface-700/30">
          <div className="bg-surface-800/60 px-4 py-3 text-center">
            <p className="text-lg font-bold text-white">{tripData.total_distance_km?.toFixed(0)} km</p>
            <p className="text-[10px] text-surface-400 uppercase tracking-wider">Total Distance</p>
          </div>
          <div className="bg-surface-800/60 px-4 py-3 text-center">
            <p className="text-lg font-bold text-white">{tripData.summary.total_driving_hours?.toFixed(1)} hrs</p>
            <p className="text-[10px] text-surface-400 uppercase tracking-wider">Driving Time</p>
          </div>
          <div className="bg-surface-800/60 px-4 py-3 text-center">
            <p className="text-lg font-bold text-white">{tripData.summary.total_days}</p>
            <p className="text-[10px] text-surface-400 uppercase tracking-wider">Days</p>
          </div>
          <div className="bg-surface-800/60 px-4 py-3 text-center">
            <p className="text-lg font-bold text-white">{tripData.fuel_stops_km?.length || 0}</p>
            <p className="text-[10px] text-surface-400 uppercase tracking-wider">Fuel Stops</p>
          </div>
        </div>
      )}
    </div>
  );
}
