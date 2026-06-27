import request, { uploadImport } from '@/utils/request';

export { uploadImport };

export function setMapping(jobId, data) {
  return request.post(`/import/${jobId}/mapping`, data);
}

export function getPreview(jobId) {
  return request.get(`/import/${jobId}/preview`);
}

export function executeImport(jobId) {
  return request.post(`/import/${jobId}/execute`);
}

export function getImportJob(jobId) {
  return request.get(`/import/${jobId}`);
}
