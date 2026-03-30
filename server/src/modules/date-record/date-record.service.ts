import { Injectable, Inject, forwardRef } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk'
import { MatchService, KeyInfo } from '../match/match.service'

// 约会记录接口
export interface DateRecord {
  id: number
  matchId: number  // 关联的对象ID
  date: string     // 约会日期
  location: string // 约会地点
  activity: string // 约会活动
  duration: string // 约会时长
  mood: 'excellent' | 'good' | 'normal' | 'not_good'  // 约会感受
  highlights: string[]  // 精彩瞬间
  notes: string     // 约会笔记
  photos: string[]  // 照片URL
  keyInfoExtracted: ExtractedKeyInfo[]  // AI提取的关键信息
  nextSuggestions: string[]  // 下次约会建议
  createdAt: string
  updatedAt: string
}

// AI提取的关键信息
export interface ExtractedKeyInfo {
  type: string      // 关键信息类型
  label: string     // 标签
  value: string     // 值
  source: string    // 来源描述
  confidence: number // 置信度
}

@Injectable()
export class DateRecordService {
  // 约会记录存储
  private records: DateRecord[] = [
    {
      id: 1,
      matchId: 1,
      date: '2024-03-25',
      location: '星巴克（国贸店）',
      activity: '喝咖啡聊天',
      duration: '2小时',
      mood: 'good',
      highlights: ['聊得很投机', '发现都喜欢旅行'],
      notes: '第一次单独见面，聊了很多关于旅行的话题。她去过很多地方，对日本特别感兴趣。提到她喜欢抹茶味的甜点。',
      photos: [],
      keyInfoExtracted: [
        { type: 'interest', label: '喜欢旅行', value: '去过很多地方，对日本特别感兴趣', source: '约会聊天', confidence: 0.9 },
        { type: 'food_preference', label: '饮食偏好', value: '喜欢抹茶味的甜点', source: '约会聊天', confidence: 0.85 },
      ],
      nextSuggestions: ['可以约去吃日料', '聊聊日本的旅行计划'],
      createdAt: '2024-03-25T10:00:00Z',
      updatedAt: '2024-03-25T12:00:00Z',
    },
    {
      id: 2,
      matchId: 1,
      date: '2024-04-01',
      location: '朝阳公园',
      activity: '野餐+散步',
      duration: '4小时',
      mood: 'excellent',
      highlights: ['牵手成功', '看了日落'],
      notes: '天气很好，带了她喜欢的三明治。一起散步的时候牵了她的手，她没有拒绝。聊到她下个月生日，她说往年都是和家人一起过。',
      photos: [],
      keyInfoExtracted: [
        { type: 'anniversary', label: '生日', value: '下个月（5月）', source: '约会聊天', confidence: 0.95 },
      ],
      nextSuggestions: ['准备生日惊喜', '计划下一次约会'],
      createdAt: '2024-04-01T10:00:00Z',
      updatedAt: '2024-04-01T18:00:00Z',
    },
    {
      id: 3,
      matchId: 2,
      date: '2024-03-28',
      location: '健身房',
      activity: '一起健身',
      duration: '1.5小时',
      mood: 'good',
      highlights: ['她教我做瑜伽'],
      notes: '她很专业，教了我一些瑜伽动作。提到她养的猫最近生病了，有点担心。',
      photos: [],
      keyInfoExtracted: [
        { type: 'pet', label: '宠物', value: '猫最近生病了', source: '约会聊天', confidence: 0.9 },
      ],
      nextSuggestions: ['关心她的猫', '约她去宠物医院'],
      createdAt: '2024-03-28T08:00:00Z',
      updatedAt: '2024-03-28T10:00:00Z',
    },
  ]

  private nextId = 4

  constructor(
    @Inject(forwardRef(() => MatchService))
    private readonly matchService: MatchService,
  ) {}

