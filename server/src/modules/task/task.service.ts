import { Injectable, Inject, forwardRef } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk'
import { MatchService } from '../match/match.service'
import { getSupabaseClient } from '@/storage/database/supabase-client'

// 任务分类
export type TaskCategory = 'prepare' | 'chat' | 'game' | 'romantic'

// 任务来源
export type TaskSource = 'system' | 'ai' | 'manual'

// 任务接口
export interface Task {
  id: number
  matchId: number  // 关联的对象ID
  category: TaskCategory
  title: string
  description: string
  difficulty: '简单' | '中等' | '困难'
  duration: string
  source: TaskSource
  completed: boolean
  completedAt?: string
  createdAt: string
  // 任务详情
  reason?: string       // 做这个任务的原因
  steps?: string[]      // 执行步骤
  tags?: string[]       // 多维标签（信息补全/关系推进/周期适配/互动破冰/情感升温 等）
  // 关联信息
  relatedKeyInfo?: string[]  // 关联的关键信息类型
  relatedStage?: string      // 关联的关系阶段
  // 周期阶段适配
  suitablePhases?: string[]  // 适合的周期阶段（为空表示通用）
  avoidPhases?: string[]     // 应避免的周期阶段
  // 学习记录
  lessonLearned?: string     // 完成后学到了什么
}

// 数据库任务格式
interface DbTask {
  id: number
  match_id: number
  category: string
  title: string
  description: string | null
  difficulty: string | null
  duration: string | null
  source: string | null
  completed: number
  completed_at: string | null
  related_key_info: unknown
  related_stage: string | null
  suitable_phases: unknown
  avoid_phases: unknown
  lesson_learned: string | null
  reason: string | null
  steps: unknown
  tags: unknown
  created_at: string
  updated_at: string | null
}

// AI 生成的任务格式
interface AiGeneratedTask {
  category: 'prepare' | 'chat' | 'game' | 'romantic'
  title: string
  description: string
  difficulty: '简单' | '中等' | '困难'
  duration: string
  reason: string
  steps: string[]
  tags: string[]
  suitablePhases?: string[]
  avoidPhases?: string[]
}

// 匹配上下文（供 LLM 使用）
interface MatchContext {
  // 基础档案
  profile: {
    name: string
    gender: string
    meetingScene: string
    meetingDate: string
    relationshipType: string
    impression: number
    impressionTags: string[]
    notes: string
  }
  // 全部维度数据（按层级分组）
  dimensions: Array<{
    dimensionKey: string
    displayName: string
    value: unknown
    layer: number
    category: string
    importance: string
  }>
  // 推进值
  progress: {
    totalScore: number
    stageName: string
    stageDescription: string
    stageFocus: string
    infoCompleteness: number
    criticalInfoMastery: number
    insights: string[]
    nextActions: string[]
  } | null
  // 关系能量
  energy: {
    totalEnergy: number
    trend: string
    informationScore: number
    interactionScore: number
    emotionalScore: number
    activeBoosters: string[]
    activePenalties: string[]
  } | null
  // 周期阶段
  cycle: {
    day: number
    phase: string
    phaseName: string
    description: string
    recommendations: string[]
  } | null
  // 已完成任务
  completedTasks: Array<{
    title: string
    category: string
    lessonLearned?: string
    completedAt?: string
  }>
  // 待完成任务
  pendingTasks: Array<{
    title: string
    category: string
  }>
  // 最近互动
  recentInteractions: Array<{
    type: string
    title: string
    mood: string | null
    qualityScore: number | null
    startedAt: string | null
  }>
}

