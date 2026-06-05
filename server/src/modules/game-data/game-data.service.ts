import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

@Injectable()
export class GameDataService {
  /**
   * 获取所有游戏列表
   */
  async getGameList() {
    console.log('[GameDataService] getGameList called');

    const { data, error } = await getSupabaseClient()
      .from('game_list')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[GameDataService] getGameList error:', error);
      return { code: 500, data: null, message: error.message };
    }

    console.log('[GameDataService] getGameList result:', data?.length, 'items');
    return { code: 200, data, message: 'success' };
  }

  /**
   * 根据 game_key 获取游戏内容
   */
  async getGameContent(gameKey: string, category?: string) {
    console.log('[GameDataService] getGameContent called, gameKey:', gameKey, 'category:', category);

    let query = getSupabaseClient()
      .from('game_content')
      .select('*')
      .eq('game_key', gameKey)
      .order('sort_order', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[GameDataService] getGameContent error:', error);
      return { code: 500, data: null, message: error.message };
    }

    console.log('[GameDataService] getGameContent result:', data?.length, 'items');
    return { code: 200, data, message: 'success' };
  }

  /**
   * 获取单个游戏的详情（列表信息+内容）
   */
  async getGameDetail(gameKey: string) {
    console.log('[GameDataService] getGameDetail called, gameKey:', gameKey);

    // 获取游戏列表信息
    const { data: gameInfo, error: infoError } = await getSupabaseClient()
      .from('game_list')
      .select('*')
      .eq('game_key', gameKey)
      .single();

    if (infoError) {
      console.error('[GameDataService] getGameDetail gameInfo error:', infoError);
      return { code: 404, data: null, message: '游戏不存在' };
    }

    // 获取游戏内容
    const { data: content, error: contentError } = await getSupabaseClient()
      .from('game_content')
      .select('*')
      .eq('game_key', gameKey)
      .order('sort_order', { ascending: true });

    if (contentError) {
      console.error('[GameDataService] getGameDetail content error:', contentError);
      return { code: 500, data: null, message: contentError.message };
    }

    // 按category分组内容
    const groupedContent: Record<string, any[]> = {};
    for (const item of content || []) {
      if (!groupedContent[item.category]) {
        groupedContent[item.category] = [];
      }
      groupedContent[item.category].push(item.content_data);
    }

    console.log('[GameDataService] getGameDetail result, categories:', Object.keys(groupedContent));
    return {
      code: 200,
      data: {
        gameInfo,
        content: groupedContent,
      },
      message: 'success',
    };
  }
}
