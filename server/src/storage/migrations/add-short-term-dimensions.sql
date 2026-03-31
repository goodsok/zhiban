-- ==================== 添加关系适用性字段和短期关系维度 ====================
-- 创建时间: 2025-01-XX
-- 说明: 添加 relationship_applicability 字段，插入 Layer 4 短期关系维度

-- ==================== 1. 添加关系适用性字段 ====================
ALTER TABLE dimension_definitions 
ADD COLUMN IF NOT EXISTS relationship_applicability VARCHAR(20) DEFAULT 'universal';

-- 添加索引
CREATE INDEX IF NOT EXISTS dimension_definitions_applicability_idx 
ON dimension_definitions(relationship_applicability);

-- 更新现有维度为 universal（如果还没有设置）
UPDATE dimension_definitions 
SET relationship_applicability = 'universal' 
WHERE relationship_applicability IS NULL;

-- ==================== 2. 插入 Layer 4 短期关系维度 ====================
-- 注意：使用 ON CONFLICT DO NOTHING 避免重复插入

-- ==================== 4.1 性观念与亲密 ====================

INSERT INTO dimension_definitions (
  dimension_key, display_name, description, layer, category,
  data_type, enum_options, input_type, weight, importance,
  relationship_applicability, source_allowed, sort_order
) VALUES
('sexualAttitude', '性观念', '对性和身体亲密的态度与价值观', 4, 'sexual_intimacy',
  'enum', '[{"value":"conservative","label":"传统保守"},{"value":"moderate","label":"开放适中"},{"value":"liberal","label":"开放自由"},{"value":"casual","label":"随意开放"}]',
  'select', 1.5, 'critical', 'universal', '["manual"]', 300),

('physicalIntimacyTimeline', '身体亲密时间线', '对发生身体亲密的时间预期', 4, 'sexual_intimacy',
  'enum', '[{"value":"first_date","label":"第一次约会即可"},{"value":"few_dates","label":"几次约会后"},{"value":"after_trust","label":"建立信任后"},{"value":"after_commitment","label":"确定关系后"},{"value":"after_marriage","label":"婚后"}]',
  'select', 1.4, 'important', 'universal', '["manual"]', 301),

('sexualExperienceLevel', '性经验丰富度', '过往性经验的丰富程度', 4, 'sexual_intimacy',
  'enum', '[{"value":"inexperienced","label":"经验很少"},{"value":"limited","label":"经验有限"},{"value":"moderate","label":"经验适中"},{"value":"experienced","label":"经验丰富"}]',
  'select', 1.0, 'optional', 'short_term', '["manual"]', 302),

('safeSexAttitude', '安全性行为态度', '对安全性行为的重视程度', 4, 'sexual_intimacy',
  'enum', '[{"value":"very_strict","label":"非常严格"},{"value":"careful","label":"比较谨慎"},{"value":"flexible","label":"灵活视情况"},{"value":"casual","label":"不太在意"}]',
  'select', 1.3, 'important', 'short_term', '["manual"]', 303),

('sexualCompatibilityImportance', '性契合度重要性', '认为性契合在关系中的重要程度', 4, 'sexual_intimacy',
  'int', NULL, 'slider', 1.2, 'important', 'short_term', '["manual"]', 304),

('physicalAffectionStyle', '肢体亲密度偏好', '在公开场合和私下对身体接触的舒适度', 4, 'sexual_intimacy',
  'enum', '[{"value":"very_affectionate","label":"非常喜欢肢体接触"},{"value":"moderate","label":"适度亲昵"},{"value":"private_only","label":"私下亲密"},{"value":"reserved","label":"比较含蓄"}]',
  'select', 1.1, 'important', 'universal', '["manual"]', 305)
ON CONFLICT (dimension_key) DO NOTHING;

-- ==================== 4.2 关系形式偏好 ====================

INSERT INTO dimension_definitions (
  dimension_key, display_name, description, layer, category,
  data_type, enum_options, input_type, weight, importance,
  relationship_applicability, source_allowed, sort_order
) VALUES
('relationshipFormPreference', '关系形式偏好', '对关系形式的接受和偏好', 4, 'relationship_form',
  'string[]', NULL, 'multiselect', 1.4, 'critical', 'universal', '["manual"]', 310),

