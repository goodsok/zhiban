/**
 * 维度展示组件
 * 按层级展示对象的维度数据
 */

import { View, Text } from '@tarojs/components'
import type { FC } from 'react'
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronRight, Database, Loader } from 'lucide-react-taro'
import {
  getMatchDimensions,
  layerNames,
  layerDescriptions,
  categoryNames,
  formatDimensionValue,
  type DimensionDefinition,
  type DimensionValue
} from '@/services/dimension'
import Taro from '@tarojs/taro'

interface DimensionViewerProps {
  matchId: number
  relationshipType?: 'long_term' | 'short_term' | 'both' | 'undefined'
  onEdit?: (dimensionKey: string) => void
}

interface DimensionGroup {
  layer: number
  category: string
  dimensions: Array<{
    definition: DimensionDefinition
    value: DimensionValue | null
  }>
}

export const DimensionViewer: FC<DimensionViewerProps> = ({ matchId, relationshipType, onEdit }) => {
  const [loading, setLoading] = useState(true)
  const [dimensionGroups, setDimensionGroups] = useState<DimensionGroup[]>([])
  const [completeness, setCompleteness] = useState<Array<{ layer: number; completeness: number }>>([])

  useEffect(() => {
    fetchDimensions()
  }, [matchId, relationshipType])

  const fetchDimensions = async () => {
    try {
      setLoading(true)
      const res = await getMatchDimensions(matchId, relationshipType)
      if (res.code === 200 && res.data) {
        // 按层级和分类分组
        const groups: Record<string, DimensionGroup> = {}
        
        for (const [, item] of Object.entries(res.data.dimensions)) {
          const groupKey = `${item.definition.layer}-${item.definition.category}`
          if (!groups[groupKey]) {
            groups[groupKey] = {
              layer: item.definition.layer,
              category: item.definition.category,
              dimensions: []
            }
          }
          groups[groupKey].dimensions.push({
            definition: item.definition,
            value: item.value
          })
        }
        
        // 排序
        const sortedGroups = Object.values(groups).sort((a, b) => {
          if (a.layer !== b.layer) return a.layer - b.layer
          return a.category.localeCompare(b.category)
        })
        
        setDimensionGroups(sortedGroups)
        setCompleteness(res.data.completeness)
      }
    } catch (err) {
      console.error('获取维度数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const getCompleteness = (layer: number): number => {
    return completeness.find(c => c.layer === layer)?.completeness || 0
  }

  const handleDimensionClick = (dimensionKey: string) => {
    if (onEdit) {
      onEdit(dimensionKey)
    } else {
      Taro.navigateTo({
        url: `/pages/dimension-edit/index?matchId=${matchId}&dimensionKey=${dimensionKey}`
      })
    }
  }

  if (loading) {
    return (
      <View className="flex items-center justify-center py-8">
        <Loader size={24} color="#9CA3AF" className="animate-spin" />
        <Text className="ml-2 text-gray-500 text-sm">加载维度数据...</Text>
      </View>
    )
  }

  if (dimensionGroups.length === 0) {
    return (
      <View className="flex flex-col items-center justify-center py-8">
        <Database size={48} color="#D1D5DB" className="mb-2" />
        <Text className="text-gray-500 text-sm">暂无维度数据</Text>
      </View>
    )
  }

  return (
    <View className="dimension-viewer">
      {dimensionGroups.map((group, index) => (
        <View key={`${group.layer}-${group.category}`} className="mb-4">
          {/* 层级标题（仅在每个层级第一次出现时显示） */}
          {index === 0 || dimensionGroups[index - 1].layer !== group.layer ? (
            <View className="mb-2">
              <View className="flex items-center justify-between mb-1">
                <Text className="block text-base font-semibold text-gray-800">
                  {layerNames[group.layer] || `Layer ${group.layer}`}
                </Text>
                <Badge variant="outline" className="text-xs">
                  {getCompleteness(group.layer)}% 完成
                </Badge>
              </View>
              <Progress value={getCompleteness(group.layer)} className="h-1 mb-2" />
              <Text className="block text-xs text-gray-500 mb-2">
                {layerDescriptions[group.layer]}
              </Text>
            </View>
          ) : null}
          
          {/* 分类卡片 */}
          <Card className="mb-2">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-sm font-medium text-gray-700">
                {categoryNames[group.category] || group.category}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <View className="space-y-2">
                {group.dimensions.map((item) => {
                  const hasValue = item.value !== null && item.value !== undefined && item.value.value !== null
                  const displayValue = hasValue 
                    ? formatDimensionValue(item.definition, item.value!.value)
                    : '-'
                  
                  return (
                    <View
                      key={item.definition.dimension_key}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      onClick={() => handleDimensionClick(item.definition.dimension_key)}
                    >
                      <View className="flex items-center">
                        {item.definition.importance === 'critical' && (
                          <View className="w-1 h-1 rounded-full bg-red-500 mr-1" />
                        )}
                        {item.definition.importance === 'important' && (
                          <View className="w-1 h-1 rounded-full bg-amber-500 mr-1" />
                        )}
                        <Text className="text-sm text-gray-600">
                          {item.definition.display_name}
                        </Text>
                      </View>
                      <View className="flex items-center">
                        <Text className={`text-sm ${hasValue ? 'text-gray-800' : 'text-gray-400'}`}>
                          {displayValue}
                        </Text>
                        <ChevronRight size={16} color="#D1D5DB" className="ml-1" />
                      </View>
                    </View>
                  )
                })}
              </View>
            </CardContent>
          </Card>
        </View>
      ))}
    </View>
  )
}

export default DimensionViewer
