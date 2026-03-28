import { Controller, Get, Post, Body } from '@nestjs/common';
import { TaskService } from './task.service';

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get('list')
  getTaskList() {
    return this.taskService.getTaskList();
  }

  @Post('complete')
  completeTask(@Body() body: { taskId: number }) {
    return this.taskService.completeTask(body.taskId);
  }

  @Get('progress')
  getProgress() {
    return this.taskService.getProgress();
  }
}
