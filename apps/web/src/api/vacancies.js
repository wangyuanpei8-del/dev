import request from '@/utils/request';

export function getVacancies(params) {
  return request.get('/vacancies', { params });
}

export function getAssignableRooms(params) {
  return request.get('/vacancies/assignable-rooms', { params });
}
