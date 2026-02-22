import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTrips } from '../services/api';

export default function MyTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadTrips() {
      try {
        const data = await getTrips();
        setTrips(data);
      } catch (err) {
        setError('Failed to load trips. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    loadTrips();
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="loader mx-auto mb-4" />
        <p className="text-sm text-surface-400">Loading your trips...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card border-red-500/30 p-4">
        <p className="text-sm font-semibold text-red-400">{error}</p>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-800/80 mx-auto flex items-center justify-center mb-4">
          <span className="text-2xl">🗺️</span>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No trips yet</h3>
        <p className="text-sm text-surface-400 mb-6">Create your first HOS-compliant trip plan!</p>
        <Link to="/" className="btn-primary inline-block">
          Create New Trip
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">My Trips</h2>
        <Link to="/" className="btn-primary py-2 px-4 shadow-none text-sm">
          + New Trip
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip) => (
          <Link
            key={trip.id}
            to={`/trip/${trip.id}`}
            className="glass-card p-5 hover:border-primary-500/50 transition-colors group block"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs text-surface-400 font-mono">
                {new Date(trip.created_at).toLocaleDateString()}
              </span>
              <span className="px-2 py-1 rounded bg-surface-800 text-[10px] text-surface-300 font-medium">
                {trip.total_distance_km} km
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs">📍</span>
                <div>
                  <p className="text-[10px] text-surface-500 uppercase font-semibold tracking-wider">Start</p>
                  <p className="text-sm font-medium text-white truncate">{trip.current_location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs">📦</span>
                <div>
                  <p className="text-[10px] text-surface-500 uppercase font-semibold tracking-wider">Pickup</p>
                  <p className="text-sm font-medium text-white truncate">{trip.pickup_location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs">🏁</span>
                <div>
                  <p className="text-[10px] text-surface-500 uppercase font-semibold tracking-wider">Dropoff</p>
                  <p className="text-sm font-medium text-white truncate">{trip.dropoff_location}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-surface-700/50 flex items-center justify-between">
              <span className="text-xs text-primary-400 font-medium group-hover:text-primary-300 transition-colors">
                View Details →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
