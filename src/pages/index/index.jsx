import Taro from '@tarojs/taro'
import { View, Button } from '@tarojs/components'
import {
  login,
  fetchAllCommodities,
  newCommodity
} from '../../api/v1'
import './index.css'

export default function Index() {
  // 登录
  const handleLogin = () => {
    // 登录获取 code
    Taro.login({
      success: res => {
        if (!res.code) {
          console.log('登录失败！' + res.errMsg)
          return
        }

        // 调用后端接口与
        login({code: res.code})
          .then(response => {
            // 存储返回的用户信息和两个 token
            const {accessToken, refreshToken, user} = response
            Taro.setStorageSync('accessToken', `Bearer ${accessToken}`)
            Taro.setStorageSync('refreshToken', refreshToken)
            Taro.setStorageSync('profile', user)
          })
      }
    })
  }

  // 获取商品列表
  const handleFetch = () => {
    fetchAllCommodities()
    .then(res => console.log('commodities: ', res))
  }

  // 创建商品
  const handleCreate = () => {
    const commodityInfo = {name: 'test', price: 12}
    newCommodity(commodityInfo)
      .then(() => console.log('Created a new commodity'))
  }

  return (
    <View className='index'>
      <Button onClick={handleLogin}>Login</Button>
      <Button onClick={handleFetch}>Fetch</Button>
      <Button onClick={handleCreate}>Create</Button>
    </View>
  )
}
