import request from '../../http/request'

// 登录
export const login = data => request('/auth/login', 'POST', data)

// 商品
export const fetchAllCommodities = () => request('/commodity', 'GET', {})
export const newCommodity = data => request('/commodity', 'POST', data, true)
