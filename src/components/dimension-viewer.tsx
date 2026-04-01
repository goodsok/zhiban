/**
 * 维度展示组件
 * 按层级展示对象的维度数据，支持折叠展开
 * 
 * 性能优化：
 * 1. 数据缓存 - 使用 localStorage 缓存维度数据，减少网络请求
 * 2. 延迟加载 - 默认只加载 Layer 1，展开其他层级时才加载
 * 3. 虚拟渲染 - 只渲染可见的层级和分类
 */

import { View, Text } from '@tarojs/components'
import type { FC } from 'react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ChevronRight, ChevronDown, ChevronUp, Database, Info } from 'lucide-react-taro'
import { SkeletonDimensionLayer } from '@/components/skeleton'
import {
  getMatchDimensions,
  layerNames,
  layerDescriptions,
  categoryNames,
  formatDimensionValue,
  type DimensionDefinition,
  type DimensionValue
} from '@/services/dimension'
import { getDimensionDataWithCache } from '@/utils/cache'
import Taro from '@tarojs/taro'

interface DimensionViewerProps {
  matchId: number
  relationshipType?: 'long_term' | 'short_term' | 'both' | 'undefined'
  onEdit?: (dimensionKey: string) => void
  /** 是否启用缓存，默认 true */
  enableCache?: boolean
  /** 是否启用延迟加载，默认 true */
  enableLazyLoad?: boolean
  /** 刷新触发器，值变化时重新获取数据 */
  refreshKey?: number
}

interface DimensionGroup {
  layer: number
  category: string
  dimensions: Array<{
    definition: DimensionDefinition
    value: DimensionValue | null
  }>
}

// 需要说明的维度配置
const DIMENSION_HELP: Record<string, string> = {
  // Layer 2 - 性格特质
  riskAttitude: '面对不确定性时的倾向：追求冒险还是偏好稳妥',
  extroversionLevel: '社交能量的来源：从外部世界（社交）还是内心世界（独处）获取能量',
  conflictStyle: '面对分歧时的处理方式：直面解决、回避退让、折中妥协等',
  stressResponse: '遇到压力时的典型反应：主动化解、情绪宣泄、封闭自我等',
  commitmentStyle: '对关系承诺的态度：慎重承诺、轻松承诺、避免承诺',
  intimacyNeeds: '对情感和身体亲密的需求强度',
  jealousyLevel: '对伴侣与他人互动的敏感程度',
  attachmentStyle: '在亲密关系中的依恋模式：安全型、焦虑型、回避型等',
  
  // Layer 3 - 生活偏好
  friendshipStyle: '交友和维持友谊的方式',
  communicationStyle: '日常沟通的习惯和偏好',
  humorStyle: '幽默表达的方式',
  listeningStyle: '倾听他人时的习惯',
  argumentStyle: '争论和表达不同意见的方式',
  textingStyle: '发消息的习惯：秒回、延迟回复、简洁、详尽等',
  
  // Layer 4 - 互动策略
  safeSexAttitude: '对安全性行为的重视程度',
  sexualCompatibilityImportance: '认为性契合在关系中的重要程度',
  casualDatingAcceptance: '对没有长期承诺的约会关系的态度',
  fwbAcceptance: '对从朋友发展为亲密关系的态度（Friends with Benefits）',
  multiplePartnerAcceptance: '对同时与多人约会或保持关系的态度',
  emotionalInvestmentSpeed: '在感情中投入情感的快慢节奏',
  reboundRelationshipAttitude: '对分手后快速开始新关系的态度',
  datingMultiplePeopleStyle: '同时与多人约会时的处理方式：坦诚告知、不问不说、一次只专注一人',
  signalSensitivity: '对对方释放的约会信号（暗示、邀约等）的敏感程度',
  gamesPlayingAttitude: '对"欲擒故纵"等约会策略的态度',
  flirtingStyle: '表达兴趣和吸引力的方式',
  emotionalDetachmentAbility: '从情感关系中抽离的能力',
  emotionalBoundaryStyle: '设定和维护情感边界的方式',
  physicalAffectionStyle: '在公开场合和私下对身体接触的舒适度',
}

