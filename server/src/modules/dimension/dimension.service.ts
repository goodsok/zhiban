import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '../../storage/database/supabase-client'

export interface DimensionDefinition {
  id: number
  dimension_key: string
  display_name: string
  description: string | null
  layer: number
  category: string
  subcategory: string | null
  data_type: string
  enum_options: Array<{ value: string; label: string }> | null
  validation_rules: { min?: number; max?: number; pattern?: string; required?: boolean } | null
  default_value: any
  input_type: string | null
  placeholder: string | null
  help_text: string | null
  icon: string | null
  weight: string
  importance: string
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

@Injectable()
export class DimensionService {
  /**
   * 获取所有维度定义（支持按层级、分类筛选）
   */
  async getDimensionDefinitions(filters?: {
    layer?: number
    category?: string
    isActive?: boolean
  }): Promise<{ code: number; msg: string; data: DimensionDefinition[] }> {
    try {
      const supabase = getSupabaseClient()
      
      let query = supabase
        .from('dimension_definitions')
        .select('*')
        .order('layer')
        .order('category')
        .order('sort_order')

      if (filters?.layer !== undefined) {
        query = query.eq('layer', filters.layer)
      }
      if (filters?.category) {
        query = query.eq('category', filters.category)
      }
      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive)
      }

      const { data, error } = await query

      if (error) {
        console.error('获取维度定义失败:', error)
        return { code: 500, msg: error.message, data: [] }
      }

