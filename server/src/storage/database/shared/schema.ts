import { pgTable, serial, timestamp, varchar, text, integer, jsonb, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// 系统健康检查表（禁止删除）
export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 激素周期知识库表
// 存储女性月经周期各阶段的激素状态、身心特征和行为建议
export const hormoneCycleKnowledge = pgTable(
	"hormone_cycle_knowledge",
	{
		id: serial().primaryKey(),
		// 阶段标识：menstrual, follicular, ovulation, luteal_early, luteal_mid, luteal_late
		phase_key: varchar("phase_key", { length: 32 }).notNull().unique(),
		// 阶段名称：月经期, 卵泡期, 排卵期, 黄体期前期等
		phase_name: varchar("phase_name", { length: 64 }).notNull(),
		// 天数范围：1-5, 6-13, 14-16, 17-21, 22-25, 26-28
		day_range: varchar("day_range", { length: 32 }).notNull(),
		// 阶段描述
		description: text("description"),
		// 激素状态（JSONB）
		// { estrogen: "lowest", progesterone: "lowest", fsh: "rising", lh: "low" }
		hormone_status: jsonb("hormone_status").notNull().$type<Record<string, string>>(),
		// 身心特征（JSONB）
		// { emotion: "...", thinking: "...", social: "...", body: "...", libido: "..." }
		characteristics: jsonb("characteristics").notNull().$type<{
			emotion?: string;
			thinking?: string;
			social?: string;
			body?: string;
			libido?: string;
			appearance?: string;
		}>(),
		// 行为建议（JSONB）
		// { best_actions: [...], avoid_actions: [...] }
		recommendations: jsonb("recommendations").$type<{
			best_actions?: string[];
			avoid_actions?: string[];
			self_care?: string[];
		}>(),
		// 给伴侣的建议
		partner_tips: text("partner_tips"),
		// 排序权重
		sort_order: integer("sort_order").notNull().default(0),
		// 时间戳
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("hormone_cycle_knowledge_phase_key_idx").on(table.phase_key),
		index("hormone_cycle_knowledge_sort_order_idx").on(table.sort_order),
	]
);

// 激素信息表（补充知识）
// 存储各激素的详细说明
export const hormoneInfo = pgTable(
	"hormone_info",
	{
		id: serial().primaryKey(),
		// 激素标识：estrogen, progesterone, fsh, lh, hcg, oxytocin
		hormone_key: varchar("hormone_key", { length: 32 }).notNull().unique(),
		// 激素名称：雌激素, 孕激素, 卵泡刺激素等
		hormone_name: varchar("hormone_name", { length: 64 }).notNull(),
		// 英文名
		english_name: varchar("english_name", { length: 64 }),
		// 主要来源
		source: text("source"),
		// 功能描述
		function: text("function"),
		// 男性对比（是否有，含量差异）
		male_comparison: text("male_comparison"),
		// 排序权重
		sort_order: integer("sort_order").notNull().default(0),
		// 时间戳
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("hormone_info_hormone_key_idx").on(table.hormone_key),
		index("hormone_info_sort_order_idx").on(table.sort_order),
	]
);
