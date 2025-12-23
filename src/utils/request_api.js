import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, removeToken } from '@/utils/auth'
import { useUserStore } from '@/store/user'
import { pinia } from '@/store'
import { useAppStore } from '@/store/app'

const service = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 50000,
})

service.interceptors.request.use(
  config => {
    if (!config.headers) {
      config.headers = {}
    }
    const userStore = useUserStore(pinia)
    const token = userStore.token || getToken()
    if (token) {
      config.headers['api-token'] = token
    }
    const app = useAppStore()
    const lang = app.setting.lang
    if (lang) {
      config.headers['Accept-Language'] = lang
    }
    return config
  },
  error => {
    return Promise.reject(error)
  },
)

service.interceptors.response.use(
  response => {
    const res = response.data
    if (Array.isArray(res)) {
      return res
    }
    if (res.code !== 0) {
      ElMessage({
        message: res.message || 'error',
        type: 'error',
        duration: 5 * 1000,
      })
      if (res.code === 403) {
        removeToken()
        window.location.reload()
      }
      return Promise.reject(res)
    } else {
      return res
    }
  },
  error => {
    if (error.code === 'ECONNABORTED' && error.message.indexOf('timeout') > -1) {
      error.message = 'Connection Time Out!'
    }
    ElMessage({
      message: error.message,
      type: 'error',
      duration: 5 * 1000,
    })
    return Promise.reject(error)
  },
)

export default service