('exclusivityExpectation', '独占性期望', '对关系排他性的期望程度', 4, 'relationship_form',
  'enum', '[{"value":"strictly_exclusive","label":"必须排他"},{"value":"prefer_exclusive","label":"偏好排他"},{"value":"flexible","label":"可以协商"},{"value":"open_acceptable","label":"接受开放"}]',
  'select', 1.5, 'critical', 'short_term', '["manual"]', 311),

('labelingPreference', '关系标签化偏好', '对给关系贴标签（如男女朋友）的态度', 4, 'relationship_form',
  'enum', '[{"value":"need_label","label":"需要明确标签"},{"value":"prefer_label","label":"偏好有标签"},{"value":"flexible","label":"标签不重要"},{"value":"avoid_label","label":"不想贴标签"}]',
  'select', 1.2, 'important', 'short_term', '["manual"]', 312),

('casualDatingAcceptance', '随意约会接受度', '对没有长期承诺的约会关系的态度', 4, 'relationship_form',
  'enum', '[{"value":"prefer_casual","label":"偏好随意约会"},{"value":"accept","label":"可以接受"},{"value":"hesitant","label":"有些犹豫"},{"value":"reject","label":"不接受"}]',
  'select', 1.3, 'important', 'short_term', '["manual"]', 313),

('fwbAcceptance', '朋友变恋人接受度', '对从朋友发展为亲密关系的态度', 4, 'relationship_form',
  'enum', '[{"value":"open_to_it","label":"可以接受"},{"value":"case_by_case","label":"视情况而定"},{"value":"prefer_separate","label":"朋友恋人分开"},{"value":"uncomfortable","label":"不太舒服"}]',
  'select', 1.0, 'optional', 'short_term', '["manual"]', 314),

('multiplePartnerAcceptance', '多伴侣接受度', '对同时与多人约会或保持关系的态度', 4, 'relationship_form',
  'enum', '[{"value":"open_to_it","label":"可以接受"},{"value":"with_transparency","label":"坦诚前提下可接受"},{"value":"case_by_case","label":"视情况而定"},{"value":"not_acceptable","label":"不能接受"}]',
  'select', 1.3, 'important', 'short_term', '["manual"]', 315)
ON CONFLICT (dimension_key) DO NOTHING;

-- ==================== 4.3 情感投入与边界 ====================

INSERT INTO dimension_definitions (
  dimension_key, display_name, description, layer, category,
  data_type, enum_options, input_type, weight, importance,
  relationship_applicability, source_allowed, sort_order
) VALUES
('emotionalBoundaryStyle', '情感边界设定', '在关系中对情感投入的边界控制方式', 4, 'emotional_investment',
  'enum', '[{"value":"all_in","label":"全情投入"},{"value":"gradual","label":"逐步开放"},{"value":"guarded","label":"有保留"},{"value":"compartmentalized","label":"情感隔离"}]',
  'select', 1.4, 'important', 'short_term', '["manual"]', 320),

('emotionalInvestmentSpeed', '情感投入速度', '在感情中投入情感的快慢节奏', 4, 'emotional_investment',
  'enum', '[{"value":"very_fast","label":"很快投入"},{"value":"fast","label":"比较快"},{"value":"moderate","label":"循序渐进"},{"value":"slow","label":"慢热型"},{"value":"very_slow","label":"非常慢热"}]',
  'select', 1.2, 'important', 'universal', '["manual"]', 321),

('emotionalDetachmentAbility', '情感抽离能力', '在关系结束后或需要时抽离情感的能力', 4, 'emotional_investment',
  'int', NULL, 'slider', 1.0, 'optional', 'short_term', '["manual"]', 322),

('feelingsExpressionTiming', '表达感觉的时机', '多久之后会表达喜欢或爱的感觉', 4, 'emotional_investment',
  'enum', '[{"value":"early","label":"很早就说"},{"value":"when_sure","label":"确定后说"},{"value":"wait_for_partner","label":"等对方先说"},{"value":"rarely","label":"很少表达"}]',
  'select', 1.1, 'important', 'short_term', '["manual"]', 323),

('emotionalAvailabilityLevel', '情感可用性', '当前能够投入感情的程度', 4, 'emotional_investment',
  'enum', '[{"value":"fully_available","label":"完全可用"},{"value":"mostly_available","label":"大部分可用"},{"value":"partially_available","label":"部分可用"},{"value":"limited","label":"情感受限"},{"value":"unavailable","label":"暂时不可用"}]',
  'select', 1.5, 'critical', 'universal', '["manual"]', 324)
