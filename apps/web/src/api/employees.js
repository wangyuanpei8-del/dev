import request from '@/utils/request';

export function getEmployees(params) {
  return request.get('/employees', { params });
}

export function getEmployee(id) {
  return request.get(`/employees/${id}`);
}

export function createEmployee(data) {
  return request.post('/employees', data);
}

export function updateEmployee(id, data) {
  return request.patch(`/employees/${id}`, data);
}

export function deleteEmployee(id) {
  return request.delete(`/employees/${id}`);
}

export function updateFirstDormUseDate(id, data) {
  return request.patch(`/employees/${id}/first-dorm-use-date`, data);
}
