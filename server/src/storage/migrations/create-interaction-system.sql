-- ==================== 互动事件系统迁移 ====================
-- 创建时间: 2025-01-XX
-- 说明: 创建互动事件表、关系能量表、关系能量历史表

-- ==================== 1. 互动事件表 ====================
CREATE TABLE IF NOT EXISTS interaction_events (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL,
  
  -- 互动类型
  interaction_type VARCHAR(32) NOT NULL,
  -- 'date' | 'chat' | 'call' | 'video' | 'message' | 'gift' | 'physical' | 'social' | 'other'
  
  -- 互动分类
  interaction_category VARCHAR(32),
  -- 'online' | 'offline' | 'hybrid'
  
  -- 时间信息
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  
  -- 发起方
  initiator VARCHAR(16),
  -- 'self' | 'partner' | 'mutual'
  
  -- 地点（线下约会）
  location TEXT,
  location_type VARCHAR(32),
  -- 'restaurant' | 'cinema' | 'outdoor' | 'home' | 'online' | 'cafe' | 'shopping' | 'entertainment' | 'other'
  
  -- 互动内容
  title VARCHAR(128),
  description TEXT,
  activities JSONB DEFAULT '[]'::jsonb,
  
  -- 互动质量评估
  quality_score INTEGER,
  -- 0-100
  mood VARCHAR(32),
  -- 'excellent' | 'good' | 'neutral' | 'awkward' | 'bad'
  
  -- 关系影响
  energy_change INTEGER DEFAULT 0,
  breakthrough_moment TEXT,
  issues_encountered TEXT,
  
  -- 新发现
  new_insights JSONB DEFAULT '[]'::jsonb,
  
  -- 关联
  related_task_id INTEGER,
  chat_record_ids JSONB DEFAULT '[]'::jsonb,
  
  -- 元信息
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- 互动事件索引
CREATE INDEX IF NOT EXISTS interaction_events_match_id_idx ON interaction_events(match_id);
CREATE INDEX IF NOT EXISTS interaction_events_type_idx ON interaction_events(interaction_type);
CREATE INDEX IF NOT EXISTS interaction_events_started_at_idx ON interaction_events(started_at DESC);
CREATE INDEX IF NOT EXISTS interaction_events_quality_idx ON interaction_events(quality_score);

-- 互动事件 RLS 策略
ALTER TABLE interaction_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interaction_events_允许公开读取" ON interaction_events
  FOR SELECT TO public USING (true);

CREATE POLICY "interaction_events_允许公开写入" ON interaction_events
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "interaction_events_允许公开更新" ON interaction_events
  FOR UPDATE TO public USING (true);

CREATE POLICY "interaction_events_允许公开删除" ON interaction_events
  FOR DELETE TO public USING (true);

-- 互动事件更新时间触发器
DROP TRIGGER IF EXISTS update_interaction_events_updated_at ON interaction_events;
CREATE TRIGGER update_interaction_events_updated_at
    BEFORE UPDATE ON interaction_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================== 2. 关系能量表 ====================
CREATE TABLE IF NOT EXISTS relationship_energy (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL UNIQUE,
  
  -- 能量总值 (0-100)
  total_energy INTEGER DEFAULT 0 NOT NULL,
  
  -- 三大维度分数 (0-100)
  information_score INTEGER DEFAULT 0 NOT NULL,
  interaction_score INTEGER DEFAULT 0 NOT NULL,
  emotional_score INTEGER DEFAULT 0 NOT NULL,
  
  -- 能量趋势
  trend VARCHAR(16) DEFAULT 'stable' NOT NULL,
  -- 'rising' | 'stable' | 'declining' | 'stagnant'
  
  -- 关键指标
  total_interactions INTEGER DEFAULT 0 NOT NULL,
  avg_quality_score INTEGER DEFAULT 0 NOT NULL,
  last_interaction_days INTEGER DEFAULT -1 NOT NULL,
  breakthrough_count INTEGER DEFAULT 0 NOT NULL,
  dimension_completeness INTEGER DEFAULT 0 NOT NULL,
  
  -- 上次计算时间
  calculated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- 元信息
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- 关系能量索引
CREATE INDEX IF NOT EXISTS relationship_energy_match_id_idx ON relationship_energy(match_id);
CREATE INDEX IF NOT EXISTS relationship_energy_total_idx ON relationship_energy(total_energy DESC);

-- 关系能量 RLS 策略
ALTER TABLE relationship_energy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "relationship_energy_允许公开读取" ON relationship_energy
  FOR SELECT TO public USING (true);

CREATE POLICY "relationship_energy_允许公开写入" ON relationship_energy
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "relationship_energy_允许公开更新" ON relationship_energy
  FOR UPDATE TO public USING (true);

CREATE POLICY "relationship_energy_允许公开删除" ON relationship_energy
  FOR DELETE TO public USING (true);

-- 关系能量更新时间触发器
DROP TRIGGER IF EXISTS update_relationship_energy_updated_at ON relationship_energy;
CREATE TRIGGER update_relationship_energy_updated_at
    BEFORE UPDATE ON relationship_energy
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================== 3. 关系能量历史表 ====================
CREATE TABLE IF NOT EXISTS relationship_energy_history (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL,
  
  -- 能量快照
  total_energy INTEGER NOT NULL,
  information_score INTEGER NOT NULL,
  interaction_score INTEGER NOT NULL,
  emotional_score INTEGER NOT NULL,
  
  -- 变化原因
  change_reason VARCHAR(32) NOT NULL,
  -- 'interaction' | 'dimension_update' | 'time_decay' | 'breakthrough' | 'manual'
  change_detail TEXT,
  
  -- 关联事件
  related_event_id INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 关系能量历史索引
CREATE INDEX IF NOT EXISTS relationship_energy_history_match_id_idx ON relationship_energy_history(match_id);
CREATE INDEX IF NOT EXISTS relationship_energy_history_created_at_idx ON relationship_energy_history(created_at DESC);

-- 关系能量历史 RLS 策略
ALTER TABLE relationship_energy_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "relationship_energy_history_允许公开读取" ON relationship_energy_history
  FOR SELECT TO public USING (true);

CREATE POLICY "relationship_energy_history_允许公开写入" ON relationship_energy_history
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "relationship_energy_history_允许公开删除" ON relationship_energy_history
  FOR DELETE TO public USING (true);

-- ==================== 4. 为现有 match 创建能量记录 ====================
INSERT INTO relationship_energy (match_id)
SELECT id FROM matches
WHERE id NOT IN (SELECT match_id FROM relationship_energy)
ON CONFLICT (match_id) DO NOTHING;

-- ==================== 完成 ====================
DO $$
BEGIN
  RAISE NOTICE '互动事件系统迁移完成！';
  RAISE NOTICE '新增表: interaction_events, relationship_energy, relationship_energy_history';
END $$;
