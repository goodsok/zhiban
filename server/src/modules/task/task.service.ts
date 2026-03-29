import { Injectable } from '@nestjs/common'

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
  // 关联信息
  relatedKeyInfo?: string[]  // 关联的关键信息类型
  relatedStage?: string      // 关联的关系阶段
}

// 关系阶段配置
const stageTaskConfigs: Record<string, { categories: TaskCategory[], focus: string }> = {
  new: {
    categories: ['chat', 'prepare'],
    focus: '建立联系、初步了解'
  },
  contacting: {
    categories: ['chat', 'game', 'prepare'],
    focus: '增进了解、寻找共同话题'
  },
  dating: {
    categories: ['romantic', 'game', 'prepare'],
    focus: '创造浪漫、加深感情'
  },
  progressing: {
    categories: ['romantic', 'game'],
    focus: '推进关系、表达心意'
  }
}

// 根据关键信息生成的任务模板
const keyInfoTaskTemplates: Record<string, Array<{ category: TaskCategory, title: string, description: string, difficulty: '简单' | '中等' | '困难', duration: string }>> = {
  birthday: [
    { category: 'romantic', title: '准备生日惊喜', description: '根据Ta的生日准备一份特别的礼物或惊喜', difficulty: '中等', duration: '1-2天' },
    { category: 'chat', title: '聊聊生日回忆', description: '问问Ta往年生日是怎么过的，有什么特别的回忆', difficulty: '简单', duration: '20分钟' },
  ],
  hometown: [
    { category: 'chat', title: '聊聊家乡故事', description: '问问Ta家乡有什么好玩的地方和美食', difficulty: '简单', duration: '15分钟' },
    { category: 'romantic', title: '计划一次家乡之旅', description: '提议一起回Ta家乡看看，体验当地文化', difficulty: '困难', duration: '2-3天' },
  ],
  food_preference: [
    { category: 'prepare', title: '研究Ta喜欢的餐厅', description: '根据Ta的饮食偏好找几家合适的餐厅', difficulty: '简单', duration: '30分钟' },
    { category: 'romantic', title: '准备一顿Ta喜欢的美食', description: '亲手做或带Ta去吃Ta喜欢的食物', difficulty: '中等', duration: '2小时' },
  ],
  pet: [
    { category: 'chat', title: '聊聊Ta的宠物', description: '问问Ta宠物的日常趣事，表现出对宠物的喜爱', difficulty: '简单', duration: '15分钟' },
    { category: 'romantic', title: '送宠物小礼物', description: '给Ta的宠物准备一份小零食或玩具', difficulty: '简单', duration: '30分钟' },
  ],
  music: [
    { category: 'chat', title: '分享音乐品味', description: '聊聊彼此喜欢的音乐，分享歌单', difficulty: '简单', duration: '20分钟' },
    { category: 'romantic', title: '一起去听演唱会', description: '如果有机会，一起去看Ta喜欢的歌手演唱会', difficulty: '困难', duration: '半天' },
  ],
  movie: [
    { category: 'chat', title: '聊聊电影话题', description: '讨论最近上映的电影或Ta喜欢的电影类型', difficulty: '简单', duration: '15分钟' },
    { category: 'romantic', title: '约看电影', description: '根据Ta的喜好选择一部电影一起看', difficulty: '中等', duration: '2-3小时' },
  ],
  sports: [
    { category: 'game', title: '一起运动', description: '约Ta一起做Ta喜欢的运动', difficulty: '中等', duration: '1-2小时' },
    { category: 'chat', title: '聊聊运动话题', description: '问问Ta平时怎么运动，有没有运动搭子', difficulty: '简单', duration: '15分钟' },
  ],
  taboo: [
    { category: 'prepare', title: '记住Ta的禁忌', description: '牢记Ta不喜欢的事情，避免踩雷', difficulty: '简单', duration: '持续注意' },
  ],
  anniversary: [
    { category: 'romantic', title: '记住重要日子', description: '在Ta提到的特殊日期准备惊喜', difficulty: '中等', duration: '提前准备' },
  ],
}

