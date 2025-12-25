import request from '@/utils/request'

export function list (params) {
  return request({
    url: '/order/list',
    method: 'get',
    params,
  })
}

export function detail (id) {
  return request({
    url: `/order/detail/${id}`,
    method: 'get',
  })
}

export function refund (data) {
  return request({
    url: '/order/refund',
    method: 'post',
    data,
  })
}

export function close (data) {
  return request({
    url: '/order/close',
    method: 'post',
    data,
  })
}
