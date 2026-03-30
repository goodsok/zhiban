import { Controller, Get, Post, Body, Param, Req, Put } from '@nestjs/common'
import { Request } from 'express'
import { MatchService, HardwareInfo, SoftwareInfo } from './match.service'

@Controller('match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get('list')
  async getMatchList() {
    return await this.matchService.getMatchList()
  }

  @Get(':id')
  async getMatchDetail(@Param('id') id: string) {
    return await this.matchService.getMatchDetail(Number(id))
  }

  @Post('create')
  async createMatch(@Body() body: {
    name: string
    gender?: string
    hardware?: Partial<HardwareInfo>
    software?: Partial<SoftwareInfo>
    meetingScene?: string
    meetingDate?: string
    relationshipStage?: string
    interactionStatus?: string
    impression?: number
    impressionTags?: string[]
    notes?: string
  }) {
    return await this.matchService.createMatch(body)
  }

  @Put(':id')
  @Post(':id/update')
  async updateMatch(@Param('id') id: string, @Body() body: Partial<{
    name: string
    gender: string
    hardware: Partial<HardwareInfo>
    software: Partial<SoftwareInfo>
    meetingScene: string
    meetingDate: string
    relationshipStage: string
    interactionStatus: string
    impression: number
    impressionTags: string[]
    keyInfo: Array<{ id: string; type: string; label: string; icon: string; value: string }>
    notes: string
    status: string
    nextAction: string
  }>) {
    return await this.matchService.updateMatch(Number(id), body)
  }

  @Post(':id/delete')
  async deleteMatch(@Param('id') id: string) {
    return await this.matchService.deleteMatch(Number(id))
  }

  @Get(':id/recommend')
  async getRecommendations(@Param('id') id: string) {
    return await this.matchService.getRecommendations(Number(id))
  }

  @Post(':id/ai-topics')
  async getAITopics(@Param('id') id: string, @Req() req: Request) {
    return await this.matchService.getAITopics(Number(id), req)
  }

  @Post(':id/ai-interaction')
  async getAIInteraction(@Param('id') id: string, @Body() body: { situation?: string }, @Req() req: Request) {
    return await this.matchService.getAIInteraction(Number(id), body.situation, req)
  }

  // ============== 周期追踪接口 ==============

  @Get(':id/cycle')
  async getCycleInfo(@Param('id') id: string) {
    return await this.matchService.getCycleInfo(Number(id))
  }

  @Post(':id/cycle')
  async updateCycleInfo(@Param('id') id: string, @Body() body: { cycleStartDate: string; cycleLength?: number }) {
    return await this.matchService.updateCycleInfo(Number(id), body.cycleStartDate, body.cycleLength)
  }

  // ============== 推进值接口 ==============

  @Get(':id/progress-score')
  async getProgressScore(@Param('id') id: string) {
    return await this.matchService.getProgressScore(Number(id))
  }
}
