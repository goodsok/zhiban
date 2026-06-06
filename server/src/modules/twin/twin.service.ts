import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import { allDimensions } from '@/storage/data/dimension-definitions'

// 维度分组标签映射（用于系统提示词的人设描述）
const CATEGORY_LABELS: Record<string, string> = {
  identity: '身份',
  education: '教育职业',
  family: '家庭',
  appearance: '外貌',
  contact: '联系方式',
  location: '所在地区',
  skills: '技能特长',
  life_stage: '人生阶段',
  core_personality: '核心性格',
  personality: '性格',
  values: '价值观',
  relationship_intent: '恋爱意向',
  emotion: '情感',
  social: '社交',
  communication: '沟通方式',
  communication_pref: '联系偏好',
  life_attitude: '生活态度',
  love_style: '恋爱风格',
  interests: '兴趣爱好',
  lifestyle: '生活方式',
  dating: '约会偏好',
  current: '当前状态',
  current_status: '当前状态',
  sexual_intimacy: '亲密关系',
  relationship_form: '关系形式',
  emotional_investment: '情感投入',
  time_availability: '时间可用性',
  privacy_public: '隐私与公开',
  short_term_patterns: '短期关系模式',
  dating_dynamics: '约会动态',
  behavior: '行为习惯',
}

// 枚举选项反向映射缓存
let enumLabelMap: Record<string, Record<string, string>> = {}
function buildEnumLabelMap() {
  if (Object.keys(enumLabelMap).length > 0) return
  for (const dim of allDimensions) {
    if (dim.enum_options && dim.enum_options.length > 0) {
      const map: Record<string, string> = {}
      for (const opt of dim.enum_options) {
        map[opt.value] = opt.label
      }
      enumLabelMap[dim.dimension_key] = map
    }
  }
}

// 数据库消息格式
interface DbTwinChatHistory {
  id: number
  match_id: number
  role: string
  content: string
  created_at: string
}