// 将数据库记录转换为 Task 接口
const dbToTask = (db: DbTask): Task => ({
  id: db.id,
  matchId: db.match_id,
  category: db.category as TaskCategory,
  title: db.title,
  description: db.description || '',
  difficulty: (db.difficulty as '简单' | '中等' | '困难') || '简单',
  duration: db.duration || '15分钟',
  source: (db.source as TaskSource) || 'system',
  completed: db.completed === 1,
  completedAt: db.completed_at || undefined,
  reason: db.reason || undefined,
  steps: Array.isArray(db.steps) ? db.steps as string[] : undefined,
  tags: Array.isArray(db.tags) ? db.tags as string[] : undefined,
  relatedKeyInfo: Array.isArray(db.related_key_info) ? db.related_key_info as string[] : undefined,
  relatedStage: db.related_stage || undefined,
  suitablePhases: Array.isArray(db.suitable_phases) ? db.suitable_phases as string[] : undefined,
  avoidPhases: Array.isArray(db.avoid_phases) ? db.avoid_phases as string[] : undefined,
  lessonLearned: db.lesson_learned || undefined,
  createdAt: db.created_at,
})

@Injectable()
export class TaskService {
  constructor(
    @Inject(forwardRef(() => MatchService))
    private readonly matchService: MatchService,
  ) {}

