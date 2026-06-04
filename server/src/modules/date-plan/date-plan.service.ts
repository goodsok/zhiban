import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk'
import { getSupabaseClient } from '@/storage/database/supabase-client'

export interface DatePlanInput {
  matchId: number
  budget?: string
  season?: string
  location?: string
  preference?: string
  duration?: string
}

export interface DatePlan {
  title: string
  description: string
  schedule: Array<{
    time: string
    activity: string
    location: string
    tips: string
  }>
  totalBudget: string
  conversationTopics: string[]
  outfitSuggestion: string
  backupPlan: string
}

@Injectable()
export class DatePlanService {
  /**
   * 生成约会计划
   */
  async generatePlan(input: DatePlanInput, req: Request) {
    const { matchId, budget, season, location, preference, duration } = input

    // 1. 获取对象信息
    const { data: match } = await getSupabaseClient()
      .from('matches')
      .select('id, name, gender')
      .eq('id', matchId)
      .single()

    if (!match) {
      return { code: 404, data: null, message: '对象不存在' }
    }

    // 2. 获取对象画像
    const { data: portrait } = await getSupabaseClient()
      .from('profile_portraits')
      .select('*')
      .eq('match_id', matchId)
      .single()

    // 3. 获取对象维度信息
    const { data: dimensions } = await getSupabaseClient()
      .from('dimensions')
      .select('key, value, category')
      .eq('match_id', matchId)
      .limit(20)

    // 4. 获取行为模式
    const { data: behavior } = await getSupabaseClient()
      .from('behavior_patterns')
      .select('*')
      .eq('match_id', matchId)
      .single()

    // 构建对象偏好上下文
    let preferenceContext = `对象名称：${match.name}\n`
    if (portrait) {
      preferenceContext += `性格外向度：${portrait.personality_extraversion || 50}/100\n`
      preferenceContext += `情感表达：${portrait.emotional_expression || 50}/100\n`
      preferenceContext += `社交活跃度：${portrait.social_activity || 50}/100\n`
      preferenceContext += `幽默感：${portrait.communication_humor || 50}/100\n`
      preferenceContext += `亲密需求：${portrait.social_intimacy || 50}/100\n`
    }
    if (dimensions && dimensions.length > 0) {
      preferenceContext += `已知信息：${dimensions.map((d: { key: string; value: string }) => `${d.key}=${d.value}`).join(', ')}\n`
    }
    if (behavior) {
      preferenceContext += `活跃时段：${JSON.stringify(behavior.active_hours || {})}\n`
      preferenceContext += `话题偏好：${JSON.stringify(behavior.topic_categories || {})}\n`
    }

    // 5. AI 生成约会计划
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
    const config = new Config()
    const client = new LLMClient(config, customHeaders)

    const prompt = `你是一个专业的约会策划师。请根据以下信息，生成一份详细且个性化的约会计划。

${preferenceContext}

用户补充要求：
- 预算：${budget || '不限'}
- 季节：${season || '当前季节'}
- 地点偏好：${location || '不限'}
- 约会偏好：${preference || '无特殊要求'}
- 时长：${duration || '半天'}

请严格按以下 JSON 格式返回（不要其他文字）：
{
  "title": "约会计划标题（简短有吸引力）",
  "description": "约会整体描述（一句话概括约会氛围和亮点）",
  "schedule": [
    {
      "time": "14:00",
      "activity": "活动名称",
      "location": "具体地点类型",
      "tips": "这个环节的小技巧"
    }
  ],
  "totalBudget": "预估总花费范围",
  "conversationTopics": ["约会中可以聊的话题1", "话题2", "话题3", "话题4"],
  "outfitSuggestion": "穿搭建议（简短）",
  "backupPlan": "备选方案（天气变化等突发情况）"
}

注意：
- schedule 至少安排3个环节，时间安排要合理
- 活动要根据对象的性格和偏好来设计
- conversationTopics 要结合对象画像中的兴趣
- 要考虑对象画像中外向度、亲密需求等维度来推荐合适的活动强度
- 整体氛围要从舒适到亲密递进`

    try {
      const response = await client.invoke([
        { role: 'user', content: prompt }
      ], { temperature: 0.7 })

      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return { code: 500, data: null, message: 'AI 生成计划解析失败' }
      }

      const plan: DatePlan = JSON.parse(jsonMatch[0])

      // 6. 保存到数据库
      const { data: savedPlan, error } = await getSupabaseClient()
        .from('date_plans')
        .insert({
          match_id: matchId,
          title: plan.title,
          description: plan.description,
          schedule: plan.schedule,
          total_budget: plan.totalBudget,
          conversation_topics: plan.conversationTopics,
          outfit_suggestion: plan.outfitSuggestion,
          backup_plan: plan.backupPlan,
          budget: budget || null,
          season: season || null,
          location_pref: location || null,
          preference: preference || null,
          duration: duration || null,
        })
        .select()
        .single()

      if (error) {
        console.error('Save date plan error:', error)
        // 仍然返回计划，只是不保存
        return {
          code: 200,
          data: { matchId, matchName: match.name, plan, saved: false },
          message: 'success',
        }
      }

      return {
        code: 200,
        data: {
          matchId,
          matchName: match.name,
          plan,
          planId: savedPlan.id,
          saved: true,
        },
        message: 'success',
      }
    } catch (error) {
      console.error('Generate date plan error:', error)
      return { code: 500, data: null, message: 'AI 生成约会计划失败，请稍后重试' }
    }
  }

  /**
   * 获取历史约会计划列表
   */
  async getPlans(matchId?: number) {
    let query = getSupabaseClient()
      .from('date_plans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (matchId) {
      query = query.eq('match_id', matchId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Get date plans error:', error)
      return { code: 500, data: null, message: error.message }
    }

    // 批量获取对象名称
    const matchIds = [...new Set((data || []).map((p: Record<string, unknown>) => p.match_id as number))]
    const matchNameMap: Record<number, string> = {}
    if (matchIds.length > 0) {
      const { data: matches } = await getSupabaseClient()
        .from('matches')
        .select('id, name')
        .in('id', matchIds)
      ;(matches || []).forEach((m: { id: number; name: string }) => {
        matchNameMap[m.id] = m.name
      })
    }

    return {
      code: 200,
      data: {
        list: data?.map((plan: Record<string, unknown>) => ({
          id: plan.id,
          matchId: plan.match_id,
          matchName: matchNameMap[plan.match_id as number] || '未知',
          title: plan.title,
          description: plan.description,
          totalBudget: plan.total_budget,
          createdAt: plan.created_at,
        })) || [],
      },
      message: 'success',
    }
  }

  /**
   * 获取约会计划详情
   */
  async getPlanById(id: number) {
    const { data, error } = await getSupabaseClient()
      .from('date_plans')
      .select('*, matches(name)')
      .eq('id', id)
      .single()

    if (error || !data) {
      return { code: 404, data: null, message: '计划不存在' }
    }

    return {
      code: 200,
      data: {
        id: data.id,
        matchId: data.match_id,
        matchName: (data.matches as Record<string, string>)?.name || '未知',
        title: data.title,
        description: data.description,
        schedule: data.schedule,
        totalBudget: data.total_budget,
        conversationTopics: data.conversation_topics,
        outfitSuggestion: data.outfit_suggestion,
        backupPlan: data.backup_plan,
        budget: data.budget,
        season: data.season,
        createdAt: data.created_at,
      },
      message: 'success',
    }
  }

  /**
   * 获取对象列表（用于选择约会对象）
   */
  async getMatchList() {
    const { data, error } = await getSupabaseClient()
      .from('matches')
      .select('id, name, gender, status, impression')
      .order('last_contact', { ascending: false })

    if (error) {
      return { code: 500, data: null, message: error.message }
    }

    return {
      code: 200,
      data: { list: data || [] },
      message: 'success',
    }
  }

  /**
   * 删除约会计划
   */
  async deletePlan(id: number) {
    const { error } = await getSupabaseClient()
      .from('date_plans')
      .delete()
      .eq('id', id)

    if (error) {
      return { code: 500, data: null, message: error.message }
    }

    return { code: 200, data: null, message: 'success' }
  }
}
