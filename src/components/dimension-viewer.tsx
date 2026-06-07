/**
 * 维度展示组件
 * 按层级展示对象的维度数据，支持折叠展开
 * 支持自定义维度的创建、编辑和删除
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ChevronRight, ChevronDown, ChevronUp, Database, Info, Plus, Trash2, Loader, X } from 'lucide-react-taro'
import { SkeletonDimensionLayer } from '@/components/skeleton'
import {
  getMatchDimensions,
  createCustomDimension,
  deleteCustomDimension,
  layerNames,
  layerDescriptions,
  categoryNames,
  formatDimensionValue,
  type DimensionDefinition,
  type DimensionValue
} from '@/services/dimension'
import { getDimensionDataWithCache, clearDimensionCache } from '@/utils/cache'
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
  /** 维度数据变更后的回调 */
  onDimensionChange?: () => void
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
  communicationStyleOnline: '对方在微信、电话等线上场景的沟通方式，很多人线上和线下表现截然不同',
  communicationStyleOffline: '对方面对面时的沟通方式，与线上风格可能完全不同',
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

// 自定义维度的输入类型选项
const INPUT_TYPE_OPTIONS = [
  { value: 'text', label: '文本' },
  { value: 'select', label: '单选' },
  { value: 'multiselect', label: '多选标签' },
  { value: 'slider', label: '滑块打分' },
  { value: 'textarea', label: '长文本' },
] as const

