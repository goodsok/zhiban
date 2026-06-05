import { Controller, Get, Query } from '@nestjs/common';
import { GameDataService } from './game-data.service';

@Controller('game-data')
export class GameDataController {
  constructor(private readonly gameDataService: GameDataService) {}

  /**
   * 获取所有游戏列表
   * GET /api/game-data/list
   */
  @Get('list')
  getGameList() {
    return this.gameDataService.getGameList();
  }

  /**
   * 获取指定游戏的内容
   * GET /api/game-data/content?gameKey=truth-dare&category=truth
   */
  @Get('content')
  getGameContent(@Query('gameKey') gameKey: string, @Query('category') category?: string) {
    return this.gameDataService.getGameContent(gameKey, category);
  }

  /**
   * 获取单个游戏的完整详情（列表信息+内容）
   * GET /api/game-data/detail?gameKey=truth-dare
   */
  @Get('detail')
  getGameDetail(@Query('gameKey') gameKey: string) {
    return this.gameDataService.getGameDetail(gameKey);
  }
}
