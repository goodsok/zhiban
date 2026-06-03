/**
 * 人物画像引擎 - 类型定义
 * 
 * 定义画像系统的核心数据结构和接口
 */

// ==================== 画像维度定义 ====================

/**
 * 五大人格维度 (Big Five)
 */
export interface PersonalityDimensions {
  /** 开放性: 0-100, 传统 ↔ 开放 */
  openness: number
  /** 尽责性: 0-100, 随性 ↔ 自律 */
  conscientiousness: number
  /** 外向性: 0-100, 内向 ↔ 外向 */
  extraversion: number
  /** 宜人性: 0-100, 直接 ↔ 温和 */
  agreeableness: number
  /** 神经质: 0-100, 稳定 ↔ 敏感 */
  neuroticism: number
}

/**
 * 情感维度
 */
export interface EmotionalDimensions {
  /** 情绪稳定性: 0-100 */
  stability: number
  /** 情感表达: 0-100 */
  expression: number
  /** 共情能力: 0-100 */
  empathy: number
  /** 情感独立性: 0-100 */
  independence: number
}

/**
 * 社交维度
 */
export interface SocialDimensions {
  /** 社交活跃度: 0-100 */
  activity: number
  /** 社交主动性: 0-100 */
  initiative: number
  /** 亲密需求: 0-100 */
  intimacy: number
  /** 信任倾向: 0-100 */
  trust: number
}

/**
 * 沟通维度
 */
export interface CommunicationDimensions {
  /** 直接程度: 0-100 */
  directness: number
  /** 响应速度: 0-100 */
  responsiveness: number
  /** 幽默感: 0-100 */
  humor: number
  /** 深度偏好: 0-100 */
  depth: number
}

/**
 * 完整画像维度
 */
export interface PortraitDimensions {
  personality: PersonalityDimensions
  emotional: EmotionalDimensions
  social: SocialDimensions
  communication: CommunicationDimensions
}

// ==================== 行为模式定义 ====================

/**
 * 数据来源类型
 */
export type DataSourceType = 'chat_record' | 'manual' | 'none'

/**
 * 行为模式数据
 */
export interface BehaviorPattern {
  /** 数据来源 */
  dataSource: DataSourceType
  /** 平均回复时间(分钟) */
  avgResponseTime: number | null
  /** 回复时间方差 */
  responseTimeVariance: number | null
  /** 各小时活跃度 { "9": 10, "10": 15, ... } */
  activeHours: Record<string, number>
  /** 各天活跃度 { "monday": 20, ... } */
  activeDays: Record<string, number>
  /** 平均消息长度 */
  messageLengthAvg: number | null
  /** 表情使用率(0-100) */
  emojiUsageRate: number
  /** 提问率(0-100) */
  questionRate: number
  /** 主动发起率(0-100) */
  initiativeRate: number
  /** 话题类型分布 */
  topicCategories: Record<string, number>
  /** 情绪关键词 */
  emotionalKeywords: string[]
  /** 总互动次数 */
  totalInteractions: number
  /** 线上沟通风格 */
  communicationStyleOnline?: 'direct' | 'indirect' | 'balanced' | 'playful' | 'warm' | 'rational'
  /** 线下沟通风格 */
  communicationStyleOffline?: 'direct' | 'indirect' | 'balanced' | 'playful' | 'warm' | 'rational'
}

/**
 * 手动填写的行为数据
 */
export interface ManualBehaviorData {
  /** 回复速度 */
  responseSpeed?: 'instant' | 'fast' | 'normal' | 'slow' | 'very_slow'
  /** 活跃时段 */
  activeTimeSlots?: string[]
  /** 话题偏好 */
  topicPreferences?: string[]
  /** 沟通风格（已废弃，保留向后兼容） */
  communicationStyle?: 'direct' | 'indirect' | 'balanced'
  /** 线上沟通风格（微信/电话等） */
  communicationStyleOnline?: 'direct' | 'indirect' | 'balanced' | 'playful' | 'warm' | 'rational'
  /** 线下沟通风格（见面时） */
  communicationStyleOffline?: 'direct' | 'indirect' | 'balanced' | 'playful' | 'warm' | 'rational'
  /** 情感表达程度 */
  emotionalExpression?: 'rich' | 'moderate' | 'reserved'
  /** 社交主动性 */
  socialInitiative?: 'very_active' | 'active' | 'moderate' | 'passive'
  /** 备注 */
  notes?: string
}

// ==================== 画像变化历史 ====================

/**
 * 画像变化记录
 */
export interface PortraitHistoryRecord {
  id: number
  matchId: number
  /** 维度名称 */
  dimension: string
  /** 旧值 */
  oldValue: number
  /** 新值 */
  newValue: number
  /** 变化原因: chat_analysis/behavior_update/manual */
  changeReason: 'chat_analysis' | 'behavior_update' | 'manual'
  /** 证据/来源描述 */
  evidence: string | null
  createdAt: string
}

