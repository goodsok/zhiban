import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '../../storage/database/supabase-client'
import { allDimensions } from '../../storage/data/dimension-definitions'

// 硬件字段到维度 key 的映射
const hardwareToDimensionMap: Record<string, {
  dimensionKey: string
  transform?: (value: unknown) => unknown
}> = {
  age: {
    dimensionKey: 'birthYear',
    transform: (value) => {
      const age = Number(value)
      if (isNaN(age) || age <= 0) return null
      const currentYear = new Date().getFullYear()
      return currentYear - age
    }
  },
  height: {
    dimensionKey: 'height',
    transform: (value) => {
      const str = String(value).replace(/[^0-9]/g, '')
      const num = parseInt(str, 10)
      return isNaN(num) ? null : num
    }
  },
  zodiac: {
    dimensionKey: 'zodiac',
    transform: (value) => {
      const zodiacMap: Record<string, string> = {
        '白羊座': 'aries', '金牛座': 'taurus', '双子座': 'gemini', '巨蟹座': 'cancer',
        '狮子座': 'leo', '处女座': 'virgo', '天秤座': 'libra', '天蝎座': 'scorpio',
        '射手座': 'sagittarius', '摩羯座': 'capricorn', '水瓶座': 'aquarius', '双鱼座': 'pisces',
        '白羊': 'aries', '金牛': 'taurus', '双子': 'gemini', '巨蟹': 'cancer',
        '狮子': 'leo', '处女': 'virgo', '天秤': 'libra', '天蝎': 'scorpio',
        '射手': 'sagittarius', '摩羯': 'capricorn', '水瓶': 'aquarius', '双鱼': 'pisces'
      }
      return zodiacMap[String(value)] || String(value).toLowerCase()
    }
  },
  bloodType: {
    dimensionKey: 'bloodType',
    transform: (value) => {
      const str = String(value).toUpperCase()
      if (['A', 'B', 'AB', 'O'].includes(str)) return str
      const match = str.match(/([ABO]+)/)
      return match ? match[1] : null
    }
  },
  bodyType: {
    dimensionKey: 'bodyType',
    transform: (value) => {
      const bodyTypeMap: Record<string, string> = {
        '偏瘦': 'slim', '瘦': 'slim', 'slim': 'slim',
        '匀称': 'average', '标准': 'average', 'average': 'average',
        '健壮': 'athletic', '肌肉': 'athletic', 'athletic': 'athletic',
        '丰满': 'curvy', 'curvy': 'curvy',
        '偏胖': 'plump', '胖': 'plump', 'plump': 'plump'
      }
      return bodyTypeMap[String(value)] || 'average'
    }
  },
  style: {
    dimensionKey: 'appearance'
  },
  location: {
    dimensionKey: 'currentCity'
  },
  occupation: {
    dimensionKey: 'occupation'
  },
  company: {
    dimensionKey: 'company'
  }
}

