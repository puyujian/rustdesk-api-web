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
      config.headers['Authorization'] = `Bearer ${token}`
    }
    const app = useAppStore(pinia)
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

    // 非标准响应（没有 code 字段）则原样返回，避免被误判为错误
    if (res === null || typeof res !== 'object' || !Object.prototype.hasOwnProperty.call(res, 'code')) {
      return res
    }

    const code = Number(res.code)
    // code 不是数字（如后端/网关返回了非标准结构），不在此处拦截
    if (!Number.isFinite(code)) {
      return res
    }

    if (code !== 0) {
      ElMessage({
        message: res.message || 'error',
        type: 'error',
        duration: 5 * 1000,
      })
      if (code === 403) {
        removeToken()
        window.location.reload()
      }
      return Promise.reject(res)
    }
    return res
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