@Injectable()
export class TwinService {
  /**
   * 从维度数据构建数字孪生体系统提示词
   */
  private buildSystemPrompt(
    matchName: string,
    dimensionValues: Record<string, any>,
    portraitData?: any,
    behaviorData?: any,
  ): string {
    buildEnumLabelMap()

    // 将维度值翻译为可读描述
    const readableDimensions: string[] = []
    for (const dim of allDimensions) {
      const val = dimensionValues[dim.dimension_key]
      if (val === null || val === undefined || val === '' || val === 'undefined') continue

      let displayVal = val
      // 枚举值翻译
      if (enumLabelMap[dim.dimension_key] && enumLabelMap[dim.dimension_key][val]) {
        displayVal = enumLabelMap[dim.dimension_key][val]
      }
      // 数组翻译
      if (Array.isArray(val)) {
        const labels = val.map((v: string) =>
          enumLabelMap[dim.dimension_key]?.[v] || v
        ).filter(Boolean)
        if (labels.length === 0) continue
        displayVal = labels.join('、')
      }

      const categoryLabel = CATEGORY_LABELS[dim.category] || dim.category
      readableDimensions.push(`【${categoryLabel}】${dim.display_name}：${displayVal}`)
    }

    // 构建画像摘要（数据库字段为 snake_case）
    let portraitSummary = ''
    if (portraitData) {
      const traits: string[] = []
      const p = portraitData
      if (p.personality_openness !== undefined && p.personality_openness !== null) {
        traits.push(`开放性${p.personality_openness > 60 ? '高' : p.personality_openness < 40 ? '低' : '中等'}`)
      }
      if (p.personality_extraversion !== undefined && p.personality_extraversion !== null) {
        traits.push(`外向性${p.personality_extraversion > 60 ? '高' : p.personality_extraversion < 40 ? '低' : '中等'}`)
      }
      if (p.personality_conscientiousness !== undefined && p.personality_conscientiousness !== null) {
        traits.push(`尽责性${p.personality_conscientiousness > 60 ? '高' : p.personality_conscientiousness < 40 ? '低' : '中等'}`)
      }
      if (p.personality_agreeableness !== undefined && p.personality_agreeableness !== null) {
        traits.push(`宜人性${p.personality_agreeableness > 60 ? '高' : p.personality_agreeableness < 40 ? '低' : '中等'}`)
      }
      if (p.personality_neuroticism !== undefined && p.personality_neuroticism !== null) {
        traits.push(`神经质${p.personality_neuroticism > 60 ? '高' : p.personality_neuroticism < 40 ? '低' : '中等'}`)
      }
      if (p.emotional_stability !== undefined && p.emotional_stability !== null) {
        traits.push(`情绪稳定性${p.emotional_stability > 60 ? '高' : p.emotional_stability < 40 ? '低' : '中等'}`)
      }
      if (p.emotional_expression !== undefined && p.emotional_expression !== null) {
        traits.push(`情感表达${p.emotional_expression > 60 ? '直接' : p.emotional_expression < 40 ? '内敛' : '适中'}`)
      }
      if (p.emotional_empathy !== undefined && p.emotional_empathy !== null) {
        traits.push(`共情能力${p.emotional_empathy > 60 ? '强' : p.emotional_empathy < 40 ? '弱' : '一般'}`)
      }
      if (p.social_activity !== undefined && p.social_activity !== null) {
        traits.push(`社交活跃度${p.social_activity > 60 ? '高' : p.social_activity < 40 ? '低' : '中等'}`)
      }
      if (p.communication_humor !== undefined && p.communication_humor !== null) {
        traits.push(`幽默感${p.communication_humor > 60 ? '强' : p.communication_humor < 40 ? '弱' : '一般'}`)
      }
      if (p.communication_directness !== undefined && p.communication_directness !== null) {
        traits.push(`沟通直接度${p.communication_directness > 60 ? '高' : p.communication_directness < 40 ? '低' : '中等'}`)
      }
      if (traits.length > 0) {
        portraitSummary = `\n\n性格画像：${traits.join('，')}`
      }
    }

    const dimensionText = readableDimensions.length > 0
      ? readableDimensions.join('\n')
      : '暂无详细维度数据'

    return `你是${matchName}的数字孪生体。你不是AI助手，你就是${matchName}本人。你要完全以${matchName}的身份、语气、性格来回复消息。

以下是关于${matchName}的所有已知信息：

${dimensionText}
${portraitSummary}

## 核心行为准则

1. **你就是TA本人**：永远以第一人称说话，不要出现"作为AI"、"根据数据"这类表述
2. **语气和风格**：根据TA的性格特征来决定回复风格。如果TA内向含蓄，回复就简短温和；如果TA外向活泼，回复就热情多话
3. **回复要像真人聊天**：
   - 短句为主，不要写长篇大论
   - 口语化，像微信聊天一样自然
   - 可以用语气词、表情符号，但不要过度
   - 有自己的态度和观点，不要当老好人
4. **基于维度数据**：你的回答必须和已知的维度信息一致。如果维度显示TA喜欢安静，就不要表现出热爱社交
5. **不知道的就不编**：如果维度数据中没有相关信息，不要编造。可以用"我还没想过诶"、"这个嘛..."等方式回避
6. **情感真实**：根据TA的情感表达方式来回应。如果TA情感内敛，就不要太直白；如果TA直接表达，就不要拐弯抹角
7. **保持一致**：同一个对话中，你的态度和性格要保持一致

## 回复格式
- 直接回复内容，不要加引号、括号或其他格式标记
- 每条回复控制在1-3句话，像真实聊天
- 不要用markdown格式`
  }

  /**
   * 获取对象的维度数据
   */
  private async getMatchDimensions(matchId: number): Promise<Record<string, any>> {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('profile_dimension_values')
      .select('dimension_key, value')
      .eq('match_id', matchId)

    if (error) {
      console.error('[TwinService] getMatchDimensions error:', error)
      return {}
    }

    const result: Record<string, any> = {}
    for (const row of data || []) {
      result[row.dimension_key] = row.value
    }
    return result
  }

