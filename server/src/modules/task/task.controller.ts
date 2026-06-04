import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common'
import { Request } from 'express'
import { TaskService } from './task.service'

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get('list')
  async getTaskList(@Query('matchId') matchId?: string) {
    return this.taskService.getTaskList(matchId ? Number(matchId) : undefined)
  }

  @Get('progress')
  async getProgress(@Query('matchId') matchId?: string) {
    return this.taskService.getProgress(matchId ? Number(matchId) : undefined)
  }

  @Post('complete')
  async completeTask(@Body() body: { taskId: number; lessonLearned?: string }) {
    return this.taskService.completeTask(body.taskId, body.lessonLearned)
  }

  @Post('update-lesson')
  async updateLesson(@Body() body: { taskId: number; lesson: string }) {
    return this.taskService.updateTaskLesson(body.taskId, body.lesson)
  }

  @Post('create')
  async createTask(@Body() body: {
    matchId: number
    category: 'prepare' | 'chat' | 'game' | 'romantic'
    title: string
    description: string
    difficulty?: '简单' | '中等' | '困难'
    duration?: string
    relatedKeyInfo?: string[]
    relatedStage?: string
  }) {
    const task = await this.taskService.createTask(body.matchId, {
      category: body.category,
      title: body.title,
      description: body.description,
      difficulty: body.difficulty,
      duration: body.duration,
      source: 'manual',
      relatedKeyInfo: body.relatedKeyInfo,
      relatedStage: body.relatedStage,
    })
    return {
      code: 200,
      data: task,
      message: 'success',
    }
  }

  @Post('delete')
  async deleteTask(@Body() body: { taskId: number }) {
    return this.taskService.deleteTask(body.taskId)
  }

  /**
   * AI 生成推荐任务
   * 后端自动聚合全部维度数据、进度、周期、能量等，无需前端传参
   */
  @Post('generate/:matchId')
  async generateTasks(
    @Req() req: Request,
    @Param('matchId') matchId: string,
  ) {
    const tasks = await this.taskService.generateRecommendedTasks(Number(matchId), req)
    return {
      code: 200,
      data: tasks,
      message: 'success',
    }
  }

  @Post('update-stage/:matchId')
  async updateTasksForStage(
    @Param('matchId') matchId: string,
    @Body() body: {
      newStage: string
      keyInfo: Array<{ type: string; label: string; value: string }>
      interests: string[]
    }
  ) {
    const tasks = await this.taskService.updateTasksForStage(
      Number(matchId),
      body.newStage,
      { keyInfo: body.keyInfo, interests: body.interests }
    )
    return {
      code: 200,
      data: tasks,
      message: 'success',
    }
  }
}
