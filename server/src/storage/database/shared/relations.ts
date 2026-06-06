import { relations } from "drizzle-orm/relations";
import { matches, momentsAnalysis, speedPlans, speedPlanMessages, stories, storyMessages, momentsPosts, momentsSuggestions } from "./schema";

export const momentsAnalysisRelations = relations(momentsAnalysis, ({one}) => ({
	match: one(matches, {
		fields: [momentsAnalysis.matchId],
		references: [matches.id]
	}),
}));

export const matchesRelations = relations(matches, ({many}) => ({
	momentsAnalyses: many(momentsAnalysis),
	speedPlans: many(speedPlans),
	stories: many(stories),
	momentsPosts: many(momentsPosts),
	momentsSuggestions: many(momentsSuggestions),
}));

export const speedPlansRelations = relations(speedPlans, ({one, many}) => ({
	match: one(matches, {
		fields: [speedPlans.matchId],
		references: [matches.id]
	}),
	speedPlanMessages_planId: many(speedPlanMessages, {
		relationName: "speedPlanMessages_planId_speedPlans_id"
	}),
	speedPlanMessages_planId: many(speedPlanMessages, {
		relationName: "speedPlanMessages_planId_speedPlans_id"
	}),
}));

export const speedPlanMessagesRelations = relations(speedPlanMessages, ({one}) => ({
	speedPlan_planId: one(speedPlans, {
		fields: [speedPlanMessages.planId],
		references: [speedPlans.id],
		relationName: "speedPlanMessages_planId_speedPlans_id"
	}),
	speedPlan_planId: one(speedPlans, {
		fields: [speedPlanMessages.planId],
		references: [speedPlans.id],
		relationName: "speedPlanMessages_planId_speedPlans_id"
	}),
}));

export const storiesRelations = relations(stories, ({one, many}) => ({
	match: one(matches, {
		fields: [stories.matchId],
		references: [matches.id]
	}),
	storyMessages: many(storyMessages),
}));

export const storyMessagesRelations = relations(storyMessages, ({one}) => ({
	story: one(stories, {
		fields: [storyMessages.storyId],
		references: [stories.id]
	}),
}));

export const momentsPostsRelations = relations(momentsPosts, ({one}) => ({
	match: one(matches, {
		fields: [momentsPosts.matchId],
		references: [matches.id]
	}),
}));

export const momentsSuggestionsRelations = relations(momentsSuggestions, ({one}) => ({
	match: one(matches, {
		fields: [momentsSuggestions.matchId],
		references: [matches.id]
	}),
}));