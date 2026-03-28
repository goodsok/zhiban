import { Injectable } from '@nestjs/common';

@Injectable()
export class TaskService {
  // 模拟任务数据
  private tasks = [
    {
      id: 1,
      category: 'prepare',
      title: '选一首适合约会的歌单',
      description: '提前准备3-5首轻松愉快的歌曲，营造氛围',
      difficulty: '简单',
      duration: '10分钟',
      completed: true,
    },
    {
      id: 2,
      category: 'prepare',
      title: '了解对方的兴趣爱好',
      description: '提前在聊天中了解对方喜欢什么',
      difficulty: '简单',
      duration: '15分钟',
      completed: true,
    },
    {
      id: 3,
      category: 'chat',
      title: '分享童年趣事',
      description: '聊聊小时候最难忘的事情',
      difficulty: '简单',
      duration: '20分钟',
      completed: false,
    },
    {
      id: 4,
      category: 'chat',
      title: '讨论旅行梦想',
      description: '分享彼此最想去的地方',
      difficulty: '简单',
      duration: '15分钟',
      completed: false,
    },
    {
      id: 5,
      category: 'game',
      title: '玩一次真心话大冒险',
      description: '通过游戏增进了解',
      difficulty: '中等',
      duration: '30分钟',
      completed: false,
    },
    {
      id: 6,
      category: 'romantic',
      title: '送一份小礼物',
      description: '准备一份贴心的小礼物',
      difficulty: '中等',
      duration: '1小时',
      completed: false,
    },
  ];

  getTaskList() {
    return {
      code: 200,
      data: this.tasks,
      message: 'success',
    };
  }

  completeTask(taskId: number) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (task) {
      task.completed = true;
      return {
        code: 200,
        data: task,
        message: 'success',
      };
    }
    return {
      code: 404,
      data: null,
      message: 'Task not found',
    };
  }

  getProgress() {
    const completed = this.tasks.filter((t) => t.completed).length;
    const total = this.tasks.length;
    return {
      code: 200,
      data: {
        completed,
        total,
        percentage: Math.round((completed / total) * 100),
      },
      message: 'success',
    };
  }
}
