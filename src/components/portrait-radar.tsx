import { View, Text, Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { FC } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

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
 * 将 hex 颜色转换为 rgba
 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * 小程序端：使用 Taro Canvas API 绘制
 */
const MiniAppRadarChart: FC<RadarChartProps & { canvasId: string }> = ({
  dimensions,
  size = 240,
  color = '#000000',
  canvasId
}) => {
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    if (dimensions.length === 0) return

    const timer = setTimeout(() => {
      const center = size / 2
      const radius = size * 0.32
      const n = dimensions.length
      const angleStep = (2 * Math.PI) / n

      const ctx = Taro.createCanvasContext(canvasId)

      // 绘制背景网格环
      const gridRings = [0.2, 0.4, 0.6, 0.8, 1.0]
      gridRings.forEach((scale) => {
        ctx.beginPath()
        for (let i = 0; i <= n; i++) {
          const angle = angleStep * (i % n) - Math.PI / 2
          const x = center + radius * scale * Math.cos(angle)
          const y = center + radius * scale * Math.sin(angle)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.setStrokeStyle('#E5E7EB')
        ctx.setLineWidth(1)
        ctx.stroke()
      })

      // 绘制射线
      for (let i = 0; i < n; i++) {
        const angle = angleStep * i - Math.PI / 2
        const x = center + radius * Math.cos(angle)
        const y = center + radius * Math.sin(angle)
        ctx.beginPath()
        ctx.moveTo(center, center)
        ctx.lineTo(x, y)
        ctx.setStrokeStyle('#E5E7EB')
        ctx.setLineWidth(1)
        ctx.stroke()
      }

      // 绘制数据区域
      ctx.beginPath()
      for (let i = 0; i <= n; i++) {
        const dim = dimensions[i % n]
        const angle = angleStep * (i % n) - Math.PI / 2
        const value = dim.value / (dim.maxValue || 100)
        const x = center + radius * value * Math.cos(angle)
        const y = center + radius * value * Math.sin(angle)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.setFillStyle(hexToRgba(color, 0.15))
      ctx.fill()
      ctx.setStrokeStyle(color)
      ctx.setLineWidth(2)
      ctx.stroke()

      // 绘制数据点
      for (let i = 0; i < n; i++) {
        const dim = dimensions[i]
        const angle = angleStep * i - Math.PI / 2
        const value = dim.value / (dim.maxValue || 100)
        const x = center + radius * value * Math.cos(angle)
        const y = center + radius * value * Math.sin(angle)
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.setFillStyle(color)
        ctx.fill()
      }

      ctx.draw()
      setDrawn(true)
    }, 200)

    return () => clearTimeout(timer)
  }, [dimensions, size, color, canvasId])

  // 计算标签位置
  const center = size / 2
  const radius = size * 0.32
  const n = dimensions.length
  const angleStep = n > 0 ? (2 * Math.PI) / n : 0
  const labelRadius = radius + 24

  const labelPositions = dimensions.map((dim, i) => {
    const angle = angleStep * i - Math.PI / 2
    const x = center + labelRadius * Math.cos(angle)
    const y = center + labelRadius * Math.sin(angle)
    return { x, y, name: dim.name, value: dim.value }
  })

  return (
    <View className="relative" style={{ width: size, height: size + 50 }}>
      <Canvas canvasId={canvasId} style={{ width: size, height: size }} />
      {drawn && labelPositions.map((label, i) => (
        <View
          key={i}
          className="absolute flex flex-col items-center"
          style={{ left: label.x - 30, top: label.y - 10, width: 60 }}
        >
          <Text className="block text-xs text-stone-500 text-center">{label.name}</Text>
          <Text className="block text-sm font-semibold text-stone-800">{label.value}</Text>
        </View>
      ))}
    </View>
  )
}

/**
 * H5 端：使用 SVG 绘制（H5 支持原生 SVG）
 */
const H5RadarChart: FC<RadarChartProps> = ({
  dimensions,
  size = 240,
  color = '#000000'
}) => {
  const center = size / 2
  const radius = size * 0.32

  // 计算雷达图路径点
  const points = useMemo(() => {
    const n = dimensions.length
    const angleStep = (2 * Math.PI) / n
    return dimensions.map((dim, i) => {
      const angle = angleStep * i - Math.PI / 2
      const value = dim.value / (dim.maxValue || 100)
      return {
        x: center + radius * value * Math.cos(angle),
        y: center + radius * value * Math.sin(angle)
      }
    })
  }, [dimensions, center, radius])

  // 数据路径
  const dataPath = useMemo(() => {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
  }, [points])

  // 网格路径
  const generateGridPath = (scale: number): string => {
    const n = dimensions.length
    const angleStep = (2 * Math.PI) / n
    const gridPoints: { x: number; y: number }[] = []
    for (let i = 0; i < n; i++) {
      const angle = angleStep * i - Math.PI / 2
      gridPoints.push({
        x: center + radius * scale * Math.cos(angle),
        y: center + radius * scale * Math.sin(angle)
      })
    }
    return gridPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
  }

  // 射线
  const rays = useMemo(() => {
    const n = dimensions.length
    const angleStep = (2 * Math.PI) / n
    return dimensions.map((_, i) => {
      const angle = angleStep * i - Math.PI / 2
      return `M ${center} ${center} L ${center + radius * Math.cos(angle)} ${center + radius * Math.sin(angle)}`
    })
  }, [dimensions, center, radius])

  // 标签位置
  const labelPositions = useMemo(() => {
    const n = dimensions.length
    const angleStep = (2 * Math.PI) / n
    const labelRadius = radius + 24
    return dimensions.map((dim, i) => {
      const angle = angleStep * i - Math.PI / 2
      return {
        x: center + labelRadius * Math.cos(angle),
        y: center + labelRadius * Math.sin(angle),
        name: dim.name,
        value: dim.value
      }
    })
  }, [dimensions, center, radius])

  const gridRings = [0.2, 0.4, 0.6, 0.8, 1.0]

  return (
    <View className="relative" style={{ width: size, height: size + 50 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {gridRings.map((scale, i) => (
          <path key={`grid-${i}`} d={generateGridPath(scale)} fill="none" stroke="#E5E7EB" strokeWidth={1} />
        ))}
        {rays.map((ray, i) => (
          <path key={`ray-${i}`} d={ray} fill="none" stroke="#E5E7EB" strokeWidth={1} />
        ))}
        <path d={dataPath} fill={hexToRgba(color, 0.15)} stroke={color} strokeWidth={2} />
        {points.map((p, i) => (
          <circle key={`point-${i}`} cx={p.x} cy={p.y} r={4} fill={color} />
        ))}
      </svg>
      {labelPositions.map((label, i) => (
        <View
          key={`label-${i}`}
          className="absolute flex flex-col items-center"
          style={{ left: label.x - 30, top: label.y - 10, width: 60 }}
        >
          <Text className="block text-xs text-stone-500 text-center">{label.name}</Text>
          <Text className="block text-sm font-semibold text-stone-800">{label.value}</Text>
        </View>
      ))}
    </View>
  )
}

/**
 * 雷达图组件（跨端兼容）
 * - H5 端使用 SVG
 * - 小程序端使用 Canvas
 */
const RadarChart: FC<RadarChartProps> = (props) => {
  const isMiniApp = ([Taro.ENV_TYPE.WEAPP, Taro.ENV_TYPE.TT] as string[]).includes(Taro.getEnv() as string)
  const canvasId = useRef(`radar-${Date.now()}`).current

  if (isMiniApp) {
    return <MiniAppRadarChart {...props} canvasId={canvasId} />
  }

  return <H5RadarChart {...props} />
}

export default RadarChart
