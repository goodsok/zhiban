/**
 * 画像引擎模块导出
 */

export { PortraitEngineModule } from './portrait-engine.module'
export { PortraitEngineService } from './portrait-engine.service'

// 导出类型
export * from './types/portrait.types'

// 导出分析器（供高级使用场景）
export { PortraitCalculator } from './analyzers/portrait-calculator'
export { ChatRecordAnalyzer } from './analyzers/chat-record.analyzer'
export { BehaviorPatternAnalyzer } from './analyzers/behavior-pattern.analyzer'

// 导出预测器（供高级使用场景）
export { TrendPredictor } from './predictors/trend-predictor'
export { StrategyRecommender } from './predictors/strategy-recommender'
