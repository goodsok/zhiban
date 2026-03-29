import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common'
import { TaskService } from './task.service'

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get('list')
  getTaskList(@Query('matchId') matchId?: string) {
    return this.taskService.getTaskList(matchId ? Number(matchId) : undefined)
  }

  @Get('progress')
  getProgress(@Query('matchId') matchId?: string) {
    return this.taskService.getProgress(matchId ? Number(matchId) : undefined)
  }

  @Post('complete')
  completeTask(@Body() body: { taskId: number; lessonLearned?: string }) {
    return this.taskService.completeTask(body.taskId, body.lessonLearned)
  }

  @Post('update-lesson')
  updateLesson(@Body() body: { taskId: number; lesson: string }) {
    return this.taskService.updateTaskLesson(body.taskId, body.lesson)
  }

  @Post('create')
  createTask(@Body() body: {
    matchId: number
    category: 'prepare' | 'chat' | 'game' | 'romantic'
    title: string
    description: string
    difficulty?: '简单' | '中等' | '困难'
    duration?: string
    relatedKeyInfo?: string[]
    relatedStage?: string
  }) {
    const task = this.taskService.createTask(body.matchId, {
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
  deleteTask(@Body() body: { taskId: number }) {
    return this.taskService.deleteTask(body.taskId)
  }

  @Post('generate/:matchId')
  generateTasks(
    @Param('matchId') matchId: string,
    @Body() body: {
      relationshipStage: string
      keyInfo: Array<{ type: string; label: string; value: string }>
      interests: string[]
      cycleStartDate?: string
      cycleLength?: number
    }
  ) {
    const tasks = this.taskService.generateRecommendedTasks(Number(matchId), body)
    return {
      code: 200,
      data: tasks,
      message: 'success',
    }
  }

  @Post('update-stage/:matchId')
  updateTasksForStage(
    @Param('matchId') matchId: string,
    @Body() body: {
      newStage: string
      keyInfo: Array<{ type: string; label: string; value: string }>
      interests: string[]
    }
  ) {
    const tasks = this.taskService.updateTasksForStage(
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

  @Post('create-from-suggestions/:matchId')
  createFromSuggestions(
    @Param('matchId') matchId: string,
    @Body() body: { suggestions: Array<{ action: string; reason: string; tips: string }> }
  ) {
    const tasks = this.taskService.createFromSuggestions(
      Number(matchId),
      body.suggestions || []
    )
    return {
      code: 200,
      data: tasks,
      message: 'success',
    }
  }
}
