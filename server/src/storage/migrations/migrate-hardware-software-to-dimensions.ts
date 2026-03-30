/**
 * 数据迁移脚本：将 matches.hardware/software 迁移到维度值表
 * 
 * 字段映射关系：
 * 
 * Hardware → Layer 1 维度:
 * - age → birthYear (需要计算: currentYear - age)
 * - height → height
 * - birthday → (保留在 hardware，可后续提取到 keyInfo)
 * - zodiac → zodiac
 * - bloodType → bloodType
 * - bodyType → bodyType
 * - style → appearance
 * - location → currentCity
 * - occupation → occupation
 * - company → company
 * - position → jobLevel
 * 
 * Software → Layer 2/3 维度:
 * - mbti → mbti
 * - personality → (映射到 personality 相关维度)
 * - emotionalStyle → emotionalExpressionStyle
 * - interests → hobbies
 * - hobbies → hobbies (合并)
 * - schedule → (映射到 lifestyle 相关)
 * - spendingStyle → moneyPhilosophy
 * - communicationStyle → communicationStyle
 * - likes → (可映射到 preferences)
 * - dislikes → (可映射到 preferences)
 * - dealBreakers → marriageNonNegotiables
 * - loveLanguages → loveLanguage
 * - communicationPreferences → communicationStyle 相关
 */

