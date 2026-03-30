import { pgTable, serial, timestamp, index, unique, pgPolicy, varchar, text, jsonb, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const hormoneCycleKnowledge = pgTable("hormone_cycle_knowledge", {
	id: serial().primaryKey().notNull(),
	phaseKey: varchar("phase_key", { length: 32 }).notNull(),
	phaseName: varchar("phase_name", { length: 64 }).notNull(),
	dayRange: varchar("day_range", { length: 32 }).notNull(),
	description: text(),
	hormoneStatus: jsonb("hormone_status").notNull(),
	characteristics: jsonb().notNull(),
	recommendations: jsonb(),
	partnerTips: text("partner_tips"),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("hormone_cycle_knowledge_phase_key_idx").using("btree", table.phaseKey.asc().nullsLast().op("text_ops")),
	index("hormone_cycle_knowledge_sort_order_idx").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
	unique("hormone_cycle_knowledge_phase_key_unique").on(table.phaseKey),
	pgPolicy("hormone_cycle_knowledge_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("hormone_cycle_knowledge_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("hormone_cycle_knowledge_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("hormone_cycle_knowledge_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const hormoneInfo = pgTable("hormone_info", {
	id: serial().primaryKey().notNull(),
	hormoneKey: varchar("hormone_key", { length: 32 }).notNull(),
	hormoneName: varchar("hormone_name", { length: 64 }).notNull(),
	englishName: varchar("english_name", { length: 64 }),
	source: text(),
	function: text(),
	maleComparison: text("male_comparison"),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("hormone_info_hormone_key_idx").using("btree", table.hormoneKey.asc().nullsLast().op("text_ops")),
	index("hormone_info_sort_order_idx").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
	unique("hormone_info_hormone_key_unique").on(table.hormoneKey),
	pgPolicy("hormone_info_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("hormone_info_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("hormone_info_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("hormone_info_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

// AI 对话历史表
export const chatHistories = pgTable("chat_histories", {
	id: serial().primaryKey().notNull(),
	matchId: integer("match_id").notNull(),
	role: varchar("role", { length: 16 }).notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("chat_histories_match_id_idx").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
	index("chat_histories_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	pgPolicy("chat_histories_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("chat_histories_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("chat_histories_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("chat_histories_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

// 任务表
export const tasks = pgTable("tasks", {
	id: serial().primaryKey().notNull(),
	matchId: integer("match_id").notNull(),
	category: varchar("category", { length: 16 }).notNull().default('prepare'),
	title: varchar("title", { length: 128 }).notNull(),
	description: text(),
	difficulty: varchar("difficulty", { length: 16 }).default('简单'),
	duration: varchar("duration", { length: 32 }).default('15分钟'),
	source: varchar("source", { length: 16 }).default('system'),
	completed: integer("completed").default(0).notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	relatedKeyInfo: jsonb("related_key_info").default([]),
	relatedStage: varchar("related_stage", { length: 32 }),
	suitablePhases: jsonb("suitable_phases").default([]),
	avoidPhases: jsonb("avoid_phases").default([]),
	lessonLearned: text("lesson_learned"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("tasks_match_id_idx").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
	index("tasks_completed_idx").using("btree", table.completed.asc().nullsLast().op("int4_ops")),
	index("tasks_created_at_idx").using("btree", table.createdAt.desc().nullsLast().op("timestamptz_ops")),
	pgPolicy("tasks_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("tasks_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("tasks_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("tasks_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

// 人物画像表 - 存储多维度画像数据
export const profilePortraits = pgTable("profile_portraits", {
	id: serial().primaryKey().notNull(),
	matchId: integer("match_id").notNull(),
	// 五大人格维度 (0-100)
	personalityOpenness: integer("personality_openness").default(50),           // 开放性
	personalityConscientiousness: integer("personality_conscientiousness").default(50), // 尽责性
	personalityExtraversion: integer("personality_extraversion").default(50),   // 外向性
	personalityAgreeableness: integer("personality_agreeableness").default(50), // 宜人性
	personalityNeuroticism: integer("personality_neuroticism").default(50),     // 神经质
	// 情感维度 (0-100)
	emotionalStability: integer("emotional_stability").default(50),      // 情绪稳定性
	emotionalExpression: integer("emotional_expression").default(50),    // 情感表达
	emotionalEmpathy: integer("emotional_empathy").default(50),          // 共情能力
	emotionalIndependence: integer("emotional_independence").default(50), // 情感独立性
	// 社交维度 (0-100)
	socialActivity: integer("social_activity").default(50),              // 社交活跃度
	socialInitiative: integer("social_initiative").default(50),          // 社交主动性
	socialIntimacy: integer("social_intimacy").default(50),              // 亲密需求
	socialTrust: integer("social_trust").default(50),                    // 信任倾向
	// 沟通维度 (0-100)
	communicationDirectness: integer("communication_directness").default(50),    // 直接程度
	communicationHumor: integer("communication_humor").default(50),             // 幽默感
	communicationResponsiveness: integer("communication_responsiveness").default(50), // 响应速度
	communicationDepth: integer("communication_depth").default(50),             // 深度偏好
	// 互动模式
	interactionStyle: varchar("interaction_style", { length: 32 }).default('balanced'), // active/passive/balanced
	preferredTopicTypes: jsonb("preferred_topic_types").default([]),  // 偏好的话题类型
	activeTimeSlots: jsonb("active_time_slots").default([]),          // 活跃时段
	responsePattern: jsonb("response_pattern").default({}),           // 回复模式统计
	// 画像置信度
	confidence: integer("confidence").default(0), // 0-100，基于数据量的置信度
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("profile_portraits_match_id_idx").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
	pgPolicy("profile_portraits_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("profile_portraits_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("profile_portraits_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("profile_portraits_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

// 画像变化历史表 - 记录画像随时间的变化
export const profileHistories = pgTable("profile_histories", {
	id: serial().primaryKey().notNull(),
	matchId: integer("match_id").notNull(),
	dimension: varchar("dimension", { length: 64 }).notNull(), // 维度名称
	oldValue: integer("old_value").notNull(),  // 旧值
	newValue: integer("new_value").notNull(),  // 新值
	changeReason: varchar("change_reason", { length: 32 }).notNull(), // 变化原因: chat_analysis/behavior_update/manual
	evidence: text("evidence"), // 证据/来源描述
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("profile_histories_match_id_idx").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
	index("profile_histories_created_at_idx").using("btree", table.createdAt.desc().nullsLast().op("timestamptz_ops")),
	pgPolicy("profile_histories_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("profile_histories_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("profile_histories_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("profile_histories_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

// 行为模式表 - 存储从聊天记录提取的行为特征
export const behaviorPatterns = pgTable("behavior_patterns", {
	id: serial().primaryKey().notNull(),
	matchId: integer("match_id").notNull(),
	// 时间行为
	avgResponseTime: integer("avg_response_time"), // 平均回复时间(分钟)
	responseTimeVariance: integer("response_time_variance"), // 回复时间方差
	activeHours: jsonb("active_hours").default({}), // 各小时活跃度 { "9": 10, "10": 15, ... }
	activeDays: jsonb("active_days").default({}), // 各天活跃度 { "monday": 20, ... }
	// 沟通行为
	messageLengthAvg: integer("message_length_avg"), // 平均消息长度
	emojiUsageRate: integer("emoji_usage_rate").default(0), // 表情使用率(0-100)
	questionRate: integer("question_rate").default(0), // 提问率(0-100)
	initiativeRate: integer("initiative_rate").default(0), // 主动发起率(0-100)
	// 话题偏好
	topicCategories: jsonb("topic_categories").default({}), // 话题类型分布 { "work": 10, "hobby": 5, ... }
	emotionalKeywords: jsonb("emotional_keywords").default([]), // 情绪关键词
	// 互动模式
	totalInteractions: integer("total_interactions").default(0), // 总互动次数
	lastAnalyzedAt: timestamp("last_analyzed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("behavior_patterns_match_id_idx").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
	pgPolicy("behavior_patterns_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("behavior_patterns_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("behavior_patterns_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("behavior_patterns_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

// 档案对象表
export const matches = pgTable("matches", {
	id: serial().primaryKey().notNull(),
	name: varchar("name", { length: 64 }).notNull(),
	gender: varchar("gender", { length: 16 }).default('female'),
	// 硬件信息（JSON）
	hardware: jsonb("hardware").default({}),
	// 软件信息（JSON）
	software: jsonb("software").default({}),
	// 认识场景
	meetingScene: varchar("meeting_scene", { length: 32 }).default('other'),
	meetingDate: varchar("meeting_date", { length: 32 }),
	// 关系状态
	relationshipStage: varchar("relationship_stage", { length: 32 }).default('new'),
	interactionStatus: varchar("interaction_status", { length: 32 }).default('just_met'),
	// 印象
	impression: integer("impression").default(0),
	impressionTags: jsonb("impression_tags").default([]),
	// 关键信息（兼容旧数据）
	keyInfo: jsonb("key_info").default([]),
	// 备注
	notes: text("notes"),
	// 状态
	status: varchar("status", { length: 32 }).default('new'),
	nextAction: text("next_action"),
	lastContact: timestamp("last_contact", { withTimezone: true, mode: 'string' }).defaultNow(),
	// 周期追踪
	cycleStartDate: varchar("cycle_start_date", { length: 32 }),
	cycleLength: integer("cycle_length").default(28),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("matches_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("matches_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("matches_created_at_idx").using("btree", table.createdAt.desc().nullsLast().op("timestamptz_ops")),
	pgPolicy("matches_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("matches_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("matches_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("matches_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);
