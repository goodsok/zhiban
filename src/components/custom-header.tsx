import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import type { FC, ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react-taro'

interface CustomHeaderProps {
  title: string
  showBack?: boolean
  rightAction?: ReactNode
  onBack?: () => void
}

const CustomHeader: FC<CustomHeaderProps> = ({ 
  title, 
  showBack = true, 
  rightAction,
  onBack 
}) => {
  const [statusBarHeight, setStatusBarHeight] = useState(0)
  const [navBarHeight, setNavBarHeight] = useState(44)

  useEffect(() => {
    // 获取系统信息
    const systemInfo = Taro.getSystemInfoSync()
    setStatusBarHeight(systemInfo.statusBarHeight || 0)
    
    // 小程序端导航栏高度通常为 44px
    // H5 端不需要额外的导航栏高度
    if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
      setNavBarHeight(44)
    } else {
      setNavBarHeight(44) // H5 端也保持一致
    }
  }, [])

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      Taro.navigateBack()
    }
  }

  // 头部总高度 = 状态栏 + 导航栏
  const totalHeight = statusBarHeight + navBarHeight

  return (
    <>
      {/* 固定头部 */}
      <View 
        className="fixed top-0 left-0 right-0 z-50 bg-white"
        style={{ borderBottom: '1px solid #f3f4f6' }}
      >
        {/* 状态栏占位 */}
        <View style={{ height: `${statusBarHeight}px` }} />
        
        {/* 导航栏 */}
        <View 
          className="flex items-center justify-between px-4"
          style={{ height: `${navBarHeight}px` }}
        >
          <View 
            className="w-8 h-8 flex items-center justify-center"
            onClick={showBack ? handleBack : undefined}
          >
            {showBack && <ArrowLeft size={24} color="#374151" />}
          </View>
          <Text className="block text-base font-semibold text-gray-900">{title}</Text>
          <View className="w-8 h-8 flex items-center justify-center">
            {rightAction}
          </View>
        </View>
      </View>
      
      {/* 内容占位，防止被头部遮挡 */}
      <View style={{ height: `${totalHeight}px` }} />
    </>
  )
}

export default CustomHeader
