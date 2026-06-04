-- ==================== 聊天记录系统迁移 ====================
-- 创建时间: 2025-01-XX
-- 说明: 创建聊天记录表，用于存储用户上传的聊天截图/文本，供互动记录关联和AI分析

-- ==================== 1. 聊天记录表 ====================
CREATE TABLE IF NOT EXISTS chat_records (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL,

  -- 来源平台
  source VARCHAR(32) DEFAULT 'manual',
  -- 'wechat' | 'whatsapp' | 'tinder' | 'manual' | 'other'

  -- 内容类型
  content_type VARCHAR(16) NOT NULL DEFAULT 'text',
  -- 'text' (粘贴的文本) | 'image' (上传的截图)

  -- 原始内容（文本粘贴 或 AI 解析图片后的文字）
  raw_content TEXT,

  -- AI 解析后的结构化消息
  parsed_messages JSONB DEFAULT '[]'::jsonb,
  -- [{ sender: string, content: string, timestamp?: string }]

  -- 图片存储 key（如果通过截图上传）
  image_key TEXT,

  -- AI 生成的内容摘要
  summary TEXT,

  -- 提取的关键话题/标签
  key_topics JSONB DEFAULT '[]'::jsonb,

  -- 整体情感倾向
  sentiment VARCHAR(16),
  -- 'positive' | 'neutral' | 'mixed' | 'negative'

  -- 消息条数
  message_count INTEGER DEFAULT 0,

  -- 聊天时间范围
  date_range_start TIMESTAMPTZ,
  date_range_end TIMESTAMPTZ,

  -- 元信息
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- 聊天记录索引
CREATE INDEX IF NOT EXISTS chat_records_match_id_idx ON chat_records(match_id);
CREATE INDEX IF NOT EXISTS chat_records_source_idx ON chat_records(source);
CREATE INDEX IF NOT EXISTS chat_records_created_at_idx ON chat_records(created_at DESC);

-- 聊天记录 RLS 策略
ALTER TABLE chat_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_records_允许公开读取" ON chat_records
  FOR SELECT TO public USING (true);

CREATE POLICY "chat_records_允许公开写入" ON chat_records
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "chat_records_允许公开更新" ON chat_records
  FOR UPDATE TO public USING (true);

CREATE POLICY "chat_records_允许公开删除" ON chat_records
  FOR DELETE TO public USING (true);

-- 聊天记录更新时间触发器
DROP TRIGGER IF EXISTS update_chat_records_updated_at ON chat_records;
CREATE TRIGGER update_chat_records_updated_at
    BEFORE UPDATE ON chat_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================== 完成 ====================
DO $$
BEGIN
  RAISE NOTICE '聊天记录系统迁移完成！';
  RAISE NOTICE '新增表: chat_records';
END $$;