ON CONFLICT (dimension_key) DO NOTHING;

-- ==================== 4.4 时间可用性 ====================

INSERT INTO dimension_definitions (
  dimension_key, display_name, description, layer, category,
  data_type, enum_options, input_type, weight, importance,
  relationship_applicability, source_allowed, sort_order
) VALUES
('availabilityForDating', '恋爱时间可用性', '当前可用于恋爱的时间和精力', 4, 'time_availability',
  'enum', '[{"value":"fully_available","label":"充分可用"},{"value":"mostly_available","label":"大部分可用"},{"value":"limited","label":"时间有限"},{"value":"irregular","label":"时间不规律"},{"value":"mostly_unavailable","label":"很少有时间"}]',
  'select', 1.4, 'important', 'universal', '["manual"]', 330),

('meetingFrequencyExpectation', '见面频率期望', '期望与约会对象见面的频率', 4, 'time_availability',
  'enum', '[{"value":"daily","label":"每天都见"},{"value":"few_times_week","label":"每周几次"},{"value":"weekly","label":"每周一次"},{"value":"biweekly","label":"每两周一次"},{"value":"flexible","label":"灵活安排"}]',
  'select', 1.2, 'important', 'short_term', '["manual"]', 331),

('responseTimePreference', '回复消息偏好', '自己回复消息的习惯速度', 4, 'time_availability',
  'enum', '[{"value":"instant","label":"基本秒回"},{"value":"within_hour","label":"一小时内"},{"value":"within_day","label":"当天回复"},{"value":"when_available","label":"有空才回"},{"value":"unpredictable","label":"不太稳定"}]',
  'select', 1.0, 'optional', 'short_term', '["manual"]', 332),

('schedulingFlexibility', '日程安排灵活性', '临时约会的可接受程度', 4, 'time_availability',
  'enum', '[{"value":"very_flexible","label":"非常灵活"},{"value":"somewhat_flexible","label":"比较灵活"},{"value":"needs_notice","label":"需要提前约"},{"value":"strict_schedule","label":"日程固定"}]',
  'select', 1.0, 'optional', 'short_term', '["manual"]', 333),

('longDistanceAcceptance', '异地恋接受度', '对异地关系的接受程度', 4, 'time_availability',
  'enum', '[{"value":"open_to_it","label":"可以接受"},{"value":"with_end_date","label":"有结束日期可以"},{"value":"hesitant","label":"有些犹豫"},{"value":"not_acceptable","label":"不接受"}]',
  'select', 1.2, 'important', 'universal', '["manual"]', 334),

('travelWillingness', '见面出行意愿', '为了见面愿意付出的出行代价', 4, 'time_availability',
  'enum', '[{"value":"very_willing","label":"愿意长途奔波"},{"value":"willing","label":"可以跨城市"},{"value":"moderate","label":"同城内可以"},{"value":"limited","label":"附近最好"},{"value":"prefer_close","label":"只想见附近的"}]',
  'select', 1.0, 'optional', 'short_term', '["manual"]', 335)
ON CONFLICT (dimension_key) DO NOTHING;

-- ==================== 4.5 隐私与公开 ====================

INSERT INTO dimension_definitions (
  dimension_key, display_name, description, layer, category,
  data_type, enum_options, input_type, weight, importance,
  relationship_applicability, source_allowed, sort_order
) VALUES
('privacyProtectionLevel', '隐私保护倾向', '在关系中对隐私的重视程度', 4, 'privacy_public',
  'enum', '[{"value":"very_open","label":"非常开放"},{"value":"selective","label":"选择性开放"},{"value":"compartmentalized","label":"严格区隔"},{"value":"very_private","label":"高度保密"}]',
  'select', 1.2, 'important', 'short_term', '["manual"]', 340),

('socialMediaPublicStatus', '社交媒体公开偏好', '是否愿意在社交媒体上公开关系状态', 4, 'privacy_public',
  'enum', '[{"value":"like_to_share","label":"喜欢分享"},{"value":"okay_to_post","label":"可以发"},{"value":"keep_private","label":"保持私密"},{"value":"avoid_completely","label":"完全避免"}]',
  'select', 1.1, 'important', 'short_term', '["manual"]', 341),

