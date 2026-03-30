# 数据库表结构说明书

> 本文档描述相亲/交友互动小程序的数据库设计，基于 Supabase (PostgreSQL) 实现。

## 目录

- [概览](#概览)
- [核心业务表](#核心业务表)
  - [matches - 档案对象表](#matches---档案对象表)
  - [tasks - 任务表](#tasks---任务表)
- [画像系统表](#画像系统表)
  - [profile_portraits - 人物画像表](#profile_portraits---人物画像表)
  - [profile_histories - 画像变化历史表](#profile_histories---画像变化历史表)
  - [behavior_patterns - 行为模式表](#behavior_patterns---行为模式表)
  - [chat_records - 聊天记录存储表](#chat_records---聊天记录存储表)
  - [manual_behavior_data - 手动行为数据表](#manual_behavior_data---手动行为数据表)
- [用户系统表](#用户系统表)
  - [user_profiles - 用户个人档案表](#user_profiles---用户个人档案表)
  - [user_behavior_preferences - 用户行为偏好表](#user_behavior_preferences---用户行为偏好表)
- [AI 对话表](#ai-对话表)
  - [chat_histories - AI对话历史表](#chat_histories---ai对话历史表)
- [知识库表](#知识库表)
  - [hormone_cycle_knowledge - 激素周期知识表](#hormone_cycle_knowledge---激素周期知识表)
  - [hormone_info - 激素信息表](#hormone_info---激素信息表)
- [表关系图](#表关系图)
- [枚举值说明](#枚举值说明)

---

## 概览

### 表清单

| 表名 | 中文名 | 用途 | 关联 |
|------|--------|------|------|
| `matches` | 档案对象表 | 存储恋爱对象的基本信息 | 核心表，被多表关联 |
| `tasks` | 任务表 | 存储推进关系的任务 | → matches |
| `profile_portraits` | 人物画像表 | 存储对象的多维度画像 | → matches |
| `profile_histories` | 画像变化历史表 | 记录画像随时间的变化 | → matches |
| `behavior_patterns` | 行为模式表 | 存储从聊天记录提取的行为特征 | → matches |
| `chat_records` | 聊天记录存储表 | 用户上传的与对象的聊天截图 | → matches |
| `manual_behavior_data` | 手动行为数据表 | 用户手动填写的行为数据 | → matches |
| `user_profiles` | 用户个人档案表 | 用户自己的基本信息和画像 | 独立 |
| `user_behavior_preferences` | 用户行为偏好表 | 用户自己的行为习惯 | → user_profiles |
| `chat_histories` | AI对话历史表 | 用户与应用内AI的对话记录 | → matches |
| `hormone_cycle_knowledge` | 激素周期知识表 | 生理周期知识库 | 知识表 |
| `hormone_info` | 激素信息表 | 激素相关知识 | 知识表 |

### 设计原则

1. **多对象管理**: 通过 `matches` 表管理多个恋爱对象
2. **画像引擎**: 多表协作实现画像分析（portrait + behavior + chat_records + manual）
3. **数据来源追溯**: 行为数据区分来源（聊天记录分析 / 手动填写）
4. **历史追踪**: `profile_histories` 记录画像变化，支持趋势分析

---

## 核心业务表

### matches - 档案对象表

存储恋爱对象的核心信息，是系统的核心实体。

| 字段名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `id` | serial | - | 主键，自增 |
| `name` | varchar(64) | - | 对象姓名 |
| `gender` | varchar(16) | 'female' | 性别: male/female |
| `hardware` | jsonb | {} | 硬件信息（年龄、身高、生日等） |
| `software` | jsonb | {} | 软件信息（性格、兴趣、爱好等） |
| `meeting_scene` | varchar(32) | 'other' | 认识场景 |
| `meeting_date` | varchar(32) | - | 认识日期 |
| `relationship_stage` | varchar(32) | 'new' | 关系阶段 |
| `interaction_status` | varchar(32) | 'just_met' | 互动状态 |
| `impression` | integer | 0 | 印象分 (0-100) |
| `impression_tags` | jsonb | [] | 印象标签 |
| `key_info` | jsonb | [] | 关键信息列表 |
| `notes` | text | - | 备注 |
| `status` | varchar(32) | 'new' | 状态: new/active/archived |
| `next_action` | text | - | 下一步行动建议 |
| `last_contact` | timestamp | NOW() | 最后联系时间 |
| `cycle_start_date` | varchar(32) | - | 周期开始日期（女性） |
| `cycle_length` | integer | 28 | 周期长度（天） |
| `created_at` | timestamp | NOW() | 创建时间 |
| `updated_at` | timestamp | - | 更新时间 |

**hardware 结构示例**:
```json
{
  "age": 25,
  "height": "165cm",
  "birthday": "1999-03-15",
  "zodiac": "双鱼座",
  "location": "北京",
  "occupation": "产品经理",
  "company": "某科技公司"
}
```

**software 结构示例**:
```json
{
  "mbti": "ENFP",
  "personality": "开朗活泼",
  "interests": ["摄影", "旅行", "美食"],
  "communicationPreferences": {
    "effectiveWays": ["直接沟通", "幽默风趣"],
    "ineffectiveWays": ["冷战", "说教"],
    "landmines": ["提及前任"]
  },
  "loveLanguages": ["quality_time", "words"]
}
```

**索引**: `name`, `status`, `created_at`

---

### tasks - 任务表

存储推进关系的任务，支持系统生成和用户创建。

| 字段名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `id` | serial | - | 主键 |
| `match_id` | integer | - | 关联的对象ID |
| `category` | varchar(16) | 'prepare' | 任务类别: prepare/chat/date/gift/advance |
| `title` | varchar(128) | - | 任务标题 |
| `description` | text | - | 任务描述 |
| `difficulty` | varchar(16) | '简单' | 难度: 简单/中等/困难 |
| `duration` | varchar(32) | '15分钟' | 预计时长 |
| `source` | varchar(16) | 'system' | 来源: system/manual/ai |
| `completed` | integer | 0 | 完成状态: 0未完成/1已完成 |
| `completed_at` | timestamp | - | 完成时间 |
| `related_key_info` | jsonb | [] | 关联的关键信息 |
| `related_stage` | varchar(32) | - | 关联的阶段 |
| `suitable_phases` | jsonb | [] | 适合的生理周期阶段 |
| `avoid_phases` | jsonb | [] | 避免的生理周期阶段 |
| `lesson_learned` | text | - | 完成后的心得 |
| `created_at` | timestamp | NOW() | 创建时间 |
| `updated_at` | timestamp | - | 更新时间 |

**索引**: `match_id`, `completed`, `created_at`

---

## 画像系统表

### profile_portraits - 人物画像表

存储对象的多维度画像数据，是画像引擎的核心输出。

| 字段名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `id` | serial | - | 主键 |
| `match_id` | integer | - | 关联的对象ID |
| **五大人格维度** ||||
| `personality_openness` | integer | 50 | 开放性 (0-100) |
| `personality_conscientiousness` | integer | 50 | 尽责性 (0-100) |
| `personality_extraversion` | integer | 50 | 外向性 (0-100) |
| `personality_agreeableness` | integer | 50 | 宜人性 (0-100) |
| `personality_neuroticism` | integer | 50 | 神经质 (0-100) |
| **情感维度** ||||
| `emotional_stability` | integer | 50 | 情绪稳定性 (0-100) |
| `emotional_expression` | integer | 50 | 情感表达 (0-100) |
| `emotional_empathy` | integer | 50 | 共情能力 (0-100) |
| `emotional_independence` | integer | 50 | 情感独立性 (0-100) |
| **社交维度** ||||
| `social_activity` | integer | 50 | 社交活跃度 (0-100) |
| `social_initiative` | integer | 50 | 社交主动性 (0-100) |
| `social_intimacy` | integer | 50 | 亲密需求 (0-100) |
| `social_trust` | integer | 50 | 信任倾向 (0-100) |
| **沟通维度** ||||
| `communication_directness` | integer | 50 | 直接程度 (0-100) |
| `communication_humor` | integer | 50 | 幽默感 (0-100) |
| `communication_responsiveness` | integer | 50 | 响应速度 (0-100) |
| `communication_depth` | integer | 50 | 深度偏好 (0-100) |
| **互动模式** ||||
| `interaction_style` | varchar(32) | 'balanced' | 互动风格: active/passive/balanced |
| `preferred_topic_types` | jsonb | [] | 偏好的话题类型 |
| `active_time_slots` | jsonb | [] | 活跃时段 |
| `response_pattern` | jsonb | {} | 回复模式统计 |
| `confidence` | integer | 0 | 画像置信度 (0-100) |
| `created_at` | timestamp | NOW() | 创建时间 |
| `updated_at` | timestamp | - | 更新时间 |

**索引**: `match_id`

---

### profile_histories - 画像变化历史表

记录画像维度随时间的变化，支持趋势分析。

| 字段名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `id` | serial | - | 主键 |
| `match_id` | integer | - | 关联的对象ID |
| `dimension` | varchar(64) | - | 维度名称 |
| `old_value` | integer | - | 变化前的值 |
| `new_value` | integer | - | 变化后的值 |
| `change_reason` | varchar(32) | - | 变化原因: chat_analysis/behavior_update/manual |
| `evidence` | text | - | 证据/来源描述 |
| `created_at` | timestamp | NOW() | 创建时间 |

**索引**: `match_id`, `created_at`

---

### behavior_patterns - 行为模式表

存储从聊天记录提取的行为特征，是画像分析的数据来源。

| 字段名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `id` | serial | - | 主键 |
| `match_id` | integer | - | 关联的对象ID |
| `data_source` | varchar(32) | 'manual' | 数据来源: chat_record/manual/none |
| **时间行为** ||||
| `avg_response_time` | integer | - | 平均回复时间(分钟) |
| `response_time_variance` | integer | - | 回复时间方差 |
| `active_hours` | jsonb | {} | 各小时活跃度 {"9": 10, "10": 15} |
| `active_days` | jsonb | {} | 各天活跃度 {"monday": 20} |
| **沟通行为** ||||
| `message_length_avg` | integer | - | 平均消息长度 |
| `emoji_usage_rate` | integer | 0 | 表情使用率(0-100) |
| `question_rate` | integer | 0 | 提问率(0-100) |
| `initiative_rate` | integer | 0 | 主动发起率(0-100) |
| **话题偏好** ||||
| `topic_categories` | jsonb | {} | 话题类型分布 {"work": 10, "hobby": 5} |
| `emotional_keywords` | jsonb | [] | 情绪关键词 |
| `total_interactions` | integer | 0 | 总互动次数 |
| `last_analyzed_at` | timestamp | - | 最后分析时间 |
| `created_at` | timestamp | NOW() | 创建时间 |
| `updated_at` | timestamp | - | 更新时间 |

**索引**: `match_id`

---

### chat_records - 聊天记录存储表

用户上传的与对象的聊天截图，用于画像分析。

| 字段名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `id` | serial | - | 主键 |
| `match_id` | integer | - | 关联的对象ID |
| `image_url` | text | - | 聊天截图URL |
| `analyzed_content` | jsonb | - | 分析结果 |
| `avg_response_time` | integer | - | 平均回复时间(分钟) |
| `active_hours` | jsonb | {} | 活跃时段 |
| `active_days` | jsonb | {} | 活跃日期分布 |
| `message_count` | integer | 0 | 消息数量 |
| `emoji_usage_rate` | integer | 0 | 表情使用率 |
| `topic_keywords` | jsonb | [] | 话题关键词 |
| `analysis_status` | varchar(32) | 'pending' | 分析状态: pending/analyzing/completed/failed |
| `analysis_error` | text | - | 分析错误信息 |
| `created_at` | timestamp | NOW() | 创建时间 |
| `updated_at` | timestamp | - | 更新时间 |

**索引**: `match_id`

**与 chat_histories 的区别**:
- `chat_records`: 用户与**对象**的聊天截图（用于画像分析）
- `chat_histories`: 用户与**应用内AI**的对话记录（用于AI上下文）

---

### manual_behavior_data - 手动行为数据表

用户手动填写的关于对象的行为数据。

| 字段名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `id` | serial | - | 主键 |
| `match_id` | integer | - | 关联的对象ID |
| `response_speed` | varchar(32) | - | 回复速度: instant/fast/normal/slow/very_slow |
| `active_time_slots` | jsonb | [] | 活跃时段: morning/afternoon/evening/night |
| `topic_preferences` | jsonb | [] | 话题偏好: daily/work/emotion/hobby/future/relationship |
| `communication_style` | varchar(32) | - | 沟通风格: direct/indirect/balanced |
| `notes` | text | - | 备注 |
| `created_at` | timestamp | NOW() | 创建时间 |
| `updated_at` | timestamp | - | 更新时间 |

**索引**: `match_id`

---

## 用户系统表

### user_profiles - 用户个人档案表

存储用户自己的基本信息和画像，用于双方匹配分析。

| 字段名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `id` | serial | - | 主键 |
| `nickname` | varchar(64) | - | 昵称 |
| `gender` | varchar(16) | 'male' | 性别 |
| `birth_year` | integer | - | 出生年份 |
| `height` | integer | - | 身高(cm) |
| `occupation` | varchar(128) | - | 职业 |
| `education` | varchar(64) | - | 学历 |
| `location` | varchar(128) | - | 所在地 |
| **性格自评 (0-100)** ||||
| `personality_openness` | integer | 50 | 开放性 |
| `personality_conscientiousness` | integer | 50 | 尽责性 |
| `personality_extraversion` | integer | 50 | 外向性 |
| `personality_agreeableness` | integer | 50 | 宜人性 |
| `personality_neuroticism` | integer | 50 | 神经质 |
| **情感特点 (0-100)** ||||
| `emotional_stability` | integer | 50 | 情绪稳定性 |
| `emotional_expression` | integer | 50 | 情感表达 |
| `emotional_empathy` | integer | 50 | 共情能力 |
| **恋爱观** ||||
| `relationship_goal` | varchar(64) | - | 恋爱目标: serious/casual/marriage |
| `attachment_style` | varchar(64) | - | 依恋类型: secure/anxious/avoidant |
| `love_language` | jsonb | [] | 爱的语言 |
| **兴趣爱好** ||||
| `hobbies` | jsonb | [] | 爱好 |
| `interests` | jsonb | [] | 兴趣 |
| **期望对象** ||||
| `preferred_traits` | jsonb | [] | 期望的特质 |
| `deal_breakers` | jsonb | [] | 不能接受的点 |
| `bio` | text | - | 自我介绍 |
| `confidence` | integer | 0 | 画像置信度 |
| `created_at` | timestamp | NOW() | 创建时间 |
| `updated_at` | timestamp | - | 更新时间 |

---

### user_behavior_preferences - 用户行为偏好表

存储用户自己的行为习惯。

| 字段名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `id` | serial | - | 主键 |
| `user_id` | integer | - | 关联的用户ID |
| `communication_style` | varchar(32) | - | 沟通风格: direct/indirect/balanced |
| `response_speed` | varchar(32) | - | 回复速度: instant/fast/normal/slow |
| `active_time_slots` | jsonb | [] | 活跃时段 |
| `social_energy` | varchar(32) | - | 社交能量: high/medium/low |
| `alone_time` | varchar(32) | - | 独处偏好 |
| `expression_style` | varchar(32) | - | 表达方式: expressive/reserved |
| `affection_style` | varchar(32) | - | 表达爱意的方式 |
| `preferred_topics` | jsonb | [] | 喜欢的话题 |
| `topic_avoid` | jsonb | [] | 避免的话题 |
| `created_at` | timestamp | NOW() | 创建时间 |
| `updated_at` | timestamp | - | 更新时间 |

**索引**: `user_id`

---

## AI 对话表

### chat_histories - AI对话历史表

存储用户与应用内AI助手的对话记录，用于多轮对话上下文。

| 字段名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `id` | serial | - | 主键 |
| `match_id` | integer | - | 关联的对象ID（对话上下文） |
| `role` | varchar(16) | - | 角色: user/assistant/system |
| `content` | text | - | 消息内容 |
| `created_at` | timestamp | NOW() | 创建时间 |

**索引**: `match_id`, `created_at`

**重要区分**:
```
chat_histories: 用户 ←→ 应用内AI（用于AI对话上下文）
chat_records:   用户 ←→ 对象的聊天截图（用于画像分析）
```

---

## 知识库表

### hormone_cycle_knowledge - 激素周期知识表

存储女性生理周期各阶段的知识，用于情境化建议。

| 字段名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `id` | serial | - | 主键 |
| `phase_key` | varchar(32) | - | 阶段标识: menstrual/follicular/ovulation/luteal_* |
| `phase_name` | varchar(64) | - | 阶段名称 |
| `day_range` | varchar(32) | - | 日期范围 |
| `description` | text | - | 阶段描述 |
| `hormone_status` | jsonb | - | 激素状态 |
| `characteristics` | jsonb | - | 特征 |
| `recommendations` | jsonb | - | 建议 |
| `partner_tips` | text | - | 伴侣提示 |
| `sort_order` | integer | 0 | 排序 |
| `created_at` | timestamp | NOW() | 创建时间 |
| `updated_at` | timestamp | - | 更新时间 |

**索引**: `phase_key` (unique), `sort_order`

---

### hormone_info - 激素信息表

存储激素相关知识。

| 字段名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `id` | serial | - | 主键 |
| `hormone_key` | varchar(32) | - | 激素标识 |
| `hormone_name` | varchar(64) | - | 激素名称 |
| `english_name` | varchar(64) | - | 英文名 |
| `source` | text | - | 来源 |
| `function` | text | - | 功能 |
| `male_comparison` | text | - | 与男性对比 |
| `sort_order` | integer | 0 | 排序 |
| `created_at` | timestamp | NOW() | 创建时间 |
| `updated_at` | timestamp | - | 更新时间 |

**索引**: `hormone_key` (unique), `sort_order`

---

## 表关系图

```
┌─────────────────────────────────────────────────────────────────────┐
│                           核心业务                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────┐                                                  │
│   │   matches    │◀─────────────────────────────────────────────┐   │
│   │  (档案对象)   │                                              │   │
│   └──────┬───────┘                                              │   │
│          │                                                      │   │
│          │ 1:N                                                  │   │
│          ▼                                                      │   │
│   ┌──────────────┐                                              │   │
│   │    tasks     │                                              │   │
│   │   (任务)     │                                              │   │
│   └──────────────┘                                              │   │
│                                                                 │   │
└─────────────────────────────────────────────────────────────────────┘
          │
          │ 1:1
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           画像系统                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐     │
│   │   profile_   │      │   behavior_  │      │  chat_records│     │
│   │  portraits   │◀─────│   patterns   │◀─────│ (聊天截图)   │     │
│   │  (画像维度)  │ 1:1  │  (行为模式)  │ 1:N  │              │     │
│   └──────┬───────┘      └──────────────┘      └──────────────┘     │
│          │                      ▲                                   │
│          │ 1:N                  │ 1:1                               │
│          ▼                      │                                   │
│   ┌──────────────┐      ┌──────────────┐                           │
│   │   profile_   │      │   manual_    │                           │
│   │   histories  │      │behavior_data │                           │
│   │ (画像历史)   │      │ (手动数据)   │                           │
│   └──────────────┘      └──────────────┘                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
          │
          │ 1:N
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          AI 对话系统                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────┐                                                  │
│   │    chat_     │                                                  │
│   │   histories  │  用户与AI的对话（用于上下文，不用于画像分析）      │
│   │ (AI对话历史) │                                                  │
│   └──────────────┘                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                           用户系统                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────┐      ┌──────────────┐                           │
│   │user_profiles │◀─────│    user_     │                           │
│   │ (用户档案)   │ 1:1  │  behavior_   │                           │
│   └──────────────┘      │preferences   │                           │
│                         │(用户行为偏好)│                           │
│                         └──────────────┘                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 枚举值说明

### 关系阶段 (relationship_stage)

| 值 | 中文 |
|---|------|
| `new` | 刚认识 |
| `contacting` | 接触中 |
| `dating` | 约会中 |
| `progressing` | 发展中 |

### 互动状态 (interaction_status)

| 值 | 中文 |
|---|------|
| `just_met` | 一面之缘 |
| `got_contact` | 有联系方式 |
| `chatted` | 聊过天 |
| `good_vibe` | 聊得不错 |
| `met_up` | 见过面 |
| `dating_regularly` | 稳定约会 |
| `ambiguous` | 暧昧期 |
| `confirming` | 准备确认 |

### 任务类别 (category)

| 值 | 中文 |
|---|------|
| `prepare` | 准备类 |
| `chat` | 聊天类 |
| `date` | 约会类 |
| `gift` | 礼物类 |
| `advance` | 推进类 |

### 数据来源 (data_source)

| 值 | 说明 |
|---|------|
| `chat_record` | 聊天记录分析 |
| `manual` | 手动填写 |
| `none` | 无数据 |

### 互动风格 (interaction_style)

| 值 | 中文 |
|---|------|
| `active` | 积极主动 |
| `passive` | 较为被动 |
| `balanced` | 平衡互动 |

### 回复速度 (response_speed)

| 值 | 中文 |
|---|------|
| `instant` | 秒回 |
| `fast` | 较快 |
| `normal` | 正常 |
| `slow` | 较慢 |
| `very_slow` | 很慢 |

### 沟通风格 (communication_style)

| 值 | 中文 |
|---|------|
| `direct` | 直接 |
| `indirect` | 含蓄 |
| `balanced` | 平衡 |

### 生理周期阶段 (phase_key)

| 值 | 中文 | 天数范围 |
|---|------|---------|
| `menstrual` | 月经期 | 第1-5天 |
| `follicular` | 卵泡期 | 第6-13天 |
| `ovulation` | 排卵期 | 第14-16天 |
| `luteal_early` | 黄体早期 | 第17-21天 |
| `luteal_mid` | 黄体中期 | 第22-25天 |
| `luteal_late` | 黄体晚期 | 第26-28天 |
