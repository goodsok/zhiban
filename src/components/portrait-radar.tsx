import { View, Text } from '@tarojs/components'
import type { FC } from 'react'
import { useMemo } from 'react'

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

interface Point {
  x: number
  y: number
}

interface LabelPosition extends Point {
  name: string
  value: number
}

const RadarChart: FC<RadarChartProps> = ({
  dimensions,
  size = 200,
  color = '#000000'
}) => {
  const center = size / 2
  const radius = size * 0.38

  // 计算雷达图路径点
  const points = useMemo((): Point[] => {
    const n = dimensions.length
    const angleStep = (2 * Math.PI) / n
    
    return dimensions.map((dim, i) => {
      const angle = angleStep * i - Math.PI / 2
      const value = dim.value / (dim.maxValue || 100)
      const x = center + radius * value * Math.cos(angle)
      const y = center + radius * value * Math.sin(angle)
      return { x, y }
    })
  }, [dimensions, center, radius])

  // 生成路径字符串
  const dataPath = useMemo(() => {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
  }, [points])

  // 生成背景网格
  const gridRings = [0.2, 0.4, 0.6, 0.8, 1.0]

  // 标签位置
  const labelPositions = useMemo((): LabelPosition[] => {
    const n = dimensions.length
    const angleStep = (2 * Math.PI) / n
    const labelRadius = radius + 20

    return dimensions.map((dim, i) => {
      const angle = angleStep * i - Math.PI / 2
      const x = center + labelRadius * Math.cos(angle)
      const y = center + labelRadius * Math.sin(angle)
      return { x, y, name: dim.name, value: dim.value }
    })
  }, [dimensions, center, radius])

  // 生成网格路径
  const generateGridPath = (scale: number): string => {
    const n = dimensions.length
    const angleStep = (2 * Math.PI) / n
    const gridPoints: Point[] = []
    
    for (let i = 0; i < n; i++) {
      const angle = angleStep * i - Math.PI / 2
      const x = center + radius * scale * Math.cos(angle)
      const y = center + radius * scale * Math.sin(angle)
      gridPoints.push({ x, y })
    }
    
    return gridPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
  }

  // 生成射线
  const rays = useMemo((): string[] => {
    const n = dimensions.length
    const angleStep = (2 * Math.PI) / n
    
    return dimensions.map((_, i) => {
      const angle = angleStep * i - Math.PI / 2
      const x = center + radius * Math.cos(angle)
      const y = center + radius * Math.sin(angle)
      return `M ${center} ${center} L ${x} ${y}`
    })
  }, [dimensions, center, radius])

  return (
    <View className="relative" style={{ width: size, height: size + 60 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 背景网格 */}
        {gridRings.map((scale, i) => (
          <path
            key={i}
            d={generateGridPath(scale)}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={1}
          />
        ))}
        
        {/* 射线 */}
        {rays.map((ray, i) => (
          <path
            key={i}
            d={ray}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={1}
          />
        ))}
        
        {/* 数据区域 */}
        <path
          d={dataPath}
          fill={color}
          fillOpacity={0.2}
          stroke={color}
          strokeWidth={2}
        />
        
        {/* 数据点 */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={color}
          />
        ))}
      </svg>
      
      {/* 标签 */}
      {labelPositions.map((label, i) => (
        <View
          key={i}
          className="absolute flex flex-col items-center"
          style={{
            left: label.x - 30,
            top: label.y - 10,
            width: 60,
          }}
        >
          <Text className="block text-xs text-gray-500 text-center">{label.name}</Text>
          <Text className="block text-sm font-semibold text-gray-800">{label.value}</Text>
        </View>
      ))}
    </View>
  )
}

export default RadarChart