('friendsIntroductionTiming', '介绍给朋友时机', '多久后会介绍约会对象给朋友认识', 4, 'privacy_public',
  'enum', '[{"value":"early","label":"很早就介绍"},{"value":"after_stable","label":"稳定后介绍"},{"value":"after_commitment","label":"确定关系后"},{"value":"hesitant","label":"比较犹豫"},{"value":"prefer_not","label":"不想介绍"}]',
  'select', 1.0, 'optional', 'short_term', '["manual"]', 342),

('familyIntroductionTiming', '介绍给家人时机', '多久后会介绍约会对象给家人认识', 4, 'privacy_public',
  'enum', '[{"value":"early","label":"比较早介绍"},{"value":"after_serious","label":"认真后介绍"},{"value":"after_commitment","label":"确定关系后"},{"value":"before_marriage","label":"谈婚论嫁时"},{"value":"hesitant","label":"比较犹豫"}]',
  'select', 1.1, 'important', 'long_term', '["manual"]', 343),

('phonePrivacyBoundary', '手机隐私边界', '对伴侣使用自己手机的态度', 4, 'privacy_public',
  'enum', '[{"value":"fully_open","label":"完全开放"},{"value":"mostly_open","label":"大部分开放"},{"value":"selective","label":"选择性开放"},{"value":"private","label":"保持私密"}]',
  'select', 1.0, 'optional', 'short_term', '["manual"]', 344)
ON CONFLICT (dimension_key) DO NOTHING;

-- ==================== 4.6 短期关系模式 ====================

INSERT INTO dimension_definitions (
  dimension_key, display_name, description, layer, category,
  data_type, enum_options, input_type, weight, importance,
  relationship_applicability, source_allowed, sort_order
) VALUES
('shortTermRelationshipExperience', '短期关系经历', '过往短期关系的经历情况', 4, 'short_term_patterns',
  'enum', '[{"value":"extensive","label":"经历丰富"},{"value":"some","label":"有一些经历"},{"value":"limited","label":"经历有限"},{"value":"none","label":"没有经历"}]',
  'select', 0.8, 'optional', 'short_term', '["manual"]', 350),

('typicalRelationshipDuration', '典型关系持续时长', '过往恋爱关系通常维持的时间', 4, 'short_term_patterns',
  'enum', '[{"value":"weeks","label":"几周"},{"value":"months","label":"几个月"},{"value":"half_year","label":"半年左右"},{"value":"year_plus","label":"一年以上"},{"value":"varies","label":"差异很大"}]',
  'select', 1.0, 'optional', 'short_term', '["manual"]', 351),

('relationshipEndingStyle', '关系结束风格', '通常如何结束一段关系', 4, 'short_term_patterns',
  'enum', '[{"value":"direct_talk","label":"直接沟通"},{"value":"gradual_distance","label":"逐渐疏远"},{"value":"ghosting","label":"消失断联"},{"value":"mutual_discussion","label":"协商结束"}]',
  'select', 1.1, 'important', 'short_term', '["manual"]', 352),

('postBreakupContactAttitude', '分手后联系态度', '对分手后保持联系的态度', 4, 'short_term_patterns',
  'enum', '[{"value":"stay_friends","label":"可以做朋友"},{"value":"casual_contact","label":"偶尔联系"},{"value":"no_contact","label":"不再联系"},{"value":"case_by_case","label":"视情况而定"}]',
  'select', 1.0, 'optional', 'short_term', '["manual"]', 353),

('reboundRelationshipAttitude', '反弹关系态度', '对分手后快速开始新关系的态度', 4, 'short_term_patterns',
  'enum', '[{"value":"quick_to_date","label":"很快开始新关系"},{"value":"takes_time","label":"需要时间恢复"},{"value":"depends","label":"看情况"},{"value":"avoids","label":"避免反弹关系"}]',
  'select', 0.9, 'optional', 'short_term', '["manual"]', 354),

('datingMultiplePeopleStyle', '多人约会风格', '同时与多人约会时的处理方式', 4, 'short_term_patterns',
  'enum', '[{"value":"transparent","label":"坦诚告知"},{"value":"dont_ask_dont_tell","label":"不问不说"},{"value":"exclusive_focus","label":"一次只专注一人"},{"value":"not_applicable","label":"不适用"}]',
  'select', 1.1, 'important', 'short_term', '["manual"]', 355)
ON CONFLICT (dimension_key) DO NOTHING;

-- ==================== 4.7 约会节奏与信号 ====================

