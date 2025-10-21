import api from './index'

export const getMenuList = () => api.get('/menu/list')
export const addDish = (data) => api.post('/menu/add', data)
export const deleteDish = (id) => api.delete(`/menu/${id}`)
