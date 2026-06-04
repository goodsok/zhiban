import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk'
import { getSupabaseClient } from '@/storage/database/supabase-client'

export interface ChatReviewResult {
  interestSignals: Array<{
    signal: string
    evidence: string
    level: 'high' | 'medium' | 'low'
  }>
  emotionState: {
    overall: string
    trend: string
    details: string
  }
  replyRhythm: {
    speed: string
    initiative: string
    pattern: string
  }
  suggestions: string[]
  score: number
}

@Injectable()
export class ChatReviewService {
  /**
   * 获取对象的所有聊天记录，进行 AI 复盘分析
   */
  async reviewByMatchId(matchId: number, req: Request) {
    // 1. 获取对象信息
    const { data: match } = await getSupabaseClient()
      .from('matches')
      .select('id, name, gender')
      .eq('id', matchId)
      .single()

    if (!match) {
      return { code: 404, data: null, message: '对象不存在' }
    }

    // 2. 获取聊天记录（chat_records 表中已分析的数据 + chat_histories 表）
    const { data: chatRecords } = await getSupabaseClient()
      .from('chat_records')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: chatHistories } = await getSupabaseClient()
      .from('chat_histories')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .limit(50)

    // 3. 拼接聊天内容
    let chatContent = ''

    if (chatHistories && chatHistories.length > 0) {
      chatContent = chatHistories
        .map((msg: { role: string; content: string; created_at: string }) => {
          const sender = msg.role === 'user' ? '我' : match.name
          return `${sender}: ${msg.content}`
        })
        .join('\n')
    }

    // 补充已分析的聊天记录摘要
    if (chatRecords && chatRecords.length > 0) {
      chatContent += '\n\n--- 以下为聊天截图记录摘要 ---\n'
      chatRecords.forEach((record: { summary?: string; raw_content?: string; created_at: string }) => {
        if (record.summary) {
          chatContent += `[摘要] ${record.summary}\n`
        }
        if (record.raw_content) {
          chatContent += record.raw_content.slice(0, 500) + '\n'
        }
      })
    }

    if (!chatContent.trim()) {
      return {
        code: 200,
        data: {
          matchId,
          matchName: match.name,
          hasData: false,
          message: '暂无聊天记录，请先添加聊天记录',
        },
        message: 'success',
      }
    }

    // 4. 获取对象画像辅助分析
    const { data: portrait } = await getSupabaseClient()
      .from('profile_portraits')
      .select('*')
      .eq('match_id', matchId)
      .single()

    let portraitContext = ''
    if (portrait) {
      portraitContext = `\n\n对象画像参考：性格外向度${portrait.personality_extraversion || 50}，情感表达${portrait.emotional_expression || 50}，社交主动性${portrait.social_initiative || 50}，沟通幽默感${portrait.communication_humor || 50}`
    }

    // 5. AI 分析
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
    const config = new Config()
    const client = new LLMClient(config, customHeaders)

    const prompt = `你是一个恋爱聊天分析专家。请对以下聊天记录进行深度复盘分析。

对象名称：${match.name}
${portraitContext}

聊天记录：
${chatContent.slice(0, 4000)}

请严格按以下 JSON 格式返回（不要其他文字）：
{
  "interestSignals": [
    { "signal": "兴趣信号描述", "evidence": "聊天中的具体证据", "level": "high/medium/low" }
  ],
  "emotionState": {
    "overall": "整体情绪状态描述（如：积极/平淡/冷淡/犹豫）",
    "trend": "情绪趋势（如：升温中/稳定/降温中）",
    "details": "情绪变化的详细分析"
  },
  "replyRhythm": {
    "speed": "回复速度评价（如：秒回/较快/正常/较慢/很慢）",
    "initiative": "主动发起对话的频率评价",
    "pattern": "回复节奏规律分析"
  },
  "suggestions": [
    "具体可执行的下一步建议1",
    "具体可执行的下一步建议2",
    "具体可执行的下一步建议3"
  ],
  "score": 兴趣度评分（0-100的整数）
}

注意：
- interestSignals 至少列出3条
- suggestions 至少列出3条可执行建议
- score 基于回复速度、主动程度、话题参与度等综合判断
- 分析要基于具体聊天内容，不要泛泛而谈`

    try {
      const response = await client.invoke([
        { role: 'user', content: prompt }
      ], { temperature: 0.3 })

      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return { code: 500, data: null, message: 'AI 分析结果解析失败' }
      }

      const analysis: ChatReviewResult = JSON.parse(jsonMatch[0])

      // 6. 保存分析结果到 chat_records 的分析内容字段
      await getSupabaseClient()
        .from('chat_records')
        .update({
          analyzed_content: { type: 'review', result: analysis, reviewedAt: new Date().toISOString() },
          analysis_status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('match_id', matchId)
        .eq('analysis_status', 'pending')
        .limit(1)

      return {
        code: 200,
        data: {
          matchId,
          matchName: match.name,
          hasData: true,
          chatRecordCount: chatRecords?.length || 0,
          chatHistoryCount: chatHistories?.length || 0,
          analysis,
        },
        message: 'success',
      }
    } catch (error) {
      console.error('Chat review AI error:', error)
      return { code: 500, data: null, message: 'AI 分析失败，请稍后重试' }
    }
  }

  /**
   * 获取对象最近的聊天复盘结果（如果已分析过）
   */
  async getLatestReview(matchId: number) {
    const { data: match } = await getSupabaseClient()
      .from('matches')
      .select('id, name')
      .eq('id', matchId)
      .single()

    if (!match) {
      return { code: 404, data: null, message: '对象不存在' }
    }

    // 查找最近分析的记录
    const { data: record } = await getSupabaseClient()
      .from('chat_records')
      .select('analyzed_content, created_at')
      .eq('match_id', matchId)
      .eq('analysis_status', 'completed')
      .not('analyzed_content', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (!record?.analyzed_content?.result) {
      return {
        code: 200,
        data: { matchId, matchName: match.name, hasReview: false },
        message: 'success',
      }
    }

    return {
      code: 200,
      data: {
        matchId,
        matchName: match.name,
        hasReview: true,
        analysis: record.analyzed_content.result,
        reviewedAt: record.analyzed_content.reviewedAt,
      },
      message: 'success',
    }
  }

  /**
   * 获取所有对象列表（用于聊天复盘选择）
   */
  async getMatchList() {
    const { data, error } = await getSupabaseClient()
      .from('matches')
      .select('id, name, gender, status, impression, last_contact')
      .order('last_contact', { ascending: false })

    if (error) {
      return { code: 500, data: null, message: error.message }
    }

    // 为每个对象查询聊天记录数量
    const matchesWithCount = await Promise.all(
      (data || []).map(async (match: { id: number; name: string; gender?: string; status: string; impression: number; last_contact: string }) => {
        const { count: chatRecordCount } = await getSupabaseClient()
          .from('chat_records')
          .select('*', { count: 'exact', head: true })
          .eq('match_id', match.id)

        const { count: chatHistoryCount } = await getSupabaseClient()
          .from('chat_histories')
          .select('*', { count: 'exact', head: true })
          .eq('match_id', match.id)

        return {
          ...match,
          chatRecordCount: chatRecordCount || 0,
          chatHistoryCount: chatHistoryCount || 0,
        }
      })
    )

    return {
      code: 200,
      data: { list: matchesWithCount },
      message: 'success',
    }
  }
}
