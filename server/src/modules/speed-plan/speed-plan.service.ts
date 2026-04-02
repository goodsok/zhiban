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
   * 生成速推方案
   */
  async generatePlan(
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

    // 3. 调用LLM生成方案
    const plan = await this.generatePlanWithLLM(
      background,
      currentProgress,
      targetBehavior,
      targetHours,
      difficulty,
      objectInfo,
      request
    )

    return {
      code: 200,
      msg: 'success',
      data: {
        plan,
        difficulty: difficulty.score,
        difficultyLevel: difficulty.level,
        targetBehavior: targetBehavior,
        targetHours,
      }
    }
  }

  /**
   * 获取对象信息
   */
  private async getMatchInfo(matchId: number, request: Request) {
    const client = getSupabaseClient()

    // 获取基本信息
    const { data: match } = await client
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    // 获取维度数据
    const { data: dimensions } = await client
      .from('match_dimensions')
      .select('dimension_key, dimension_value')
      .eq('match_id', matchId)

    // 获取互动能量
    const { data: interactions } = await client
      .from('interaction_events')
      .select('energy_value')
      .eq('match_id', matchId)
      .eq('status', 'completed')

    const totalEnergy = interactions?.reduce((sum: number, i: { energy_value: number }) => sum + (i.energy_value || 0), 0) || 0

    // 解析维度
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
      cyclePhase: '', // 可以后续补充周期信息
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
    // 1. 获取当前最高层级
    const currentLevel = this.getCurrentLevel(currentProgress)
    
    // 2. 获取目标层级
    const target = BEHAVIOR_LEVELS.find(b => b.code === targetBehavior)
    const targetLevel = target?.level || 3
    
    // 3. 层级差距（基础难度）
    const levelGap = Math.max(0, targetLevel - currentLevel)
    const baseDifficulty = levelGap * 2

    // 4. 时间压力系数（基准时间72小时）
    const baseTime = 72
    const timePressure = baseTime / Math.max(targetHours, 1)
    const timeFactor = Math.min(timePressure, 3) // 最高3倍

    // 5. 关系类型系数
    let relationshipFactor = 1
    if (objectInfo.relationshipType === 'long_term') {
      relationshipFactor = 1.2 // 长期关系需要更多耐心
    } else if (objectInfo.relationshipType === 'short_term') {
      relationshipFactor = 0.8 // 短期关系可以更快
    }

    // 6. 依恋类型系数
    let attachmentFactor = 1
    if (objectInfo.attachmentType === 'secure') {
      attachmentFactor = 0.9 // 安全型更容易推进
    } else if (objectInfo.attachmentType === 'anxious') {
      attachmentFactor = 0.8 // 焦虑型反而更容易快速推进
    } else if (objectInfo.attachmentType === 'avoidant') {
      attachmentFactor = 1.3 // 回避型更难推进
    }

    // 7. 推进值系数
    const progressFactor = Math.max(0.5, 1 - objectInfo.progressScore / 200)

    // 8. 关系能量系数
    const energyFactor = Math.max(0.6, 1 - objectInfo.relationshipEnergy / 200)

    // 9. 互动次数系数（互动越多越容易）
    const interactionFactor = Math.max(0.7, 1 - objectInfo.interactionCount / 20)

    // 10. 综合难度
    const totalDifficulty = baseDifficulty * timeFactor * relationshipFactor * attachmentFactor * progressFactor * energyFactor * interactionFactor
    
    // 限制在1-10
    const score = Math.min(10, Math.max(1, Math.round(totalDifficulty)))

    // 确定难度等级
    let level = '简单'
    if (score >= 8) level = '极难'
    else if (score >= 6) level = '困难'
    else if (score >= 4) level = '中等'
    else if (score >= 2) level = '较易'

    // 收集影响因素
    const factors: string[] = []
    if (levelGap > 0) factors.push(`层级差距${levelGap}级`)
    if (timeFactor > 1.5) factors.push('时间紧迫')
    if (relationshipFactor > 1) factors.push('长期关系需要耐心')
    if (attachmentFactor > 1) factors.push('回避型依恋')
    if (objectInfo.progressScore > 50) factors.push('推进值较高')
    if (objectInfo.relationshipEnergy > 30) factors.push('关系能量充足')

    return { score, level, factors }
  }

  /**
   * 获取当前最高层级
   */
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
   * 使用LLM生成方案
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

    // 目标行为的友好表述映射
    const targetDisplayNames: Record<string, string> = {
      'sex': '亲密关系',
      'stay_over': '过夜相处',
      'intimate_touch': '亲密接触',
    }
    const targetDisplayName = targetDisplayNames[targetBehavior] || target?.name || targetBehavior

    const systemPrompt = `你是一位专业的婚恋情感咨询师，为成年人提供恋爱关系发展指导。你的职责是帮助用户在尊重、自愿、安全的前提下推进健康的恋爱关系。

重要原则：
1. 所有建议必须建立在双方自愿、相互尊重的基础上
2. 强调情感连接和信任建立的重要性
3. 关注对方的感受和边界
4. 提供的是关系发展指导，而非技术指导

输出要求：
1. 方案应该具体、可执行
2. 每个步骤都要有明确的时间节点
3. 考虑对象的性格特点（MBTI、依恋类型）
4. 给出具体的聊天话题或行动建议
5. 指出需要注意的边界和尊重事项
6. 强调情感交流和氛围营造的重要性

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
- 关系类型：${objectInfo.relationshipType === 'long_term' ? '长期' : objectInfo.relationshipType === 'short_term' ? '短期' : '灵活'}
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

请生成具体的推进方案，重点围绕情感连接、氛围营造、时机把握等方面给出建议。`

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
}