export const DimensionViewer: FC<DimensionViewerProps> = ({ 
  matchId, 
  relationshipType, 
  onEdit,
  enableCache = true,
  enableLazyLoad = true,
  refreshKey,
  onDimensionChange
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

  // 自定义维度创建弹窗状态
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createInputType, setCreateInputType] = useState<string>('text')
  const [creating, setCreating] = useState(false)
  // 多选标签输入状态
  const [createTags, setCreateTags] = useState<string[]>([])
  const [createTagInput, setCreateTagInput] = useState('')

  // 删除确认弹窗状态
  const [deleteTarget, setDeleteTarget] = useState<{ key: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

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
    
    // 排序：系统维度分类在前，custom 分类在后
    const sortedGroups = Object.values(groups).sort((a, b) => {
      if (a.layer !== b.layer) return a.layer - b.layer
      // custom 分类排在该层级的最后
      const aIsCustom = a.category === 'custom' ? 1 : 0
      const bIsCustom = b.category === 'custom' ? 1 : 0
      if (aIsCustom !== bIsCustom) return aIsCustom - bIsCustom
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

  // 创建自定义维度
  const handleCreateCustom = useCallback(async () => {
    if (!createName.trim()) return
    try {
      setCreating(true)
      const data_type = createInputType === 'slider' ? 'int' : (createInputType === 'multiselect' ? 'string[]' : 'string')
      const validation_rules = createInputType === 'slider' ? { min: 0, max: 100 } : undefined
      
      // 多选/单选：标签作为可选选项 (enum_options)
      const enum_options = (createInputType === 'multiselect' || createInputType === 'select') && createTags.length > 0
        ? createTags.map(tag => ({ value: tag, label: tag }))
        : undefined

      const res = await createCustomDimension({
        display_name: createName.trim(),
        data_type,
        input_type: createInputType,
        category: 'custom',
        validation_rules,
        enum_options,
      })
      
      if (res.code === 200) {
        // 清除缓存并刷新
        clearDimensionCache(matchId)
        fetchDimensions()
        resetCreateDialog()
        onDimensionChange?.()
      } else {
        console.error('创建自定义维度失败:', res.msg)
      }
    } catch (err) {
      console.error('创建自定义维度异常:', err)
    } finally {
      setCreating(false)
    }
  }, [createName, createInputType, createTags, matchId, onDimensionChange])

  const resetCreateDialog = useCallback(() => {
    setShowCreateDialog(false)
    setCreateName('')
    setCreateInputType('text')
    setCreateTags([])
    setCreateTagInput('')
  }, [])

  // 删除自定义维度
  const handleDeleteCustom = useCallback(async (dimensionKey: string) => {
    try {
      setDeleting(true)
      const res = await deleteCustomDimension(dimensionKey)
      if (res.code === 200) {
        clearDimensionCache(matchId)
        fetchDimensions()
        setDeleteTarget(null)
        onDimensionChange?.()
      } else {
        console.error('删除自定义维度失败:', res.msg)
      }
    } catch (err) {
      console.error('删除自定义维度异常:', err)
    } finally {
      setDeleting(false)
    }
  }, [matchId, onDimensionChange])

  if (loading) {
    return (
      <View className="dimension-viewer">
        {/* 维度统计骨架 */}
        <View className="mb-4 p-3 bg-white rounded-xl">
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
        <Text className="text-gray-500 text-sm mb-4">暂无维度数据</Text>
        <Button
          size="sm"
          className="bg-green-500"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus size={14} color="#fff" />
          <Text className="text-white text-xs ml-1">添加自定义维度</Text>
        </Button>
      </View>
    )
  }

  const sortedLayers = Object.keys(layersData).map(Number).sort((a, b) => a - b)

  return (
    <View className="dimension-viewer">
      {/* 维度统计概览 */}
      <View className="mb-4 p-3 bg-white rounded-xl">
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
        const isCustomLayer = layer === 6
        
        // 延迟加载：只渲染已加载的层级或当前展开的层级
        const shouldRenderContent = !enableLazyLoad || loadedLayers.has(layer) || isLayerExpanded
        
        return (
          <View key={layer} className="mb-4">
            {/* 层级标题栏 - 可点击折叠 */}
            <View 
              className="bg-white rounded-xl p-3"
              onClick={() => toggleLayer(layer)}
            >
              <View className="flex items-center justify-between">
                <View className="flex items-center gap-3 flex-1">
                  <Text className="block text-sm font-semibold text-gray-900">
                    {layerNames[layer] || `Layer ${layer}`}
                  </Text>
                  <Badge variant="outline" className="text-xs">
                    {layerComplete}%
                  </Badge>
                </View>
                <View className="flex items-center gap-3">
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
                    const isCustomCategory = group.category === 'custom'
                    
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
                          <View className="flex items-center gap-3">
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
                          <View className="bg-white rounded-lg mt-1 overflow-hidden">
                            {group.dimensions.map((item, idx) => {
                              const hasValue = item.value !== null && item.value !== undefined && item.value.value !== null
                              const displayValue = hasValue 
                                ? formatDimensionValue(item.definition, item.value!.value)
                                : '-'
                              const hasHelp = DIMENSION_HELP[item.definition.dimension_key]
                              const isCustomDim = item.definition.is_custom
                              
                              return (
                                <View
                                  key={item.definition.dimension_key}
                                  className={`flex items-center justify-between py-3 px-3 ${
                                    idx < group.dimensions.length - 1 ? 'border-b border-gray-100' : ''
                                  }`}
                                >
                                  <View 
                                    className="flex items-center shrink-0 mr-2 flex-1"
                                    onClick={() => handleDimensionClick(item.definition.dimension_key)}
                                  >
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
                                  
                                  <View className="flex items-center justify-end min-w-0 shrink-0">
                                    <View onClick={() => handleDimensionClick(item.definition.dimension_key)}>
                                      <Text 
                                        className={`text-sm ${hasValue ? 'text-gray-800' : 'text-gray-400'} truncate`}
                                      >
                                        {displayValue}
                                      </Text>
                                    </View>
                                    {/* 自定义维度显示删除按钮 */}
                                    {isCustomDim && (
                                      <View 
                                        className="ml-2"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setDeleteTarget({ key: item.definition.dimension_key, name: item.definition.display_name })
                                        }}
                                      >
                                        <Trash2 size={14} color="#EF4444" />
                                      </View>
                                    )}
                                    {!isCustomDim && (
                                      <View className="shrink-0 ml-1" onClick={() => handleDimensionClick(item.definition.dimension_key)}>
                                        <ChevronRight size={14} color="#D1D5DB" />
                                      </View>
                                    )}
                                  </View>
                                </View>
                              )
                            })}

                            {/* 自定义分类底部：添加自定义维度按钮 */}
                            {isCustomCategory && (
                              <View 
                                className="flex items-center justify-center py-3 px-3 border-t border-gray-100"
                                onClick={() => setShowCreateDialog(true)}
                              >
                                <Plus size={14} color="#2E9E5A" />
                                <Text className="text-sm text-green-600 ml-1">添加自定义维度</Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    )
                  })
                ) : (
                  // 延迟加载骨架
                  <SkeletonDimensionLayer />
                )}

                {/* 自定义层级底部：添加自定义维度按钮 */}
                {isCustomLayer && (
                  <View 
                    className="bg-white rounded-lg p-3 flex items-center justify-center mt-2"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Plus size={14} color="#2E9E5A" />
                    <Text className="text-sm text-green-600 ml-1">添加自定义维度</Text>
                  </View>
                )}

                {/* 非自定义层级不再显示添加自定义维度入口 */}
              </View>
            )}
          </View>
        )
      })}

      {/* 如果没有任何自定义维度，也显示独立的入口 */}
      {!sortedLayers.includes(6) && (
        <View className="mb-4">
          <View 
            className="bg-white rounded-xl p-3"
            onClick={() => {
              setExpandedLayers(prev => new Set(prev).add(6))
              setLoadedLayers(prev => new Set(prev).add(6))
              setShowCreateDialog(true)
            }}
          >
            <View className="flex items-center justify-between">
              <View className="flex items-center gap-3 flex-1">
                <Text className="block text-sm font-semibold text-gray-900">
                  自定义维度
                </Text>
              </View>
              <View className="flex items-center gap-2">
                <Plus size={14} color="#2E9E5A" />
                <Text className="text-sm text-green-600">添加</Text>
              </View>
            </View>
            <Text className="block text-xs text-gray-400 mt-1">
              用户自定义的维度
            </Text>
          </View>
        </View>
      )}

      {/* 创建自定义维度弹窗 */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { if (!open) resetCreateDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Text className="block text-lg font-semibold">添加自定义维度</Text>
            </DialogTitle>
          </DialogHeader>
          
          <View className="py-4 space-y-4">
            {/* 维度名称 */}
            <View>
              <Text className="block text-sm font-medium text-gray-700 mb-2">维度名称</Text>
              <View className="bg-gray-50 rounded-lg px-4 py-3">
                <Input
                  value={createName}
                  onInput={(e) => setCreateName(e.detail.value)}
                  placeholder="例如：口头禅、社交账号、宠物名..."
                  className="w-full bg-transparent text-sm"
                  focus
                />
              </View>
            </View>

            {/* 输入类型 */}
            <View>
              <Text className="block text-sm font-medium text-gray-700 mb-2">输入类型</Text>
              <View className="flex flex-wrap gap-2">
                {INPUT_TYPE_OPTIONS.map(opt => (
                  <View
                    key={opt.value}
                    className={`px-3 py-2 rounded-lg ${
                      createInputType === opt.value ? 'bg-green-500' : 'bg-gray-100'
                    }`}
                    onClick={() => setCreateInputType(opt.value)}
                  >
                    <Text className={`text-sm ${createInputType === opt.value ? 'text-white' : 'text-gray-600'}`}>
                      {opt.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 类型说明 */}
            <View className="bg-gray-50 rounded-lg p-3">
              <Text className="block text-xs text-gray-500">
                {createInputType === 'text' && '文本：适合简短内容，如昵称、口头禅'}
                {createInputType === 'select' && '单选：适合从几个选项中选一个，如血型、风格'}
                {createInputType === 'multiselect' && '多选标签：适合选多个，如标签、兴趣爱好'}
                {createInputType === 'slider' && '滑块打分：适合量化评估，如满意度（0-100分）'}
                {createInputType === 'textarea' && '长文本：适合详细描述，如备注、故事'}
              </Text>
            </View>

            {/* 多选/单选：添加可选选项 */}
            {(createInputType === 'multiselect' || createInputType === 'select') && (
              <View>
                <Text className="block text-sm font-medium text-gray-700 mb-2">
                  {createInputType === 'multiselect' ? '添加可选选项' : '添加可选选项'}
                </Text>
                <Text className="block text-xs text-gray-400 mb-2">
                  {createInputType === 'multiselect' ? '用户可从中选择多个标签' : '用户可从中选择一项'}
                </Text>
                {/* 已添加的选项 */}
                {createTags.length > 0 && (
                  <View className="flex flex-wrap gap-2 mb-3">
                    {createTags.map(tag => (
                      <View
                        key={tag}
                        className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-full px-3 py-1"
                      >
                        <Text className="text-sm text-blue-700">{tag}</Text>
                        <View onClick={() => setCreateTags(prev => prev.filter(t => t !== tag))}>
                          <X size={12} color="#3b82f6" />
                        </View>
                      </View>
                    ))}
                  </View>
                )}
                {/* 选项输入框 */}
                <View style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
                  <View className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                    <Input
                      value={createTagInput}
                      onInput={(e) => setCreateTagInput(e.detail.value)}
                      placeholder="输入选项后点击添加..."
                      className="w-full bg-transparent text-sm"
                      onConfirm={() => {
                        if (createTagInput.trim() && !createTags.includes(createTagInput.trim())) {
                          setCreateTags(prev => [...prev, createTagInput.trim()])
                          setCreateTagInput('')
                        }
                      }}
                    />
                  </View>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!createTagInput.trim() || createTags.includes(createTagInput.trim())}
                    onClick={() => {
                      if (createTagInput.trim() && !createTags.includes(createTagInput.trim())) {
                        setCreateTags(prev => [...prev, createTagInput.trim()])
                        setCreateTagInput('')
                      }
                    }}
                  >
                    <Text className="text-xs">添加</Text>
                  </Button>
                </View>
              </View>
            )}
          </View>

          <DialogFooter>
            <Button variant="outline" onClick={resetCreateDialog}>
              <Text className="block">取消</Text>
            </Button>
            <Button 
              className="bg-green-500" 
              onClick={handleCreateCustom}
              disabled={!createName.trim() || creating}
            >
              {creating ? (
                <Loader size={14} color="#fff" className="animate-spin" />
              ) : (
                <Text className="text-white">创建</Text>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除自定义维度确认弹窗 */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Text className="block text-lg font-semibold">删除自定义维度</Text>
            </DialogTitle>
          </DialogHeader>
          <View className="py-4">
            <Text className="block text-sm text-gray-600">
              确定要删除自定义维度「{deleteTarget?.name}」吗？删除后该维度的所有数据将无法恢复。
            </Text>
          </View>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              <Text className="block">取消</Text>
            </Button>
            <Button 
              className="bg-red-500" 
              onClick={() => deleteTarget && handleDeleteCustom(deleteTarget.key)}
              disabled={deleting}
            >
              {deleting ? (
                <Loader size={14} color="#fff" className="animate-spin" />
              ) : (
                <Text className="text-white">删除</Text>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  )
}

export default DimensionViewer
