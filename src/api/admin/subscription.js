import request from '@/utils/request'

export function list (params) {
  return request({
    url: '/subscription/list',
    method: 'get',
    params,
  })
}

export function detail (id) {
  return request({
    url: `/subscription/detail/${id}`,
    method: 'get',
  })
}

export function grant (data) {
  return request({
    url: '/subscription/grant',
    method: 'post',
    data,
  })
}

export function cancel (data) {
  return request({
    url: '/subscription/cancel',
    method: 'post',
    data,
  })
}
