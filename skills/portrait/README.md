# Portrait Skill - 人物画像技能

快速上手画像引擎，实现用户画像分析、关系预测和策略推荐。

## 快速导航

- [SKILL.md](./SKILL.md) - 完整技能文档
- [types.ts](./types.ts) - TypeScript 类型定义
- [examples.ts](./examples.ts) - 使用示例代码

## 核心功能

| 功能 | 说明 | 适用场景 |
|------|------|----------|
| 画像获取 | 获取对方的完整画像数据 | 查看画像概览、置信度、活跃时段 |
| 聊天分析 | 上传聊天截图进行多模态分析 | 自动提取行为模式数据 |
| 趋势预测 | 预测关系发展方向 | 了解关系状态、获取洞察建议 |
| 策略推荐 | 获取个性化互动建议 | 不知道聊什么、如何推进关系 |

## 快速开始

### 1. 后端使用

```typescript
import { PortraitEngineService } from '@/modules/portrait-engine'

@Injectable()
export class YourService {
  constructor(private portraitEngine: PortraitEngineService) {}
  
  async analyze(matchId: number) {
    // 获取画像
    const portrait = await this.portraitEngine.getOrCreatePortrait(matchId)
    
    // 预测趋势
    const prediction = await this.portraitEngine.predictRelationshipTrend(
      matchId,
      userPortrait,
      request
    )
    
    return { portrait, prediction }
  }
}
```

### 2. 前端调用

```typescript
import { Network } from '@/network'

// 获取画像
const res = await Network.request({
  url: `/api/portrait/${matchId}`,
  method: 'GET'
})

// 上传聊天记录
const result = await Network.request({
  url: '/api/portrait/chat-record',
  method: 'POST',
  data: { matchId, base64Data }
})
```

## 数据来源说明

画像数据有两个来源，优先级如下：

1. **聊天记录分析**（推荐）
   - 通过上传聊天截图自动分析
   - 提取回复时间、活跃时段、话题偏好
   - 数据准确性高，置信度可达 100%

2. **手动填写**
   - 用户手动输入行为数据
   - 作为补充或初始数据
   - 置信度约 30%

## 常见场景

### 场景1: 刚认识对方，想了解对方特点

```typescript
// 1. 如果有聊天记录，先上传分析
const result = await uploadChatRecord(matchId, base64Data)

// 2. 获取画像查看对方特点
const portrait = await getPortrait(matchId)
console.log('活跃时段:', portrait.activeTimeSlots)
console.log('互动风格:', portrait.interactionStyle)
```

### 场景2: 想知道关系发展趋势

```typescript
// 获取趋势预测
const prediction = await getTrend(matchId)

console.log('趋势:', prediction.trend) // improving/stable/declining
console.log('建议:', prediction.recommendations)
```

### 场景3: 不知道怎么聊天/推进关系

```typescript
// 获取互动策略
const strategies = await getStrategies(matchId)

strategies.forEach(s => {
  console.log(`建议: ${s.action}`)
  console.log(`时机: ${s.timing}`)
})
```

## 注意事项

1. **首次使用**：如果没有聊天记录，画像置信度为 0，建议先上传聊天截图
2. **数据更新**：上传新的聊天记录会自动合并数据，提高准确性
3. **隐私保护**：聊天图片存储在对象存储中，设置合理过期时间
4. **性能考虑**：LLM 分析较慢（约 3-5 秒），建议显示加载状态

## 相关文档

- [画像引擎模块](../../server/src/modules/portrait-engine/README.md)
- [用户档案模块](../../server/src/modules/user-profile/README.md)
- [画像 API 接口](../../server/src/modules/portrait/README.md)
