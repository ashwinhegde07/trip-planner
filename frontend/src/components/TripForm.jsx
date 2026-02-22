/**
 * TripForm — Input form for trip planning.
 *
 * Collects current location, pickup, dropoff, and cycle hours used.
 * Validates inputs and shows inline error messages.
 */
import { useState } from 'react';

const INDIAN_CITIES = [
  'Bengaluru', 'Chennai', 'Mumbai', 'Delhi', 'Hyderabad', 'Kolkata',
  'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kochi', 'Nagpur',
  'Indore', 'Bhopal', 'Surat', 'Coimbatore', 'Goa', 'Chandigarh',
  'Patna', 'Mysuru', 'Mangaluru', 'Vijayawada', 'Madurai', 'Varanasi',
];

export default function TripForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    current_location: 'Bengaluru',
    pickup_location: 'Chennai',
    dropoff_location: 'Mumbai',
    current_cycle_used: 40,
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.current_location.trim()) errs.current_location = 'Required';
    if (!form.pickup_location.trim()) errs.pickup_location = 'Required';
    if (!form.dropoff_location.trim()) errs.dropoff_location = 'Required';
    if (form.current_cycle_used === '' || form.current_cycle_used < 0 || form.current_cycle_used > 70) {
      errs.current_cycle_used = 'Must be between 0 and 70';
    }
    if (form.current_location.trim().toLowerCase() === form.pickup_location.trim().toLowerCase()) {
      errs.pickup_location = 'Must differ from current location';
    }
    if (form.pickup_location.trim().toLowerCase() === form.dropoff_location.trim().toLowerCase()) {
      errs.dropoff_location = 'Must differ from pickup location';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(form);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Plan Your Trip</h2>
          <p className="text-xs text-surface-400">Enter trip details to generate HOS-compliant schedule</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Current Location */}
        <div>
          <label className="input-label" htmlFor="current_location">
            📍 Current Location
          </label>
          <input
            id="current_location"
            list="cities-list"
            className={`input-field ${errors.current_location ? 'border-red-500 focus:ring-red-500/50' : ''}`}
            value={form.current_location}
            onChange={(e) => handleChange('current_location', e.target.value)}
            placeholder="e.g. Bengaluru"
          />
          {errors.current_location && (
            <p className="mt-1 text-xs text-red-400">{errors.current_location}</p>
          )}
        </div>

        {/* Pickup Location */}
        <div>
          <label className="input-label" htmlFor="pickup_location">
            📦 Pickup Location
          </label>
          <input
            id="pickup_location"
            list="cities-list"
            className={`input-field ${errors.pickup_location ? 'border-red-500 focus:ring-red-500/50' : ''}`}
            value={form.pickup_location}
            onChange={(e) => handleChange('pickup_location', e.target.value)}
            placeholder="e.g. Chennai"
          />
          {errors.pickup_location && (
            <p className="mt-1 text-xs text-red-400">{errors.pickup_location}</p>
          )}
        </div>

        {/* Dropoff Location */}
        <div>
          <label className="input-label" htmlFor="dropoff_location">
            🏁 Dropoff Location
          </label>
          <input
            id="dropoff_location"
            list="cities-list"
            className={`input-field ${errors.dropoff_location ? 'border-red-500 focus:ring-red-500/50' : ''}`}
            value={form.dropoff_location}
            onChange={(e) => handleChange('dropoff_location', e.target.value)}
            placeholder="e.g. Mumbai"
          />
          {errors.dropoff_location && (
            <p className="mt-1 text-xs text-red-400">{errors.dropoff_location}</p>
          )}
        </div>

        {/* Cycle Used */}
        <div>
          <label className="input-label" htmlFor="current_cycle_used">
            ⏱️ Cycle Used (hrs / 70)
          </label>
          <div className="relative">
            <input
              id="current_cycle_used"
              type="number"
              min={0}
              max={70}
              step={0.5}
              className={`input-field pr-16 ${errors.current_cycle_used ? 'border-red-500 focus:ring-red-500/50' : ''}`}
              value={form.current_cycle_used}
              onChange={(e) => handleChange('current_cycle_used', e.target.value === '' ? '' : Number(e.target.value))}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-surface-400 font-mono">
              / 70 hrs
            </span>
          </div>
          {errors.current_cycle_used && (
            <p className="mt-1 text-xs text-red-400">{errors.current_cycle_used}</p>
          )}
          {/* Cycle bar */}
          <div className="mt-2 h-1.5 bg-surface-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min((form.current_cycle_used / 70) * 100, 100)}%`,
                background: form.current_cycle_used > 60
                  ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                  : form.current_cycle_used > 40
                    ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                    : 'linear-gradient(90deg, #22c55e, #16a34a)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="mt-6 flex items-center gap-4">
        <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
          {loading ? (
            <>
              <div className="loader !w-5 !h-5 !border-2" />
              Calculating…
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Calculate Trip
            </>
          )}
        </button>
        <span className="text-xs text-surface-500 hidden md:inline">
          Generates route, stops, and daily ELD log sheets
        </span>
      </div>

      {/* Datalist for city suggestions */}
      <datalist id="cities-list">
        {INDIAN_CITIES.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>
    </form>
  );
}
