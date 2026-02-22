import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TripForm from './TripForm';
import { calculateTrip } from '../services/api';

export default function NewTrip() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      const data = await calculateTrip(formData);
      // Navigate to the trip detail view to see the results
      navigate(`/trip/${data.trip_id}`);
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.details ||
        err.message ||
        'Something went wrong. Please try again.';
      setError(typeof message === 'object' ? JSON.stringify(message) : message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
          Plan Your Route.{' '}
          <span className="bg-gradient-to-r from-primary-400 to-emerald-400 bg-clip-text text-transparent">
            Generate ELD Logs.
          </span>
        </h2>
        <p className="text-sm text-surface-400 max-w-xl mx-auto">
          Enter your trip details to calculate an HOS-compliant driving schedule
          with automatic daily ELD log sheet generation.
        </p>
      </div>

      {/* Trip Form */}
      <TripForm onSubmit={handleSubmit} loading={loading} />

      {/* Error */}
      {error && (
        <div className="glass-card border-red-500/30 p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-red-400">Calculation Error</p>
            <p className="text-xs text-surface-400 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="glass-card p-12 text-center">
          <div className="loader mx-auto mb-4" />
          <p className="text-sm text-surface-400">Calculating HOS-compliant route…</p>
          <p className="text-xs text-surface-500 mt-1">This may take a few seconds</p>
        </div>
      )}
    </div>
  );
}
