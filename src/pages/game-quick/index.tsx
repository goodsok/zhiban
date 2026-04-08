import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Zap } from 'lucide-react-taro'
import { Card, CardContent } from '@/components/ui/card'

const QuickPage: FC = () => {
  useLoad(() => {
    console.log('Quick game loaded.')
  })

  return (
    <View className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
      <Card className="m-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100">
        <CardContent className="py-8">
          <View className="flex flex-col items-center">
            <View className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Zap size={32} color="#a855f7" />
            </View>
            <Text className="block text-lg font-semibold text-gray-900 mb-2">快速问答</Text>
            <Text className="block text-xs text-purple-600 text-center">
              开发中，敬请期待...
            </Text>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}

export default QuickPage
