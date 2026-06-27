import request from '@/utils/request';

export function getDorms(params) {
  return request.get('/dorms', { params });
}

export function getDorm(id) {
  return request.get(`/dorms/${id}`);
}

export function createDorm(data) {
  return request.post('/dorms', data);
}

export function updateDorm(id, data) {
  return request.patch(`/dorms/${id}`, data);
}

export function deleteDorm(id) {
  return request.delete(`/dorms/${id}`);
}
