import request from '@/utils/request';

export function getUsers(params) {
  return request.get('/users', { params });
}

export function createUser(data) {
  return request.post('/users', data);
}

export function updateUser(id, data) {
  return request.patch(`/users/${id}`, data);
}