// 根据阶段生成的默认任务
const stageDefaultTasks: Record<string, Array<{ category: TaskCategory, title: string, description: string, difficulty: '简单' | '中等' | '困难', duration: string }>> = {
  new: [
    { category: 'chat', title: '发送第一条消息', description: '主动发消息打招呼，保持轻松自然的语气', difficulty: '简单', duration: '5分钟' },
    { category: 'chat', title: '了解基本背景', description: '聊聊工作、生活、兴趣爱好等基本信息', difficulty: '简单', duration: '20分钟' },
    { category: 'prepare', title: '记住Ta的基本信息', description: '记录Ta的名字、职业、兴趣等重要信息', difficulty: '简单', duration: '10分钟' },
  ],
  contacting: [
    { category: 'chat', title: '分享日常趣事', description: '主动分享生活中有趣的事情，保持互动', difficulty: '简单', duration: '15分钟' },
    { category: 'chat', title: '寻找共同话题', description: '根据Ta的兴趣爱好找到共同话题', difficulty: '简单', duration: '20分钟' },
    { category: 'game', title: '玩线上小游戏', description: '一起玩个简单的手机游戏增进感情', difficulty: '中等', duration: '30分钟' },
    { category: 'prepare', title: '了解Ta的作息', description: '找到合适的聊天时间，不要打扰Ta休息', difficulty: '简单', duration: '持续观察' },
  ],
  dating: [
    { category: 'romantic', title: '计划一次约会', description: '根据Ta的兴趣策划一次特别的约会', difficulty: '中等', duration: '半天' },
    { category: 'prepare', title: '准备约会话题', description: '提前准备几个约会时可以聊的话题', difficulty: '简单', duration: '15分钟' },
    { category: 'game', title: '玩互动游戏', description: '约会时玩个小游戏，增加趣味性', difficulty: '中等', duration: '30分钟' },
    { category: 'romantic', title: '送一份小礼物', description: '准备一份贴心的小礼物表达心意', difficulty: '中等', duration: '1小时' },
  ],
  progressing: [
    { category: 'romantic', title: '创造浪漫氛围', description: '找一个浪漫的场景，营造特殊时刻', difficulty: '中等', duration: '2-3小时' },
    { category: 'romantic', title: '表达真挚情感', description: '用真诚的方式表达你的感受', difficulty: '困难', duration: '适时' },
    { category: 'game', title: '一起规划未来', description: '聊聊对未来的期望和计划', difficulty: '中等', duration: '1小时' },
  ],
}

@Injectable()
export class TaskService {
  // 任务存储
  private tasks: Task[] = [
    {
      id: 1,
      matchId: 1,
      category: 'prepare',
      title: '了解小红的饮食偏好',
      description: '根据记录：不吃辣，爱吃日料，可以找合适的餐厅',
      difficulty: '简单',
      duration: '30分钟',
      source: 'system',
      completed: true,
      createdAt: new Date().toISOString(),
      relatedKeyInfo: ['food_preference'],
      relatedStage: 'contacting',
    },
    {
      id: 2,
      matchId: 1,
      category: 'chat',
      title: '聊聊生日话题',
      description: '小红的生日是6月15日，可以聊聊往年生日怎么过的',
      difficulty: '简单',
      duration: '15分钟',
      source: 'system',
      completed: false,
      createdAt: new Date().toISOString(),
      relatedKeyInfo: ['birthday'],
      relatedStage: 'contacting',
    },
    {
      id: 3,
      matchId: 1,
      category: 'romantic',
      title: '准备生日惊喜',
      description: '为小红准备一份特别的生日礼物',
      difficulty: '中等',
      duration: '1-2天',
      source: 'system',
      completed: false,
      createdAt: new Date().toISOString(),
      relatedKeyInfo: ['birthday'],
      relatedStage: 'dating',
    },
  ]

  private nextId = 4

  /**
   * 获取指定对象的任务列表
   */
  getTaskList(matchId?: number) {
    let filteredTasks = this.tasks
    if (matchId) {
      filteredTasks = this.tasks.filter(t => t.matchId === matchId)
    }
    return {
      code: 200,
      data: filteredTasks,
      message: 'success',
    }
  }

