import request from '@/utils/request'

export function getPlans () {
  return request({
    url: '/subscription/plans',
    method: 'get',
  })
}

export function createOrder (data) {
  return request({
    url: '/subscription/orders',
    method: 'post',
    data,
  })
}

export function getOrders (params) {
  return request({
    url: '/subscription/orders',
    method: 'get',
    params,
  })
}

export function getStatus () {
  return request({
    url: '/subscription/status',
    method: 'get',
  })
}
