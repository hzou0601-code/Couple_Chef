import axios from 'axios'
import Taro from '@tarojs/taro'

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 5000,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    Taro.showToast({ title: '请求失败', icon: 'none' })
    return Promise.reject(err)
  }
)

export default api
