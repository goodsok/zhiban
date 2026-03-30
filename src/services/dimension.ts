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
 */
export async function getMatchDimensions(matchId: number): Promise<{
  code: number
  msg: string
  data: MatchDimensionProfile
}> {
  const res = await Network.request({ url: `/api/dimension/profile/${matchId}` })
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
  
  switch (definition.data_type) {
    case 'enum': {
      const option = definition.enum_options?.find(opt => opt.value === value)
      return option?.label || value
    }
    case 'string[]': {
      if (Array.isArray(value)) {
        return value.join('、')
      }
      return value
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
  5: '近期状态'
}

/**
 * 层级描述映射
 */
export const layerDescriptions: Record<number, string> = {
  1: '几乎不变的静态属性',
  2: '缓慢变化的长期特质',
  3: '可改变的中期偏好',
  4: '经常变化的动态状态',
  5: '实时变化的情境数据'
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
  background: '成长背景'
}
