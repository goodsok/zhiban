import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk'
import { getSupabaseClient } from '@/storage/database/supabase-client'

// 行为层级定义（与前端一致）
const BEHAVIOR_LEVELS = [
  { level: 1, code: 'get_contact', name: '交换联系方式', intimacy: 10 },
  { level: 1, code: 'first_chat', name: '第一次聊天', intimacy: 15 },
  { level: 1, code: 'agree_meet', name: '约定见面', intimacy: 20 },
  { level: 2, code: 'first_meet', name: '第一次见面', intimacy: 30 },
  { level: 2, code: 'show_interest', name: '对方表现兴趣', intimacy: 35 },
  { level: 2, code: 'second_meet', name: '同意第二次见面', intimacy: 40 },
  { level: 3, code: 'light_touch', name: '肢体接触', intimacy: 50 },
  { level: 3, code: 'hold_hands', name: '牵手', intimacy: 55 },
  { level: 3, code: 'hug', name: '拥抱', intimacy: 60 },
  { level: 4, code: 'pet_name', name: '亲密称呼', intimacy: 65 },
  { level: 4, code: 'kiss', name: '接吻', intimacy: 75 },
  { level: 4, code: 'cuddle', name: '依偎', intimacy: 70 },
  { level: 5, code: 'intimate_touch', name: '亲密抚摸', intimacy: 85 },
  { level: 5, code: 'stay_over', name: '过夜', intimacy: 90 },
  { level: 5, code: 'sex', name: '发生关系', intimacy: 100 },
  { level: 6, code: 'relationship', name: '确认恋爱', intimacy: 80 },
]

@Injectable()
export class SpeedPlanService {
  /**
   * 创建方案并生成初始内容
   */
  async createPlan(
    input: {
      background: string
      currentProgress: string[]
      matchId: number
      targetHours: number
      targetBehavior: string
    },
    request: Request
  ) {
    const { background, currentProgress, matchId, targetHours, targetBehavior } = input

    // 1. 获取对象信息
    const objectInfo = await this.getMatchInfo(matchId, request)
    
    // 2. 计算难度
    const difficulty = this.calculateDifficulty(
      currentProgress,
      targetBehavior,
      objectInfo,
      targetHours
    )

    // 3. 生成初始方案
    const initialPlan = await this.generatePlanWithLLM(
      background,
      currentProgress,
      targetBehavior,
      targetHours,
      difficulty,
      objectInfo,
      request
    )

    // 4. 保存到数据库
    const client = getSupabaseClient()
    const { data: plan, error } = await client
      .from('speed_plans')
      .insert({
        match_id: matchId,
        background,
        current_progress: currentProgress,
        target_hours: targetHours,
        target_behavior: targetBehavior,
        difficulty_score: difficulty.score,
        difficulty_level: difficulty.level,
        status: 'active',
      })
      .select()
      .single()

    if (error || !plan) {
      return {
        code: 500,
        msg: '保存方案失败',
        data: null,
      }
    }

    // 5. 保存初始消息
    await client
      .from('speed_plan_messages')
      .insert({
        plan_id: plan.id,
        role: 'assistant',
        content: initialPlan,
      })

    return {
      code: 200,
      msg: 'success',
      data: {
        planId: plan.id,
        initialMessage: initialPlan,
        difficulty: difficulty.score,
        difficultyLevel: difficulty.level,
      }
    }
  }