  /**
   * 获取任务进度
   */
  getProgress(matchId?: number) {
    let filteredTasks = this.tasks
    if (matchId) {
      filteredTasks = this.tasks.filter(t => t.matchId === matchId)
    }
    const completed = filteredTasks.filter(t => t.completed).length
    const total = filteredTasks.length
    return {
      code: 200,
      data: {
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
      message: 'success',
    }
  }

  /**
   * 创建任务（支持AI建议转任务）
   */
  createTask(matchId: number, taskData: {
    category: TaskCategory
    title: string
    description: string
    difficulty?: '简单' | '中等' | '困难'
    duration?: string
    source?: TaskSource
    relatedKeyInfo?: string[]
    relatedStage?: string
  }) {
    const newTask: Task = {
      id: this.nextId++,
      matchId,
      category: taskData.category,
      title: taskData.title,
      description: taskData.description,
      difficulty: taskData.difficulty || '简单',
      duration: taskData.duration || '15分钟',
      source: taskData.source || 'manual',
      completed: false,
      createdAt: new Date().toISOString(),
      relatedKeyInfo: taskData.relatedKeyInfo,
      relatedStage: taskData.relatedStage,
    }
    
    this.tasks.push(newTask)
    return newTask
  }

  /**
   * 批量创建任务（AI建议转任务）
   */
  createTasksFromAI(matchId: number, suggestions: Array<{ action: string; reason: string; tips: string }>) {
    const createdTasks: Task[] = []
    
    suggestions.forEach(suggestion => {
      // 根据建议内容判断分类
      const category = this.categorizeTask(suggestion.action)
      
      // 判断难度
      const difficulty = this.estimateDifficulty(suggestion.action, suggestion.tips)
      
      // 估算时长
      const duration = this.estimateDuration(suggestion.action)
      
      const task = this.createTask(matchId, {
        category,
        title: suggestion.action,
        description: `${suggestion.reason}。注意：${suggestion.tips}`,
        difficulty,
        duration,
        source: 'ai',
      })
      
      createdTasks.push(task)
    })
    
    return createdTasks
  }

  /**
   * 根据对象信息生成推荐任务
   */
  generateRecommendedTasks(matchId: number, matchData: {
    relationshipStage: string
    keyInfo: Array<{ type: string; label: string; value: string }>
    interests: string[]
  }) {
    const recommendedTasks: Task[] = []
    const stage = matchData.relationshipStage || 'new'
    
    // 1. 根据阶段添加默认任务
    const stageTasks = stageDefaultTasks[stage] || []
    stageTasks.forEach((taskTemplate, index) => {
      const existingTask = this.tasks.find(
        t => t.matchId === matchId && t.title === taskTemplate.title
      )
      if (!existingTask) {
        const task = this.createTask(matchId, {
          ...taskTemplate,
          source: 'system',
          relatedStage: stage,
        })
        recommendedTasks.push(task)
      }
    })
    
    // 2. 根据关键信息添加个性化任务
    matchData.keyInfo?.forEach(info => {
      const templates = keyInfoTaskTemplates[info.type]
      if (templates) {
        templates.forEach(taskTemplate => {
          const existingTask = this.tasks.find(
            t => t.matchId === matchId && t.title === taskTemplate.title
          )
          if (!existingTask) {
            const task = this.createTask(matchId, {
              ...taskTemplate,
              source: 'system',
              relatedKeyInfo: [info.type],
              description: `${taskTemplate.description}（Ta的${info.label}：${info.value}）`,
            })
            recommendedTasks.push(task)
          }
        })
      }
    })
    
    // 3. 根据兴趣爱好添加任务
    if (matchData.interests?.includes('旅行')) {
      const existingTask = this.tasks.find(
        t => t.matchId === matchId && t.title === '聊聊旅行经历'
      )
      if (!existingTask) {
        const task = this.createTask(matchId, {
          category: 'chat',
          title: '聊聊旅行经历',
          description: 'Ta喜欢旅行，可以聊聊去过的地方和有趣的经历',
          difficulty: '简单',
          duration: '20分钟',
          source: 'system',
        })
        recommendedTasks.push(task)
      }
    }
    
    if (matchData.interests?.includes('美食')) {
      const existingTask = this.tasks.find(
        t => t.matchId === matchId && t.title === '一起品尝美食'
      )
      if (!existingTask) {
        const task = this.createTask(matchId, {
          category: 'romantic',
          title: '一起品尝美食',
          description: 'Ta喜欢美食，可以一起探索好吃的餐厅',
          difficulty: '中等',
          duration: '2小时',
          source: 'system',
        })
        recommendedTasks.push(task)
      }
    }
    
    return recommendedTasks
  }

  /**
   * 完成任务
   */
  completeTask(taskId: number) {
    const task = this.tasks.find(t => t.id === taskId)
    if (task) {
      task.completed = true
      task.completedAt = new Date().toISOString()
      return {
        code: 200,
        data: task,
        message: 'success',
      }
    }
    return {
      code: 404,
      data: null,
      message: 'Task not found',
    }
  }

  /**
   * 删除任务
   */
  deleteTask(taskId: number) {
    const index = this.tasks.findIndex(t => t.id === taskId)
    if (index !== -1) {
      this.tasks.splice(index, 1)
      return { code: 200, data: null, message: 'success' }
    }
    return { code: 404, data: null, message: 'Task not found' }
  }

  /**
   * 根据阶段更新任务（阶段变化时调用）
   */
  updateTasksForStage(matchId: number, newStage: string, matchData: {
    keyInfo: Array<{ type: string; label: string; value: string }>
    interests: string[]
  }) {
    // 获取新阶段的默认任务
    const stageTasks = stageDefaultTasks[newStage] || []
    const newTasks: Task[] = []
    
    stageTasks.forEach(taskTemplate => {
      const existingTask = this.tasks.find(
        t => t.matchId === matchId && t.title === taskTemplate.title
      )
      if (!existingTask) {
        const task = this.createTask(matchId, {
          ...taskTemplate,
          source: 'system',
          relatedStage: newStage,
        })
        newTasks.push(task)
      }
    })
    
    return newTasks
  }

  // 私有方法：根据建议内容判断分类
  private categorizeTask(action: string): TaskCategory {
    const actionLower = action.toLowerCase()
    
    if (actionLower.includes('准备') || actionLower.includes('计划') || actionLower.includes('了解')) {
      return 'prepare'
    }
    if (actionLower.includes('聊') || actionLower.includes('话题') || actionLower.includes('分享') || actionLower.includes('消息')) {
      return 'chat'
    }
    if (actionLower.includes('游戏') || actionLower.includes('玩') || actionLower.includes('互动')) {
      return 'game'
    }
    if (actionLower.includes('约会') || actionLower.includes('礼物') || actionLower.includes('浪漫') || actionLower.includes('表达')) {
      return 'romantic'
    }
    
    // 默认分类
    return 'chat'
  }

  // 私有方法：估算任务难度
  private estimateDifficulty(action: string, tips: string): '简单' | '中等' | '困难' {
    const combined = (action + tips).toLowerCase()
    
    if (combined.includes('准备') || combined.includes('计划') || combined.includes('安排')) {
      return '中等'
    }
    if (combined.includes('表白') || combined.includes('旅行') || combined.includes('求婚')) {
      return '困难'
    }
    
    return '简单'
  }

  // 私有方法：估算任务时长
  private estimateDuration(action: string): string {
    const actionLower = action.toLowerCase()
    
    if (actionLower.includes('消息') || actionLower.includes('问候')) {
      return '5分钟'
    }
    if (actionLower.includes('聊') || actionLower.includes('话题')) {
      return '15-30分钟'
    }
    if (actionLower.includes('约会') || actionLower.includes('见面')) {
      return '2-3小时'
    }
    if (actionLower.includes('准备') || actionLower.includes('计划')) {
      return '1小时'
    }
    
    return '20分钟'
  }

  /**
   * 从AI建议创建任务（供外部调用）
   */
  createFromSuggestions(matchId: number, suggestions: Array<{ action: string; reason: string; tips: string }>) {
    return this.createTasksFromAI(matchId, suggestions)
  }
}
