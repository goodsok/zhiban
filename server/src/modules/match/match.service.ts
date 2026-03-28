import { Injectable } from '@nestjs/common'

export interface Match {
  id: number
  name: string
  age: number
  gender: string
  occupation: string
  meetingScene: string
  meetingDate: string
  impression: number
  impressionTags: string[]
  interests: string[]
  notes: string
  status: string
  nextAction: string
  lastContact: string
  createdAt: Date
}

@Injectable()
export class MatchService {
  // 模拟数据存储
  private matches: Match[] = [
    {
      id: 1,
      name: '小红',
      age: 25,
      gender: 'female',
      occupation: '产品经理',
      meetingScene: 'blind_date',
      meetingDate: '2024-03-20',
      impression: 4,
      impressionTags: ['nice', 'pretty'],
      interests: ['旅行', '摄影', '美食'],
      notes: '相亲认识，印象不错',
      status: 'contacting',
      nextAction: '约她周末去拍照',
      lastContact: new Date().toISOString(),
      createdAt: new Date('2024-03-20'),
    },
    {
      id: 2,
      name: '小芳',
      age: 27,
      gender: 'female',
      occupation: '设计师',
      meetingScene: 'activity',
      meetingDate: '2024-03-15',
      impression: 5,
      impressionTags: ['smart', 'funny'],
      interests: ['健身', '电影', '阅读'],
      notes: '健身房认识',
      status: 'dating',
      nextAction: '第三次约会，看她的展',
      lastContact: new Date().toISOString(),
      createdAt: new Date('2024-03-15'),
    },
    {
      id: 3,
      name: '小丽',
      age: 24,
      gender: 'female',
      occupation: '教师',
      meetingScene: 'app_meetup',
      meetingDate: '2024-03-10',
      impression: 3,
      impressionTags: ['nice'],
      interests: ['音乐', '旅行'],
      notes: '交友App认识',
      status: 'new',
      nextAction: '发第一条消息',
      lastContact: new Date().toISOString(),
      createdAt: new Date('2024-03-10'),
    },
  ]

  private nextId = 4

  getMatchList() {
    return {
      code: 200,
      data: this.matches.map(m => ({
        id: m.id,
        name: m.name,
        age: m.age,
        occupation: m.occupation,
        meetingScene: m.meetingScene,
        impression: m.impression,
        interests: m.interests,
        status: m.status,
        nextAction: m.nextAction,
        lastContact: this.formatLastContact(m.lastContact),
      })),
      message: 'success',
    }
  }

  getMatchDetail(id: number) {
    const match = this.matches.find(m => m.id === id)
    if (!match) {
      return { code: 404, data: null, message: 'Not found' }
    }
    return {
      code: 200,
      data: {
        ...match,
        progress: this.calculateProgress(match),
        stats: {
          tasks: 5,
          completedTasks: 2,
          quizScore: 80,
          dates: 2,
        },
      },
      message: 'success',
    }
  }

  createMatch(body: Partial<Match>) {
    const newMatch: Match = {
      id: this.nextId++,
      name: body.name || '',
      age: body.age || 0,
      gender: body.gender || 'female',
      occupation: body.occupation || '',
      meetingScene: body.meetingScene || 'other',
      meetingDate: body.meetingDate || new Date().toISOString().split('T')[0],
      impression: body.impression || 0,
      impressionTags: body.impressionTags || [],
      interests: body.interests || [],
      notes: body.notes || '',
      status: 'new',
      nextAction: this.generateNextAction(body.meetingScene || 'other'),
      lastContact: new Date().toISOString(),
      createdAt: new Date(),
    }
    this.matches.push(newMatch)
    return {
      code: 200,
      data: newMatch,
      message: 'success',
    }
  }

  updateMatch(id: number, body: Partial<Match>) {
    const index = this.matches.findIndex(m => m.id === id)
    if (index === -1) {
      return { code: 404, data: null, message: 'Not found' }
    }
    this.matches[index] = { ...this.matches[index], ...body }
    return {
      code: 200,
      data: this.matches[index],
      message: 'success',
    }
  }

  deleteMatch(id: number) {
    const index = this.matches.findIndex(m => m.id === id)
    if (index === -1) {
      return { code: 404, data: null, message: 'Not found' }
    }
    this.matches.splice(index, 1)
    return { code: 200, data: null, message: 'success' }
  }

  getRecommendations(id: number) {
    const match = this.matches.find(m => m.id === id)
    if (!match) {
      return { code: 404, data: null, message: 'Not found' }
    }

    // 根据场景和兴趣推荐
    const recommendations = {
      topics: this.recommendTopics(match),
      tasks: this.recommendTasks(match),
      tips: this.recommendTips(match),
    }

    return {
      code: 200,
      data: recommendations,
      message: 'success',
    }
  }

  private formatLastContact(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays < 7) return `${diffDays}天前`
    return `${Math.floor(diffDays / 7)}周前`
  }

  private calculateProgress(match: Match): number {
    // 根据状态计算进度
    const statusProgress: Record<string, number> = {
      new: 10,
      contacting: 30,
      dating: 60,
      progressing: 80,
      paused: 0,
    }
    return statusProgress[match.status] || 0
  }

  private generateNextAction(scene: string): string {
    const actions: Record<string, string> = {
      blind_date: '发消息约下次见面',
      pickup: '发第一条消息',
      app_meetup: '延续线上话题',
      party: '约出来单独见面',
      workplace: '找个理由搭话',
      school: '约一起去图书馆',
      activity: '约下次一起运动',
      other: '主动联系',
    }
    return actions[scene] || '主动联系'
  }

  private recommendTopics(match: Match): string[] {
    const baseTopics = [
      '聊聊最近的一次旅行',
      '分享童年趣事',
      '讨论喜欢的电影',
    ]
    if (match.interests.includes('旅行')) {
      baseTopics.push('最想去哪里旅行？')
    }
    if (match.interests.includes('美食')) {
      baseTopics.push('分享美食经历')
    }
    return baseTopics.slice(0, 3)
  }

  private recommendTasks(match: Match): string[] {
    return [
      '发送一条关心的消息',
      '分享一件有趣的事',
      '记住对方的一个小习惯',
    ]
  }

  private recommendTips(match: Match): string[] {
    const tips: Record<string, string[]> = {
      blind_date: ['展示真诚和稳定', '聊聊生活规划', '了解对方家庭观念'],
      pickup: ['保持轻松自然', '寻找共同话题', '适度展示自己'],
      app_meetup: ['延续线上热度', '安排有趣活动', '创造浪漫氛围'],
      party: ['利用共同朋友', '组织小团体活动', '自然接触'],
    }
    return tips[match.meetingScene] || ['真诚对待', '保持联系', '创造机会']
  }
}
