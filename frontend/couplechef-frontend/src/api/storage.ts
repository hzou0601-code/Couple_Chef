import api from './index'

export const getStorageList = () => api.get('/storage/list')
export const updateStorage = (id, data) => api.put(`/storage/${id}`, data)