  /**
   * 获取指定对象的任务列表
   */
  async getTaskList(matchId?: number) {
    try {
      const client = getSupabaseClient()
      let query = client
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (matchId) {
        query = query.eq('match_id', matchId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Get task list error:', error)
        return { code: 500, data: [], message: `获取任务列表失败: ${error.message}` }
      }

      const tasks = (data as DbTask[]).map(dbToTask)
      return { code: 200, data: tasks, message: 'success' }
    } catch (error) {
      console.error('Get task list error:', error)
      return { code: 500, data: [], message: '获取任务列表失败' }
    }
  }

  /**
   * 获取任务进度
   */
  async getProgress(matchId?: number) {
    try {
      const client = getSupabaseClient()
      let query = client.from('tasks').select('completed')

      if (matchId) {
        query = query.eq('match_id', matchId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Get progress error:', error)
        return { code: 500, data: { completed: 0, total: 0, percentage: 0 }, message: `获取进度失败: ${error.message}` }
      }

      const tasks = data as { completed: number }[]
      const total = tasks.length
      const completed = tasks.filter(t => t.completed === 1).length

      return {
        code: 200,
        data: {
          completed,
          total,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        },
        message: 'success',
      }
    } catch (error) {
      console.error('Get progress error:', error)
      return { code: 500, data: { completed: 0, total: 0, percentage: 0 }, message: '获取进度失败' }
    }
  }

  /**
   * 获取指定对象的任务统计（供 MatchService 使用）
   */
  async getTaskStats(matchId: number): Promise<{ total: number; completed: number }> {
    try {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('tasks')
        .select('completed')
        .eq('match_id', matchId)

      if (error) {
        console.error('Get task stats error:', error)
        return { total: 0, completed: 0 }
      }

      const tasks = data as { completed: number }[]
      return {
        total: tasks.length,
        completed: tasks.filter(t => t.completed === 1).length,
      }
    } catch (error) {
      console.error('Get task stats error:', error)
      return { total: 0, completed: 0 }
    }
  }

  /**
   * 创建任务
   */
  async createTask(matchId: number, taskData: {
    category: TaskCategory
    title: string
    description: string
    difficulty?: '简单' | '中等' | '困难'
    duration?: string
    source?: TaskSource
    reason?: string
    steps?: string[]
    tags?: string[]
    relatedKeyInfo?: string[]
    relatedStage?: string
    suitablePhases?: string[]
    avoidPhases?: string[]
  }) {
    try {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('tasks')
        .insert({
          match_id: matchId,
          category: taskData.category,
          title: taskData.title,
          description: taskData.description,
          difficulty: taskData.difficulty || '简单',
          duration: taskData.duration || '15分钟',
          source: taskData.source || 'manual',
          completed: 0,
          reason: taskData.reason || null,
          steps: taskData.steps || [],
          tags: taskData.tags || [],
          related_key_info: taskData.relatedKeyInfo || [],
          related_stage: taskData.relatedStage || null,
          suitable_phases: taskData.suitablePhases || [],
          avoid_phases: taskData.avoidPhases || [],
        })
        .select()
        .single()

      if (error) {
        console.error('Create task error:', error)
        return null
      }

      return dbToTask(data as DbTask)
    } catch (error) {
      console.error('Create task error:', error)
      return null
    }
  }

  /**
   * 批量创建任务（AI建议转任务，供外部调用）
   */
  async createTasksFromAI(matchId: number, suggestions: Array<{ action: string; reason: string; tips: string }>) {
    const createdTasks: Task[] = []

    for (const suggestion of suggestions) {
      const task = await this.createTask(matchId, {
        category: 'chat',
        title: suggestion.action,
        description: `${suggestion.reason}。注意：${suggestion.tips}`,
        difficulty: '简单',
        duration: '15分钟',
        source: 'ai',
      })

      if (task) {
        createdTasks.push(task)
      }
    }

    return createdTasks
  }

  /**
   * 从AI建议创建任务（供外部调用）
   */
  async createFromSuggestions(matchId: number, suggestions: Array<{ action: string; reason: string; tips: string }>) {
    return this.createTasksFromAI(matchId, suggestions)
  }

  // ==================== 核心改造：AI 驱动的任务生成 ====================

  /**
   * 聚合匹配对象的全部上下文数据
   */
  private async collectMatchContext(matchId: number): Promise<MatchContext> {
    const client = getSupabaseClient()

    // 1. 基础档案
    const { data: matchData } = await client
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    const match = matchData as any
    const profile: MatchContext['profile'] = {
      name: match?.name || '',
      gender: match?.gender || '',
      meetingScene: match?.meeting_scene || '',
      meetingDate: match?.meeting_date || '',
      relationshipType: match?.relationship_type || '',
      impression: match?.impression || 0,
      impressionTags: match?.impression_tags || [],
      notes: match?.notes || '',
    }

    // 2. 全部维度数据（关联维度定义获取 display_name、layer、category、importance）
    const { data: dimensionValues } = await client
      .from('profile_dimension_values')
      .select(`
        dimension_key,
        value,
        definition:dimension_definitions!inner(display_name, layer, category, importance)
      `)
      .eq('match_id', matchId)

    const dimensions: MatchContext['dimensions'] = (dimensionValues || []).map((dv: any) => ({
      dimensionKey: dv.dimension_key,
      displayName: dv.definition?.display_name || dv.dimension_key,
      value: dv.value,
      layer: dv.definition?.layer || 1,
      category: dv.definition?.category || 'unknown',
      importance: dv.definition?.importance || 'optional',
    }))

    // 3. 推进值
    let progress: MatchContext['progress'] = null
    try {
      const progressScore = await this.matchService.calculateProgressScore(matchId)
      progress = {
        totalScore: progressScore.total,
        stageName: progressScore.stage.name,
        stageDescription: progressScore.stage.description,
        stageFocus: progressScore.stage.focus,
        infoCompleteness: progressScore.breakdown.infoCompleteness,
        criticalInfoMastery: progressScore.breakdown.criticalInfoMastery,
        insights: progressScore.insights,
        nextActions: progressScore.nextActions,
      }
    } catch (e) {
      console.error('Collect progress score error:', e)
    }

    // 4. 关系能量
    let energy: MatchContext['energy'] = null
    try {
      const { data: energyData } = await client
        .from('relationship_energy')
        .select('*')
        .eq('match_id', matchId)
        .single()

      if (energyData) {
        const e = energyData as any
        energy = {
          totalEnergy: e.total_energy || 0,
          trend: e.trend || 'stable',
          informationScore: e.information_score || 0,
          interactionScore: e.interaction_score || 0,
          emotionalScore: e.emotional_score || 0,
          activeBoosters: e.active_boosters || [],
          activePenalties: e.active_penalties || [],
        }
      }
    } catch (e) {
      console.error('Collect energy error:', e)
    }

    // 5. 周期阶段
    let cycle: MatchContext['cycle'] = null
    try {
      const cycleStartDate = match?.cycle_start_date
      const cycleLength = match?.cycle_length || 28
      if (cycleStartDate) {
        cycle = this.calculateCyclePhase(cycleStartDate, cycleLength)
      }
    } catch (e) {
      console.error('Collect cycle error:', e)
    }

    // 6. 已完成任务
    const { data: completedTasksData } = await client
      .from('tasks')
      .select('title, category, lesson_learned, completed_at')
      .eq('match_id', matchId)
      .eq('completed', 1)
      .order('completed_at', { ascending: false })
      .limit(20)

    const completedTasks: MatchContext['completedTasks'] = (completedTasksData || []).map((t: any) => ({
      title: t.title,
      category: t.category,
      lessonLearned: t.lesson_learned || undefined,
      completedAt: t.completed_at || undefined,
    }))

    // 7. 待完成任务
    const { data: pendingTasksData } = await client
      .from('tasks')
      .select('title, category')
      .eq('match_id', matchId)
      .eq('completed', 0)

    const pendingTasks: MatchContext['pendingTasks'] = (pendingTasksData || []).map((t: any) => ({
      title: t.title,
      category: t.category,
    }))

    // 8. 最近互动
    const { data: interactionsData } = await client
      .from('interaction_events')
      .select('interaction_type, title, mood, quality_score, started_at')
      .eq('match_id', matchId)
      .order('started_at', { ascending: false })
      .limit(5)

    const recentInteractions: MatchContext['recentInteractions'] = (interactionsData || []).map((i: any) => ({
      type: i.interaction_type,
      title: i.title || '',
      mood: i.mood,
      qualityScore: i.quality_score,
      startedAt: i.started_at,
    }))

    return {
      profile,
      dimensions,
      progress,
      energy,
      cycle,
      completedTasks,
      pendingTasks,
      recentInteractions,
    }
  }

  /**
   * 计算周期阶段
   */
  private calculateCyclePhase(
    cycleStartDate: string,
    cycleLength: number = 28
  ): { phase: string; phaseName: string; description: string; recommendations: string[]; day: number } {
    const startDate = new Date(cycleStartDate)
    const today = new Date()
    const dayDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const currentDay = (dayDiff % cycleLength) + 1

    let phase = 'follicular'
    let phaseName = '卵泡期'
    let description = '精力充沛，适合主动出击'
    const recommendations: string[] = []

    if (currentDay <= 5) {
      phase = 'menstrual'
      phaseName = '月经期'
      description = '身体需要休息，多关心体贴'
      recommendations.push('避免安排体力活动', '可以准备贴心物品', '多问候关心身体状况')
    } else if (currentDay <= 14) {
      phase = 'follicular'
      phaseName = '卵泡期'
      description = '精力充沛，适合主动出击'
      recommendations.push('适合安排约会活动', '可以尝试新的话题和互动', '对方情绪较为稳定')
    } else if (currentDay <= 17) {
      phase = 'ovulation'
      phaseName = '排卵期'
      description = '魅力高峰期，互动效果最佳'
      recommendations.push('最佳约会时期', '适合进行重要对话', '注意对方可能更加敏感')
    } else if (currentDay <= 21) {
      phase = 'luteal_early'
      phaseName = '黄体早期'
      description = '情绪稳定，适合日常互动'
      recommendations.push('保持正常互动频率', '适合轻松的话题')
    } else if (currentDay <= 25) {
      phase = 'luteal_mid'
      phaseName = '黄体中期'
      description = '可能出现经前症状，需要耐心'
      recommendations.push('多些耐心和理解', '避免敏感话题', '可以准备一些小惊喜')
    } else {
      phase = 'luteal_late'
      phaseName = '黄体晚期'
      description = '经前症状明显，格外关心'
      recommendations.push('格外关心和体贴', '避免安排重要活动', '准备温热食物或饮品')
    }

    return { phase, phaseName, description, recommendations, day: currentDay }
  }

  /**
   * 构建维度数据摘要（按层级分组，用于 prompt）
   */
  private buildDimensionSummary(dimensions: MatchContext['dimensions']): string {
    if (!dimensions || dimensions.length === 0) {
      return '暂无维度数据'
    }

    const layerNames: Record<number, string> = {
      1: '基础档案',
      2: '性格特质',
      3: '生活偏好',
      4: '互动策略',
      5: '近期状态',
    }

    const grouped: Record<number, Array<{ key: string; name: string; value: unknown; importance: string }>> = {}
    for (const d of dimensions) {
      if (!grouped[d.layer]) grouped[d.layer] = []
      grouped[d.layer].push({
        key: d.dimensionKey,
        name: d.displayName,
        value: d.value,
        importance: d.importance,
      })
    }

    const parts: string[] = []
    for (const [layer, items] of Object.entries(grouped)) {
      const layerName = layerNames[Number(layer)] || `层级${layer}`
      const itemsStr = items
        .map(i => {
          const valStr = typeof i.value === 'object' ? JSON.stringify(i.value) : String(i.value)
          const impMark = i.importance === 'critical' ? '⭐' : i.importance === 'important' ? '📌' : ''
          return `  - ${i.name}(${i.key}): ${valStr} ${impMark}`
        })
        .join('\n')
      parts.push(`【${layerName}】\n${itemsStr}`)
    }

    return parts.join('\n\n')
  }

  /**
   * 构建 LLM prompt
   */
  private buildGenerationPrompt(context: MatchContext): string {
    const { profile, dimensions, progress, energy, cycle, completedTasks, pendingTasks, recentInteractions } = context

    // 维度摘要
    const dimensionSummary = this.buildDimensionSummary(dimensions)

    // 推进值
    const progressStr = progress
      ? `总分: ${progress.totalScore}/100
当前阶段: ${progress.stageName}（${progress.stageDescription}）
阶段重点: ${progress.stageFocus}
信息完整度: ${progress.infoCompleteness}/60
关键信息掌握度: ${progress.criticalInfoMastery}/20
洞察: ${progress.insights.join('；') || '无'}
建议下一步: ${progress.nextActions.join('；') || '无'}`
      : '暂无推进数据'

    // 关系能量
    const energyStr = energy
      ? `总能量: ${energy.totalEnergy}
趋势: ${energy.trend}
信息分: ${energy.informationScore} | 互动分: ${energy.interactionScore} | 情感分: ${energy.emotionalScore}
活跃加成: ${energy.activeBoosters.length > 0 ? energy.activeBoosters.join('、') : '无'}
活跃衰减: ${energy.activePenalties.length > 0 ? energy.activePenalties.join('、') : '无'}`
      : '暂无能量数据'

    // 周期阶段
    const cycleStr = cycle
      ? `当前阶段: ${cycle.phaseName}（Day ${cycle.day}）
描述: ${cycle.description}
建议: ${cycle.recommendations.join('；')}`
      : '暂无周期数据'

    // 已完成任务
    const completedStr = completedTasks.length > 0
      ? completedTasks.map(t => {
          let s = `- "${t.title}"(${t.category})`
          if (t.lessonLearned) s += ` → 经验: ${t.lessonLearned}`
          return s
        }).join('\n')
      : '暂无已完成任务'

    // 待完成任务
    const pendingStr = pendingTasks.length > 0
      ? pendingTasks.map(t => `- "${t.title}"(${t.category})`).join('\n')
      : '暂无待完成任务'

    // 最近互动
    const interactionStr = recentInteractions.length > 0
      ? recentInteractions.map(i => `- ${i.type}${i.title ? ': ' + i.title : ''} | 心情: ${i.mood || '未知'} | 质量: ${i.qualityScore || '未知'}`).join('\n')
      : '暂无互动记录'

    return `你是一位专业的恋爱关系顾问。请根据以下对象的全部信息，为用户生成个性化的行动任务。

## 对象档案
- 姓名: ${profile.name}
- 性别: ${profile.gender}
- 认识场景: ${profile.meetingScene}
- 认识日期: ${profile.meetingDate}
- 关系类型: ${profile.relationshipType || '未设定'}
- 印象分: ${profile.impression}/10
- 印象标签: ${profile.impressionTags.join('、') || '无'}
- 备注: ${profile.notes || '无'}

## 已知维度信息
${dimensionSummary}

## 关系进度
${progressStr}

## 关系能量
${energyStr}

## 生理周期
${cycleStr}

## 已完成任务（近期）
${completedStr}

## 当前待完成任务
${pendingStr}

## 最近互动
${interactionStr}

---

请生成 5-8 个个性化行动任务，要求：

1. 每个任务必须包含: category, title, description, difficulty, duration, reason, steps, tags, suitablePhases, avoidPhases
2. category 取值: prepare(准备/了解信息), chat(聊天交流), game(互动游戏), romantic(浪漫约会)
3. suitablePhases 和 avoidPhases 取值: menstrual, follicular, ovulation, luteal_early, luteal_mid, luteal_late（为空数组表示通用）
4. reason: 说明为什么要做这个任务（基于具体数据，如"你们已经认识2周但还没有了解她的饮食偏好"或"当前处于卵泡期，她精力充沛适合约出来"）
5. steps: 2-4个具体执行步骤（如"1. 侧面问她的同事她喜欢什么菜系 2. 查找附近评分高的对应餐厅 3. 找一个自然的话题提起美食"）
6. tags: 从以下标签中选择1-3个最匹配的：信息补全, 关系推进, 周期适配, 互动破冰, 情感升温, 深度了解, 趣味互动, 浪漫约会, 贴心关怀, 话题拓展, 表达心意, 创造回忆
7. 任务必须基于对象的已知维度信息个性化定制，禁止生成泛泛而谈的通用任务
8. 优先弥补信息短板：未填写的 critical/important 维度 → 对应 prepare 类型任务
9. 根据关系推进阶段推荐适合的互动深度和方式
10. 根据周期阶段调整任务内容：月经期/黄体晚期避免体力消耗和浪漫约会，卵泡期/排卵期适合约会和深度交流
11. 严禁与已完成的任务或当前待完成任务重复或高度相似
12. 已完成任务的 lessonLearned 经验要体现在新任务中
13. 根据关系能量趋势决定任务节奏：能量上升期可安排更多任务，下降期减少任务数量和难度

返回纯 JSON 数组，格式如下，不要包含任何其他文字：
[
  {
    "category": "prepare",
    "title": "任务标题",
    "description": "任务描述，包含具体操作建议",
    "difficulty": "简单",
    "duration": "15分钟",
    "reason": "为什么要做这个任务，基于具体数据给出理由",
    "steps": ["步骤1：具体操作", "步骤2：具体操作", "步骤3：具体操作"],
    "tags": ["信息补全", "贴心关怀"],
    "suitablePhases": ["follicular", "ovulation"],
    "avoidPhases": ["menstrual"]
  }
]`
  }

  /**
   * 调用 LLM 生成任务
   */
  private async callLLMToGenerateTasks(context: MatchContext, req?: Request): Promise<AiGeneratedTask[]> {
    try {
      const customHeaders = req
        ? HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
        : {}
      const config = new Config()
      const client = new LLMClient(config, customHeaders)

      const prompt = this.buildGenerationPrompt(context)

      console.log('Task generation prompt length:', prompt.length)

      const response = await client.invoke(
        [{ role: 'user', content: prompt }],
        { temperature: 0.7 }
      )

      const content = response.content

      // 解析 JSON
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        console.error('LLM response is not a JSON array:', content.substring(0, 200))
        return []
      }

      const parsed = JSON.parse(jsonMatch[0]) as AiGeneratedTask[]

      // 校验每个任务的字段
      const validTasks: AiGeneratedTask[] = []
      const validCategories = ['prepare', 'chat', 'game', 'romantic']
      const validDifficulties = ['简单', '中等', '困难']
      const validPhases = ['menstrual', 'follicular', 'ovulation', 'luteal_early', 'luteal_mid', 'luteal_late']
      const validTags = ['信息补全', '关系推进', '周期适配', '互动破冰', '情感升温', '深度了解', '趣味互动', '浪漫约会', '贴心关怀', '话题拓展', '表达心意', '创造回忆']

      for (const task of parsed) {
        if (!task.title || !task.description) continue
        if (!validCategories.includes(task.category)) task.category = 'chat'
        if (!validDifficulties.includes(task.difficulty)) task.difficulty = '简单'
        if (!task.duration) task.duration = '15分钟'
        if (!task.reason) task.reason = '基于当前关系状态推荐'
        if (!Array.isArray(task.steps) || task.steps.length === 0) task.steps = ['按任务描述执行']
        if (!Array.isArray(task.tags)) task.tags = []
        else task.tags = task.tags.filter((t: string) => validTags.includes(t))
        if (!Array.isArray(task.suitablePhases)) task.suitablePhases = []
        else task.suitablePhases = task.suitablePhases.filter((p: string) => validPhases.includes(p))
        if (!Array.isArray(task.avoidPhases)) task.avoidPhases = []
        else task.avoidPhases = task.avoidPhases.filter((p: string) => validPhases.includes(p))

        validTasks.push(task)
      }

      return validTasks.slice(0, 10)
    } catch (error) {
      console.error('Call LLM to generate tasks error:', error)
      return []
    }
  }

  /**
   * 计算两个字符串的相似度（简单版，用于去重）
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim()
    const s2 = str2.toLowerCase().trim()
    if (s1 === s2) return 1
    if (s1.length === 0 || s2.length === 0) return 0
    const len = Math.max(s1.length, s2.length)
    let matches = 0
    const minLen = Math.min(s1.length, s2.length)
    for (let i = 0; i < minLen; i++) {
      if (s1[i] === s2[i]) matches++
    }
    return matches / len
  }

  /**
   * AI 驱动的任务生成（核心入口）
   * 后端自动聚合全部数据，无需前端传参
   */
  async generateRecommendedTasks(matchId: number, req?: Request) {
    console.log('Generating AI tasks for matchId:', matchId)

    // 1. 聚合全部上下文
    const context = await this.collectMatchContext(matchId)

    // 2. 调用 LLM 生成任务
    const aiTasks = await this.callLLMToGenerateTasks(context, req)

    if (aiTasks.length === 0) {
      console.warn('LLM generated 0 tasks for matchId:', matchId)
      return []
    }

    // 3. 去重：与现有任务标题对比
    const existingTitles = new Set([
      ...context.completedTasks.map(t => t.title),
      ...context.pendingTasks.map(t => t.title),
    ])

    const recommendedTasks: Task[] = []

    for (const aiTask of aiTasks) {
      // 标题完全相同 → 跳过
      if (existingTitles.has(aiTask.title)) continue

      // 标题高度相似 → 跳过
      let isDuplicate = false
      for (const existingTitle of existingTitles) {
        if (this.calculateSimilarity(aiTask.title, existingTitle) > 0.8) {
          isDuplicate = true
          break
        }
      }
      if (isDuplicate) continue

      const task = await this.createTask(matchId, {
        category: aiTask.category,
        title: aiTask.title,
        description: aiTask.description,
        difficulty: aiTask.difficulty,
        duration: aiTask.duration,
        reason: aiTask.reason,
        steps: aiTask.steps,
        tags: aiTask.tags,
        source: 'ai',
        suitablePhases: aiTask.suitablePhases,
        avoidPhases: aiTask.avoidPhases,
      })

      if (task) {
        recommendedTasks.push(task)
        existingTitles.add(aiTask.title)
      }
    }

    console.log(`Generated ${recommendedTasks.length} AI tasks for matchId:`, matchId)
    return recommendedTasks
  }

  /**
   * 完成任务（支持记录学习）
   * 任务完成后会自动检查是否需要生成下一批任务
   */
  async completeTask(taskId: number, lessonLearned?: string) {
    try {
      const client = getSupabaseClient()

      // 先获取任务信息
      const { data: taskData } = await client
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single()

      if (!taskData) {
        return { code: 404, data: null, message: 'Task not found' }
      }

      const matchId = (taskData as DbTask).match_id

      // 更新任务状态
      const updateData: Record<string, unknown> = {
        completed: 1,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (lessonLearned) {
        updateData.lesson_learned = lessonLearned
      }

      const { data, error } = await client
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .select()
        .single()

      if (error) {
        console.error('Complete task error:', error)
        return { code: 500, data: null, message: `完成任务失败: ${error.message}` }
      }

      // 检查是否需要生成下一阶段任务
      const shouldGenerateNew = await this.checkAndGenerateNextTasks(matchId)

      return {
        code: 200,
        data: {
          task: dbToTask(data as DbTask),
          newTasksGenerated: shouldGenerateNew.length,
          newTasks: shouldGenerateNew,
        },
        message: 'success'
      }
    } catch (error) {
      console.error('Complete task error:', error)
      return { code: 500, data: null, message: '完成任务失败' }
    }
  }

  /**
   * 检查并生成下一阶段任务
   * 当任务完成率达到阈值时，自动生成下一批推荐任务
   */
  private async checkAndGenerateNextTasks(matchId: number): Promise<Task[]> {
    try {
      const client = getSupabaseClient()

      // 获取当前任务统计
      const { data: tasks } = await client
        .from('tasks')
        .select('completed')
        .eq('match_id', matchId)

      if (!tasks || tasks.length === 0) {
        return []
      }

      const total = tasks.length
      const completed = tasks.filter(t => t.completed === 1).length
      const completionRate = completed / total

      // 当完成率达到80%时，生成新一批任务
      if (completionRate >= 0.8) {
        const newTasks = await this.generateRecommendedTasks(matchId)
        return newTasks
      }

      return []
    } catch (error) {
      console.error('Check and generate next tasks error:', error)
      return []
    }
  }

  /**
   * 更新任务的学习记录
   */
  async updateTaskLesson(taskId: number, lesson: string) {
    try {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('tasks')
        .update({
          lesson_learned: lesson,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single()

      if (error) {
        return { code: 500, data: null, message: `更新失败: ${error.message}` }
      }

      if (!data) {
        return { code: 404, data: null, message: 'Task not found' }
      }

      return { code: 200, data: dbToTask(data as DbTask), message: 'success' }
    } catch (error) {
      console.error('Update task lesson error:', error)
      return { code: 500, data: null, message: '更新失败' }
    }
  }

  /**
   * 删除任务
   */
  async deleteTask(taskId: number) {
    try {
      const client = getSupabaseClient()
      const { error } = await client
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) {
        return { code: 500, data: null, message: `删除失败: ${error.message}` }
      }

      return { code: 200, data: null, message: 'success' }
    } catch (error) {
      console.error('Delete task error:', error)
      return { code: 500, data: null, message: '删除失败' }
    }
  }

  /**
   * 根据阶段更新任务（阶段变化时调用）
   */
  async updateTasksForStage(matchId: number, _newStage: string, _matchData: {
    keyInfo: Array<{ type: string; label: string; value: string }>
    interests: string[]
  }) {
    // 阶段变化时也用 AI 生成新任务
    const newTasks = await this.generateRecommendedTasks(matchId)
    return newTasks
  }
}
