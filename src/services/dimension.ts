/**
 * 维度管理服务
 * 用于获取维度定义和维度值
 */

import { Network } from '@/network'

export interface DimensionDefinition {
  id: number
  dimension_key: string
  display_name: string
  description: string | null
  layer: number
  category: string
  subcategory: string | null
  data_type: 'string' | 'int' | 'float' | 'boolean' | 'enum' | 'string[]' | 'object'
  enum_options: Array<{ value: string; label: string }> | null
  validation_rules: { min?: number; max?: number; pattern?: string; required?: boolean } | null
  default_value: any
  input_type: 'text' | 'select' | 'multiselect' | 'slider' | 'textarea' | 'number' | null
  placeholder: string | null
  help_text: string | null
  icon: string | null
  weight: string
  importance: 'critical' | 'important' | 'optional'
  source_allowed: string[]
  sort_order: number
  is_active: boolean
  is_custom: boolean
  created_at: string
  updated_at: string | null
}

export interface DimensionValue {
  id: number
  match_id: number
  dimension_key: string
  value: any
  source: string
  source_detail: any
  confidence: number | null
  previous_value: any
  changed_reason: string | null
  created_at: string
  updated_at: string | null
}

export interface DimensionWithDefinition {
  definition: DimensionDefinition
  value: DimensionValue | null
}

export interface MatchDimensionProfile {
  dimensions: Record<string, DimensionWithDefinition>
  completeness: Array<{ layer: number; completeness: number }>
  applicableCount: number  // 适用的维度数量
  filledCount: number      // 已填写的维度数量
}

/**
 * 获取维度定义列表
 */
export async function getDimensionDefinitions(filters?: {
  layer?: number
  category?: string
  isActive?: boolean
}): Promise<{ code: number; msg: string; data: DimensionDefinition[] }> {
  const params = new URLSearchParams()
  if (filters?.layer !== undefined) {
    params.append('layer', String(filters.layer))
  }
  if (filters?.category) {
    params.append('category', filters.category)
  }
  if (filters?.isActive !== undefined) {
    params.append('isActive', String(filters.isActive))
  }
  
  const query = params.toString()
  const url = query ? `/api/dimension/definitions?${query}` : '/api/dimension/definitions'
  
  const res = await Network.request({ url })
  return res.data
}

/**
 * 获取单个维度定义
 */
export async function getDimensionDefinition(dimensionKey: string): Promise<{
  code: number
  msg: string
  data: DimensionDefinition | null
}> {
  const res = await Network.request({ url: `/api/dimension/definitions/${dimensionKey}` })
  return res.data
}

/**
 * 获取对象的维度数据（带定义和完成度）
 * 支持根据关系类型筛选维度
 */
export async function getMatchDimensions(
  matchId: number,
  relationshipType?: 'long_term' | 'short_term' | 'both' | 'undefined'
): Promise<{
  code: number
  msg: string
  data: MatchDimensionProfile
}> {
  const params = relationshipType ? `?relationshipType=${relationshipType}` : ''
  const res = await Network.request({ url: `/api/dimension/profile/${matchId}${params}` })
  return res.data
}

/**
 * 设置单个维度值
 */
export async function setDimensionValue(
  matchId: number,
  dimensionKey: string,
  value: any,
  options?: {
    source?: string
    confidence?: number
    changed_reason?: string
  }
): Promise<{ code: number; msg: string; data: DimensionValue | null }> {
  const res = await Network.request({
    url: `/api/dimension/values/${matchId}/${dimensionKey}`,
    method: 'POST',
    data: {
      value,
      source: options?.source || 'manual',
      confidence: options?.confidence,
      changed_reason: options?.changed_reason
    }
  })
  return res.data
}

/**
 * 批量设置维度值
 */
export async function batchSetDimensionValues(
  matchId: number,
  values: Array<{
    dimension_key: string
    value: any
    source?: string
    confidence?: number
  }>
): Promise<{ code: number; msg: string; data: { success: number; failed: number } }> {
  const res = await Network.request({
    url: `/api/dimension/values/${matchId}/batch`,
    method: 'POST',
    data: { values }
  })
  return res.data
}

/**
 * 获取维度历史
 */
export async function getDimensionHistory(
  matchId: number,
  dimensionKey?: string
): Promise<{ code: number; msg: string; data: any[] }> {
  const url = dimensionKey 
    ? `/api/dimension/history/${matchId}?dimensionKey=${dimensionKey}`
    : `/api/dimension/history/${matchId}`
  
  const res = await Network.request({ url })
  return res.data
}

/**
 * 格式化维度值显示
 */
