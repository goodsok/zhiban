/**
 * 人物画像类型定义
 * 
 * 该文件定义了画像引擎的核心类型，供前端和后端共同使用
 */

// ==================== 核心画像类型 ====================

/**
 * 画像维度
 * 每个维度的值为 0-100
 */
export interface PortraitDimensions {
  /** 性格维度 */
  personality: {
    openness: number          // 开放性
    conscientiousness: number // 尽责性
    extraversion: number      // 外向性
    agreeableness: number     // 宜人性
    neuroticism: number       // 神经质
  }
  
  /** 情感维度 */
  emotional: {
    stability: number         // 情绪稳定性
    expression: number        // 情感表达
    empathy: number           // 共情能力
    independence: number      // 情感独立性
  }
  
  /** 社交维度 */
  social: {
    activity: number          // 社交活跃度
    initiative: number        // 社交主动性
    intimacy: number          // 亲密需求
    trust: number             // 信任倾向
  }
  
  /** 沟通维度 */
  communication: {
    directness: number        // 直接程度
    responsiveness: number    // 响应速度
    humor: number             // 幽默感
    depth: number             // 深度偏好
  }
}

/**
 * 行为模式
 */
export interface BehaviorPattern {
  /** 数据来源 */
  dataSource: 'chat_record' | 'manual' | 'none'
  
  /** 平均回复时间(分钟) */
  avgResponseTime: number | null
  
  /** 回复时间方差 */
  responseTimeVariance?: number | null
  
  /** 活跃时段分布 */
  activeHours: Record<string, number>
  
  /** 活跃日期分布 */
  activeDays: Record<string, number>
  
  /** 平均消息长度 */
  messageLengthAvg?: number | null
  
  /** 表情使用率 */
  emojiUsageRate: number
  
  /** 提问率 */
  questionRate?: number
  
  /** 主动发起率 */
  initiativeRate?: number
  
  /** 话题分类 */
  topicCategories: Record<string, number>
  
  /** 情绪关键词 */
  emotionalKeywords: string[]
  
  /** 总互动次数 */
  totalInteractions: number
}

/**
 * 互动风格
 */
export type InteractionStyle = 'active' | 'passive' | 'balanced'

/**
 * 数据源状态
 */
export interface DataSourceStatus {
  /** 是否有聊天记录 */
  hasChatRecords: boolean
  
  /** 是否有手动数据 */
  hasManualData: boolean
  
  /** 聊天记录数量 */
  chatRecordCount: number
}

/**
 * 画像历史记录
 */
export interface PortraitHistory {
  id: number
  matchId: number
  dimension: string
  oldValue: number
  newValue: number
  changeReason: 'chat_analysis' | 'behavior_update' | 'manual'
  evidence: string | null
  createdAt: string
}

/**
 * 完整画像
 */
export interface FullPortrait {
  /** 画像维度 */
  dimensions: PortraitDimensions
  
  /** 行为模式 */
  behaviorPattern: BehaviorPattern
  
  /** 互动风格 */
  interactionStyle: InteractionStyle
  
  /** 偏好话题类型 */
  preferredTopicTypes: string[]
  
  /** 活跃时段 */
  activeTimeSlots: string[]
  
  /** 置信度(0-100) */
  confidence: number
  
  /** 历史记录 */
  history: PortraitHistory[]
  
  /** 数据源状态 */
  dataSourceStatus: DataSourceStatus
  
  /** 最后更新时间 */
  lastUpdated: string
}

// ==================== 分析与预测类型 ====================

/**
 * 聊天记录分析结果
 */
export interface ChatRecordAnalysisResult {
  /** 平均回复时间(分钟) */
  avgResponseTime: number
  
  /** 活跃时段 */
  activeHours: Record<string, number>
  
  /** 活跃日期 */
  activeDays: Record<string, number>
  
  /** 消息数量 */
  messageCount: number
  
  /** 表情使用率 */
  emojiUsageRate: number
  
  /** 话题关键词 */
  topicKeywords: string[]
  
  /** 情绪倾向 */
  emotionalTone?: string
  
  /** 分析洞察 */
  insights?: string[]
}

/**
 * 趋势预测结果
 */
export interface TrendPredictionResult {
  /** 趋势方向 */
  trend: 'improving' | 'stable' | 'declining'
  
  /** 置信度(0-100) */
  confidence: number
  
  /** 洞察列表 */
  insights: string[]
  
  /** 建议列表 */
  recommendations: string[]
}

/**
 * 互动策略
 */
export interface InteractionStrategy {
  /** 策略类别 */
  category: 'communication' | 'topic' | 'timing' | 'activity'
  
  /** 具体行动 */
  action: string
  
  /** 理由 */
  reason: string
  
  /** 最佳时机 */
  timing?: string
  
  /** 预期效果 */
  expectedOutcome?: string
}

/**
 * 策略推荐结果
 */
export interface StrategyRecommendationResult {
  /** 策略列表 */
  strategies: InteractionStrategy[]
}

/**
 * 用户画像摘要(用于预测)
 */
export interface UserPortraitSummary {
  /** 用户性格维度 */
  personality?: Partial<PortraitDimensions['personality']>
  
  /** 用户沟通偏好 */
  communicationPreference?: string
  
  /** 用户活跃时段 */
  activeTimeSlots?: string[]
}

/**
 * 手动行为数据
 */
export interface ManualBehaviorData {
  /** 回复速度 */
  responseSpeed: 'fast' | 'medium' | 'slow'
  
  /** 活跃时段 */
  activeTimeSlots: string[]
  
  /** 话题偏好 */
  topicPreferences: string[]
  
  /** 沟通风格 */
  communicationStyle: string
  
  /** 备注 */
  notes?: string
}

// ==================== API 响应类型 ====================

/**
 * 画像 API 响应
 */
export interface PortraitApiResponse<T = unknown> {
  code: number
  msg: string
  data: T
}

/**
 * 上传聊天记录响应
 */
export interface UploadChatRecordResponse {
  success: boolean
  analysis?: ChatRecordAnalysisResult
  message: string
}

/**
 * 获取画像响应
 */
export interface GetPortraitResponse {
  portrait: FullPortrait
}

/**
 * 趋势预测响应
 */
export interface GetTrendResponse {
  prediction: TrendPredictionResult
}

/**
 * 策略推荐响应
 */
export interface GetStrategyResponse {
  strategies: InteractionStrategy[]
}
