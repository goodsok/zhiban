import { getSupabaseClient } from '@/storage/database/supabase-client'

// 激素周期知识库服务

export interface HormoneCycleKnowledge {
  id: number
  phase_key: string
  phase_name: string
  day_range: string
  description: string | null
  hormone_status: Record<string, string>
  characteristics: {
    emotion?: string
    thinking?: string
    social?: string
    body?: string
    libido?: string
    appearance?: string
  }
  recommendations: {
    best_actions?: string[]
    avoid_actions?: string[]
    self_care?: string[]
  } | null
  partner_tips: string | null
  sort_order: number
  created_at: string
  updated_at: string | null
}

export interface HormoneInfo {
  id: number
  hormone_key: string
  hormone_name: string
  english_name: string | null
  source: string | null
  function: string | null
  male_comparison: string | null
  sort_order: number
  created_at: string
  updated_at: string | null
}

/**
 * 获取所有激素周期知识
 */
export async function getAllHormoneCycleKnowledge(): Promise<HormoneCycleKnowledge[]> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('hormone_cycle_knowledge')
    .select('*')
    .order('sort_order', { ascending: true })
  
  if (error) throw new Error(`获取激素周期知识失败: ${error.message}`)
  return data as HormoneCycleKnowledge[]
}

/**
 * 根据阶段标识获取知识
 */
export async function getHormoneCycleKnowledgeByPhase(phaseKey: string): Promise<HormoneCycleKnowledge | null> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('hormone_cycle_knowledge')
    .select('*')
    .eq('phase_key', phaseKey)
    .maybeSingle()
  
  if (error) throw new Error(`获取激素周期知识失败: ${error.message}`)
  return data as HormoneCycleKnowledge | null
}

/**
 * 获取所有激素信息
 */
export async function getAllHormoneInfo(): Promise<HormoneInfo[]> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('hormone_info')
    .select('*')
    .order('sort_order', { ascending: true })
  
  if (error) throw new Error(`获取激素信息失败: ${error.message}`)
  return data as HormoneInfo[]
}

/**
 * 根据激素标识获取信息
 */
export async function getHormoneInfoByKey(hormoneKey: string): Promise<HormoneInfo | null> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('hormone_info')
    .select('*')
    .eq('hormone_key', hormoneKey)
    .maybeSingle()
  
  if (error) throw new Error(`获取激素信息失败: ${error.message}`)
  return data as HormoneInfo | null
}

/**
 * 根据周期天数获取当前阶段知识
 * @param cycleDay 周期天数 (1-28)
 */
export async function getHormoneCycleKnowledgeByDay(cycleDay: number): Promise<HormoneCycleKnowledge | null> {
  const all = await getAllHormoneCycleKnowledge()
  
  for (const knowledge of all) {
    const [start, end] = knowledge.day_range.split('-').map(Number)
    if (cycleDay >= start && cycleDay <= end) {
      return knowledge
    }
  }
  
  return null
}