  /**
   * 获取方案列表
   */
  async getPlanList(matchId: number | undefined, request: Request) {
    const client = getSupabaseClient()
    
    let query = client
      .from('speed_plans')
      .select(`
        id,
        match_id,
        background,
        target_hours,
        target_behavior,
        difficulty_score,
        difficulty_level,
        status,
        created_at,
        matches(name)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (matchId) {
      query = query.eq('match_id', matchId)
    }

    const { data, error } = await query

    if (error) {
      return { code: 500, msg: '获取失败', data: null }
    }

    return {
      code: 200,
      msg: 'success',
      data: { plans: data },
    }
  }

  /**
   * 获取方案详情
   */
  async getPlanDetail(planId: number, request: Request) {
    const client = getSupabaseClient()

    // 获取方案信息
    const { data: plan, error: planError } = await client
      .from('speed_plans')
      .select(`
        id,
        match_id,
        background,
        current_progress,
        target_hours,
        target_behavior,
        difficulty_score,
        difficulty_level,
        status,
        created_at,
        matches(id, name, relationship_type)
      `)
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return { code: 404, msg: '方案不存在', data: null }
    }

    // 获取消息记录
    const { data: messages } = await client
      .from('speed_plan_messages')
      .select('id, role, content, created_at')
      .eq('plan_id', planId)
      .order('created_at', { ascending: true })

    return {
      code: 200,
      msg: 'success',
      data: {
        plan,
        messages: messages || [],
      },
    }
  }

  /**
   * 继续对话
   */
  async continueChat(planId: number, userMessage: string, request: Request) {
    const client = getSupabaseClient()

    // 1. 获取方案信息
    const { data: plan, error: planError } = await client
      .from('speed_plans')
      .select(`
        id,
        match_id,
        background,
        current_progress,
        target_hours,
        target_behavior,
        difficulty_score,
        matches(id, name)
      `)
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return { code: 404, msg: '方案不存在', data: null }
    }

    // 2. 获取历史消息
    const { data: history } = await client
      .from('speed_plan_messages')
      .select('role, content')
      .eq('plan_id', planId)
      .order('created_at', { ascending: true })
      .limit(20)

    // 3. 保存用户消息
    await client
      .from('speed_plan_messages')
      .insert({
        plan_id: planId,
        role: 'user',
        content: userMessage,
      })

    // 4. 调用LLM生成回复
    const reply = await this.continueChatWithLLM(
      plan,
      history || [],
      userMessage,
      request
    )

    // 5. 保存AI回复
    await client
      .from('speed_plan_messages')
      .insert({
        plan_id: planId,
        role: 'assistant',
        content: reply,
      })

    return {
      code: 200,
      msg: 'success',
      data: { reply },
    }
  }

  /**
   * 删除方案
   */
  async deletePlan(planId: number, request: Request) {
    const client = getSupabaseClient()

    const { error } = await client
      .from('speed_plans')
      .update({ status: 'deleted' })
      .eq('id', planId)

    if (error) {
      return { code: 500, msg: '删除失败', data: null }
    }

    return { code: 200, msg: 'success', data: null }
  }

  /**
   * 获取对象信息
   */
  private async getMatchInfo(matchId: number, request: Request) {
    const client = getSupabaseClient()

    const { data: match } = await client
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    const { data: dimensions } = await client
      .from('match_dimensions')
      .select('dimension_key, dimension_value')
      .eq('match_id', matchId)

    const { data: interactions } = await client
      .from('interaction_events')
      .select('energy_value')
      .eq('match_id', matchId)
      .eq('status', 'completed')

    const totalEnergy = interactions?.reduce((sum: number, i: { energy_value: number }) => sum + (i.energy_value || 0), 0) || 0

    const dimensionMap: Record<string, string> = {}
    dimensions?.forEach((d: { dimension_key: string; dimension_value: string }) => {
      dimensionMap[d.dimension_key] = d.dimension_value
    })

    return {
      name: match?.name || '',
      relationshipType: dimensionMap['relationship_type'] || 'both',
      mbti: dimensionMap['mbti'] || '',
      attachmentType: dimensionMap['attachment_type'] || '',
      progressScore: match?.progress_score || 0,
      relationshipEnergy: totalEnergy,
      interactionCount: interactions?.length || 0,
      cyclePhase: '',
    }
  }

  /**
   * 计算难度系数
   */
  private calculateDifficulty(
    currentProgress: string[],
    targetBehavior: string,
    objectInfo: {
      relationshipType: string
      mbti: string
      attachmentType: string
      progressScore: number
      relationshipEnergy: number
      interactionCount: number
      cyclePhase: string
    },
    targetHours: number
  ): { score: number; level: string; factors: string[] } {
    const currentLevel = this.getCurrentLevel(currentProgress)
    const target = BEHAVIOR_LEVELS.find(b => b.code === targetBehavior)
    const targetLevel = target?.level || 3
    
    const levelGap = Math.max(0, targetLevel - currentLevel)
    const baseDifficulty = levelGap * 2

    const baseTime = 72
    const timePressure = baseTime / Math.max(targetHours, 1)
    const timeFactor = Math.min(timePressure, 3)

    let relationshipFactor = 1
    if (objectInfo.relationshipType === 'long_term') {
      relationshipFactor = 1.2
    } else if (objectInfo.relationshipType === 'short_term') {
      relationshipFactor = 0.8
    }

    let attachmentFactor = 1
    if (objectInfo.attachmentType === 'secure') {
      attachmentFactor = 0.9
    } else if (objectInfo.attachmentType === 'anxious') {
      attachmentFactor = 0.8
    } else if (objectInfo.attachmentType === 'avoidant') {
      attachmentFactor = 1.3
    }

    const progressFactor = Math.max(0.5, 1 - objectInfo.progressScore / 200)
    const energyFactor = Math.max(0.6, 1 - objectInfo.relationshipEnergy / 200)
    const interactionFactor = Math.max(0.7, 1 - objectInfo.interactionCount / 20)

    const totalDifficulty = baseDifficulty * timeFactor * relationshipFactor * attachmentFactor * progressFactor * energyFactor * interactionFactor
    const score = Math.min(10, Math.max(1, Math.round(totalDifficulty)))

    let level = '简单'
    if (score >= 8) level = '极难'
    else if (score >= 6) level = '困难'
    else if (score >= 4) level = '中等'
    else if (score >= 2) level = '较易'

    const factors: string[] = []
    if (levelGap > 0) factors.push(`层级差距${levelGap}级`)
    if (timeFactor > 1.5) factors.push('时间紧迫')
    if (relationshipFactor > 1) factors.push('长期关系需要耐心')
    if (attachmentFactor > 1) factors.push('回避型依恋')
    if (objectInfo.progressScore > 50) factors.push('推进值较高')
    if (objectInfo.relationshipEnergy > 30) factors.push('关系能量充足')

    return { score, level, factors }
  }

  private getCurrentLevel(currentProgress: string[]): number {
    let maxLevel = 0
    currentProgress.forEach(code => {
      const behavior = BEHAVIOR_LEVELS.find(b => b.code === code)
      if (behavior && behavior.level > maxLevel) {
        maxLevel = behavior.level
      }
    })
    return maxLevel
  }

  /**
   * 生成初始方案
   */
  private async generatePlanWithLLM(
    background: string,
    currentProgress: string[],
    targetBehavior: string,
    targetHours: number,
    difficulty: { score: number; level: string; factors: string[] },
    objectInfo: {
      name: string
      relationshipType: string
      mbti: string
      attachmentType: string
      progressScore: number
      relationshipEnergy: number
      interactionCount: number
      cyclePhase: string
    },
    request: Request
  ): Promise<string> {
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers as Record<string, string>)
    const config = new Config()
    const client = new LLMClient(config, customHeaders)

    const target = BEHAVIOR_LEVELS.find(b => b.code === targetBehavior)
    const progressNames = currentProgress.map(code => {
      const b = BEHAVIOR_LEVELS.find(item => item.code === code)
      return b?.name || code
    })

    const targetDisplayNames: Record<string, string> = {
      'sex': '亲密关系',
      'stay_over': '过夜相处',
      'intimate_touch': '亲密接触',
    }
    const targetDisplayName = targetDisplayNames[targetBehavior] || target?.name || targetBehavior

    const relationshipTypeDesc: Record<string, string> = {
      'long_term': '长期关系（以结婚或长期伴侣为目标）',
      'short_term': '短期关系（双方都明确的恋爱尝试，不承诺长期发展）',
      'both': '灵活关系（根据相处情况决定发展方向）',
    }
    const relationshipDesc = relationshipTypeDesc[objectInfo.relationshipType] || '未明确'

    const systemPrompt = `你是一位专业的婚恋情感咨询师，为成年人提供恋爱关系发展指导。

关于关系类型的说明：
- 长期关系：以结婚或长期伴侣为目标，节奏较慢，注重深度了解
- 短期关系：双方都明确的恋爱尝试，不承诺长期发展，节奏可以较快，但仍需尊重和真诚
- 灵活关系：根据相处情况决定发展方向

重要提示：不同关系类型是成年人的正常选择，只要双方知情同意，都值得被尊重和认真对待。

核心原则：
1. 所有建议必须建立在双方自愿、相互尊重的基础上
2. 短期关系也需要真诚对待，不能欺骗或玩弄感情
3. 关注对方的感受和边界，及时沟通彼此的期待
4. 强调情感连接和氛围营造的重要性

输出要求：
1. 方案应该具体、可执行
2. 每个步骤都要有明确的时间节点
3. 根据关系类型调整节奏和策略
4. 给出具体的聊天话题或行动建议
5. 指出需要注意的边界和尊重事项

输出格式：
【总体策略】（一句话概括）
【难度分析】（结合难度系数和影响因素）
【分步计划】
1. 第X步：xxx（时间：XX小时内）
   - 具体行动
   - 话术示例
2. ...
【注意事项】（特别强调尊重边界和双方意愿）
【备选方案】（如果计划受阻）`

    const userMessage = `请为以下情况生成关系推进方案：

【互动背景】
${background || '未提供'}

【当前进展】
${progressNames.length > 0 ? progressNames.join('、') : '刚开始认识'}

【对象信息】
- 姓名：${objectInfo.name}
- 关系类型：${relationshipDesc}
- MBTI：${objectInfo.mbti || '未知'}
- 依恋类型：${objectInfo.attachmentType || '未知'}
- 推进值：${objectInfo.progressScore}
- 关系能量：${objectInfo.relationshipEnergy}
- 互动次数：${objectInfo.interactionCount}

【目标】
在${targetHours}小时内推进到"${targetDisplayName}"阶段

【难度系数】
${difficulty.score}/10（${difficulty.level}）
影响因素：${difficulty.factors.length > 0 ? difficulty.factors.join('、') : '无特殊因素'}

请生成具体的推进方案。`

    try {
      const response = await client.invoke([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ], { temperature: 0.7 })

      return response.content
    } catch (error) {
      console.error('LLM generate plan error:', error)
      return '生成方案失败，请稍后重试'
    }
  }

  /**
   * 继续对话
   */
  private async continueChatWithLLM(
    plan: any,
    history: Array<{ role: string; content: string }>,
    userMessage: string,
    request: Request
  ): Promise<string> {
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers as Record<string, string>)
    const config = new Config()
    const client = new LLMClient(config, customHeaders)

    const target = BEHAVIOR_LEVELS.find(b => b.code === plan.target_behavior)
    const targetName = target?.name || plan.target_behavior

    const systemPrompt = `你是一位专业的婚恋情感咨询师，正在帮助用户推进恋爱关系。

当前方案背景：
- 对象：${plan.matches?.name || '对方'}
- 目标：在${plan.target_hours}小时内推进到"${targetName}"
- 难度：${plan.difficulty_score}/10

你的任务是：
1. 根据用户的反馈调整方案
2. 回答用户的具体问题
3. 提供应对建议
4. 保持真诚、尊重的态度

回复要求：
- 简洁实用，避免重复
- 针对用户的具体问题回答
- 如果用户说某步骤不合适，提供替代方案
- 保持温暖的语气`

    // 构建消息历史
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ]

    // 添加历史消息（最近10条）
    const recentHistory = history.slice(-10)
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })
    })

    // 添加当前用户消息
    messages.push({ role: 'user', content: userMessage })

    try {
      const response = await client.invoke(messages, { temperature: 0.7 })
      return response.content
    } catch (error) {
      console.error('LLM continue chat error:', error)
      return '抱歉，回复失败，请稍后重试'
    }
  }
}
