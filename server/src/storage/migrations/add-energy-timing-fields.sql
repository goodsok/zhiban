-- 为关系能量表添加时机相关字段
ALTER TABLE relationship_energy 
ADD COLUMN IF NOT EXISTS current_stage VARCHAR(32) DEFAULT '刚刚认识',
ADD COLUMN IF NOT EXISTS active_boosters JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS active_penalties JSONB DEFAULT '[]';

-- 更新 change_reason 类型，添加 'combo'
ALTER TABLE relationship_energy_history 
ALTER COLUMN change_reason TYPE VARCHAR(32);

-- 添加注释
COMMENT ON COLUMN relationship_energy.current_stage IS '当前关系阶段: 刚刚认识/初识期/热恋初期/热恋期/稳定期/深化期/成熟期';
COMMENT ON COLUMN relationship_energy.active_boosters IS '当前激活的时机加成ID列表';
COMMENT ON COLUMN relationship_energy.active_penalties IS '当前激活的时机衰减ID列表';