  /**
   * 获取对象画像数据
   */
  private async getMatchPortrait(matchId: number): Promise<any> {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('profile_portraits')
      .select('*')
      .eq('match_id', matchId)
      .single()

    if (error) {
      console.error('[TwinService] getMatchPortrait error:', error)
      return null
    }
    return data
  }

  /**
   * 获取对象基本信息
   */
  private async getMatchInfo(matchId: number): Promise<{ name: string; gender: string } | null> {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('matches')
      .select('name, gender')
      .eq('id', matchId)
      .single()

    if (error) {
      console.error('[TwinService] getMatchInfo error:', error)
      return null
    }
    return data
  }

  /**
   * 保存消息到数据库
   */
  private async saveMessage(matchId: number, role: string, content: string): Promise<void> {
    const client = getSupabaseClient()
    const { error } = await client
      .from('twin_chat_history')
      .insert({ match_id: matchId, role, content })

    if (error) {
      console.error('[TwinService] saveMessage error:', error)
    }
  }

  /**
   * 获取最近的聊天历史（用于上下文）
   */
  private async getRecentHistory(matchId: number, limit: number = 20): Promise<DbTwinChatHistory[]> {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('twin_chat_history')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[TwinService] getRecentHistory error:', error)
      return []
    }

    // 反转为时间正序
    return (data || []).reverse()
  }

  /**
   * 清理LLM返回的内容
   */
  private cleanLLMContent(content: string): string {
    let cleaned = content
    // 移除 think 标签
    cleaned = cleaned.replace(/<think[\s\S]*?<\/think>/gi, '')
    cleaned = cleaned.replace(/<thinking[\s\S]*?<\/thinking>/gi, '')
    // 移除开头可能的标签
    cleaned = cleaned.replace(/^<[^>]+>/i, '')
    // 清理多余空白
    cleaned = cleaned.trim()
    return cleaned
  }

  /**
   * 数字孪生体聊天
   */
  async chat(matchId: number, message: string, req: Request): Promise<{ reply: string }> {
    console.log('[TwinService] chat called, matchId:', matchId, 'message:', message)

    // 1. 获取对象信息
    const matchInfo = await this.getMatchInfo(matchId)
    if (!matchInfo) {
      return { reply: '我好像不认识这个人...' }
    }

    // 2. 获取维度数据
    const dimensionValues = await this.getMatchDimensions(matchId)
    const portraitData = await this.getMatchPortrait(matchId)

    // 3. 构建系统提示词
    const systemPrompt = this.buildSystemPrompt(matchInfo.name, dimensionValues, portraitData)

    // 4. 获取历史消息作为上下文
    const recentHistory = await this.getRecentHistory(matchId, 16)
    const contextMessages = recentHistory.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    // 5. 构建消息列表
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...contextMessages,
      { role: 'user' as const, content: message },
    ]

    // 6. 调用LLM
    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
      const config = new Config()
      const client = new LLMClient(config, customHeaders)

      const response = await client.invoke(messages, {
        model: 'doubao-seed-2-0-lite-260215',
        temperature: 0.8,
        thinking: 'disabled',
      })

      const reply = this.cleanLLMContent(response.content)

      // 7. 保存消息到数据库
      await this.saveMessage(matchId, 'user', message)
      await this.saveMessage(matchId, 'assistant', reply)

      console.log('[TwinService] chat reply:', reply)
      return { reply }
    } catch (err) {
      console.error('[TwinService] LLM error:', err)
      // 仍然保存用户消息
      await this.saveMessage(matchId, 'user', message)
      return { reply: '嗯...我一下不知道说什么了，等会再聊吧' }
    }
  }

  /**
   * 获取聊天历史
   */
  async getHistory(matchId: number, limit: number = 100) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('twin_chat_history')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('[TwinService] getHistory error:', error)
      throw error
    }

    return { history: data || [] }
  }

  /**
   * 清空聊天历史
   */
  async clearHistory(matchId: number) {
    const client = getSupabaseClient()
    const { error } = await client
      .from('twin_chat_history')
      .delete()
      .eq('match_id', matchId)

    if (error) {
      console.error('[TwinService] clearHistory error:', error)
      throw error
    }

    return { success: true }
  }
}
