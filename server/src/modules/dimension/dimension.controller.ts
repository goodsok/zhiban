import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common'
import { DimensionService } from './dimension.service'

@Controller('dimension')
export class DimensionController {
  constructor(private readonly dimensionService: DimensionService) {}

  /**
   * 获取维度定义列表
   * GET /api/dimension/definitions?layer=1&category=identity
   */
  @Get('definitions')
  async getDefinitions(
    @Query('layer') layer?: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string
  ) {
    const filters: { layer?: number; category?: string; isActive?: boolean } = {}
    
    if (layer) {
      filters.layer = parseInt(layer)
    }
    if (category) {
      filters.category = category
    }
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true'
    }

    return await this.dimensionService.getDimensionDefinitions(filters)
  }

  /**
   * 获取单个维度定义
   * GET /api/dimension/definitions/:dimensionKey
   */
  @Get('definitions/:dimensionKey')
  async getDefinition(@Param('dimensionKey') dimensionKey: string) {
    return await this.dimensionService.getDimensionDefinition(dimensionKey)
  }

  /**
   * 获取对象的维度值列表
   * GET /api/dimension/values/:matchId
   */
  @Get('values/:matchId')
  async getMatchDimensionValues(@Param('matchId') matchId: string) {
    return await this.dimensionService.getMatchDimensionValues(parseInt(matchId))
  }

  /**
   * 获取对象的维度数据（带定义和完成度）
   * GET /api/dimension/profile/:matchId?relationshipType=long_term
   */
  @Get('profile/:matchId')
  async getMatchDimensionsWithDefinitions(
    @Param('matchId') matchId: string,
    @Query('relationshipType') relationshipType?: 'long_term' | 'short_term' | 'both' | 'undefined'
  ) {
    return await this.dimensionService.getMatchDimensionsWithDefinitions(
      parseInt(matchId),
      relationshipType
    )
  }

  /**
   * 设置单个维度值
   * POST /api/dimension/values/:matchId/:dimensionKey
   */
  @Post('values/:matchId/:dimensionKey')
  async setDimensionValue(
    @Param('matchId') matchId: string,
    @Param('dimensionKey') dimensionKey: string,
    @Body() body: {
      value: any
      source?: string
      source_detail?: any
      confidence?: number
      changed_reason?: string
    }
  ) {
    return await this.dimensionService.setDimensionValue(
      parseInt(matchId),
      dimensionKey,
      body
    )
  }

  /**
   * 批量设置维度值
   * POST /api/dimension/values/:matchId/batch
   */
  @Post('values/:matchId/batch')
  async batchSetDimensionValues(
    @Param('matchId') matchId: string,
    @Body() body: {
      values: Array<{
        dimension_key: string
        value: any
        source?: string
        confidence?: number
      }>
    }
  ) {
    return await this.dimensionService.batchSetDimensionValues(parseInt(matchId), body.values)
  }

  /**
   * 删除维度值
   * DELETE /api/dimension/values/:matchId/:dimensionKey
   */
  @Delete('values/:matchId/:dimensionKey')
  async deleteDimensionValue(
    @Param('matchId') matchId: string,
    @Param('dimensionKey') dimensionKey: string
  ) {
    return await this.dimensionService.deleteDimensionValue(parseInt(matchId), dimensionKey)
  }

  /**
   * 获取维度值历史
   * GET /api/dimension/history/:matchId?dimensionKey=mbti
   */
  @Get('history/:matchId')
  async getDimensionHistory(
    @Param('matchId') matchId: string,
    @Query('dimensionKey') dimensionKey?: string
  ) {
    return await this.dimensionService.getDimensionHistory(parseInt(matchId), dimensionKey)
  }

  /**
   * 初始化维度定义数据
   * POST /api/dimension/init-definitions
   */
  @Post('init-definitions')
  async initializeDimensionDefinitions() {
    return await this.dimensionService.initializeDimensionDefinitions()
  }

  /**
   * 迁移 hardware/software 数据到维度值表
   * POST /api/dimension/migrate
   */
  @Post('migrate')
  async migrateHardwareSoftwareToDimensions() {
    return await this.dimensionService.migrateHardwareSoftwareToDimensions()
  }

  /**
   * 更新维度定义的枚举选项
   * POST /api/dimension/update-enum-options
   */
  @Post('update-enum-options')
  async updateDimensionEnumOptions() {
    return await this.dimensionService.updateDimensionEnumOptions()
  }
}