      return { code: 200, msg: 'success', data: data || [] }
    } catch (err) {
      console.error('获取维度定义异常:', err)
      return { code: 500, msg: String(err), data: [] }
    }
  }

  /**
   * 获取单个维度定义
   */
  async getDimensionDefinition(dimensionKey: string): Promise<{ code: number; msg: string; data: DimensionDefinition | null }> {
    try {
      const supabase = getSupabaseClient()
      
      const { data, error } = await supabase
        .from('dimension_definitions')
        .select('*')
        .eq('dimension_key', dimensionKey)
        .single()

      if (error) {
        console.error('获取维度定义失败:', error)
        return { code: 404, msg: '维度定义不存在', data: null }
      }

      return { code: 200, msg: 'success', data }
    } catch (err) {
      console.error('获取维度定义异常:', err)
      return { code: 500, msg: String(err), data: null }
    }
  }

  /**
   * 获取对象的维度值列表
   */
  async getMatchDimensionValues(matchId: number): Promise<{ code: number; msg: string; data: DimensionValue[] }> {
    try {
      const supabase = getSupabaseClient()
      
      const { data, error } = await supabase
        .from('profile_dimension_values')
        .select('*')
        .eq('match_id', matchId)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('获取维度值失败:', error)
        return { code: 500, msg: error.message, data: [] }
      }

      return { code: 200, msg: 'success', data: data || [] }
    } catch (err) {
      console.error('获取维度值异常:', err)
      return { code: 500, msg: String(err), data: [] }
    }
  }

  /**
   * 获取对象的维度值（带维度定义信息）
   */
  async getMatchDimensionsWithDefinitions(matchId: number): Promise<{ 
    code: number; 
    msg: string; 
    data: {
      dimensions: Record<string, { definition: DimensionDefinition; value: DimensionValue | null }>
      completeness: { layer: number; completeness: number }[]
    }
  }> {
    try {
      const supabase = getSupabaseClient()
      
      // 获取维度定义
      const { data: definitions, error: defError } = await supabase
        .from('dimension_definitions')
        .select('*')
        .eq('is_active', true)
        .order('layer')
        .order('sort_order')

      if (defError) {
        return { code: 500, msg: defError.message, data: { dimensions: {}, completeness: [] } }
      }

      // 获取维度值
      const { data: values, error: valError } = await supabase
        .from('profile_dimension_values')
        .select('*')
        .eq('match_id', matchId)

      if (valError) {
        return { code: 500, msg: valError.message, data: { dimensions: {}, completeness: [] } }
      }

      // 组合数据
      const dimensionsMap: Record<string, { definition: DimensionDefinition; value: DimensionValue | null }> = {}
      const valueMap = new Map(values?.map(v => [v.dimension_key, v]))

      for (const def of definitions || []) {
        dimensionsMap[def.dimension_key] = {
          definition: def as DimensionDefinition,
          value: valueMap.get(def.dimension_key) || null
        }
      }

      // 计算完成度
      const layerCompleteness: Record<number, { filled: number; total: number; weight: number }> = {}
      for (const def of definitions || []) {
        if (!layerCompleteness[def.layer]) {
          layerCompleteness[def.layer] = { filled: 0, total: 0, weight: 0 }
        }
        layerCompleteness[def.layer].total++
        layerCompleteness[def.layer].weight += parseFloat(def.weight)
        if (valueMap.has(def.dimension_key)) {
          layerCompleteness[def.layer].filled += parseFloat(def.weight)
        }
      }

      const completeness = Object.entries(layerCompleteness).map(([layer, data]) => ({
        layer: parseInt(layer),
        completeness: data.weight > 0 ? Math.round((data.filled / data.weight) * 100) : 0
      }))

      return { 
        code: 200, 
        msg: 'success', 
        data: { 
          dimensions: dimensionsMap,
          completeness
        }
      }
    } catch (err) {
      console.error('获取维度数据异常:', err)
      return { code: 500, msg: String(err), data: { dimensions: {}, completeness: [] } }
    }
  }

  /**
   * 设置对象的维度值
   */
  async setDimensionValue(matchId: number, dimensionKey: string, body: {
    value: any
    source?: string
    source_detail?: any
    confidence?: number
    changed_reason?: string
  }): Promise<{ code: number; msg: string; data: DimensionValue | null }> {
    try {
      const supabase = getSupabaseClient()
      
      // 验证维度定义存在
      const { data: def } = await supabase
        .from('dimension_definitions')
        .select('*')
        .eq('dimension_key', dimensionKey)
        .single()

      if (!def) {
        return { code: 404, msg: '维度定义不存在', data: null }
      }

      // 获取旧值
      const { data: existingValue } = await supabase
        .from('profile_dimension_values')
        .select('value')
        .eq('match_id', matchId)
        .eq('dimension_key', dimensionKey)
        .single()

      // UPSERT 维度值
      const { data, error } = await supabase
        .from('profile_dimension_values')
        .upsert({
          match_id: matchId,
          dimension_key: dimensionKey,
          value: body.value,
          source: body.source || 'manual',
          source_detail: body.source_detail || null,
          confidence: body.confidence || null,
          previous_value: existingValue?.value || null,
          changed_reason: body.changed_reason || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'match_id,dimension_key'
        })
        .select()
        .single()

      if (error) {
        console.error('设置维度值失败:', error)
        return { code: 500, msg: error.message, data: null }
      }

      // 记录历史
      if (existingValue) {
        await supabase
          .from('profile_dimension_history')
          .insert({
            match_id: matchId,
            dimension_key: dimensionKey,
            old_value: existingValue.value,
            new_value: body.value,
            change_source: body.source === 'ai_extract' || body.source === 'chat_analysis' ? 'ai_update' : 'manual_update',
            changed_reason: body.changed_reason || null
          })
      }

      return { code: 200, msg: 'success', data }
    } catch (err) {
      console.error('设置维度值异常:', err)
      return { code: 500, msg: String(err), data: null }
    }
  }

  /**
   * 批量设置维度值
   */
  async batchSetDimensionValues(matchId: number, values: Array<{
    dimension_key: string
    value: any
    source?: string
    confidence?: number
  }>): Promise<{ code: number; msg: string; data: { success: number; failed: number } }> {
    try {
      const supabase = getSupabaseClient()
      
      let success = 0
      let failed = 0

      for (const item of values) {
        const result = await this.setDimensionValue(matchId, item.dimension_key, {
          value: item.value,
          source: item.source || 'manual',
          confidence: item.confidence
        })
        if (result.code === 200) {
          success++
        } else {
          failed++
        }
      }

      return { code: 200, msg: 'success', data: { success, failed } }
    } catch (err) {
      console.error('批量设置维度值异常:', err)
      return { code: 500, msg: String(err), data: { success: 0, failed: 0 } }
    }
  }

  /**
   * 删除维度值
   */
  async deleteDimensionValue(matchId: number, dimensionKey: string): Promise<{ code: number; msg: string }> {
    try {
      const supabase = getSupabaseClient()
      
      const { error } = await supabase
        .from('profile_dimension_values')
        .delete()
        .eq('match_id', matchId)
        .eq('dimension_key', dimensionKey)

      if (error) {
        console.error('删除维度值失败:', error)
        return { code: 500, msg: error.message }
      }

      return { code: 200, msg: 'success' }
    } catch (err) {
      console.error('删除维度值异常:', err)
      return { code: 500, msg: String(err) }
    }
  }

  /**
   * 获取维度历史
   */
  async getDimensionHistory(matchId: number, dimensionKey?: string): Promise<{ code: number; msg: string; data: any[] }> {
    try {
      const supabase = getSupabaseClient()
      
      let query = supabase
        .from('profile_dimension_history')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: false })

      if (dimensionKey) {
        query = query.eq('dimension_key', dimensionKey)
      }

      const { data, error } = await query

      if (error) {
        console.error('获取维度历史失败:', error)
        return { code: 500, msg: error.message, data: [] }
      }

      return { code: 200, msg: 'success', data: data || [] }
    } catch (err) {
      console.error('获取维度历史异常:', err)
      return { code: 500, msg: String(err), data: [] }
    }
  }
}
