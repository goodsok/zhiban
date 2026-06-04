import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class GrowService {
  /**
   * 获取某个 matchId 下的所有成长数据
   */
  async getGrowData(matchId: number) {
    const client = getSupabaseClient()

    const [anniversariesRes, goalsRes, memoriesRes, promisesRes] = await Promise.all([
      client.from('grow_anniversaries').select('*').eq('match_id', matchId).order('created_at', { ascending: true }),
      client.from('grow_goals').select('*').eq('match_id', matchId).order('created_at', { ascending: true }),
      client.from('grow_memories').select('*').eq('match_id', matchId).order('date', { ascending: false }),
      client.from('grow_promises').select('*').eq('match_id', matchId).order('created_at', { ascending: true }),
    ])

    return {
      code: 200,
      msg: 'success',
      data: {
        anniversaries: anniversariesRes.data || [],
        goals: goalsRes.data || [],
        memories: memoriesRes.data || [],
        promises: promisesRes.data || [],
      },
    }
  }

  // ===== 纪念日 =====
  async addAnniversary(matchId: number, title: string, date: string, icon: string) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('grow_anniversaries')
      .insert({ match_id: matchId, title, date, icon })
      .select()
      .single()

    if (error) {
      console.error('Add anniversary error:', error)
      return { code: 500, msg: '添加失败', data: null }
    }
    return { code: 200, msg: 'success', data }
  }

  async deleteAnniversary(id: number) {
    const client = getSupabaseClient()
    const { error } = await client.from('grow_anniversaries').delete().eq('id', id)
    if (error) {
      return { code: 500, msg: '删除失败', data: null }
    }
    return { code: 200, msg: '删除成功', data: null }
  }

  // ===== 目标 =====
  async addGoal(matchId: number, title: string, total: number) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('grow_goals')
      .insert({ match_id: matchId, title, total, progress: 0, completed: false })
      .select()
      .single()

    if (error) {
      console.error('Add goal error:', error)
      return { code: 500, msg: '添加失败', data: null }
    }
    return { code: 200, msg: 'success', data }
  }

  async updateGoalProgress(id: number, delta: number) {
    const client = getSupabaseClient()

    // 先获取当前值
    const { data: goal } = await client.from('grow_goals').select('*').eq('id', id).single()
    if (!goal) {
      return { code: 404, msg: '目标不存在', data: null }
    }

    const newProgress = Math.min(Math.max(0, goal.progress + delta), goal.total)
    const completed = newProgress >= goal.total

    const { data, error } = await client
      .from('grow_goals')
      .update({ progress: newProgress, completed })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { code: 500, msg: '更新失败', data: null }
    }
    return { code: 200, msg: 'success', data }
  }

  async deleteGoal(id: number) {
    const client = getSupabaseClient()
    const { error } = await client.from('grow_goals').delete().eq('id', id)
    if (error) {
      return { code: 500, msg: '删除失败', data: null }
    }
    return { code: 200, msg: '删除成功', data: null }
  }

  // ===== 日记 =====
  async addMemory(matchId: number, content: string, date: string) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('grow_memories')
      .insert({ match_id: matchId, content, date })
      .select()
      .single()

    if (error) {
      console.error('Add memory error:', error)
      return { code: 500, msg: '添加失败', data: null }
    }
    return { code: 200, msg: 'success', data }
  }

  async deleteMemory(id: number) {
    const client = getSupabaseClient()
    const { error } = await client.from('grow_memories').delete().eq('id', id)
    if (error) {
      return { code: 500, msg: '删除失败', data: null }
    }
    return { code: 200, msg: '删除成功', data: null }
  }

  // ===== 约定 =====
  async addPromise(matchId: number, content: string) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('grow_promises')
      .insert({ match_id: matchId, content, completed: false })
      .select()
      .single()

    if (error) {
      console.error('Add promise error:', error)
      return { code: 500, msg: '添加失败', data: null }
    }
    return { code: 200, msg: 'success', data }
  }

  async togglePromise(id: number) {
    const client = getSupabaseClient()
    const { data: promise } = await client.from('grow_promises').select('*').eq('id', id).single()
    if (!promise) {
      return { code: 404, msg: '约定不存在', data: null }
    }

    const { data, error } = await client
      .from('grow_promises')
      .update({ completed: !promise.completed })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { code: 500, msg: '更新失败', data: null }
    }
    return { code: 200, msg: 'success', data }
  }

  async deletePromise(id: number) {
    const client = getSupabaseClient()
    const { error } = await client.from('grow_promises').delete().eq('id', id)
    if (error) {
      return { code: 500, msg: '删除失败', data: null }
    }
    return { code: 200, msg: '删除成功', data: null }
  }
}