INSERT INTO dimension_definitions (
  dimension_key, display_name, description, layer, category,
  data_type, enum_options, input_type, weight, importance,
  relationship_applicability, source_allowed, sort_order
) VALUES
('datingPacePreference', '约会节奏偏好', '希望关系发展的快慢节奏', 4, 'dating_dynamics',
  'enum', '[{"value":"very_fast","label":"快速发展"},{"value":"fast","label":"比较快"},{"value":"moderate","label":"适中节奏"},{"value":"slow","label":"慢慢来"},{"value":"very_slow","label":"非常慢"}]',
  'select', 1.2, 'important', 'short_term', '["manual"]', 360),

('initiativeStyle', '主动程度', '在约会中主动发起的倾向', 4, 'dating_dynamics',
  'enum', '[{"value":"very_initiative","label":"非常主动"},{"value":"initiative","label":"比较主动"},{"value":"balanced","label":"有来有往"},{"value":"passive","label":"比较被动"},{"value":"very_passive","label":"非常被动"}]',
  'select', 1.1, 'important', 'short_term', '["manual"]', 361),

('signalSensitivity', '信号敏感度', '对对方释放的约会信号的敏感程度', 4, 'dating_dynamics',
  'enum', '[{"value":"very_sensitive","label":"非常敏感"},{"value":"sensitive","label":"比较敏感"},{"value":"moderate","label":"一般"},{"value":"oblivious","label":"不太敏感"},{"value":"clueless","label":"完全不懂"}]',
  'select', 0.9, 'optional', 'short_term', '["manual"]', 362),

('gamesPlayingAttitude', '恋爱游戏态度', '对"欲擒故纵"等约会策略的态度', 4, 'dating_dynamics',
  'enum', '[{"value":"plays_games","label":"会玩套路"},{"value":"sometimes","label":"偶尔为之"},{"value":"straightforward","label":"直接坦诚"},{"value":"hates_games","label":"讨厌套路"}]',
  'select', 1.0, 'optional', 'short_term', '["manual"]', 363),

('flirtingStyle', '调情风格', '表达兴趣和吸引力的方式', 4, 'dating_dynamics',
  'string[]', NULL, 'multiselect', 0.8, 'optional', 'short_term', '["manual","chat_analysis"]', 364),

('dealbreakerList', '约会底线清单', '绝对不能接受的约会对象特质', 4, 'dating_dynamics',
  'string[]', NULL, 'multiselect', 1.3, 'important', 'universal', '["manual"]', 365)
ON CONFLICT (dimension_key) DO NOTHING;

-- ==================== 4.8 生活状态 ====================

INSERT INTO dimension_definitions (
  dimension_key, display_name, description, layer, category,
  data_type, enum_options, input_type, weight, importance,
  relationship_applicability, source_allowed, sort_order
) VALUES
('currentDatingStatus', '当前约会状态', '目前是否在与其他人约会', 4, 'current_status',
  'enum', '[{"value":"single","label":"单身，未约会"},{"value":"casually_dating","label":"随意约会中"},{"value":"seeing_someone","label":"在接触某人"},{"value":"in_relationship","label":"恋爱中"},{"value":"complicated","label":"关系复杂"}]',
  'select', 1.5, 'critical', 'short_term', '["manual"]', 370),

('readinessForRelationship', '恋爱准备度', '心理和现实层面准备好进入关系的程度', 4, 'current_status',
  'int', NULL, 'slider', 1.4, 'important', 'universal', '["manual"]', 371),

('recentBreakupStatus', '近期分手状态', '最近是否刚结束一段关系', 4, 'current_status',
  'enum', '[{"value":"no_recent_breakup","label":"近期没有"},{"value":"within_month","label":"一个月内"},{"value":"within_three_months","label":"三个月内"},{"value":"within_six_months","label":"半年内"},{"value":"still_healing","label":"还在疗伤"}]',
  'select', 1.2, 'important', 'short_term', '["manual"]', 372),

('lifePriorityRanking', '生活优先级排序', '当前生活中各项事务的优先级', 4, 'current_status',
  'string[]', NULL, 'multiselect', 1.1, 'important', 'universal', '["manual"]', 373)
ON CONFLICT (dimension_key) DO NOTHING;

-- ==================== 完成 ====================
-- 迁移完成提示
DO $$
BEGIN
  RAISE NOTICE '短期关系维度迁移完成！';
  RAISE NOTICE '新增字段: relationship_applicability';
  RAISE NOTICE '新增维度数量: 约50个（Layer 4）';
END $$;
