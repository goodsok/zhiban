# 数据库表结构速查表

> 快速查阅各表的用途和关键字段

## 核心表速查

| 表名 | 用途 | 关键字段 | 关联 |
|------|------|----------|------|
| **matches** | 档案对象 | name, hardware, software, relationship_stage | 核心表 |
| **tasks** | 任务列表 | match_id, category, title, completed | → matches |
| **profile_portraits** | 人物画像 | match_id, personality/*, emotional/*, confidence | → matches |
| **behavior_patterns** | 行为模式 | match_id, data_source, avg_response_time, active_hours | → matches |
| **chat_records** | 聊天截图 | match_id, image_url, analysis_status | → matches |
| **chat_histories** | AI对话 | match_id, role, content | → matches |
| **user_profiles** | 用户档案 | nickname, personality/*, relationship_goal | 独立 |

## 两张易混淆的表

| 表名 | 数据来源 | 用途 | 示例 |
|------|----------|------|------|
| **chat_records** | 用户上传聊天截图 | 分析对方行为模式 | 微信聊天截图 → 提取回复时间、话题偏好 |
| **chat_histories** | 应用内AI对话 | 保持AI对话上下文 | 用户问AI"怎么回复" → AI回答 |

```
❌ 错误理解：从 chat_histories 推断对方画像
✅ 正确理解：从 chat_records 分析对方画像
```

## 画像数据流

```
数据输入                      画像引擎                    输出
┌─────────────┐           ┌─────────────┐          ┌─────────────┐
│chat_records │──┐        │             │          │profile_     │
│(聊天截图)   │  │        │             │          │portraits    │
└─────────────┘  │        │   portrait  │──分析──▶│(画像维度)   │
                 ├───────▶│   engine    │          └─────────────┘
┌─────────────┐  │        │             │                 │
│manual_      │  │        │             │                 ▼
│behavior_data│──┘        │             │          ┌─────────────┐
│(手动填写)   │           │             │          │profile_     │
└─────────────┘           └─────────────┘          │histories    │
                                                   │(变化历史)   │
                                                   └─────────────┘
```

## 常用查询

### 获取对象完整信息
```sql
SELECT m.*, p.confidence, bp.data_source, bp.total_interactions
FROM matches m
LEFT JOIN profile_portraits p ON m.id = p.match_id
LEFT JOIN behavior_patterns bp ON m.id = bp.match_id
WHERE m.id = ?
```

### 获取画像数据来源统计
```sql
SELECT 
  bp.data_source,
  COUNT(*) as count
FROM behavior_patterns bp
GROUP BY bp.data_source
```

### 获取对象的聊天截图分析记录
```sql
SELECT * FROM chat_records 
WHERE match_id = ? AND analysis_status = 'completed'
ORDER BY created_at DESC
```

### 获取AI对话历史（用于上下文）
```sql
SELECT role, content FROM chat_histories 
WHERE match_id = ?
ORDER BY created_at ASC
LIMIT 20
```

## 字段默认值说明

### 画像维度 (0-100)
- 所有画像维度字段默认值为 `50`（中性值）
- `confidence` 默认为 `0`（无数据）

### 状态字段
- `relationship_stage`: 'new'
- `interaction_status`: 'just_met'
- `analysis_status`: 'pending'
- `data_source`: 'manual'

### JSONB 字段
- 空数组: `[]`
- 空对象: `{}`
