import { pgTable, serial, timestamp, index, unique, pgPolicy, varchar, text, jsonb, integer, foreignKey, uniqueIndex, bigserial, bigint, numeric, boolean } from "drizzle-orm/pg-core"
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
	pgPolicy("hormone_cycle_knowledge_允许公开写入", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`true`  }),
	pgPolicy("hormone_cycle_knowledge_允许公开删除", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("hormone_cycle_knowledge_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
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
	pgPolicy("hormone_info_允许公开写入", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`true`  }),
	pgPolicy("hormone_info_允许公开删除", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("hormone_info_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("hormone_info_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const chatHistories = pgTable("chat_histories", {
	id: serial().primaryKey().notNull(),
	matchId: integer("match_id").notNull(),
	role: varchar({ length: 16 }).notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("chat_histories_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("chat_histories_match_id_idx").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
	pgPolicy("chat_histories_允许公开写入", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`true`  }),
	pgPolicy("chat_histories_允许公开删除", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("chat_histories_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("chat_histories_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const matches = pgTable("matches", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 64 }).notNull(),
	gender: varchar({ length: 16 }).default('female'),
	meetingScene: varchar("meeting_scene", { length: 32 }).default('other'),
	meetingDate: varchar("meeting_date", { length: 32 }),
	relationshipStage: varchar("relationship_stage", { length: 32 }).default('new'),
	interactionStatus: varchar("interaction_status", { length: 32 }).default('just_met'),
	impression: integer().default(0),
	impressionTags: jsonb("impression_tags").default([]),
	keyInfo: jsonb("key_info").default([]),
	notes: text(),
	status: varchar({ length: 32 }).default('new'),
	nextAction: text("next_action"),
	lastContact: timestamp("last_contact", { withTimezone: true, mode: 'string' }).defaultNow(),
	cycleStartDate: varchar("cycle_start_date", { length: 32 }),
	cycleLength: integer("cycle_length").default(28),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	relationshipType: varchar("relationship_type", { length: 16 }).default('undefined'),
}, (table) => [
	index("matches_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("matches_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("matches_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	pgPolicy("matches_允许公开写入", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`true`  }),
	pgPolicy("matches_允许公开删除", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("matches_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("matches_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const relationshipEnergy = pgTable("relationship_energy", {
	id: serial().primaryKey().notNull(),
	matchId: integer("match_id").notNull(),
	totalEnergy: integer("total_energy").default(0).notNull(),
	informationScore: integer("information_score").default(0).notNull(),
	interactionScore: integer("interaction_score").default(0).notNull(),
	emotionalScore: integer("emotional_score").default(0).notNull(),
	trend: varchar({ length: 16 }).default('stable').notNull(),
	totalInteractions: integer("total_interactions").default(0).notNull(),
	avgQualityScore: integer("avg_quality_score").default(0).notNull(),
	lastInteractionDays: integer("last_interaction_days").default(sql`'-1'`).notNull(),
	breakthroughCount: integer("breakthrough_count").default(0).notNull(),
	dimensionCompleteness: integer("dimension_completeness").default(0).notNull(),
	calculatedAt: timestamp("calculated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	currentStage: varchar("current_stage", { length: 32 }).default('刚刚认识'),
	activeBoosters: jsonb("active_boosters").default([]),
	activePenalties: jsonb("active_penalties").default([]),
}, (table) => [
	index("relationship_energy_match_id_idx").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
	index("relationship_energy_total_idx").using("btree", table.totalEnergy.desc().nullsFirst().op("int4_ops")),
	unique("relationship_energy_match_id_key").on(table.matchId),
	pgPolicy("relationship_energy_允许公开写入", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`true`  }),
	pgPolicy("relationship_energy_允许公开删除", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("relationship_energy_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("relationship_energy_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const momentsAnalysis = pgTable("moments_analysis", {
	id: serial().primaryKey().notNull(),
	userId: text("user_id"),
	matchId: integer("match_id"),
	inputContent: text("input_content"),
	analysisResult: jsonb("analysis_result"),
	interactionAdvice: jsonb("interaction_advice"),
	status: text().default('active'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_moments_analysis_match_id").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.matchId],
			foreignColumns: [matches.id],
			name: "moments_analysis_match_id_fkey"
		}).onDelete("set null"),
]);

export const tasks = pgTable("tasks", {
	id: serial().primaryKey().notNull(),
	matchId: integer("match_id").notNull(),
	category: varchar({ length: 16 }).default('prepare').notNull(),
	title: varchar({ length: 128 }).notNull(),
	description: text(),
	difficulty: varchar({ length: 16 }).default('简单'),
	duration: varchar({ length: 32 }).default('15分钟'),
	source: varchar({ length: 16 }).default('system'),
	completed: integer().default(0).notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	relatedKeyInfo: jsonb("related_key_info").default([]),
	relatedStage: varchar("related_stage", { length: 32 }),
	suitablePhases: jsonb("suitable_phases").default([]),
	avoidPhases: jsonb("avoid_phases").default([]),
	lessonLearned: text("lesson_learned"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	reason: text(),
	steps: jsonb().default([]),
	tags: jsonb().default([]),
}, (table) => [
	index("tasks_completed_idx").using("btree", table.completed.asc().nullsLast().op("int4_ops")),
	index("tasks_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("tasks_match_id_idx").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
	pgPolicy("tasks_允许公开写入", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`true`  }),
	pgPolicy("tasks_允许公开删除", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("tasks_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("tasks_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const profilePortraits = pgTable("profile_portraits", {
	id: serial().primaryKey().notNull(),
	matchId: integer("match_id").notNull(),
	personalityOpenness: integer("personality_openness").default(50),
	personalityConscientiousness: integer("personality_conscientiousness").default(50),
	personalityExtraversion: integer("personality_extraversion").default(50),
	personalityAgreeableness: integer("personality_agreeableness").default(50),
	personalityNeuroticism: integer("personality_neuroticism").default(50),
	emotionalStability: integer("emotional_stability").default(50),
	emotionalExpression: integer("emotional_expression").default(50),
	emotionalEmpathy: integer("emotional_empathy").default(50),
	emotionalIndependence: integer("emotional_independence").default(50),
	socialActivity: integer("social_activity").default(50),
	socialInitiative: integer("social_initiative").default(50),
	socialIntimacy: integer("social_intimacy").default(50),
	socialTrust: integer("social_trust").default(50),
	communicationDirectness: integer("communication_directness").default(50),
	communicationHumor: integer("communication_humor").default(50),
	communicationResponsiveness: integer("communication_responsiveness").default(50),
	communicationDepth: integer("communication_depth").default(50),
	interactionStyle: varchar("interaction_style", { length: 32 }).default('balanced'),
	preferredTopicTypes: jsonb("preferred_topic_types").default([]),
	activeTimeSlots: jsonb("active_time_slots").default([]),
	responsePattern: jsonb("response_pattern").default({}),
	confidence: integer().default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("profile_portraits_match_id_idx").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
	uniqueIndex("profile_portraits_match_id_uniq").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
]);

export const profileHistories = pgTable("profile_histories", {
	id: serial().primaryKey().notNull(),
	matchId: integer("match_id").notNull(),
	dimension: varchar({ length: 64 }).notNull(),
	oldValue: integer("old_value").notNull(),
	newValue: integer("new_value").notNull(),
	changeReason: varchar("change_reason", { length: 32 }).notNull(),
	evidence: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("profile_histories_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("profile_histories_match_id_idx").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
]);

export const behaviorPatterns = pgTable("behavior_patterns", {
	id: serial().primaryKey().notNull(),
	matchId: integer("match_id").notNull(),
	avgResponseTime: integer("avg_response_time"),
	responseTimeVariance: integer("response_time_variance"),
	activeHours: jsonb("active_hours").default({}),
	activeDays: jsonb("active_days").default({}),
	messageLengthAvg: integer("message_length_avg"),
	emojiUsageRate: integer("emoji_usage_rate").default(0),
	questionRate: integer("question_rate").default(0),
	initiativeRate: integer("initiative_rate").default(0),
	topicCategories: jsonb("topic_categories").default({}),
	emotionalKeywords: jsonb("emotional_keywords").default([]),
	totalInteractions: integer("total_interactions").default(0),
	lastAnalyzedAt: timestamp("last_analyzed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("behavior_patterns_match_id_idx").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
	uniqueIndex("behavior_patterns_match_id_uniq").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
]);

export const userProfiles = pgTable("user_profiles", {
	id: serial().primaryKey().notNull(),
	nickname: varchar({ length: 64 }),
	gender: varchar({ length: 16 }).default('male'),
	birthYear: integer("birth_year"),
	height: integer(),
	occupation: varchar({ length: 128 }),
	education: varchar({ length: 64 }),
	location: varchar({ length: 128 }),
	personalityOpenness: integer("personality_openness").default(50),
	personalityConscientiousness: integer("personality_conscientiousness").default(50),
	personalityExtraversion: integer("personality_extraversion").default(50),
	personalityAgreeableness: integer("personality_agreeableness").default(50),
	personalityNeuroticism: integer("personality_neuroticism").default(50),
	emotionalStability: integer("emotional_stability").default(50),
	emotionalExpression: integer("emotional_expression").default(50),
	emotionalEmpathy: integer("emotional_empathy").default(50),
	relationshipGoal: varchar("relationship_goal", { length: 64 }),
	attachmentStyle: varchar("attachment_style", { length: 64 }),
	loveLanguage: jsonb("love_language").default([]),
	hobbies: jsonb().default([]),
	interests: jsonb().default([]),
	preferredTraits: jsonb("preferred_traits").default([]),
	dealBreakers: jsonb("deal_breakers").default([]),
	bio: text(),
	confidence: integer().default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	mbti: varchar({ length: 4 }),
});

export const speedPlans = pgTable("speed_plans", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	userId: bigint("user_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	matchId: bigint("match_id", { mode: "number" }),
	background: text(),
	currentProgress: text("current_progress").array(),
	targetHours: integer("target_hours"),
	targetBehavior: varchar("target_behavior", { length: 50 }),
	difficultyScore: integer("difficulty_score"),
	difficultyLevel: varchar("difficulty_level", { length: 20 }),
	status: varchar({ length: 20 }).default('active'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_speed_plans_match_id").using("btree", table.matchId.asc().nullsLast().op("int8_ops")),
	index("idx_speed_plans_user_id").using("btree", table.userId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.matchId],
			foreignColumns: [matches.id],
			name: "fk_speed_plans_match_id"
		}).onDelete("cascade"),
]);

export const speedPlanMessages = pgTable("speed_plan_messages", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	planId: bigint("plan_id", { mode: "number" }),
	role: varchar({ length: 20 }).notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_speed_plan_messages_plan_id").using("btree", table.planId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.planId],
			foreignColumns: [speedPlans.id],
			name: "speed_plan_messages_plan_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.planId],
			foreignColumns: [speedPlans.id],
			name: "fk_speed_plan_messages_plan_id"
		}).onDelete("cascade"),
]);

export const userBehaviorPreferences = pgTable("user_behavior_preferences", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	communicationStyle: varchar("communication_style", { length: 32 }),
	responseSpeed: varchar("response_speed", { length: 32 }),
	activeTimeSlots: jsonb("active_time_slots").default([]),
	socialEnergy: varchar("social_energy", { length: 32 }),
	aloneTime: varchar("alone_time", { length: 32 }),
	expressionStyle: varchar("expression_style", { length: 32 }),
	affectionStyle: varchar("affection_style", { length: 32 }),
	preferredTopics: jsonb("preferred_topics").default([]),
	topicAvoid: jsonb("topic_avoid").default([]),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	communicationStyleOnline: varchar("communication_style_online"),
	communicationStyleOffline: varchar("communication_style_offline"),
}, (table) => [
	unique("user_behavior_preferences_user_id_key").on(table.userId),
]);

export const dimensionDefinitions = pgTable("dimension_definitions", {
	id: serial().primaryKey().notNull(),
	dimensionKey: varchar("dimension_key", { length: 100 }).notNull(),
	displayName: varchar("display_name", { length: 100 }).notNull(),
	description: text(),
	layer: integer().notNull(),
	category: varchar({ length: 50 }).notNull(),
	subcategory: varchar({ length: 50 }),
	dataType: varchar("data_type", { length: 20 }).notNull(),
	enumOptions: jsonb("enum_options"),
	validationRules: jsonb("validation_rules"),
	defaultValue: jsonb("default_value"),
	inputType: varchar("input_type", { length: 20 }),
	placeholder: text(),
	helpText: text("help_text"),
	icon: varchar({ length: 50 }),
	weight: numeric({ precision: 3, scale:  2 }).default('1.00'),
	importance: varchar({ length: 20 }).default('optional'),
	sourceAllowed: jsonb("source_allowed").default(["manual"]),
	sortOrder: integer("sort_order").default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	relationshipApplicability: varchar("relationship_applicability", { length: 20 }).default('universal'),
}, (table) => [
	index("dimension_definitions_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")).where(sql`(is_active = true)`),
	index("dimension_definitions_applicability_idx").using("btree", table.relationshipApplicability.asc().nullsLast().op("text_ops")),
	index("dimension_definitions_category_idx").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("dimension_definitions_layer_idx").using("btree", table.layer.asc().nullsLast().op("int4_ops")),
	unique("dimension_definitions_dimension_key_key").on(table.dimensionKey),
	pgPolicy("dimension_definitions_允许公开写入", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`true`  }),
	pgPolicy("dimension_definitions_允许公开删除", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("dimension_definitions_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("dimension_definitions_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const stories = pgTable("stories", {
	id: serial().primaryKey().notNull(),
	userId: text("user_id"),
	matchId: integer("match_id"),
	storyType: text("story_type"),
	relationshipStage: text("relationship_stage"),
	originalContent: text("original_content"),
	keyElements: jsonb("key_elements"),
	generatedStory: text("generated_story"),
	techniquesUsed: jsonb("techniques_used"),
	status: text().default('active'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_stories_match_id").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
	index("idx_stories_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_stories_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.matchId],
			foreignColumns: [matches.id],
			name: "stories_match_id_fkey"
		}).onDelete("set null"),
]);

export const profileDimensionValues = pgTable("profile_dimension_values", {
	id: serial().primaryKey().notNull(),
	matchId: integer("match_id").notNull(),
	dimensionKey: varchar("dimension_key", { length: 100 }).notNull(),
	value: jsonb().notNull(),
	source: varchar({ length: 50 }).notNull(),
	sourceDetail: jsonb("source_detail"),
	confidence: numeric({ precision: 3, scale:  2 }),
	previousValue: jsonb("previous_value"),
	changedReason: text("changed_reason"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("profile_dimension_values_dimension_key_idx").using("btree", table.dimensionKey.asc().nullsLast().op("text_ops")),
	index("profile_dimension_values_match_id_idx").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
	index("profile_dimension_values_source_idx").using("btree", table.source.asc().nullsLast().op("text_ops")),
	index("profile_dimension_values_updated_at_idx").using("btree", table.updatedAt.desc().nullsFirst().op("timestamptz_ops")),
	index("profile_dimension_values_value_idx").using("gin", table.value.asc().nullsLast().op("jsonb_ops")),
	unique("profile_dimension_values_match_id_dimension_key_key").on(table.matchId, table.dimensionKey),
	pgPolicy("profile_dimension_values_允许公开写入", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`true`  }),
	pgPolicy("profile_dimension_values_允许公开删除", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("profile_dimension_values_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("profile_dimension_values_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const profileDimensionHistory = pgTable("profile_dimension_history", {
	id: serial().primaryKey().notNull(),
	matchId: integer("match_id").notNull(),
	dimensionKey: varchar("dimension_key", { length: 100 }).notNull(),
	oldValue: jsonb("old_value"),
	newValue: jsonb("new_value").notNull(),
	changeSource: varchar("change_source", { length: 20 }).notNull(),
	changedReason: text("changed_reason"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("profile_dimension_history_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("profile_dimension_history_dimension_key_idx").using("btree", table.dimensionKey.asc().nullsLast().op("text_ops")),
	index("profile_dimension_history_match_id_idx").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
	pgPolicy("profile_dimension_history_允许公开写入", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`true`  }),
	pgPolicy("profile_dimension_history_允许公开删除", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("profile_dimension_history_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("profile_dimension_history_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const interactionEvents = pgTable("interaction_events", {
	id: serial().primaryKey().notNull(),
	matchId: integer("match_id").notNull(),
	interactionType: varchar("interaction_type", { length: 32 }).notNull(),
	interactionCategory: varchar("interaction_category", { length: 32 }),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	endedAt: timestamp("ended_at", { withTimezone: true, mode: 'string' }),
	durationMinutes: integer("duration_minutes"),
	initiator: varchar({ length: 16 }),
	location: text(),
	locationType: varchar("location_type", { length: 32 }),
	title: varchar({ length: 128 }),
	description: text(),
	activities: jsonb().default([]),
	qualityScore: integer("quality_score"),
	mood: varchar({ length: 32 }),
	energyChange: integer("energy_change").default(0),
	breakthroughMoment: text("breakthrough_moment"),
	issuesEncountered: text("issues_encountered"),
	newInsights: jsonb("new_insights").default([]),
	relatedTaskId: integer("related_task_id"),
	chatRecordIds: jsonb("chat_record_ids").default([]),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("interaction_events_match_id_idx").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
	index("interaction_events_quality_idx").using("btree", table.qualityScore.asc().nullsLast().op("int4_ops")),
	index("interaction_events_started_at_idx").using("btree", table.startedAt.desc().nullsFirst().op("timestamptz_ops")),
	index("interaction_events_type_idx").using("btree", table.interactionType.asc().nullsLast().op("text_ops")),
	pgPolicy("interaction_events_允许公开写入", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`true`  }),
	pgPolicy("interaction_events_允许公开删除", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("interaction_events_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("interaction_events_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const storyMessages = pgTable("story_messages", {
	id: serial().primaryKey().notNull(),
	storyId: integer("story_id"),
	role: text().notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_story_messages_story_id").using("btree", table.storyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "story_messages_story_id_fkey"
		}).onDelete("cascade"),
]);

export const relationshipEnergyHistory = pgTable("relationship_energy_history", {
	id: serial().primaryKey().notNull(),
	matchId: integer("match_id").notNull(),
	totalEnergy: integer("total_energy").notNull(),
	informationScore: integer("information_score").notNull(),
	interactionScore: integer("interaction_score").notNull(),
	emotionalScore: integer("emotional_score").notNull(),
	changeReason: varchar("change_reason", { length: 32 }).notNull(),
	changeDetail: text("change_detail"),
	relatedEventId: integer("related_event_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("relationship_energy_history_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("relationship_energy_history_match_id_idx").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
	pgPolicy("relationship_energy_history_允许公开写入", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`true`  }),
	pgPolicy("relationship_energy_history_允许公开删除", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("relationship_energy_history_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const momentsPosts = pgTable("moments_posts", {
	id: serial().primaryKey().notNull(),
	userId: text("user_id"),
	matchId: integer("match_id"),
	content: text(),
	postType: text("post_type"),
	purpose: text(),
	personaTags: text("persona_tags").array(),
	publishTime: timestamp("publish_time", { withTimezone: true, mode: 'string' }),
	status: text().default('draft'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_moments_posts_match_id").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
	index("idx_moments_posts_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.matchId],
			foreignColumns: [matches.id],
			name: "moments_posts_match_id_fkey"
		}).onDelete("set null"),
]);

export const momentsSuggestions = pgTable("moments_suggestions", {
	id: serial().primaryKey().notNull(),
	userId: text("user_id"),
	matchId: integer("match_id"),
	postType: text("post_type"),
	purpose: text(),
	inputContent: text("input_content"),
	suggestedContent: jsonb("suggested_content"),
	imageSuggestions: jsonb("image_suggestions"),
	timingSuggestion: text("timing_suggestion"),
	expectedEffect: text("expected_effect"),
	status: text().default('active'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_moments_suggestions_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.matchId],
			foreignColumns: [matches.id],
			name: "moments_suggestions_match_id_fkey"
		}).onDelete("set null"),
]);

export const datingProfileHistory = pgTable("dating_profile_history", {
	id: serial().primaryKey().notNull(),
	platform: varchar({ length: 20 }).notNull(),
	nickname: varchar({ length: 50 }),
	bio: text(),
	interests: text(),
	analysisResult: jsonb("analysis_result").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const insightCache = pgTable("insight_cache", {
	id: serial().primaryKey().notNull(),
	matchId: integer("match_id").notNull(),
	personalitySummary: text("personality_summary").notNull(),
	relationshipDynamics: text("relationship_dynamics").notNull(),
	emotionalPatterns: text("emotional_patterns").notNull(),
	communicationStyle: text("communication_style").notNull(),
	keyFindings: jsonb("key_findings").notNull(),
	blindSpots: jsonb("blind_spots").notNull(),
	growthSuggestions: jsonb("growth_suggestions").notNull(),
	actionPriority: text("action_priority").notNull(),
	hiddenSignals: jsonb("hidden_signals"),
	dataFingerprint: text("data_fingerprint"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("insight_cache_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("insight_cache_match_id_idx").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
	pgPolicy("insight_cache_allow_all", { as: "permissive", for: "all", to: ["public"], using: sql`true`, withCheck: sql`true`  }),
]);

export const manualBehaviorData = pgTable("manual_behavior_data", {
	id: serial().primaryKey().notNull(),
	matchId: integer("match_id").notNull(),
	responseSpeed: varchar("response_speed", { length: 32 }),
	activeTimeSlots: jsonb("active_time_slots").default([]),
	topicPreferences: jsonb("topic_preferences").default([]),
	communicationStyle: varchar("communication_style", { length: 32 }),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	emotionalExpression: varchar("emotional_expression", { length: 20 }),
	socialInitiative: varchar("social_initiative", { length: 20 }),
	communicationStyleOnline: varchar("communication_style_online"),
	communicationStyleOffline: varchar("communication_style_offline"),
}, (table) => [
	index("manual_behavior_data_match_id_idx").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
	uniqueIndex("manual_behavior_data_match_id_uniq").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
]);

export const interactionProfileCache = pgTable("interaction_profile_cache", {
	id: serial().primaryKey().notNull(),
	matchId: integer("match_id").notNull(),
	communicationRhythm: jsonb("communication_rhythm").notNull(),
	emotionalExpression: jsonb("emotional_expression").notNull(),
	conflictPattern: jsonb("conflict_pattern").notNull(),
	socialPortrait: jsonb("social_portrait").notNull(),
	dataFingerprint: text("data_fingerprint"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	lifeRhythm: jsonb("life_rhythm"),
	loveStyle: jsonb("love_style"),
	intimacyBoundary: jsonb("intimacy_boundary"),
}, (table) => [
	index("interaction_profile_cache_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("interaction_profile_cache_match_id_idx").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
]);

export const datingOpenerHistory = pgTable("dating_opener_history", {
	id: serial().primaryKey().notNull(),
	platform: varchar({ length: 50 }).default('tantan'),
	targetProfile: text("target_profile").default(''),
	selfProfile: text("self_profile").default(''),
	result: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const datingPhotoHistory = pgTable("dating_photo_history", {
	id: serial().primaryKey().notNull(),
	platform: varchar({ length: 50 }).default('tantan'),
	photoUrls: text("photo_urls").default('[]'),
	analysisResult: jsonb("analysis_result"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const growAnniversaries = pgTable("grow_anniversaries", {
	id: serial().primaryKey().notNull(),
	matchId: integer("match_id").notNull(),
	title: text().notNull(),
	date: text().notNull(),
	icon: text().default('💝'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const growMemories = pgTable("grow_memories", {
	id: serial().primaryKey().notNull(),
	matchId: integer("match_id").notNull(),
	content: text().notNull(),
	date: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const growPromises = pgTable("grow_promises", {
	id: serial().primaryKey().notNull(),
	matchId: integer("match_id").notNull(),
	content: text().notNull(),
	completed: boolean().default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const growGoals = pgTable("grow_goals", {
	id: serial().primaryKey().notNull(),
	matchId: integer("match_id").notNull(),
	title: text().notNull(),
	progress: integer().default(0),
	total: integer().notNull(),
	completed: boolean().default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const sweetTalkHistory = pgTable("sweet_talk_history", {
	id: serial().primaryKey().notNull(),
	matchId: integer("match_id"),
	scene: varchar({ length: 32 }).notNull(),
	tone: varchar({ length: 32 }).default('sweet'),
	customContext: text("custom_context"),
	result: jsonb().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("sweet_talk_history_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("sweet_talk_history_match_id_idx").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
]);

export const chatRecords = pgTable("chat_records", {
	id: serial().primaryKey().notNull(),
	matchId: integer("match_id").notNull(),
	imageUrl: text("image_url"),
	analyzedContent: jsonb("analyzed_content"),
	avgResponseTime: integer("avg_response_time"),
	activeHours: jsonb("active_hours").default({}),
	activeDays: jsonb("active_days").default({}),
	messageCount: integer("message_count").default(0),
	emojiUsageRate: integer("emoji_usage_rate").default(0),
	topicKeywords: jsonb("topic_keywords").default([]),
	analysisStatus: varchar("analysis_status", { length: 32 }).default('pending'),
	analysisError: text("analysis_error"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	source: varchar({ length: 32 }).default('manual'),
	contentType: varchar("content_type", { length: 16 }).default('text').notNull(),
	rawContent: text("raw_content"),
	parsedMessages: jsonb("parsed_messages").default([]),
	imageKey: text("image_key"),
	summary: text(),
	keyTopics: jsonb("key_topics").default([]),
	sentiment: varchar({ length: 16 }),
	dateRangeStart: timestamp("date_range_start", { withTimezone: true, mode: 'string' }),
	dateRangeEnd: timestamp("date_range_end", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("chat_records_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("chat_records_match_id_idx").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
	index("chat_records_source_idx").using("btree", table.source.asc().nullsLast().op("text_ops")),
]);

export const datePlans = pgTable("date_plans", {
	id: serial().primaryKey().notNull(),
	matchId: integer("match_id").notNull(),
	title: varchar({ length: 128 }),
	description: text(),
	schedule: jsonb().default([]),
	totalBudget: varchar("total_budget", { length: 64 }),
	conversationTopics: jsonb("conversation_topics").default([]),
	outfitSuggestion: text("outfit_suggestion"),
	backupPlan: text("backup_plan"),
	budget: varchar({ length: 64 }),
	season: varchar({ length: 32 }),
	locationPref: varchar("location_pref", { length: 128 }),
	preference: text(),
	duration: varchar({ length: 32 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("date_plans_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("date_plans_match_id_idx").using("btree", table.matchId.asc().nullsLast().op("int4_ops")),
]);

export const gameList = pgTable("game_list", {
	id: serial().primaryKey().notNull(),
	gameKey: varchar("game_key", { length: 64 }).notNull(),
	title: varchar({ length: 128 }).notNull(),
	subtitle: varchar({ length: 128 }),
	description: text(),
	iconName: varchar("icon_name", { length: 64 }),
	color: varchar({ length: 128 }),
	pagePath: varchar("page_path", { length: 256 }),
	difficulty: varchar({ length: 16 }),
	players: integer().default(2),
	category: varchar({ length: 32 }),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("game_list_category_idx").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("game_list_sort_order_idx").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
	unique("game_list_game_key_unique").on(table.gameKey),
	pgPolicy("game_list_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("game_list_允许公开删除", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("game_list_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("game_list_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const gameContent = pgTable("game_content", {
	id: serial().primaryKey().notNull(),
	gameKey: varchar("game_key", { length: 64 }).notNull(),
	category: varchar({ length: 64 }),
	contentData: jsonb("content_data").notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("game_content_category_idx").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("game_content_game_key_idx").using("btree", table.gameKey.asc().nullsLast().op("text_ops")),
	index("game_content_sort_order_idx").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
	pgPolicy("game_content_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("game_content_允许公开删除", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("game_content_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("game_content_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);
