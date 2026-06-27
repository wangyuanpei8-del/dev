import request from '@/utils/request';

export function getDepartments(params) {
  return request.get('/departments', { params });
}

export function getDepartment(id) {
  return request.get(`/departments/${id}`);
}

export function createDepartment(data) {
  return request.post('/departments', data);
}

export function updateDepartment(id, data) {
  return request.patch(`/departments/${id}`, data);
}

export function deleteDepartment(id) {
  return request.delete(`/departments/${id}`);
}