import { getSupabaseClient } from '../database/supabase-client'

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
      // 处理 "170cm" 或 "170" 格式
      const str = String(value).replace(/[^0-9]/g, '')
      const num = parseInt(str, 10)
      return isNaN(num) ? null : num
    }
  },
  zodiac: {
    dimensionKey: 'zodiac',
    transform: (value) => {
      // 中文星座转英文 key
      const zodiacMap: Record<string, string> = {
        '白羊座': 'aries', '金牛': 'taurus', '双子座': 'gemini', '巨蟹': 'cancer',
        '狮子座': 'leo', '处女': 'virgo', '天秤': 'libra', '天蝎': 'scorpio',
        '射手': 'sagittarius', '摩羯': 'capricorn', '水瓶': 'aquarius', '双鱼': 'pisces',
        // 英文
        'aries': 'aries', 'taurus': 'taurus', 'gemini': 'gemini', 'cancer': 'cancer',
        'leo': 'leo', 'virgo': 'virgo', 'libra': 'libra', 'scorpio': 'scorpio',
        'sagittarius': 'sagittarius', 'capricorn': 'capricorn', 'aquarius': 'aquarius', 'pisces': 'pisces'
      }
      return zodiacMap[String(value)] || String(value).toLowerCase()
    }
  },
  bloodType: {
    dimensionKey: 'bloodType',
    transform: (value) => {
      const str = String(value).toUpperCase()
      if (['A', 'B', 'AB', 'O'].includes(str)) return str
      // 处理 "A型" 格式
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
  },
  position: {
    dimensionKey: 'jobLevel'
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
      // 验证是否为有效的 MBTI
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

interface MatchRecord {
  id: number
  name: string
  gender: string
  hardware: Record<string, unknown>
  software: Record<string, unknown>
}

interface DimensionValueInsert {
  match_id: number
  dimension_key: string
  value: unknown
  source: string
  source_detail: Record<string, unknown>
}

/**
 * 执行数据迁移
 */
export async function migrateHardwareSoftwareToDimensions(): Promise<{
  success: boolean
  migrated: number
  errors: string[]
}> {
  const client = getSupabaseClient()
  const errors: string[] = []
  let migrated = 0

  try {
    // 1. 获取所有 matches 记录
    const { data: matches, error: fetchError } = await client
      .from('matches')
      .select('id, name, gender, hardware, software')

    if (fetchError) {
      throw new Error(`获取 matches 数据失败: ${fetchError.message}`)
    }

    if (!matches || matches.length === 0) {
      console.log('没有需要迁移的数据')
      return { success: true, migrated: 0, errors: [] }
    }

    console.log(`开始迁移 ${matches.length} 条 match 记录...`)

    // 2. 准备维度值数据
    const dimensionValues: DimensionValueInsert[] = []

    for (const match of matches as MatchRecord[]) {
      const matchId = match.id
      
      // 迁移 hardware 字段
      if (match.hardware && typeof match.hardware === 'object') {
        for (const [field, mapping] of Object.entries(hardwareToDimensionMap)) {
          const value = match.hardware[field]
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
      if (match.software && typeof match.software === 'object') {
        for (const [field, mapping] of Object.entries(softwareToDimensionMap)) {
          const value = match.software[field]
          if (value === undefined || value === null || value === '') continue
          
          const transformedValue = mapping.transform ? mapping.transform(value) : value
          if (transformedValue === null || transformedValue === undefined) continue
          
          // 对于 hobbies，需要合并 interests 和 hobbies
          if (mapping.dimensionKey === 'hobbies') {
            const existingIndex = dimensionValues.findIndex(
              dv => dv.match_id === matchId && dv.dimension_key === 'hobbies'
            )
            
            if (existingIndex >= 0) {
              // 合并数组
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

    // 3. 批量插入维度值（使用 upsert 避免重复）
    const batchSize = 100
    for (let i = 0; i < dimensionValues.length; i += batchSize) {
      const batch = dimensionValues.slice(i, i + batchSize)
      
      // 先删除已有的迁移数据
      const matchIds = [...new Set(batch.map(dv => dv.match_id))]
      const dimensionKeys = [...new Set(batch.map(dv => dv.dimension_key))]
      
      await client
        .from('profile_dimension_values')
        .delete()
        .in('match_id', matchIds)
        .in('dimension_key', dimensionKeys)
        .eq('source', 'migration')

      // 插入新数据
      const { error: insertError } = await client
        .from('profile_dimension_values')
        .insert(batch)

      if (insertError) {
        errors.push(`批次 ${Math.floor(i / batchSize) + 1} 插入失败: ${insertError.message}`)
        console.error(`批次插入失败:`, insertError)
      } else {
        migrated += batch.length
        console.log(`已迁移 ${migrated}/${dimensionValues.length} 条记录`)
      }
    }

    console.log(`迁移完成! 成功: ${migrated}, 错误: ${errors.length}`)
    
    return {
      success: errors.length === 0,
      migrated,
      errors
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('迁移失败:', errorMsg)
    errors.push(errorMsg)
    return { success: false, migrated, errors }
  }
}

/**
 * 验证迁移结果
 */
export async function verifyMigration(): Promise<{
  totalMatches: number
  matchesWithDimensions: number
  dimensionValueCount: number
  sampleData: Array<{ match_id: number; dimension_key: string; value: unknown }>
}> {
  const client = getSupabaseClient()

  // 统计 matches 总数
  const { count: totalMatches } = await client
    .from('matches')
    .select('*', { count: 'exact', head: true })

  // 统计有维度值的 matches 数量
  const { data: matchesWithDimensions } = await client
    .from('profile_dimension_values')
    .select('match_id')
    .eq('source', 'migration')

  const uniqueMatchIds = new Set(matchesWithDimensions?.map(d => d.match_id) || [])

  // 统计维度值总数
  const { count: dimensionValueCount } = await client
    .from('profile_dimension_values')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'migration')

  // 获取样本数据
  const { data: sampleData } = await client
    .from('profile_dimension_values')
    .select('match_id, dimension_key, value')
    .eq('source', 'migration')
    .limit(10)

  return {
    totalMatches: totalMatches || 0,
    matchesWithDimensions: uniqueMatchIds.size,
    dimensionValueCount: dimensionValueCount || 0,
    sampleData: sampleData || []
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  ;(async () => {
    console.log('开始执行数据迁移...')
    const result = await migrateHardwareSoftwareToDimensions()
    console.log('迁移结果:', result)
    
    if (result.success) {
      console.log('\n验证迁移结果...')
      const verification = await verifyMigration()
      console.log('验证结果:', verification)
    }
  })()
}
