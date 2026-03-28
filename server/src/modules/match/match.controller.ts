import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { MatchService } from './match.service'

@Controller('match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get('list')
  getMatchList() {
    return this.matchService.getMatchList()
  }

  @Get(':id')
  getMatchDetail(@Param('id') id: string) {
    return this.matchService.getMatchDetail(Number(id))
  }

  @Post('create')
  createMatch(@Body() body: {
    name: string
    age: number
    gender: string
    occupation: string
    meetingScene: string
    meetingDate: string
    impression: number
    impressionTags: string[]
    interests: string[]
    notes: string
  }) {
    return this.matchService.createMatch(body)
  }

  @Post(':id/update')
  updateMatch(@Param('id') id: string, @Body() body: Partial<{
    name: string
    age: number
    occupation: string
    status: string
    nextAction: string
  }>) {
    return this.matchService.updateMatch(Number(id), body)
  }

  @Post(':id/delete')
  deleteMatch(@Param('id') id: string) {
    return this.matchService.deleteMatch(Number(id))
  }

  @Get(':id/recommend')
  getRecommendations(@Param('id') id: string) {
    return this.matchService.getRecommendations(Number(id))
  }
}
