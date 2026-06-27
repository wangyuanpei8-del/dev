import request from '@/utils/request';

export function getDormFees(params) {
  return request.get('/dorm-fees', { params });
}

export function calculateFees(data) {
  return request.post('/dorm-fees/calculate', data);
}

export function confirmFee(id) {
  return request.post(`/dorm-fees/${id}/confirm`);
}

export function getFeeRates(params) {
  return request.get('/fee-rates', { params });
}

export function createFeeRate(data) {
  return request.post('/fee-rates', data);
}

export function updateFeeRate(id, data) {
  return request.patch(`/fee-rates/${id}`, data);
}
