import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk'
import { getSupabaseClient } from '@/storage/database/supabase-client'

export interface SweetTalkInput {
  matchId?: number
  scene: string        // 场景：morning/night/flirt/comfort/miss/apology/celebrate
  tone?: string        // 语气：sweet/humorous/poetic/direct/playful
  customContext?: string // 自定义上下文
}

export interface SweetTalkResult {
  lines: Array<{
    content: string
    style: string
    suitablePhase: string
  }>
  tips: string[]
}

// 场景描述映射
const SCENE_DESCRIPTIONS: Record<string, string> = {
  morning: '早安问候',
  night: '晚安祝福',
  flirt: '暧昧调情',
  comfort: '安慰鼓励',
  miss: '表达想念',
  apology: '道歉和好',
  celebrate: '庆祝纪念',
}

// 语气风格映射
const TONE_DESCRIPTIONS: Record<string, string> = {
  sweet: '甜蜜温柔',
  humorous: '幽默风趣',
  poetic: '文艺浪漫',
  direct: '直球告白',
  playful: '俏皮可爱',
}

@Injectable()
export class SweetTalkService {
  /**
   * 生成情话
   */
  async generate(input: SweetTalkInput, req: Request) {
    const { matchId, scene, tone, customContext } = input

    // 1. 获取对象信息（如有）
    let matchContext = ''
    if (matchId) {
      const { data: match } = await getSupabaseClient()
        .from('matches')
        .select('id, name')
        .eq('id', matchId)
        .single()

      if (match) {
        matchContext = `对象名字：${match.name}\n`

        // 获取画像辅助
        const { data: portrait } = await getSupabaseClient()
          .from('profile_portraits')
          .select('personality_extraversion, emotional_expression, communication_humor')
          .eq('match_id', matchId)
          .single()

        if (portrait) {
          matchContext += `性格外向度：${portrait.personality_extraversion || 50}/100\n`
          matchContext += `情感表达度：${portrait.emotional_expression || 50}/100\n`
          matchContext += `幽默感：${portrait.communication_humor || 50}/100\n`
        }

        // 获取聊天记录中的偏好线索
        const { data: chatRecords } = await getSupabaseClient()
          .from('chat_records')
          .select('key_topics')
          .eq('match_id', matchId)
          .limit(3)

        if (chatRecords && chatRecords.length > 0) {
          const allTopics = chatRecords.flatMap((r: { key_topics: string[] }) => r.key_topics || [])
          if (allTopics.length > 0) {
            matchContext += `对方常聊话题：${[...new Set(allTopics)].slice(0, 5).join('、')}\n`
          }
        }
      }
    }

    const sceneDesc = SCENE_DESCRIPTIONS[scene] || scene
    const toneDesc = TONE_DESCRIPTIONS[tone || 'sweet'] || '甜蜜温柔'

    // 2. AI 生成
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
    const config = new Config()
    const client = new LLMClient(config, customHeaders)

    const prompt = `你是一个恋爱话术专家，擅长写出自然、有温度的情话。请根据以下信息生成情话。

${matchContext || '（未指定对象，请生成通用情话）'}

场景：${sceneDesc}
语气风格：${toneDesc}
${customContext ? `额外要求：${customContext}` : ''}

请严格按以下 JSON 格式返回（不要其他文字）：
{
  "lines": [
    {
      "content": "情话内容",
      "style": "风格描述（如：温柔直球/幽默反差/文艺含蓄）",
      "suitablePhase": "适合的关系阶段（如：暧昧初期/暧昧升温/热恋/稳定期）"
    }
  ],
  "tips": [
    "发送这条情话时的小技巧1",
    "发送这条情话时的小技巧2"
  ]
}

要求：
- lines 至少生成5条不同风格的情话
- 情话要自然、不油腻，让人听了会心动而不是尴尬
- 根据对象的性格特点调整风格：外向的对象可以用幽默风趣，内向的对象用温柔含蓄
- 如果有对象名字，可以适当在1-2条情话中自然地使用
- suitablePhase 要从"暧昧初期/暧昧升温/热恋/稳定期"中选择
- tips 要给出具体的使用建议，比如发送时机、搭配的表情等`

    try {
      const response = await client.invoke([
        { role: 'user', content: prompt }
      ], { temperature: 0.8 })

      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return { code: 500, data: null, message: 'AI 生成情话解析失败' }
      }

      const result: SweetTalkResult = JSON.parse(jsonMatch[0])

      // 3. 保存历史
      await getSupabaseClient()
        .from('sweet_talk_history')
        .insert({
          match_id: matchId || null,
          scene,
          tone: tone || 'sweet',
          custom_context: customContext || null,
          result,
        })

      return {
        code: 200,
        data: result,
        message: 'success',
      }
    } catch (error) {
      console.error('Generate sweet talk error:', error)
      return { code: 500, data: null, message: 'AI 生成情话失败，请稍后重试' }
    }
  }

  /**
   * 获取历史情话记录
   */
  async getHistory(matchId?: number, scene?: string) {
    let query = getSupabaseClient()
      .from('sweet_talk_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (matchId) {
      query = query.eq('match_id', matchId)
    }
    if (scene) {
      query = query.eq('scene', scene)
    }

    const { data, error } = await query

    if (error) {
      console.error('Get sweet talk history error:', error)
      return { code: 500, data: null, message: error.message }
    }

    return {
      code: 200,
      data: { list: data || [] },
      message: 'success',
    }
  }
}
