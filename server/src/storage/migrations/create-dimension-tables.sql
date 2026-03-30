-- ==================== 维度管理系统表结构迁移 ====================
-- 创建时间: 2025-01-XX
-- 说明: 创建维度定义、维度值、维度历史三个表

-- ==================== 1. 维度定义表 ====================
CREATE TABLE IF NOT EXISTS dimension_definitions (
  id SERIAL PRIMARY KEY,
  
  -- 维度标识
  dimension_key VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- 分类信息
  layer INTEGER NOT NULL, -- 1-5，对应五个层级
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  
  -- 数据约束
  data_type VARCHAR(20) NOT NULL, -- string, int, float, boolean, enum, string[], object
  enum_options JSONB, -- 枚举选项 [{value, label}]
  validation_rules JSONB, -- {min, max, pattern, required}
  default_value JSONB,
  
  -- UI 配置
  input_type VARCHAR(20), -- text, select, multiselect, slider, textarea
  placeholder TEXT,
  help_text TEXT,
  icon VARCHAR(50),
  
  -- 权重与重要性
  weight DECIMAL(3,2) DEFAULT 1.00, -- 用于推进值计算
  importance VARCHAR(20) DEFAULT 'optional', -- critical, important, optional
  
  -- 来源控制
  source_allowed JSONB DEFAULT '["manual"]'::jsonb, -- manual, ai_extract, chat_analysis, questionnaire
  
  -- 元信息
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- 维度定义表索引
CREATE INDEX IF NOT EXISTS dimension_definitions_layer_idx ON dimension_definitions(layer);
CREATE INDEX IF NOT EXISTS dimension_definitions_category_idx ON dimension_definitions(category);
CREATE INDEX IF NOT EXISTS dimension_definitions_active_idx ON dimension_definitions(is_active) WHERE is_active = true;

-- 维度定义表 RLS 策略
ALTER TABLE dimension_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dimension_definitions_允许公开读取" ON dimension_definitions
  FOR SELECT TO public USING (true);

CREATE POLICY "dimension_definitions_允许公开写入" ON dimension_definitions
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "dimension_definitions_允许公开更新" ON dimension_definitions
  FOR UPDATE TO public USING (true);

CREATE POLICY "dimension_definitions_允许公开删除" ON dimension_definitions
  FOR DELETE TO public USING (true);


-- ==================== 2. 维度值表 ====================
CREATE TABLE IF NOT EXISTS profile_dimension_values (
  id SERIAL PRIMARY KEY,
  
  -- 关联
  match_id INTEGER NOT NULL,
  dimension_key VARCHAR(100) NOT NULL,
  
  -- 值（核心）
  value JSONB NOT NULL,
  
  -- 来源追踪
  source VARCHAR(20) NOT NULL, -- manual, ai_extract, chat_analysis, questionnaire
  source_detail JSONB, -- {chat_id, message_id, confidence, extracted_from}
  
  -- 置信度（AI提取时使用）
  confidence DECIMAL(3,2), -- 0.00 - 1.00
  
  -- 历史版本
  previous_value JSONB,
  changed_reason TEXT,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  
  -- 唯一约束：每个match每个维度只有一条当前值
  UNIQUE(match_id, dimension_key)
);

-- 维度值表索引
CREATE INDEX IF NOT EXISTS profile_dimension_values_match_id_idx ON profile_dimension_values(match_id);
CREATE INDEX IF NOT EXISTS profile_dimension_values_dimension_key_idx ON profile_dimension_values(dimension_key);
CREATE INDEX IF NOT EXISTS profile_dimension_values_source_idx ON profile_dimension_values(source);
CREATE INDEX IF NOT EXISTS profile_dimension_values_updated_at_idx ON profile_dimension_values(updated_at DESC);
CREATE INDEX IF NOT EXISTS profile_dimension_values_value_idx ON profile_dimension_values USING GIN(value);

-- 维度值表 RLS 策略
ALTER TABLE profile_dimension_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_dimension_values_允许公开读取" ON profile_dimension_values
  FOR SELECT TO public USING (true);

CREATE POLICY "profile_dimension_values_允许公开写入" ON profile_dimension_values
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "profile_dimension_values_允许公开更新" ON profile_dimension_values
  FOR UPDATE TO public USING (true);

CREATE POLICY "profile_dimension_values_允许公开删除" ON profile_dimension_values
  FOR DELETE TO public USING (true);


-- ==================== 3. 维度值历史表 ====================
CREATE TABLE IF NOT EXISTS profile_dimension_history (
  id SERIAL PRIMARY KEY,
  
  -- 关联
  match_id INTEGER NOT NULL,
  dimension_key VARCHAR(100) NOT NULL,
  
  -- 变更
  old_value JSONB,
  new_value JSONB NOT NULL,
  
  -- 变更元信息
  change_source VARCHAR(20) NOT NULL, -- manual_update, ai_update, correction
  changed_reason TEXT,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 维度历史表索引
CREATE INDEX IF NOT EXISTS profile_dimension_history_match_id_idx ON profile_dimension_history(match_id);
CREATE INDEX IF NOT EXISTS profile_dimension_history_created_at_idx ON profile_dimension_history(created_at DESC);
CREATE INDEX IF NOT EXISTS profile_dimension_history_dimension_key_idx ON profile_dimension_history(dimension_key);

-- 维度历史表 RLS 策略
ALTER TABLE profile_dimension_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_dimension_history_允许公开读取" ON profile_dimension_history
  FOR SELECT TO public USING (true);

CREATE POLICY "profile_dimension_history_允许公开写入" ON profile_dimension_history
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "profile_dimension_history_允许公开更新" ON profile_dimension_history
  FOR UPDATE TO public USING (true);

CREATE POLICY "profile_dimension_history_允许公开删除" ON profile_dimension_history
  FOR DELETE TO public USING (true);


-- ==================== 4. 创建触发器函数 ====================
-- 自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为 dimension_definitions 表创建触发器
DROP TRIGGER IF EXISTS update_dimension_definitions_updated_at ON dimension_definitions;
CREATE TRIGGER update_dimension_definitions_updated_at
    BEFORE UPDATE ON dimension_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为 profile_dimension_values 表创建触发器
DROP TRIGGER IF EXISTS update_profile_dimension_values_updated_at ON profile_dimension_values;
CREATE TRIGGER update_profile_dimension_values_updated_at
    BEFORE UPDATE ON profile_dimension_values
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ==================== 5. 创建视图（可选） ====================
-- 按层级组织维度值视图
CREATE OR REPLACE VIEW profile_dimensions_by_layer AS
SELECT 
  pdv.match_id,
  dd.layer,
  dd.category,
  jsonb_object_agg(
    dd.dimension_key,
    jsonb_build_object(
      'value', pdv.value,
      'display_name', dd.display_name,
      'source', pdv.source,
      'confidence', pdv.confidence,
      'updated_at', pdv.updated_at
    )
  ) as dimensions
FROM profile_dimension_values pdv
JOIN dimension_definitions dd ON pdv.dimension_key = dd.dimension_key
WHERE dd.is_active = true
GROUP BY pdv.match_id, dd.layer, dd.category;


-- ==================== 完成提示 ====================
-- 迁移完成后，请运行维度定义初始化脚本
-- INSERT INTO dimension_definitions ... (见 dimension-definitions.ts)
