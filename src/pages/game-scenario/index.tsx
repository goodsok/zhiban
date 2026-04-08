import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Sparkles } from 'lucide-react-taro'
import { Card, CardContent } from '@/components/ui/card'

const ScenarioPage: FC = () => {
  useLoad(() => {
    console.log('Scenario game loaded.')
  })

  return (
    <View className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
      <Card className="m-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
        <CardContent className="py-8">
          <View className="flex flex-col items-center">
            <View className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Sparkles size={32} color="#22c55e" />
            </View>
            <Text className="block text-lg font-semibold text-gray-900 mb-2">情景模拟</Text>
            <Text className="block text-xs text-green-600 text-center">
              开发中，敬请期待...
            </Text>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}

export default ScenarioPage