export function formatDimensionValue(
  definition: DimensionDefinition,
  value: any
): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  
  // 优先处理有 enum_options 的情况（无论是 string、enum 还是 string[] 类型）
  const enumOptions = definition.enum_options
  if (enumOptions && enumOptions.length > 0) {
    // 单选值（string 或 enum 类型）
    if (typeof value === 'string') {
      const option = enumOptions.find(opt => opt.value === value)
      if (option) return option.label
    }
    // 多选值（string[] 类型）
    if (Array.isArray(value)) {
      const labels = value.map(v => {
        const option = enumOptions.find(opt => opt.value === v)
        return option?.label || v
      })
      return labels.join('、')
    }
  }
  
  switch (definition.data_type) {
    case 'string[]': {
      if (Array.isArray(value)) {
        return value.join('、')
      }
      return String(value)
    }
    case 'int':
    case 'float':
      return String(value)
    case 'boolean':
      return value ? '是' : '否'
    default:
      return String(value)
  }
}

/**
 * 层级名称映射
 */
export const layerNames: Record<number, string> = {
  1: '基础档案',
  2: '性格特质',
  3: '生活偏好',
  4: '互动策略',
  5: '近期状态',
  6: '自定义维度'
}

/**
 * 层级描述映射
 */
export const layerDescriptions: Record<number, string> = {
  1: '几乎不变的静态属性',
  2: '缓慢变化的长期特质',
  3: '可改变的中期偏好',
  4: '经常变化的动态状态',
  5: '实时变化的情境数据',
  6: '用户自定义的维度'
}

/**
 * 分类名称映射
 */
export const categoryNames: Record<string, string> = {
  identity: '身份基础',
  education: '教育职业',
  family: '家庭背景',
  appearance: '外形条件',
  life_stage: '人生阶段',
  core_personality: '核心人格',
  values: '价值观核心',
  relationship_intent: '婚恋意向',
  location: '地理位置',
  skills: '才艺技能',
  personality: '性格特质',
  emotion: '情绪模式',
  intimacy: '亲密关系',
  conflict: '冲突模式',
  jealousy: '嫉妒占有',
  dependence: '依赖独立',
  social: '社交模式',
  communication_trait: '沟通特质',
  decision: '决策风格',
  energy: '能量模式',
  self: '自我认知',
  control: '控制感',
  background: '成长背景',
  // Layer 2 分类
  communication: '沟通风格',
  life_attitude: '生活态度',
  love_style: '恋爱风格',
  // Layer 3 分类
  interests: '兴趣爱好',
  lifestyle: '生活方式',
  dating: '约会偏好',
  communication_pref: '沟通偏好',
  current: '当前状态',
  // Layer 4 分类
  sexual_intimacy: '性与亲密',
  dating_dynamics: '约会动态',
  emotional_investment: '情感投入',
  privacy_public: '隐私公开',
  relationship_form: '关系形式',
  short_term_patterns: '短期模式',
  current_status: '当前状态',
  time_availability: '时间安排',
  custom: '自定义维度'
}

/**
 * 创建自定义维度定义
 */
export async function createCustomDimension(data: {
  display_name: string
  description?: string
  category?: string
  data_type?: string
  input_type?: string
  enum_options?: Array<{ value: string; label: string }>
  validation_rules?: { min?: number; max?: number; pattern?: string; required?: boolean }
  placeholder?: string
  help_text?: string
  importance?: string
}): Promise<{ code: number; msg: string; data: DimensionDefinition | null }> {
  const res = await Network.request({
    url: '/api/dimension/custom-definitions',
    method: 'POST',
    data
  })
  return res.data
}

/**
 * 更新自定义维度定义
 */
export async function updateCustomDimension(
  dimensionKey: string,
  data: {
    display_name?: string
    description?: string
    data_type?: string
    input_type?: string
    enum_options?: Array<{ value: string; label: string }>
    validation_rules?: { min?: number; max?: number; pattern?: string; required?: boolean }
    placeholder?: string
    help_text?: string
    importance?: string
  }
): Promise<{ code: number; msg: string; data: DimensionDefinition | null }> {
  const res = await Network.request({
    url: `/api/dimension/custom-definitions/${dimensionKey}`,
    method: 'POST',
    data
  })
  return res.data
}

/**
 * 删除自定义维度定义
 */
export async function deleteCustomDimension(
  dimensionKey: string
): Promise<{ code: number; msg: string }> {
  const res = await Network.request({
    url: `/api/dimension/custom-definitions/${dimensionKey}`,
    method: 'DELETE'
  })
  return res.data
}
