# 人物画像技能 (Portrait Skill)

## 概述

人物画像技能提供基于行为数据的用户画像分析、关系预测和策略推荐能力。该技能封装了画像引擎的核心功能，支持聊天记录分析、画像维度计算、关系趋势预测等场景。

## 核心能力

### 1. 画像数据管理
- 获取/创建画像
- 画像维度计算（性格、情感、社交、沟通）
- 画像变化趋势追踪

### 2. 行为数据分析
- 聊天记录截图分析（多模态）
- 手动填写数据管理
- 多源数据合并

### 3. 智能预测
- 关系趋势预测
- 双方画像匹配分析
- 互动策略推荐

## 使用场景

- 分析对方的性格特点和行为模式
- 预测恋爱关系的发展趋势
- 获取个性化的互动建议
- 追踪画像变化历史

## 快速开始

### 1. 获取画像

```typescript
import { PortraitEngineService } from '@/modules/portrait-engine'

// 注入服务
constructor(private readonly portraitEngine: PortraitEngineService) {}

// 获取画像
const portrait = await this.portraitEngine.getOrCreatePortrait(matchId)
```

### 2. 分析聊天记录

```typescript
// 上传并分析聊天截图
const result = await this.portraitEngine.uploadAndAnalyzeChatRecord(
  matchId,
  base64ImageData,
  request
)

if (result.success) {
  console.log('分析结果:', result.analysis)
}
```

### 3. 预测关系趋势

```typescript
// 获取用户画像
const userPortrait = await this.userProfileService.getUserPortrait(userId)

// 预测关系趋势
const prediction = await this.portraitEngine.predictRelationshipTrend(
  matchId,
  userPortrait,
  request
)

console.log('趋势:', prediction.trend) // 'improving' | 'stable' | 'declining'
console.log('洞察:', prediction.insights)
console.log('建议:', prediction.recommendations)
```

### 4. 获取互动策略

```typescript
const strategies = await this.portraitEngine.getInteractionStrategy(
  matchId,
  userPortrait,
  request
)

strategies.strategies.forEach(s => {
  console.log(`${s.category}: ${s.action}`)
  console.log(`理由: ${s.reason}`)
  console.log(`时机: ${s.timing}`)
})
```

## 数据模型

### 画像维度 (PortraitDimensions)

```typescript
interface PortraitDimensions {
  // 性格维度 (0-100)
  personality: {
    openness: number          // 开放性
    conscientiousness: number // 尽责性
    extraversion: number      // 外向性
    agreeableness: number     // 宜人性
    neuroticism: number       // 神经质
  }
  
  // 情感维度 (0-100)
  emotional: {
    stability: number         // 情绪稳定性
    expression: number        // 情感表达
    empathy: number           // 共情能力
    independence: number      // 情感独立性
  }
  
  // 社交维度 (0-100)
  social: {
    activity: number          // 社交活跃度
    initiative: number        // 社交主动性
    intimacy: number          // 亲密需求
    trust: number             // 信任倾向
  }
  
  // 沟通维度 (0-100)
  communication: {
    directness: number        // 直接程度
    responsiveness: number    // 响应速度
    humor: number             // 幽默感
    depth: number             // 深度偏好
  }
}
```

### 行为模式 (BehaviorPattern)

```typescript
interface BehaviorPattern {
  dataSource: 'chat_record' | 'manual' | 'none'
  avgResponseTime: number | null      // 平均回复时间(分钟)
  activeHours: Record<string, number> // 活跃时段分布
  activeDays: Record<string, number>  // 活跃日期分布
  emojiUsageRate: number              // 表情使用率
  topicCategories: Record<string, number> // 话题分类
  emotionalKeywords: string[]         // 情绪关键词
  totalInteractions: number           // 总互动次数
}
```

### 预测结果 (TrendPredictionResult)

```typescript
interface TrendPredictionResult {
  trend: 'improving' | 'stable' | 'declining'
  confidence: number        // 置信度 0-100
  insights: string[]        // 洞察列表
  recommendations: string[] // 建议列表
}
```

## 最佳实践

### 1. 数据来源优先级
- 聊天记录分析 > 手动填写数据
- 多条聊天记录可合并提高准确性
- 建议先上传聊天记录，再手动补充

### 2. 置信度管理
- 无数据时置信度为 0
- 手动数据置信度约 30%
- 聊天记录根据消息数量计算，最高 100%

### 3. 画像更新策略
- 聊天记录分析后自动更新行为模式
- 手动数据仅在无聊天记录时更新行为模式
- 画像维度需要显式调用更新

### 4. 性能考虑
- LLM 分析较慢，适合异步处理
- 画像数据可缓存，定期刷新
- 批量操作时注意并发控制

## API 参考

### PortraitEngineService

| 方法 | 说明 | 参数 |
|------|------|------|
| `getOrCreatePortrait(matchId)` | 获取或创建画像 | matchId: 档案ID |
| `uploadAndAnalyzeChatRecord(matchId, base64Data, request)` | 上传分析聊天记录 | matchId, base64图片, 请求对象 |
| `saveManualBehaviorData(matchId, data)` | 保存手动数据 | matchId, 手动数据对象 |
| `predictRelationshipTrend(matchId, userPortrait, request)` | 预测关系趋势 | matchId, 用户画像, 请求对象 |
| `getInteractionStrategy(matchId, userPortrait, request)` | 获取互动策略 | matchId, 用户画像, 请求对象 |
| `getPortraitTrends(matchId)` | 获取画像趋势 | matchId |
| `calculateCompatibility(userDimensions, targetDimensions)` | 计算匹配度 | 用户维度, 对方维度 |

## 相关模块

- `portrait-engine` - 画像引擎核心模块
- `user-profile` - 用户档案模块
- `portrait` (API层) - HTTP 接口模块

## 注意事项

1. **数据隐私**: 聊天记录图片存储在对象存储中，需设置合理的过期时间
2. **LLM调用**: 多模态分析和预测依赖LLM，需处理调用失败情况
3. **数据来源**: 明确区分聊天记录分析和手动填写的数据来源
4. **置信度**: 根据数据来源调整对预测结果的信任程度