// ==================== 完整画像 ====================

/**
 * 数据来源状态
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
 * 互动风格
 */
export type InteractionStyle = 'active' | 'passive' | 'balanced'

/**
 * 完整画像数据
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
  /** 变化历史 */
  history: PortraitHistoryRecord[]
  /** 数据来源状态 */
  dataSourceStatus: DataSourceStatus
  /** 最后更新时间 */
  lastUpdated: string
}

// ==================== 聊天记录分析 ====================

/**
 * 聊天记录分析结果
 */
export interface ChatRecordAnalysisResult {
  /** 是否为聊天记录 */
  isChatRecord: boolean
  /** 平均回复时间(分钟) */
  avgResponseTime?: number
  /** 活跃时段 */
  activeHours?: Record<string, number>
  /** 活跃日期 */
  activeDays?: Record<string, number>
  /** 消息数量 */
  messageCount?: number
  /** 表情使用率 */
  emojiUsageRate?: number
  /** 话题关键词 */
  topicKeywords?: string[]
  /** 总结 */
  summary?: string
}

// ==================== 预测与推荐 ====================

/**
 * 关系趋势类型
 */
export type RelationshipTrend = 'improving' | 'stable' | 'declining'

/**
 * 关系趋势预测结果
 */
export interface TrendPredictionResult {
  /** 趋势 */
  trend: RelationshipTrend
  /** 置信度 */
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
  /** 分类: 沟通/约会/话题/关怀 */
  category: string
  /** 具体行动 */
  action: string
  /** 推荐理由 */
  reason: string
  /** 最佳时机 */
  timing: string
}

/**
 * 策略推荐结果
 */
export interface StrategyRecommendationResult {
  strategies: InteractionStrategy[]
}

// ==================== 用户画像（用于AI分析） ====================

/**
 * 用户画像摘要（用于AI建议参考）
 */
export interface UserPortraitSummary {
  /** 性别 */
  gender?: 'male' | 'female' | null
  /** 年龄范围 */
  ageRange?: string | null
  /** 职业 */
  occupation?: string | null
  /** 所在地 */
  location?: string | null
  /** 性格画像 */
  personality?: {
    openness: number
    conscientiousness: number
    extraversion: number
    agreeableness: number
    neuroticism: number
    traits: string[]
  }
  /** 情感画像 */
  emotional?: {
    stability: number
    expression: number
    empathy: number
    style: string
  }
  /** 恋爱观 */
  relationship?: {
    goal?: string | null
    attachmentStyle?: string | null
    loveLanguage?: string[]
  }
  /** 行为偏好 */
  behavior?: {
    communicationStyle?: string | null
    responseSpeed?: string | null
    activeTimeSlots?: string[]
    socialEnergy?: string | null
    expressionStyle?: string | null
    preferredTopics?: string[]
  }
  /** 兴趣爱好 */
  interests?: {
    hobbies?: string[]
    interests?: string[]
  }
  /** 期望 */
  expectations?: {
    preferredTraits?: string[]
    dealBreakers?: string[]
  }
  /** 置信度 */
  confidence?: number
}

// ==================== 匹配分析 ====================

/**
 * 画像匹配分析结果
 */
export interface CompatibilityAnalysis {
  /** 总体匹配度(0-100) */
  overallScore: number
  /** 各维度匹配度 */
  dimensions: {
    personality: number
    emotional: number
    communication: number
    social: number
  }
  /** 匹配亮点 */
  strengths: string[]
  /** 潜在挑战 */
  challenges: string[]
  /** 改善建议 */
  suggestions: string[]
}

// ==================== 引擎接口定义 ====================

/**
 * 画像计算器接口
 */
export interface IPortraitCalculator {
  /**
   * 根据行为数据计算画像维度
   */
  calculateFromBehavior(behavior: BehaviorPattern): Partial<PortraitDimensions>
  
  /**
   * 合并多源数据计算画像
   */
  mergeFromSources(
    chatData: Partial<BehaviorPattern>,
    manualData: ManualBehaviorData
  ): Partial<PortraitDimensions>
  
  /**
   * 计算置信度
   */
  calculateConfidence(
    dataSource: DataSourceStatus,
    behavior: BehaviorPattern
  ): number
}

/**
 * 分析器接口
 */
export interface IAnalyzer<TInput, TOutput> {
  /**
   * 分析输入数据，返回分析结果
   */
  analyze(input: TInput): Promise<TOutput>
}

/**
 * 预测器接口
 */
export interface IPredictor<TInput, TOutput> {
  /**
   * 基于输入预测结果
   */
  predict(input: TInput): Promise<TOutput>
}