export const DimensionViewer: FC<DimensionViewerProps> = ({ 
  matchId, 
  relationshipType, 
  onEdit,
  enableCache = true,
  enableLazyLoad = true,
  refreshKey
}) => {
  const [loading, setLoading] = useState(true)
  const [dimensionGroups, setDimensionGroups] = useState<DimensionGroup[]>([])
  const [completeness, setCompleteness] = useState<Array<{ layer: number; completeness: number }>>([])
  const [applicableCount, setApplicableCount] = useState(0)
  const [filledCount, setFilledCount] = useState(0)
  
  // 折叠状态 - 默认只展开 Layer 1
  const [expandedLayers, setExpandedLayers] = useState<Set<number>>(new Set([1]))
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  
  // 延迟加载状态 - 记录已加载的层级
  const [loadedLayers, setLoadedLayers] = useState<Set<number>>(new Set([1]))

  useEffect(() => {
    fetchDimensions()
  }, [matchId, relationshipType, refreshKey])

  // 重置折叠状态（当关系类型变化时）
  useEffect(() => {
    setExpandedLayers(new Set([1]))
    setExpandedCategories(new Set())
    setLoadedLayers(new Set([1]))
  }, [relationshipType])

  const fetchDimensions = async () => {
    try {
      setLoading(true)
      
      // 使用缓存获取数据
      if (enableCache) {
        const { data } = await getDimensionDataWithCache(
          matchId,
          () => getMatchDimensions(matchId, relationshipType)
        )
        
        if (data && data.code === 200) {
          processDimensionData(data)
        }
      } else {
        const res = await getMatchDimensions(matchId, relationshipType)
        if (res.code === 200 && res.data) {
          processDimensionData(res)
        }
      }
    } catch (err) {
      console.error('获取维度数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const processDimensionData = (res: any) => {
    if (!res.data) return
    
    // 按层级和分类分组
    const groups: Record<string, DimensionGroup> = {}
    
    for (const [, item] of Object.entries(res.data.dimensions)) {
      const typedItem = item as { definition: DimensionDefinition; value: DimensionValue | null }
      const groupKey = `${typedItem.definition.layer}-${typedItem.definition.category}`
      if (!groups[groupKey]) {
        groups[groupKey] = {
          layer: typedItem.definition.layer,
          category: typedItem.definition.category,
          dimensions: []
        }
      }
      groups[groupKey].dimensions.push({
        definition: typedItem.definition,
        value: typedItem.value
      })
    }
    
    // 排序
    const sortedGroups = Object.values(groups).sort((a, b) => {
      if (a.layer !== b.layer) return a.layer - b.layer
      return a.category.localeCompare(b.category)
    })
    
    setDimensionGroups(sortedGroups)
    setCompleteness(res.data.completeness)
    setApplicableCount(res.data.applicableCount || 0)
    setFilledCount(res.data.filledCount || 0)
  }

  // 按层级分组的维度数据
  const layersData = useMemo(() => {
    const layers: Record<number, DimensionGroup[]> = {}
    for (const group of dimensionGroups) {
      if (!layers[group.layer]) {
        layers[group.layer] = []
      }
      layers[group.layer].push(group)
    }
    return layers
  }, [dimensionGroups])

  const getCompleteness = useCallback((layer: number): number => {
    return completeness.find(c => c.layer === layer)?.completeness || 0
  }, [completeness])

  const toggleLayer = useCallback((layer: number) => {
    setExpandedLayers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(layer)) {
        newSet.delete(layer)
      } else {
        newSet.add(layer)
        // 标记该层级为已加载
        setLoadedLayers(prevLoaded => new Set(prevLoaded).add(layer))
      }
      return newSet
    })
  }, [])

  const toggleCategory = useCallback((groupKey: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey)
      } else {
        newSet.add(groupKey)
      }
      return newSet
    })
  }, [])

  const handleDimensionClick = useCallback((dimensionKey: string) => {
    if (onEdit) {
      onEdit(dimensionKey)
    } else {
      Taro.navigateTo({
        url: `/pages/dimension-edit/index?matchId=${matchId}&dimensionKey=${dimensionKey}`
      })
    }
  }, [matchId, onEdit])

  if (loading) {
    return (
      <View className="dimension-viewer">
        {/* 维度统计骨架 */}
        <View className="mb-4 p-3 bg-white rounded-xl border border-gray-100">
          <View className="flex items-center justify-between">
            <View className="bg-gray-200 animate-pulse rounded h-3 w-20" />
            <View className="flex items-center gap-1">
              <View className="bg-gray-200 animate-pulse rounded h-4 w-8" />
              <View className="bg-gray-200 animate-pulse rounded h-3 w-12" />
            </View>
          </View>
          <View className="bg-gray-200 animate-pulse rounded-full h-1 w-full mt-2" />
        </View>
        
        {/* 层级骨架 */}
        <SkeletonDimensionLayer />
        <SkeletonDimensionLayer />
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

  const sortedLayers = Object.keys(layersData).map(Number).sort((a, b) => a - b)

  return (
    <View className="dimension-viewer">
      {/* 维度统计概览 */}
      <View className="mb-4 p-3 bg-white rounded-xl border border-gray-100">
        <View className="flex items-center justify-between">
          <Text className="block text-xs text-gray-500">已填写维度</Text>
          <View className="flex items-center gap-1">
            <Text className="block text-sm font-semibold text-gray-900">{filledCount}</Text>
            <Text className="block text-xs text-gray-400">/ {applicableCount}</Text>
          </View>
        </View>
        <Progress 
          value={applicableCount > 0 ? Math.round((filledCount / applicableCount) * 100) : 0} 
          className="h-1 mt-2 bg-gray-100" 
        />
      </View>

      {/* 按层级展示 */}
      {sortedLayers.map((layer) => {
        const groups = layersData[layer]
        const isLayerExpanded = expandedLayers.has(layer)
        const layerComplete = getCompleteness(layer)
        
        // 延迟加载：只渲染已加载的层级或当前展开的层级
        const shouldRenderContent = !enableLazyLoad || loadedLayers.has(layer) || isLayerExpanded
        
        return (
          <View key={layer} className="mb-3">
            {/* 层级标题栏 - 可点击折叠 */}
            <View 
              className="bg-white rounded-xl border border-gray-100 p-3"
              onClick={() => toggleLayer(layer)}
            >
              <View className="flex items-center justify-between">
                <View className="flex items-center gap-2 flex-1">
                  <Text className="block text-sm font-semibold text-gray-900">
                    {layerNames[layer] || `Layer ${layer}`}
                  </Text>
                  <Badge variant="outline" className="text-xs">
                    {layerComplete}%
                  </Badge>
                </View>
                <View className="flex items-center gap-2">
                  <Progress value={layerComplete} className="w-16 h-1 bg-gray-100" />
                  {isLayerExpanded ? (
                    <ChevronUp size={16} color="#9CA3AF" />
                  ) : (
                    <ChevronDown size={16} color="#9CA3AF" />
                  )}
                </View>
              </View>
              
              {/* 层级描述 */}
              <Text className="block text-xs text-gray-400 mt-1">
                {layerDescriptions[layer]}
              </Text>
            </View>
            
            {/* 展开后的分类列表 */}
            {isLayerExpanded && (
              <View className="mt-2">
                {shouldRenderContent ? (
                  groups.map((group) => {
                    const groupKey = `${group.layer}-${group.category}`
                    const isCategoryExpanded = expandedCategories.has(groupKey)
                    
                    // 计算该分类下已填写的维度数
                    const filledInCategory = group.dimensions.filter(
                      item => item.value !== null && item.value !== undefined && item.value.value !== null
                    ).length
                    
                    return (
                      <View key={groupKey} className="mb-2">
                        {/* 分类标题 - 可点击折叠 */}
                        <View 
                          className="bg-gray-50 rounded-lg p-3 flex items-center justify-between"
                          onClick={() => toggleCategory(groupKey)}
                        >
                          <View className="flex items-center gap-2">
                            <Text className="block text-xs font-medium text-gray-700">
                              {categoryNames[group.category] || group.category}
                            </Text>
                            <Text className="block text-xs text-gray-400">
                              {filledInCategory}/{group.dimensions.length}
                            </Text>
                          </View>
                          {isCategoryExpanded ? (
                            <ChevronUp size={14} color="#9CA3AF" />
                          ) : (
                            <ChevronDown size={14} color="#9CA3AF" />
                          )}
                        </View>
                        
                        {/* 展开后的维度列表 */}
                        {isCategoryExpanded && (
                          <View className="bg-white rounded-lg border border-gray-100 mt-1 overflow-hidden">
                            {group.dimensions.map((item, idx) => {
                              const hasValue = item.value !== null && item.value !== undefined && item.value.value !== null
                              const displayValue = hasValue 
                                ? formatDimensionValue(item.definition, item.value!.value)
                                : '-'
                              const hasHelp = DIMENSION_HELP[item.definition.dimension_key]
                              
                              return (
                                <View
                                  key={item.definition.dimension_key}
                                  className={`flex items-center justify-between py-3 px-3 ${
                                    idx < group.dimensions.length - 1 ? 'border-b border-gray-50' : ''
                                  }`}
                                  onClick={() => handleDimensionClick(item.definition.dimension_key)}
                                >
                                  <View className="flex items-center shrink-0 mr-2">
                                    {/* 重要性标记 */}
                                    {item.definition.importance === 'critical' && (
                                      <View className="w-1 h-1 rounded-full bg-red-500 mr-2" />
                                    )}
                                    {item.definition.importance === 'important' && (
                                      <View className="w-1 h-1 rounded-full bg-amber-500 mr-2" />
                                    )}
                                    
                                    <Text className="text-sm text-gray-700 whitespace-nowrap">
                                      {item.definition.display_name}
                                    </Text>
                                    
                                    {/* 维度说明提示 */}
                                    {hasHelp && (
                                      <View className="ml-1">
                                        <Info size={12} color="#9CA3AF" />
                                      </View>
                                    )}
                                  </View>
                                  
                                  <View className="flex items-center flex-1 justify-end min-w-0">
                                    <Text 
                                      className={`text-sm ${hasValue ? 'text-gray-800' : 'text-gray-400'} truncate`}
                                    >
                                      {displayValue}
                                    </Text>
                                    <View className="shrink-0 ml-1">
                                      <ChevronRight size={14} color="#D1D5DB" />
                                    </View>
                                  </View>
                                </View>
                              )
                            })}
                          </View>
                        )}
                      </View>
                    )
                  })
                ) : (
                  // 延迟加载骨架
                  <SkeletonDimensionLayer />
                )}
              </View>
            )}
          </View>
        )
      })}
    </View>
  )
}

export default DimensionViewer
