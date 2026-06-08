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
  risingZodiac: {
    dimensionKey: 'risingZodiac',
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
  communicationStyleOnline: {
    dimensionKey: 'communicationStyleOnline',
    transform: (value) => {
      const styleMap: Record<string, string> = {
        '直接坦率': 'direct', 'direct': 'direct',
        '委婉含蓄': 'indirect', 'indirect': 'indirect',
        '活泼调皮': 'playful', 'playful': 'playful',
        '温柔体贴': 'gentle', 'gentle': 'gentle',
        '理性冷静': 'rational', 'rational': 'rational',
        '因人而异': 'varied', 'varied': 'varied'
      }
      return styleMap[String(value)] || 'varied'
    }
  },
  communicationStyleOffline: {
    dimensionKey: 'communicationStyleOffline',
    transform: (value) => {
      const styleMap: Record<string, string> = {
        '直接坦率': 'direct', 'direct': 'direct',
        '委婉含蓄': 'indirect', 'indirect': 'indirect',
        '活泼调皮': 'playful', 'playful': 'playful',
        '温柔体贴': 'gentle', 'gentle': 'gentle',
        '理性冷静': 'rational', 'rational': 'rational',
        '因人而异': 'varied', 'varied': 'varied'
      }
      return styleMap[String(value)] || 'varied'
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

// 反向映射：维度 key → hardware/software 字段
const dimensionToHardwareMap: Record<string, {
  field: string
  transform?: (value: unknown) => unknown
}> = {
  birthYear: {
    field: 'age',
    transform: (value) => {
      const birthYear = Number(value)
      if (isNaN(birthYear) || birthYear <= 0) return null
      const currentYear = new Date().getFullYear()
      return currentYear - birthYear
    }
  },
  height: {
    field: 'height',
    transform: (value) => `${value}cm`
  },
  zodiac: {
    field: 'zodiac',
    transform: (value) => {
      const zodiacLabels: Record<string, string> = {
        'aries': '白羊座', 'taurus': '金牛座', 'gemini': '双子座', 'cancer': '巨蟹座',
        'leo': '狮子座', 'virgo': '处女座', 'libra': '天秤座', 'scorpio': '天蝎座',
        'sagittarius': '射手座', 'capricorn': '摩羯座', 'aquarius': '水瓶座', 'pisces': '双鱼座'
      }
      return zodiacLabels[String(value)] || String(value)
    }
  },
  risingZodiac: {
    field: 'risingZodiac',
    transform: (value) => {
      const zodiacLabels: Record<string, string> = {
        'aries': '白羊座', 'taurus': '金牛座', 'gemini': '双子座', 'cancer': '巨蟹座',
        'leo': '狮子座', 'virgo': '处女座', 'libra': '天秤座', 'scorpio': '天蝎座',
        'sagittarius': '射手座', 'capricorn': '摩羯座', 'aquarius': '水瓶座', 'pisces': '双鱼座'
      }
      return zodiacLabels[String(value)] || String(value)
    }
  },
  bloodType: { field: 'bloodType' },
  bodyType: {
    field: 'bodyType',
    transform: (value) => {
      const bodyTypeLabels: Record<string, string> = {
        'slim': '偏瘦', 'average': '匀称', 'athletic': '健壮', 'curvy': '丰满', 'plump': '偏胖'
      }
      return bodyTypeLabels[String(value)] || String(value)
    }
  },
  appearance: { field: 'style' },
  currentCity: { field: 'location' },
  occupation: { field: 'occupation' },
  company: { field: 'company' }
}

const dimensionToSoftwareMap: Record<string, {
  field: string
  transform?: (value: unknown) => unknown
}> = {
  mbti: { field: 'mbti' },
  coreTemperament: { field: 'personality' },
  emotionalExpressionStyle: {
    field: 'emotionalStyle',
    transform: (value) => {
      const styleLabels: Record<string, string> = {
        'expressive': '直接表达', 'reserved': '含蓄内敛', 'selective': '因人而异', 'avoidant': '回避表达'
      }
      return styleLabels[String(value)] || String(value)
    }
  },
  hobbies: { field: 'interests' },
  moneyPhilosophy: {
    field: 'spendingStyle',
    transform: (value) => {
      const styleLabels: Record<string, string> = {
        'frugal': '节俭', 'balanced': '平衡', 'enjoyment': '享受当下', 'investor': '投资导向'
      }
      return styleLabels[String(value)] || String(value)
    }
  },
  communicationStyle: {
    field: 'communicationStyle',
    transform: (value) => {
      const styleLabels: Record<string, string> = {
        'direct': '直接坦率', 'indirect': '委婉含蓄', 'balanced': '因人而异'
      }
      return styleLabels[String(value)] || String(value)
    }
  },
  communicationStyleOnline: {
    field: 'communicationStyleOnline',
    transform: (value) => {
      const styleLabels: Record<string, string> = {
        'direct': '直接坦率', 'indirect': '委婉含蓄', 'playful': '活泼调皮',
        'gentle': '温柔体贴', 'rational': '理性冷静', 'varied': '因人而异'
      }
      return styleLabels[String(value)] || String(value)
    }
  },
  communicationStyleOffline: {
    field: 'communicationStyleOffline',
    transform: (value) => {
      const styleLabels: Record<string, string> = {
        'direct': '直接坦率', 'indirect': '委婉含蓄', 'playful': '活泼调皮',
        'gentle': '温柔体贴', 'rational': '理性冷静', 'varied': '因人而异'
      }
      return styleLabels[String(value)] || String(value)
    }
  },
  marriageNonNegotiables: { field: 'dealBreakers' },
  loveLanguage: { field: 'loveLanguages' }
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
   * 支持根据关系类型筛选维度
   */
  async getMatchDimensionsWithDefinitions(
    matchId: number,
    relationshipType?: 'long_term' | 'short_term' | 'both' | 'undefined'
  ): Promise<{ 
    code: number; 
    msg: string; 
    data: {
      dimensions: Record<string, { definition: DimensionDefinition; value: DimensionValue | null }>
      completeness: { layer: number; completeness: number }[]
      applicableCount: number  // 适用的维度数量
      filledCount: number      // 已填写的维度数量
    }
  }> {
    try {
      const supabase = getSupabaseClient()
      
      // 构建维度定义查询
      let defQuery = supabase
        .from('dimension_definitions')
        .select('*')
        .eq('is_active', true)

      // 根据关系类型筛选维度
      // - long_term: 显示 universal + long_term
      // - short_term: 显示 universal + short_term
      // - both: 显示所有维度（universal + long_term + short_term）
      // - undefined: 显示 universal 维度（默认）
      if (relationshipType === 'long_term') {
        defQuery = defQuery.in('relationship_applicability', ['universal', 'long_term'])
      } else if (relationshipType === 'short_term') {
        defQuery = defQuery.in('relationship_applicability', ['universal', 'short_term'])
      } else if (relationshipType === 'both') {
        // 显示所有维度，不需要额外筛选
      } else {
        // undefined 或默认情况，只显示 universal
        defQuery = defQuery.eq('relationship_applicability', 'universal')
      }

      defQuery = defQuery.order('layer').order('sort_order')

      // 获取维度定义
      const { data: definitions, error: defError } = await defQuery

      if (defError) {
        return { code: 500, msg: defError.message, data: { dimensions: {}, completeness: [], applicableCount: 0, filledCount: 0 } }
      }

      // 获取维度值
      const { data: values, error: valError } = await supabase
        .from('profile_dimension_values')
        .select('*')
        .eq('match_id', matchId)

      if (valError) {
        return { code: 500, msg: valError.message, data: { dimensions: {}, completeness: [], applicableCount: 0, filledCount: 0 } }
      }

      // 组合数据
      const dimensionsMap: Record<string, { definition: DimensionDefinition; value: DimensionValue | null }> = {}
      const valueMap = new Map(values?.map(v => [v.dimension_key, v]))
      let filledCount = 0

      for (const def of definitions || []) {
        const hasValue = valueMap.has(def.dimension_key)
        if (hasValue) filledCount++
        
        dimensionsMap[def.dimension_key] = {
          definition: def as DimensionDefinition,
          value: hasValue ? valueMap.get(def.dimension_key)! : null
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
          completeness,
          applicableCount: definitions?.length || 0,
          filledCount
        }
      }
    } catch (err) {
      console.error('获取维度数据异常:', err)
      return { code: 500, msg: String(err), data: { dimensions: {}, completeness: [], applicableCount: 0, filledCount: 0 } }
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

      // 同步更新 hardware/software 字段
      await this.syncDimensionToHardwareSoftware(matchId, dimensionKey, body.value)

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

  /**
   * 同步维度值到 hardware/software 字段
   * 当维度值变更时，自动更新对应的 hardware/software 字段
   */
  private async syncDimensionToHardwareSoftware(
    matchId: number,
    dimensionKey: string,
    value: unknown
  ): Promise<void> {
    try {
      const supabase = getSupabaseClient()
      
      // 检查是否是 hardware 字段
      const hardwareMapping = dimensionToHardwareMap[dimensionKey]
      // 检查是否是 software 字段
      const softwareMapping = dimensionToSoftwareMap[dimensionKey]

      if (!hardwareMapping && !softwareMapping) {
        // 不是需要同步的维度
        return
      }

      // 获取当前 match 的 hardware/software
      const { data: match } = await supabase
        .from('matches')
        .select('hardware, software')
        .eq('id', matchId)
        .single()

      if (!match) {
        console.error(`Match ${matchId} not found`)
        return
      }

      const updateData: { hardware?: Record<string, unknown>; software?: Record<string, unknown> } = {}

      if (hardwareMapping) {
        const hardware = (match.hardware as Record<string, unknown>) || {}
        const transformedValue = hardwareMapping.transform ? hardwareMapping.transform(value) : value
        updateData.hardware = {
          ...hardware,
          [hardwareMapping.field]: transformedValue
        }
      }

      if (softwareMapping) {
        const software = (match.software as Record<string, unknown>) || {}
        const transformedValue = softwareMapping.transform ? softwareMapping.transform(value) : value
        updateData.software = {
          ...software,
          [softwareMapping.field]: transformedValue
        }
      }

      // 更新 match
      const { error: updateError } = await supabase
        .from('matches')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', matchId)

      if (updateError) {
        console.error(`同步维度值到 hardware/software 失败:`, updateError)
      } else {
        console.log(`已同步维度 ${dimensionKey} 到 match ${matchId}`)
      }
    } catch (err) {
      console.error('同步维度值异常:', err)
    }
  }

  /**
   * 批量同步维度值到 hardware/software
   * 从 hardware/software 数据更新维度值
   */
  async syncFromHardwareSoftware(matchId: number): Promise<{ code: number; msg: string; data: { synced: number } }> {
    try {
      const supabase = getSupabaseClient()
      
      const { data: match } = await supabase
        .from('matches')
        .select('hardware, software')
        .eq('id', matchId)
        .single()

      if (!match) {
        return { code: 404, msg: 'Match not found', data: { synced: 0 } }
      }

      const hardware = match.hardware as Record<string, unknown> || {}
      const software = match.software as Record<string, unknown> || {}
      let synced = 0

      // 同步 hardware 字段
      for (const [field, mapping] of Object.entries(hardwareToDimensionMap)) {
        const value = hardware[field]
        if (value === undefined || value === null || value === '') continue

        const transformedValue = mapping.transform ? mapping.transform(value) : value
        if (transformedValue === null || transformedValue === undefined) continue

        await this.setDimensionValue(matchId, mapping.dimensionKey, {
          value: transformedValue,
          source: 'hardware_software_sync'
        })
        synced++
      }

      // 同步 software 字段
      for (const [field, mapping] of Object.entries(softwareToDimensionMap)) {
        const value = software[field]
        if (value === undefined || value === null || value === '') continue

        const transformedValue = mapping.transform ? mapping.transform(value) : value
        if (transformedValue === null || transformedValue === undefined) continue

        await this.setDimensionValue(matchId, mapping.dimensionKey, {
          value: transformedValue,
          source: 'hardware_software_sync'
        })
        synced++
      }

      return { code: 200, msg: 'success', data: { synced } }
    } catch (err) {
      console.error('同步 hardware/software 到维度值异常:', err)
      return { code: 500, msg: String(err), data: { synced: 0 } }
    }
  }

  /**
   * 更新维度定义的枚举选项
   * 从本地 dimension-definitions.ts 同步 enum_options 到数据库
   */
  async updateDimensionEnumOptions(): Promise<{ code: number; msg: string; data: { updated: number; errors: string[] } }> {
    try {
      const supabase = getSupabaseClient()
      const errors: string[] = []
      let updated = 0

      // 获取需要更新的维度定义（有 enum_options 的）
      const dimensionsWithEnums = allDimensions.filter(d => d.enum_options && d.enum_options.length > 0)

      console.log(`准备更新 ${dimensionsWithEnums.length} 个维度定义的枚举选项...`)

      for (const dim of dimensionsWithEnums) {
        const { error } = await supabase
          .from('dimension_definitions')
          .update({
            enum_options: dim.enum_options,
            input_type: dim.input_type,
            data_type: dim.data_type,
            description: dim.description,
            help_text: dim.help_text,
            placeholder: dim.placeholder,
            updated_at: new Date().toISOString()
          })
          .eq('dimension_key', dim.dimension_key)

        if (error) {
          errors.push(`${dim.dimension_key}: ${error.message}`)
          console.error(`更新 ${dim.dimension_key} 失败:`, error)
        } else {
          updated++
        }
      }

      console.log(`成功更新 ${updated} 个维度定义的枚举选项`)

      return {
        code: errors.length === 0 ? 200 : 500,
        msg: errors.length === 0 ? 'success' : '部分更新失败',
        data: { updated, errors }
      }
    } catch (err) {
      console.error('更新维度枚举选项异常:', err)
      return { code: 500, msg: String(err), data: { updated: 0, errors: [String(err)] } }
    }
  }

  /**
   * 创建自定义维度定义
   */
  async createCustomDimension(body: {
    display_name: string
    description?: string
    category?: string
    data_type: string
    input_type?: string
    enum_options?: Array<{ value: string; label: string }>
    validation_rules?: { min?: number; max?: number; pattern?: string; required?: boolean }
    placeholder?: string
    help_text?: string
    importance?: string
  }): Promise<{ code: number; msg: string; data: DimensionDefinition | null }> {
    try {
      const supabase = getSupabaseClient()

      // 生成 dimension_key: custom_{timestamp}_{random}
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 6)
      const dimensionKey = `custom_${timestamp}_${random}`

      // 自定义维度使用独立层级 layer=6，与系统层级平级展示
      const newDef = {
        dimension_key: dimensionKey,
        display_name: body.display_name,
        description: body.description || null,
        layer: 6,
        category: body.category || 'custom',
        subcategory: null,
        data_type: body.data_type || 'string',
        enum_options: body.enum_options || null,
        validation_rules: body.validation_rules || null,
        default_value: null,
        input_type: body.input_type || 'text',
        placeholder: body.placeholder || null,
        help_text: body.help_text || null,
        icon: null,
        weight: 1.00,
        importance: body.importance || 'optional',
        source_allowed: ['manual'],
        sort_order: 9999,
        is_active: true,
        is_custom: true,
        relationship_applicability: 'universal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('dimension_definitions')
        .insert(newDef)
        .select()
        .single()

      if (error) {
        console.error('创建自定义维度失败:', error)
        return { code: 500, msg: error.message, data: null }
      }

      return { code: 200, msg: 'success', data }
    } catch (err) {
      console.error('创建自定义维度异常:', err)
      return { code: 500, msg: String(err), data: null }
    }
  }

  /**
   * 更新自定义维度定义
   */
  async updateCustomDimension(
    dimensionKey: string,
    body: {
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
    try {
      const supabase = getSupabaseClient()

      // 验证是自定义维度
      const { data: existing } = await supabase
        .from('dimension_definitions')
        .select('is_custom')
        .eq('dimension_key', dimensionKey)
        .single()

      if (!existing) {
        return { code: 404, msg: '维度定义不存在', data: null }
      }

      if (!existing.is_custom) {
        return { code: 403, msg: '系统维度不允许修改', data: null }
      }

      const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
      if (body.display_name !== undefined) updateData.display_name = body.display_name
      if (body.description !== undefined) updateData.description = body.description
      if (body.data_type !== undefined) updateData.data_type = body.data_type
      if (body.input_type !== undefined) updateData.input_type = body.input_type
      if (body.enum_options !== undefined) updateData.enum_options = body.enum_options
      if (body.validation_rules !== undefined) updateData.validation_rules = body.validation_rules
      if (body.placeholder !== undefined) updateData.placeholder = body.placeholder
      if (body.help_text !== undefined) updateData.help_text = body.help_text
      if (body.importance !== undefined) updateData.importance = body.importance

      const { data, error } = await supabase
        .from('dimension_definitions')
        .update(updateData)
        .eq('dimension_key', dimensionKey)
        .select()
        .single()

      if (error) {
        console.error('更新自定义维度失败:', error)
        return { code: 500, msg: error.message, data: null }
      }

      return { code: 200, msg: 'success', data }
    } catch (err) {
      console.error('更新自定义维度异常:', err)
      return { code: 500, msg: String(err), data: null }
    }
  }

  /**
   * 删除自定义维度定义（同时删除关联的维度值）
   */
  async deleteCustomDimension(dimensionKey: string): Promise<{ code: number; msg: string }> {
    try {
      const supabase = getSupabaseClient()

      // 验证是自定义维度
      const { data: existing } = await supabase
        .from('dimension_definitions')
        .select('is_custom')
        .eq('dimension_key', dimensionKey)
        .single()

      if (!existing) {
        return { code: 404, msg: '维度定义不存在' }
      }

      if (!existing.is_custom) {
        return { code: 403, msg: '系统维度不允许删除' }
      }

      // 删除关联的维度值
      await supabase
        .from('profile_dimension_values')
        .delete()
        .eq('dimension_key', dimensionKey)

      // 删除维度定义
      const { error } = await supabase
        .from('dimension_definitions')
        .delete()
        .eq('dimension_key', dimensionKey)

      if (error) {
        console.error('删除自定义维度失败:', error)
        return { code: 500, msg: error.message }
      }

      return { code: 200, msg: 'success' }
    } catch (err) {
      console.error('删除自定义维度异常:', err)
      return { code: 500, msg: String(err) }
    }
  }
}
