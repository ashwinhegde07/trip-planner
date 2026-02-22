/**
 * API service layer — communicates with the Django backend.
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * POST /api/calculate-trip/
 *
 * @param {{ current_location: string, pickup_location: string, dropoff_location: string, current_cycle_used: number }} tripData
 * @returns {Promise<object>} Trip calculation response
 */
export async function calculateTrip(tripData) {
  const response = await api.post('/api/calculate-trip/', tripData);
  return response.data;
}

/**
 * GET /api/trips/
 * @returns {Promise<Array>} List of past trips
 */
export async function getTrips() {
  const response = await api.get('/api/trips/');
  return response.data;
}

/**
 * GET /api/trips/:id/
 * @param {number|string} id 
 * @returns {Promise<object>} Trip details with map and logs
 */
export async function getTrip(id) {
  const response = await api.get(`/api/trips/${id}/`);
  return response.data;
}

export default api;
