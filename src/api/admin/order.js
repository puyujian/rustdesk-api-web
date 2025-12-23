import request from '@/utils/request'

export function list (params) {
  return request({
    url: '/admin/order/list',
    method: 'get',
    params,
  })
}

export function detail (id) {
  return request({
    url: `/admin/order/detail/${id}`,
    method: 'get',
  })
}

export function refund (data) {
  return request({
    url: '/admin/order/refund',
    method: 'post',
    data,
  })
}
