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
