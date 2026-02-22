import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTrip } from '../services/api';
import MapView from './MapView';
import LogSheet from './LogSheet';

export default function TripDetail() {
  const { id } = useParams();
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadTrip() {
      try {
        const data = await getTrip(id);
        setTripData(data);
      } catch (err) {
        setError('Failed to load trip details. It may have been deleted.');
      } finally {
        setLoading(false);
      }
    }
    loadTrip();
  }, [id]);

  if (loading) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="loader mx-auto mb-4" />
        <p className="text-sm text-surface-400">Loading trip details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card border-red-500/30 p-8 text-center">
        <p className="text-sm font-semibold text-red-400 mb-4">{error}</p>
        <Link to="/trips" className="btn-secondary">
          ← Back to My Trips
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Trip #{tripData.trip_id}</h2>
          <p className="text-sm text-surface-400 mt-1">
            {tripData.current_location.name} → {tripData.pickup_location.name} → {tripData.dropoff_location.name}
          </p>
        </div>
        <Link to="/trips" className="btn-secondary px-4 py-2 text-sm shadow-none">
          ← Back
        </Link>
      </div>

      {/* Map */}
      <MapView tripData={tripData} />

      {/* Summary Card */}
      {tripData.summary && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Trip Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface-800/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{tripData.summary.total_distance_km?.toFixed(0)}</p>
              <p className="text-xs text-surface-400 mt-1">Kilometres</p>
            </div>
            <div className="bg-surface-800/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">{tripData.summary.total_driving_hours?.toFixed(1)}</p>
              <p className="text-xs text-surface-400 mt-1">Driving Hours</p>
            </div>
            <div className="bg-surface-800/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-primary-400">{tripData.summary.total_days}</p>
              <p className="text-xs text-surface-400 mt-1">Total Days</p>
            </div>
            <div className="bg-surface-800/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-400">{tripData.summary.cycle_used_at_start}</p>
              <p className="text-xs text-surface-400 mt-1">Cycle Used (Start)</p>
            </div>
          </div>
        </div>
      )}

      {/* ELD Logs */}
      {tripData.days && <LogSheet days={tripData.days} />}
    </div>
  );
}