  /**
   * 获取约会记录列表
   */
  getRecordsByMatchId(matchId: number) {
    const records = this.records
      .filter(r => r.matchId === matchId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    return {
      code: 200,
      data: records,
      message: 'success',
    }
  }

  /**
   * 获取约会记录详情
   */
  getRecordById(id: number) {
    const record = this.records.find(r => r.id === id)
    if (!record) {
      return { code: 404, data: null, message: 'Not found' }
    }
    return {
      code: 200,
      data: record,
      message: 'success',
    }
  }

  /**
   * 获取约会统计
   */
  getDateStats(matchId: number) {
    const records = this.records.filter(r => r.matchId === matchId)
    const totalDates = records.length
    const excellentDates = records.filter(r => r.mood === 'excellent').length
    const goodDates = records.filter(r => r.mood === 'good').length
    
    // 计算总约会时长（小时）
    const totalHours = records.reduce((sum, r) => {
      const hours = parseFloat(r.duration.replace(/[^0-9.]/g, '')) || 0
      return sum + hours
    }, 0)

    // 最近约会
    const lastDate = records.length > 0 
      ? records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      : null

    return {
      code: 200,
      data: {
        totalDates,
        excellentDates,
        goodDates,
        totalHours: Math.round(totalHours),
        lastDate: lastDate ? {
          date: lastDate.date,
          activity: lastDate.activity,
          mood: lastDate.mood,
        } : null,
      },
      message: 'success',
    }
  }

  /**
   * 创建约会记录
   */
  async createRecord(
    matchId: number,
    body: {
      date: string
      location: string
      activity: string
      duration: string
      mood: 'excellent' | 'good' | 'normal' | 'not_good'
      highlights?: string[]
      notes?: string
      photos?: string[]
    },
    req: Request
  ) {
    const now = new Date().toISOString()
    
    // 先创建基础记录
    const record: DateRecord = {
      id: this.nextId++,
      matchId,
      date: body.date,
      location: body.location,
      activity: body.activity,
      duration: body.duration,
      mood: body.mood,
      highlights: body.highlights || [],
      notes: body.notes || '',
      photos: body.photos || [],
      keyInfoExtracted: [],
      nextSuggestions: [],
      createdAt: now,
      updatedAt: now,
    }

    // AI提取关键信息
    if (body.notes) {
      try {
        const extracted = await this.extractKeyInfo(
          {
            date: body.date,
            location: body.location,
            activity: body.activity,
            notes: body.notes,
            mood: body.mood,
          },
          req
        )
        record.keyInfoExtracted = extracted.keyInfo
        record.nextSuggestions = extracted.suggestions
        
        // 自动更新对象档案
        if (extracted.keyInfo.length > 0) {
          await this.updateMatchKeyInfo(matchId, extracted.keyInfo)
        }
      } catch (error) {
        console.error('AI extract key info error:', error)
      }
    }

    this.records.push(record)
    
    return {
      code: 200,
      data: record,
      message: 'success',
    }
  }

  /**
   * 更新约会记录
   */
  async updateRecord(
    id: number,
    body: Partial<{
      date: string
      location: string
      activity: string
      duration: string
      mood: 'excellent' | 'good' | 'normal' | 'not_good'
      highlights: string[]
      notes: string
      photos: string[]
    }>,
    req: Request
  ) {
    const index = this.records.findIndex(r => r.id === id)
    if (index === -1) {
      return { code: 404, data: null, message: 'Not found' }
    }

    const record = this.records[index]
    const now = new Date().toISOString()

    // 更新基础信息
    this.records[index] = {
      ...record,
      ...body,
      updatedAt: now,
    }

    // 如果更新了笔记，重新提取关键信息
    if (body.notes && body.notes !== record.notes) {
      try {
        const extracted = await this.extractKeyInfo(
          {
            date: this.records[index].date,
            location: this.records[index].location,
            activity: this.records[index].activity,
            notes: body.notes,
            mood: this.records[index].mood,
          },
          req
        )
        this.records[index].keyInfoExtracted = extracted.keyInfo
        this.records[index].nextSuggestions = extracted.suggestions
        
        // 更新对象档案
        if (extracted.keyInfo.length > 0) {
          await this.updateMatchKeyInfo(record.matchId, extracted.keyInfo)
        }
      } catch (error) {
        console.error('AI extract key info error:', error)
      }
    }

    return {
      code: 200,
      data: this.records[index],
      message: 'success',
    }
  }

  /**
   * 删除约会记录
   */
  deleteRecord(id: number) {
    const index = this.records.findIndex(r => r.id === id)
    if (index === -1) {
      return { code: 404, data: null, message: 'Not found' }
    }
    this.records.splice(index, 1)
    return { code: 200, data: null, message: 'success' }
  }

  /**
   * 手动触发AI提取关键信息
   */
  async extractKeyInfoManually(id: number, req: Request) {
    const record = this.records.find(r => r.id === id)
    if (!record) {
      return { code: 404, data: null, message: 'Not found' }
    }

    try {
      const extracted = await this.extractKeyInfo(
        {
          date: record.date,
          location: record.location,
          activity: record.activity,
          notes: record.notes,
          mood: record.mood,
        },
        req
      )

      // 更新记录
      const index = this.records.findIndex(r => r.id === id)
      this.records[index].keyInfoExtracted = extracted.keyInfo
      this.records[index].nextSuggestions = extracted.suggestions
      this.records[index].updatedAt = new Date().toISOString()

      // 更新对象档案
      if (extracted.keyInfo.length > 0) {
        await this.updateMatchKeyInfo(record.matchId, extracted.keyInfo)
      }

      return {
        code: 200,
        data: {
          keyInfo: extracted.keyInfo,
          suggestions: extracted.suggestions,
        },
        message: 'success',
      }
    } catch (error) {
      console.error('Extract key info error:', error)
      return {
        code: 500,
        data: null,
        message: 'Extract failed',
      }
    }
  }

  /**
   * 使用AI提取关键信息
   */
  private async extractKeyInfo(
    data: {
      date: string
      location: string
      activity: string
      notes?: string
      mood: string
    },
    req: Request
  ): Promise<{ keyInfo: ExtractedKeyInfo[]; suggestions: string[] }> {
    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
      const config = new Config()
      const client = new LLMClient(config, customHeaders)

      const prompt = this.buildExtractPrompt(data)
      
      const messages = [
        {
          role: 'system' as const,
          content: `你是一位专业的约会顾问，擅长从约会记录中提取有价值的关键信息，帮助用户更好地了解对方。

你需要提取的信息类型包括：
1. birthday - 生日信息
2. hometown - 家乡
3. food_preference - 饮食偏好（喜欢/不喜欢的食物）
4. pet - 宠物相关
5. music - 音乐偏好
6. movie - 电影偏好
7. sports - 运动爱好
8. taboo - 禁忌/不喜欢的事情
9. anniversary - 重要纪念日
10. family - 家庭情况
11. work - 工作相关
12. interest - 其他兴趣爱好
13. personality - 性格特点
14. other - 其他重要信息

请以JSON格式返回，格式如下：
{
  "keyInfo": [
    {
      "type": "信息类型",
      "label": "信息标签",
      "value": "具体内容",
      "source": "来源描述",
      "confidence": 0.9
    }
  ],
  "suggestions": ["下次约会建议1", "下次约会建议2"]
}

注意：
- confidence表示置信度，范围0-1
- 只提取明确提到的信息，不要推测
- 建议要具体可执行`,
        },
        {
          role: 'user' as const,
          content: prompt,
        },
      ]

      const response = await client.invoke(messages, { temperature: 0.3 })
      
      return this.parseExtractResponse(response.content)
    } catch (error) {
      console.error('AI extract error:', error)
      return { keyInfo: [], suggestions: [] }
    }
  }

