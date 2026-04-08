import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Brain } from 'lucide-react-taro'
import { Card, CardContent } from '@/components/ui/card'

const TacitPage: FC = () => {
  useLoad(() => {
    console.log('Tacit game loaded.')
  })

  return (
    <View className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
      <Card className="m-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
        <CardContent className="py-8">
          <View className="flex flex-col items-center">
            <View className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Brain size={32} color="#3b82f6" />
            </View>
            <Text className="block text-lg font-semibold text-gray-900 mb-2">默契测试</Text>
            <Text className="block text-sm text-gray-500 text-center mb-6 leading-relaxed">
              通过一系列测试题，了解你和对方的默契程度
            </Text>
            <Text className="block text-xs text-blue-600 text-center">
              开发中，敬请期待...
            </Text>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}

export default TacitPage
