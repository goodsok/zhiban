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

  // 对速推方案最有价值的维度 key（精选，避免 token 浪费）
  private static readonly KEY_DIMENSIONS = [
    // 硬件信息
    'gender', 'birthYear', 'height', 'bodyType', 'education', 'occupation',
    'currentCity', 'currentDistrict', 'hometownCity', 'industry',
    // 核心性格/软件
    'mbti', 'attachmentStyle', 'coreTemperament', 'coreValues',
    'loveLanguage', 'communicationStyle', 'conflictStyle',
    'emotionalExpressionStyle', 'emotionalAvailabilityLevel',
    'emotionalInvestmentSpeed', 'emotionalStabilityLevel',
    // 关系态度
    'relationshipGoal', 'commitmentStyle', 'datingPacePreference',
    'intimacyNeeds', 'physicalAffectionStyle', 'physicalIntimacyTimeline',
    'boundariesStyle', 'exclusivityExpectation',
    'casualDatingAcceptance', 'readinessForRelationship',
    'marriageTimeline', 'relationshipFormPreference',
    // 社交/生活偏好
    'hobbies', 'weekendPreferences', 'foodPreferences',
    'idealDateType', 'firstDatePreferences', 'giftPreferences',
    'flirtingStyle', 'signalSensitivity',
    'favoriteMusic', 'favoriteMovies', 'favoriteBooks',
    'sportsPreferences', 'travelPreferences',
    // 沟通习惯
    'textingStyle', 'responseTimePreference', 'emojiUsage',
    'initiativeStyle', 'listeningStyle', 'humorStyle',
    // 当前状态
    'currentDatingStatus', 'currentFocus', 'nearTermGoals',
    'lifeStage', 'workLifeBalance', 'exerciseFrequency',
    'sleepTime', 'wakeUpTime', 'socialEnergy',
    // 大五人格维度
    'opennessLevel', 'conscientiousnessLevel', 'extroversionLevel',
    'agreeablenessLevel', 'empathyLevel',
    // 风险/边界
    'dealbreakerList', 'jealousyLevel', 'trustLevel',
    'phonePrivacyBoundary', 'privacyProtectionLevel',
  ]

  // 维度 key → 中文标签
  private static readonly DIMENSION_LABELS: Record<string, string> = {
    gender: '性别', birthYear: '出生年份', height: '身高', bodyType: '体型',
    education: '学历', occupation: '职业', currentCity: '所在城市',
    currentDistrict: '所在区域', hometownCity: '家乡', industry: '行业',
    mbti: 'MBTI', attachmentStyle: '依恋类型', coreTemperament: '核心气质',
    coreValues: '核心价值观', loveLanguage: '爱的语言', communicationStyle: '沟通风格',
    conflictStyle: '冲突风格', emotionalExpressionStyle: '情感表达方式',
    emotionalAvailabilityLevel: '情感可获得性', emotionalInvestmentSpeed: '情感投入速度',
    emotionalStabilityLevel: '情绪稳定性',
    relationshipGoal: '关系目标', commitmentStyle: '承诺风格',
    datingPacePreference: '约会节奏偏好', intimacyNeeds: '亲密需求',
    physicalAffectionStyle: '肢体接触风格', physicalIntimacyTimeline: '身体亲密时间线',
    boundariesStyle: '边界风格', exclusivityExpectation: '排他性期望',
    casualDatingAcceptance: '随意约会接受度', readinessForRelationship: '恋爱准备度',
    marriageTimeline: '婚姻时间线', relationshipFormPreference: '关系形式偏好',
    hobbies: '兴趣爱好', weekendPreferences: '周末偏好', foodPreferences: '饮食偏好',
    idealDateType: '理想约会类型', firstDatePreferences: '首次约会偏好',
    giftPreferences: '礼物偏好', flirtingStyle: '撩人风格',
    signalSensitivity: '信号敏感度', favoriteMusic: '音乐偏好',
    favoriteMovies: '电影偏好', favoriteBooks: '阅读偏好',
    sportsPreferences: '运动偏好', travelPreferences: '旅行偏好',
    textingStyle: '聊天风格', responseTimePreference: '回复时间偏好',
    emojiUsage: '表情包使用', initiativeStyle: '主动风格',
    listeningStyle: '倾听风格', humorStyle: '幽默风格',
    currentDatingStatus: '当前约会状态', currentFocus: '当前关注点',
    nearTermGoals: '近期目标', lifeStage: '人生阶段',
    workLifeBalance: '工作生活平衡', exerciseFrequency: '运动频率',
    sleepTime: '入睡时间', wakeUpTime: '起床时间', socialEnergy: '社交能量',
    opennessLevel: '开放性', conscientiousnessLevel: '尽责性',
    extroversionLevel: '外向性', agreeablenessLevel: '宜人性',
    empathyLevel: '共情能力', dealbreakerList: '底线清单',
    jealousyLevel: '嫉妒程度', trustLevel: '信任水平',
    phonePrivacyBoundary: '手机隐私边界', privacyProtectionLevel: '隐私保护程度',
  }

  /**
   * 获取对象信息（从真实数据源：matches + profile_dimension_values + profile_portraits + interaction_events）
   */
  private async getMatchInfo(matchId: number, request: Request) {
    const client = getSupabaseClient()

    // 1. 获取对象基础信息
    const { data: match } = await client
      .from('matches')
      .select('id, name, gender, meeting_scene, relationship_stage, interaction_status, key_info, relationship_type, impression_tags')
      .eq('id', matchId)
      .single()

    // 2. 获取对象档案维度数据
    const { data: dimensions } = await client
      .from('profile_dimension_values')
      .select('dimension_key, value')
      .eq('match_id', matchId)

    // 构建 key → value 映射
    const dimensionMap: Record<string, any> = {}
    dimensions?.forEach((d: { dimension_key: string; value: any }) => {
      dimensionMap[d.dimension_key] = d.value
    })

    // 3. 获取画像量化数据
    const { data: portrait } = await client
      .from('profile_portraits')
      .select('personality_openness, personality_conscientiousness, personality_extraversion, personality_agreeableness, personality_neuroticism, emotional_stability, emotional_empathy, communication_directness, communication_humor, communication_responsiveness, communication_depth, interaction_style')
      .eq('match_id', matchId)
      .single()

    // 4. 获取互动统计数据
    const { data: interactions } = await client
      .from('interaction_events')
      .select('energy_change, quality_score, mood, breakthrough_moment')
      .eq('match_id', matchId)

    const totalEnergy = interactions?.reduce(
      (sum: number, i: { energy_change: number | null }) => sum + (i.energy_change || 0), 0
    ) || 0
    const avgQuality = interactions?.length
      ? interactions.reduce((sum: number, i: { quality_score: number | null }) => sum + (i.quality_score || 0), 0) / interactions.length
      : 0

    // 5. 构建精选维度摘要（只取对速推有价值的维度）
    const profileSummary: string[] = []
    for (const key of SpeedPlanService.KEY_DIMENSIONS) {
      const value = dimensionMap[key]
      if (value !== undefined && value !== null && value !== '') {
        const label = SpeedPlanService.DIMENSION_LABELS[key] || key
        const displayValue = Array.isArray(value) ? value.join('、') : String(value)
        profileSummary.push(`${label}：${displayValue}`)
      }
    }

    // 6. 构建 key_info 摘要
    const keyInfoSummary: string[] = []
    if (match?.key_info && Array.isArray(match.key_info)) {
      match.key_info.forEach((item: { label?: string; type?: string; value?: string }) => {
        if (item.label && item.value) {
          keyInfoSummary.push(`${item.label}（${item.type || ''}）：${item.value}`)
        }
      })
    }

    return {
      name: match?.name || '',
      gender: match?.gender || dimensionMap['gender'] || '',
      meetingScene: match?.meeting_scene || '',
      relationshipStage: match?.relationship_stage || '',
      interactionStatus: match?.interaction_status || '',
      relationshipType: match?.relationship_type || dimensionMap['relationshipGoal'] || 'both',
      mbti: dimensionMap['mbti'] || '',
      attachmentType: dimensionMap['attachmentStyle'] || '',
      profileSummary,
      keyInfoSummary,
      portrait: portrait ? {
        bigFive: {
          openness: portrait.personality_openness,
          conscientiousness: portrait.personality_conscientiousness,
          extraversion: portrait.personality_extraversion,
          agreeableness: portrait.personality_agreeableness,
          neuroticism: portrait.personality_neuroticism,
        },
        emotional: {
          stability: portrait.emotional_stability,
          empathy: portrait.emotional_empathy,
        },
        communication: {
          directness: portrait.communication_directness,
          humor: portrait.communication_humor,
          responsiveness: portrait.communication_responsiveness,
          depth: portrait.communication_depth,
        },
        interactionStyle: portrait.interaction_style,
      } : null,
      interactionCount: interactions?.length || 0,
      totalEnergy,
      avgQuality: Math.round(avgQuality),
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
      interactionCount: number
      totalEnergy: number
      avgQuality: number
      relationshipStage: string
      readinessForRelationship?: string
      datingPacePreference?: string
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
    if (objectInfo.relationshipType === 'long_term' || objectInfo.relationshipType === 'serious_dating') {
      relationshipFactor = 1.2
    } else if (objectInfo.relationshipType === 'short_term') {
      relationshipFactor = 0.8
    }

    let attachmentFactor = 1
    if (objectInfo.attachmentType === 'secure') {
      attachmentFactor = 0.9
    } else if (objectInfo.attachmentType === 'anxious') {
      attachmentFactor = 0.8
    } else if (objectInfo.attachmentType === 'avoidant' || objectInfo.attachmentType === 'fearful') {
      attachmentFactor = 1.3
    }

    // 关系阶段加成
    const stageProgress: Record<string, number> = {
      'just_met': 0, 'got_contact': 10, 'chatting': 20,
      'met_up': 40, 'dating': 60, 'exclusive': 80, 'committed': 90,
    }
    const stageScore = stageProgress[objectInfo.relationshipStage] || 0
    const progressFactor = Math.max(0.5, 1 - stageScore / 200)

    const energyFactor = Math.max(0.6, 1 - objectInfo.totalEnergy / 200)
    const interactionFactor = Math.max(0.7, 1 - objectInfo.interactionCount / 20)

    // 互动质量加成（高质量互动降低难度）
    let qualityFactor = 1
    if (objectInfo.avgQuality > 7) qualityFactor = 0.85
    else if (objectInfo.avgQuality > 5) qualityFactor = 0.95
    else if (objectInfo.avgQuality < 3) qualityFactor = 1.15

    const totalDifficulty = baseDifficulty * timeFactor * relationshipFactor * attachmentFactor * progressFactor * energyFactor * interactionFactor * qualityFactor
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
    if (attachmentFactor > 1) factors.push('回避/恐惧型依恋')
    if (stageScore > 30) factors.push('关系已有基础')
    if (objectInfo.totalEnergy > 30) factors.push('关系能量充足')
    if (qualityFactor < 1) factors.push('互动质量较高')
    if (qualityFactor > 1) factors.push('互动质量偏低')

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
      gender: string
      meetingScene: string
      relationshipStage: string
      interactionStatus: string
      relationshipType: string
      mbti: string
      attachmentType: string
      profileSummary: string[]
      keyInfoSummary: string[]
      portrait: {
        bigFive: Record<string, number>
        emotional: Record<string, number>
        communication: Record<string, number>
        interactionStyle: string
      } | null
      interactionCount: number
      totalEnergy: number
      avgQuality: number
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
      'serious_dating': '认真恋爱',
      'casual_dating': '轻松约会',
    }
    const relationshipDesc = relationshipTypeDesc[objectInfo.relationshipType] || '未明确'

    // 构建对象档案摘要
    const profileSection = objectInfo.profileSummary.length > 0
      ? objectInfo.profileSummary.join('\n')
      : '暂无详细档案信息'

    // 构建 AI 洞察摘要
    const keyInfoSection = objectInfo.keyInfoSummary.length > 0
      ? objectInfo.keyInfoSummary.join('\n')
      : '暂无'

    // 构建画像量化摘要
    let portraitSection = '暂无画像数据'
    if (objectInfo.portrait) {
      const p = objectInfo.portrait
      const bigFiveDesc = Object.entries(p.bigFive)
        .filter(([, v]) => v !== 50) // 过滤掉默认值
        .map(([k, v]) => {
          const labels: Record<string, string> = {
            openness: '开放性', conscientiousness: '尽责性',
            extraversion: '外向性', agreeableness: '宜人性', neuroticism: '神经质',
          }
          const level = v >= 70 ? '高' : v <= 30 ? '低' : '中等'
          return `${labels[k] || k}${level}(${v})`
        }).join('、')

      const commDesc = Object.entries(p.communication)
        .filter(([, v]) => v !== 50)
        .map(([k, v]) => {
          const labels: Record<string, string> = {
            directness: '直接度', humor: '幽默感',
            responsiveness: '回复积极性', depth: '沟通深度',
          }
          const level = v >= 70 ? '高' : v <= 30 ? '低' : '中等'
          return `${labels[k] || k}${level}(${v})`
        }).join('、')

      portraitSection = [bigFiveDesc, commDesc, p.interactionStyle ? `互动风格：${p.interactionStyle}` : ''].filter(Boolean).join('\n')
    }

    const stageDesc: Record<string, string> = {
      'just_met': '刚认识', 'got_contact': '已获得联系方式',
      'chatting': '聊天中', 'met_up': '已见面', 'dating': '约会中',
      'exclusive': '已确定排他关系', 'committed': '已承诺关系',
    }

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

关键要求：
- 你必须充分结合对方的档案数据（性格、偏好、边界等）来制定个性化方案
- 如果对方有明确的边界或底线（如 physicalIntimacyTimeline、boundariesStyle、dealbreakerList），方案中必须予以尊重和体现
- 利用对方的兴趣爱好、爱的语言等偏好来设计具体的约会和互动建议
- 结合对方的性格特点（如 MBTI、依恋类型、沟通风格）来调整话术和推进节奏

输出要求：
1. 方案应该具体、可执行，深度结合对方档案数据
2. 每个步骤都要有明确的时间节点
3. 根据关系类型和对方性格调整节奏和策略
4. 给出具体的聊天话题或行动建议，要贴合对方的兴趣和偏好
5. 指出需要注意的边界和尊重事项，特别是对方明确设定的底线

输出格式：
【总体策略】（一句话概括，体现对对方性格的针对性）
【难度分析】（结合难度系数、影响因素和对方性格特点）
【分步计划】
1. 第X步：xxx（时间：XX小时内）
   - 具体行动（结合对方兴趣和偏好）
   - 话术示例（符合对方沟通风格）
2. ...
【注意事项】（特别强调尊重边界和双方意愿，引用对方明确的底线）
【备选方案】（如果计划受阻，提供替代路径）`

    const userMessage = `请为以下情况生成关系推进方案：

【互动背景】
${background || '未提供'}

【当前进展】
- 关系阶段：${stageDesc[objectInfo.relationshipStage] || objectInfo.relationshipStage || '未知'}
- 互动状态：${objectInfo.interactionStatus || '未知'}
- 已达成的进展：${progressNames.length > 0 ? progressNames.join('、') : '刚开始认识'}
- 互动次数：${objectInfo.interactionCount}次
- 互动质量评分：${objectInfo.avgQuality}/10
- 关系能量：${objectInfo.totalEnergy}

【对象完整档案】
姓名：${objectInfo.name}
性别：${objectInfo.gender || '未知'}
认识场景：${objectInfo.meetingScene || '未知'}
关系类型：${relationshipDesc}
MBTI：${objectInfo.mbti || '未知'}
依恋类型：${objectInfo.attachmentType || '未知'}

--- 个人资料 ---
${profileSection}

--- AI 洞察分析 ---
${keyInfoSection}

--- 性格画像 ---
${portraitSection}

【目标】
在${targetHours}小时内推进到"${targetDisplayName}"阶段

【难度系数】
${difficulty.score}/10（${difficulty.level}）
影响因素：${difficulty.factors.length > 0 ? difficulty.factors.join('、') : '无特殊因素'}

请结合对方档案数据生成具体、个性化的推进方案。方案中要具体引用对方的性格特点、兴趣爱好、偏好和边界来设计每一步行动。`

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

    // 补充获取对象档案数据，让对话中也能参考
    const objectProfile = await this.getMatchInfo(plan.match_id, request)
    const profileHint = objectProfile.profileSummary.length > 0
      ? `\n\n--- 对方关键档案 ---\n${objectProfile.profileSummary.slice(0, 15).join('\n')}\n\n对方MBTI：${objectProfile.mbti || '未知'}，依恋类型：${objectProfile.attachmentType || '未知'}，爱的语言：${objectProfile.profileSummary.find(s => s.startsWith('爱的语言'))?.replace('爱的语言：', '') || '未知'}`
      : ''
    const keyInfoHint = objectProfile.keyInfoSummary.length > 0
      ? `\n\n--- AI之前的洞察 ---\n${objectProfile.keyInfoSummary.join('\n')}`
      : ''

    const systemPrompt = `你是一位专业的婚恋情感咨询师，正在帮助用户推进恋爱关系。

当前方案背景：
- 对象：${plan.matches?.name || '对方'}
- 目标：在${plan.target_hours}小时内推进到"${targetName}"
- 难度：${plan.difficulty_score}/10
- 背景：${plan.background || '未提供'}${profileHint}${keyInfoHint}

你的任务是：
1. 根据用户的反馈调整方案，方案要结合对方的档案数据
2. 回答用户的具体问题
3. 提供应对建议，考虑对方的性格和偏好
4. 保持真诚、尊重的态度

回复要求：
- 简洁实用，避免重复
- 针对用户的具体问题回答
- 如果用户说某步骤不合适，提供替代方案
- 保持温暖的语气
- 参考对方档案数据给出个性化建议`

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
