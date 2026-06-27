import request from '@/utils/request';

export function getEquipmentItems(params) {
  return request.get('/equipment-items', { params });
}

export function createEquipmentItem(data) {
  return request.post('/equipment-items', data);
}

export function updateEquipmentItem(id, data) {
  return request.patch(`/equipment-items/${id}`, data);
}

export function deleteEquipmentItem(id) {
  return request.delete(`/equipment-items/${id}`);
}

export function getStorageLocations(params) {
  return request.get('/storage-locations', { params });
}

export function createStorageLocation(data) {
  return request.post('/storage-locations', data);
}

export function updateStorageLocation(id, data) {
  return request.patch(`/storage-locations/${id}`, data);
}

export function deleteStorageLocation(id) {
  return request.delete(`/storage-locations/${id}`);
}
