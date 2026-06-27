import request from '@/utils/request';

export function getRooms(dormId, params) {
  return request.get(`/dorms/${dormId}/rooms`, { params });
}

export function createRoom(dormId, data) {
  return request.post(`/dorms/${dormId}/rooms`, data);
}

export function updateRoom(id, data) {
  return request.patch(`/rooms/${id}`, data);
}

export function deleteRoom(id) {
  return request.delete(`/rooms/${id}`);
}
