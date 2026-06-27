import request from '@/utils/request';

export function getOccupancyHistories(params) {
  return request.get('/occupancy-histories', { params });
}

export function getOccupancyHistory(id) {
  return request.get(`/occupancy-histories/${id}`);
}

export function updateOccupancyHistory(id, data) {
  return request.patch(`/occupancy-histories/${id}`, data);
}

export function createOccupancy(data) {
  return request.post('/occupancy-histories', data);
}

export function moveOut(id, data) {
  return request.post(`/occupancy-histories/${id}/move-out`, data);
}

export function getLongTermWarnings(params) {
  return request.get('/occupancy-histories/long-term-warnings', { params });
}

export function getOccupiedCount(params) {
  return request.get('/occupancy-histories/occupied-count', { params });
}

export function getOccupancyDataChecks(params) {
  return request.get('/occupancy-histories/data-checks', { params });
}