  private buildExtractPrompt(data: {
    date: string
    location: string
    activity: string
    notes?: string
    mood: string
  }): string {
    const moodLabels = {
      excellent: '非常愉快',
      good: '比较愉快',
      normal: '一般',
      not_good: '不太愉快',
    }

    return `请从以下约会记录中提取关键信息：

【约会基本信息】
- 日期：${data.date}
- 地点：${data.location}
- 活动：${data.activity}
- 感受：${moodLabels[data.mood] || data.mood}

【约会笔记】
${data.notes || '无'}

请提取约会中透露的关于对方的关键信息，并给出下次约会的建议。`
  }

  private parseExtractResponse(content: string): { keyInfo: ExtractedKeyInfo[]; suggestions: string[] } {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          keyInfo: parsed.keyInfo || [],
          suggestions: parsed.suggestions || [],
        }
      }
    } catch {
      // 解析失败
    }
    
    return { keyInfo: [], suggestions: [] }
  }

  /**
   * 更新对象的关键信息
   * 注意：keyInfo 已迁移到维度表，此方法暂时不实现
   */
  private async updateMatchKeyInfo(matchId: number, extractedInfo: ExtractedKeyInfo[]) {
    // TODO: 重写为使用维度 API 更新关键信息
    // 当前版本暂时跳过，避免编译错误
    console.log(`[updateMatchKeyInfo] matchId=${matchId}, extractedInfo=`, extractedInfo)
  }

  private getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      birthday: '🎂',
      hometown: '🏠',
      food_preference: '🍽️',
      pet: '🐱',
      music: '🎵',
      movie: '🎬',
      sports: '⚽',
      taboo: '⚠️',
      anniversary: '📅',
      family: '👨‍👩‍👧',
      work: '💼',
      interest: '💡',
      personality: '💫',
      other: '📝',
    }
    return icons[type] || '📝'
  }
}
