import request from '@/utils/request'

export function getConfig () {
  return request({
    url: '/payment/config',
    method: 'get',
  })
}

export function getConfigFull () {
  return request({
    url: '/payment/config/full',
    method: 'get',
  })
}

export function saveConfig (data) {
  return request({
    url: '/payment/config',
    method: 'post',
    data,
  })
}
