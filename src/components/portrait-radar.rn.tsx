import { View, Text } from '@tarojs/components'
import type { FC } from 'react'

interface RadarDimension {
  name: string
  value: number
  maxValue?: number
}

interface RadarChartProps {
  dimensions: RadarDimension[]
  size?: number
  color?: string
}

/**
 * RN 版雷达图组件 - 使用纯 View/Text 替代 Canvas
 */
const PortraitRadar: FC<RadarChartProps> = ({ dimensions, size = 200, color = '#4ECB71' }) => {
  const maxValue = 100

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {dimensions.map((dim, idx) => {
        const percent = Math.min((dim.value / (dim.maxValue || maxValue)) * 100, 100)
        return (
          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 12, color: '#6B7280', width: 60 }}>{dim.name}</Text>
            <View style={{ flex: 1, height: 8, backgroundColor: '#F1F2F5', borderRadius: 4, marginLeft: 8 }}>
              <View
                style={{
                  width: `${percent}%`,
                  height: 8,
                  backgroundColor: color,
                  borderRadius: 4,
                }}
              />
            </View>
            <Text style={{ fontSize: 12, color: '#111827', marginLeft: 8, width: 30 }}>{dim.value}</Text>
          </View>
        )
      })}
    </View>
  )
}

export default PortraitRadar
