import Taro from '@tarojs/taro'
import { statusCode } from '../config'
import request from './request'

// 标识 token 刷新状态
let isTokenRefreshing = false

// 存储因为等待 token 刷新而挂起的请求
let failedRequests = []

// 设置响应拦截器
const responseInterceptor = chain => {
  let {requestParams} = chain

  return chain.proceed(requestParams)
    .then(res => {
      switch (res.statusCode) {
        // 404
        case statusCode.NOT_FOUND:
          return Promise.reject({message: '请求资源不存在'})
        // 502
        case statusCode.BAD_GATEWAY:
          return Promise.reject({message: '服务端出现了问题'})
        // 403
        case statusCode.FORBIDDEN:
          return Promise.reject({message: '没有权限访问'})
        // 401
        case statusCode.AUTHENTICATE:
          // 获取 refreshToken 发送请求刷新 token
          // 刷新请求发送前，先判断是否有已发送的请求，如果有就挂起，如果没有就发送请求
          if (isTokenRefreshing) {
            const {url: u, method, params, header} = requestParams
            return failedRequests.push(() => request(u, method, params, true, header))
          }

          isTokenRefreshing = true
          const url = '/auth/refresh-token'
          const refreshToken = Taro.getStorageSync('refreshToken')
          return request(url, 'POST', {refreshToken}, false)
            .then(response => {
              // 刷新成功，将新的 accesToken 和 refreshToken 存储到本地
              Taro.setStorageSync('accessToken', `Bearer ${response.accessToken}`)
              Taro.setStorageSync('refreshToken', response.refreshToken)

              // 将 failedRequests 中的请求使用刷新后的 accessToken 重新发送
              failedRequests.forEach(callback => callback())
              failedRequests = []

              // 再将之前报 401 错误的请求重新发送
              const {url: u, method, params, header} = requestParams
              return request(u, method, params, true, header)
            })
            .catch(err => Promise.reject(err))
            .finally(() => {
              // 无论刷新是否成功，都需要将 isTokenRefreshing 重置为 false
              isTokenRefreshing = false
            })
        // 500
        case statusCode.SERVER_ERROR:
          // 刷新 token 失败
          if (res.data.message === 'Failed to refresh token') {
            Taro.setStorageSync('profile', null)
            Taro.showToast({
              title: '请登录',
              icon: 'error',
              duration: 2000
            })
            return Promise.reject({message: '请登录'})
          }

          // 其他问题导致失败
          return Promise.reject({message: '服务器错误'})
        // 200
        case statusCode.SUCCESS:
          return res.data
        // default
        default:
          return Promise.reject({message: ''})
      }
    })
    .catch(error => {
      console.log('网络请求异常', error, requestParams)
      return Promise.reject(error)
    })
}

export default responseInterceptor
