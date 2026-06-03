/**
 * 画像引擎模块
 * 
 * 独立的人物画像能力模块，提供画像分析、预测和推荐能力
 */

import { Module } from '@nestjs/common'
import { PortraitEngineService } from './portrait-engine.service'
import { PortraitCalculator } from './analyzers/portrait-calculator'
import { ChatRecordAnalyzer } from './analyzers/chat-record.analyzer'
import { BehaviorPatternAnalyzer } from './analyzers/behavior-pattern.analyzer'
import { TrendPredictor } from './predictors/trend-predictor'
import { StrategyRecommender } from './predictors/strategy-recommender'

import { InsightAnalyzer } from './analyzers/insight.analyzer'

@Module({
  providers: [
    // 核心服务
    PortraitEngineService,
    // 分析器
    PortraitCalculator,
    ChatRecordAnalyzer,
    BehaviorPatternAnalyzer,
    InsightAnalyzer,
    // 预测器
    TrendPredictor,
    StrategyRecommender,
  ],
  exports: [
    // 导出核心服务供其他模块使用
    PortraitEngineService,
  ],
})
export class PortraitEngineModule {}
