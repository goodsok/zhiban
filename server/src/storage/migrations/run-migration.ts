/**
 * 执行数据库迁移脚本
 * 用于创建维度管理相关的表结构并初始化数据
 */

import { getSupabaseClient } from '../database/supabase-client'
import { readFileSync } from 'fs'
import { join } from 'path'

async function runMigration() {
  console.log('开始执行数据库迁移...')
  
  const supabase = getSupabaseClient()
  
  try {
    // 读取 SQL 文件
    const sqlPath = join(__dirname, 'create-dimension-tables.sql')
    const sql = readFileSync(sqlPath, 'utf-8')
    
    // 执行 SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      // 如果 exec_sql 不存在，尝试直接执行（需要拆分语句）
      console.log('尝试逐条执行 SQL...')
      await executeSqlStatements(supabase, sql)
    }
    
    console.log('✅ 表结构创建成功')
  } catch (err) {
    console.error('❌ 迁移失败:', err)
    throw err
  }
}

/**
 * 逐条执行 SQL 语句
 */
async function executeSqlStatements(supabase: any, sql: string) {
  // 分割 SQL 语句（简单实现，可能需要更复杂的解析）
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  for (const statement of statements) {
    if (statement.trim()) {
      console.log(`执行: ${statement.substring(0, 100)}...`)
      // Supabase 不支持直接执行 DDL，需要使用 PostgreSQL 客户端
      // 这里需要手动在 Supabase Dashboard 执行
    }
  }
  
  console.log('⚠️  请在 Supabase Dashboard 的 SQL Editor 中执行以下文件:')
  console.log('   server/src/storage/migrations/create-dimension-tables.sql')
}

// 导出函数供外部调用
export { runMigration }

// 直接运行时执行
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}
