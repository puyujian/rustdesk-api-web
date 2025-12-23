import request from '@/utils/request'

export function list (params) {
  return request({
    url: '/subscription_plan/list',
    method: 'get',
    params,
  })
}

export function detail (id) {
  return request({
    url: `/subscription_plan/detail/${id}`,
    method: 'get',
  })
}

export function create (data) {
  return request({
    url: '/subscription_plan/create',
    method: 'post',
    data,
  })
}

export function update (data) {
  return request({
    url: '/subscription_plan/update',
    method: 'post',
    data,
  })
}

export function remove (data) {
  return request({
    url: '/subscription_plan/delete',
    method: 'post',
    data,
  })
}