// 软件字段到维度 key 的映射
const softwareToDimensionMap: Record<string, {
  dimensionKey: string
  transform?: (value: unknown) => unknown
}> = {
  mbti: {
    dimensionKey: 'mbti',
    transform: (value) => {
      const str = String(value).toUpperCase()
      const validMBTI = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP',
                         'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP']
      return validMBTI.includes(str) ? str : null
    }
  },
  personality: {
    dimensionKey: 'coreTemperament'
  },
  emotionalStyle: {
    dimensionKey: 'emotionalExpressionStyle',
    transform: (value) => {
      const styleMap: Record<string, string> = {
        '直接': 'expressive', '直接表达': 'expressive', 'expressive': 'expressive',
        '含蓄': 'reserved', '内敛': 'reserved', 'reserved': 'reserved',
        '看情况': 'selective', '因人而异': 'selective', 'selective': 'selective',
        '回避': 'avoidant', 'avoidant': 'avoidant'
      }
      return styleMap[String(value)] || null
    }
  },
  interests: {
    dimensionKey: 'hobbies',
    transform: (value) => {
      if (Array.isArray(value)) return value
      if (typeof value === 'string') return value.split(/[,，、]/).map(s => s.trim()).filter(Boolean)
      return null
    }
  },
  hobbies: {
    dimensionKey: 'hobbies',
    transform: (value) => {
      if (typeof value === 'string') return value.split(/[,，、]/).map(s => s.trim()).filter(Boolean)
      return null
    }
  },
  spendingStyle: {
    dimensionKey: 'moneyPhilosophy',
    transform: (value) => {
      const styleMap: Record<string, string> = {
        '节俭': 'frugal', 'frugal': 'frugal',
        '平衡': 'balanced', 'balanced': 'balanced',
        '享受': 'enjoyment', '享受当下': 'enjoyment', 'enjoyment': 'enjoyment',
        '投资': 'investor', '投资导向': 'investor', 'investor': 'investor'
      }
      return styleMap[String(value)] || 'balanced'
    }
  },
  communicationStyle: {
    dimensionKey: 'communicationStyle',
    transform: (value) => {
      const styleMap: Record<string, string> = {
        '直接': 'direct', '直率': 'direct', 'direct': 'direct',
        '委婉': 'indirect', '含蓄': 'indirect', 'indirect': 'indirect',
        '平衡': 'balanced', '因人而异': 'balanced', 'balanced': 'balanced'
      }
      return styleMap[String(value)] || 'balanced'
    }
  },
  dealBreakers: {
    dimensionKey: 'marriageNonNegotiables',
    transform: (value) => {
      if (typeof value === 'string') return [value]
      if (Array.isArray(value)) return value
      return null
    }
  },
  loveLanguages: {
    dimensionKey: 'loveLanguage',
    transform: (value) => {
      if (Array.isArray(value)) return value
      if (typeof value === 'string') {
        return value.split(/[,，、>]/).map(s => s.trim()).filter(Boolean)
      }
      return null
    }
  }
}

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

  /**
   * 初始化维度定义数据
   * 从 dimension-definitions.ts 导入所有维度定义并插入数据库
   */
  async initializeDimensionDefinitions(): Promise<{ code: number; msg: string; data: { inserted: number; skipped: number } }> {
    try {
      const supabase = getSupabaseClient()
      
      // 获取已有的维度定义
      const { data: existingDefs, error: fetchError } = await supabase
        .from('dimension_definitions')
        .select('dimension_key')

      if (fetchError) {
        console.error('获取已有维度定义失败:', fetchError)
        return { code: 500, msg: fetchError.message, data: { inserted: 0, skipped: 0 } }
      }

      const existingKeys = new Set(existingDefs?.map(d => d.dimension_key) || [])
      
      // 过滤出不存在的维度定义
      const newDefinitions = allDimensions.filter(d => !existingKeys.has(d.dimension_key))

      if (newDefinitions.length === 0) {
        return { code: 200, msg: '所有维度定义已存在', data: { inserted: 0, skipped: existingKeys.size } }
      }

      // 插入新维度定义
      const { error: insertError } = await supabase
        .from('dimension_definitions')
        .insert(newDefinitions.map(d => ({
          dimension_key: d.dimension_key,
          display_name: d.display_name,
          description: d.description || null,
          layer: d.layer,
          category: d.category,
          subcategory: d.subcategory || null,
          data_type: d.data_type,
          enum_options: d.enum_options || null,
          validation_rules: d.validation_rules || null,
          default_value: d.default_value || null,
          input_type: d.input_type || null,
          placeholder: d.placeholder || null,
          help_text: d.help_text || null,
          icon: d.icon || null,
          weight: d.weight.toString(),
          importance: d.importance,
          source_allowed: d.source_allowed,
          sort_order: d.sort_order,
          is_active: true
        })))

      if (insertError) {
        console.error('插入维度定义失败:', insertError)
        return { code: 500, msg: insertError.message, data: { inserted: 0, skipped: existingKeys.size } }
      }

      console.log(`成功插入 ${newDefinitions.length} 条维度定义`)
      
      return { 
        code: 200, 
        msg: 'success', 
        data: { 
          inserted: newDefinitions.length, 
          skipped: existingKeys.size 
        } 
      }
    } catch (err) {
      console.error('初始化维度定义异常:', err)
      return { code: 500, msg: String(err), data: { inserted: 0, skipped: 0 } }
    }
  }

  /**
   * 迁移 matches.hardware/software 数据到维度值表
   */
  async migrateHardwareSoftwareToDimensions(): Promise<{ code: number; msg: string; data: { migrated: number; errors: string[] } }> {
    const supabase = getSupabaseClient()
    const errors: string[] = []
    let migrated = 0

    try {
      // 1. 获取所有 matches 记录
      const { data: matches, error: fetchError } = await supabase
        .from('matches')
        .select('id, name, hardware, software')

      if (fetchError) {
        return { code: 500, msg: fetchError.message, data: { migrated: 0, errors: [fetchError.message] } }
      }

      if (!matches || matches.length === 0) {
        return { code: 200, msg: '没有需要迁移的数据', data: { migrated: 0, errors: [] } }
      }

      console.log(`开始迁移 ${matches.length} 条 match 记录...`)

      // 2. 准备维度值数据
      const dimensionValues: Array<{
        match_id: number
        dimension_key: string
        value: unknown
        source: string
        source_detail: Record<string, unknown>
      }> = []

      for (const match of matches) {
        const matchId = match.id
        const hardware = match.hardware as Record<string, unknown> | null
        const software = match.software as Record<string, unknown> | null
        
        // 迁移 hardware 字段
        if (hardware && typeof hardware === 'object') {
          for (const [field, mapping] of Object.entries(hardwareToDimensionMap)) {
            const value = hardware[field]
            if (value === undefined || value === null || value === '') continue
            
            const transformedValue = mapping.transform ? mapping.transform(value) : value
            if (transformedValue === null || transformedValue === undefined) continue
            
            dimensionValues.push({
              match_id: matchId,
              dimension_key: mapping.dimensionKey,
              value: transformedValue,
              source: 'migration',
              source_detail: {
                from_field: `hardware.${field}`,
                original_value: value,
                migrated_at: new Date().toISOString()
              }
            })
          }
        }

        // 迁移 software 字段
        if (software && typeof software === 'object') {
          for (const [field, mapping] of Object.entries(softwareToDimensionMap)) {
            const value = software[field]
            if (value === undefined || value === null || value === '') continue
            
            const transformedValue = mapping.transform ? mapping.transform(value) : value
            if (transformedValue === null || transformedValue === undefined) continue
            
            // 对于 hobbies，需要合并 interests 和 hobbies
            if (mapping.dimensionKey === 'hobbies') {
              const existingIndex = dimensionValues.findIndex(
                dv => dv.match_id === matchId && dv.dimension_key === 'hobbies'
              )
              
              if (existingIndex >= 0) {
                const existingValue = dimensionValues[existingIndex].value as string[]
                const newValue = transformedValue as string[]
                dimensionValues[existingIndex].value = [...new Set([...existingValue, ...newValue])]
              } else {
                dimensionValues.push({
                  match_id: matchId,
                  dimension_key: mapping.dimensionKey,
                  value: transformedValue,
                  source: 'migration',
                  source_detail: {
                    from_field: `software.${field}`,
                    original_value: value,
                    migrated_at: new Date().toISOString()
                  }
                })
              }
            } else {
              dimensionValues.push({
                match_id: matchId,
                dimension_key: mapping.dimensionKey,
                value: transformedValue,
                source: 'migration',
                source_detail: {
                  from_field: `software.${field}`,
                  original_value: value,
                  migrated_at: new Date().toISOString()
                }
              })
            }
          }
        }
      }

      console.log(`准备插入 ${dimensionValues.length} 条维度值记录...`)

      // 3. 批量插入维度值
      if (dimensionValues.length > 0) {
        // 先删除已有的迁移数据
        await supabase
          .from('profile_dimension_values')
          .delete()
          .eq('source', 'migration')

        // 插入新数据
        const { error: insertError } = await supabase
          .from('profile_dimension_values')
          .insert(dimensionValues)

        if (insertError) {
          errors.push(`插入失败: ${insertError.message}`)
          console.error('插入失败:', insertError)
        } else {
          migrated = dimensionValues.length
          console.log(`成功迁移 ${migrated} 条维度值`)
        }
      }

      return {
        code: errors.length === 0 ? 200 : 500,
        msg: errors.length === 0 ? 'success' : '部分失败',
        data: { migrated, errors }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error('迁移失败:', errorMsg)
      errors.push(errorMsg)
      return { code: 500, msg: errorMsg, data: { migrated, errors } }
    }
  }
}
