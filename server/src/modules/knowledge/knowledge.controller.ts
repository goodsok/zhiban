import { Controller, Get, Param, Query } from '@nestjs/common'
import {
  getAllHormoneCycleKnowledge,
  getHormoneCycleKnowledgeByPhase,
  getHormoneCycleKnowledgeByDay,
  getAllHormoneInfo,
  getHormoneInfoByKey,
} from '@/services/knowledge.service'

@Controller('knowledge')
export class KnowledgeController {
  /**
   * 获取所有激素周期知识
   * GET /api/knowledge/hormone-cycle
   */
  @Get('hormone-cycle')
  async getHormoneCycleKnowledge() {
    const data = await getAllHormoneCycleKnowledge()
    return {
      code: 200,
      data,
      message: 'success',
    }
  }

  /**
   * 根据阶段标识获取知识
   * GET /api/knowledge/hormone-cycle/:phase
   * phase: menstrual, follicular, ovulation, luteal_early, luteal_mid, luteal_late
   */
  @Get('hormone-cycle/:phase')
  async getHormoneCycleKnowledgeByPhase(@Param('phase') phase: string) {
    const data = await getHormoneCycleKnowledgeByPhase(phase)
    if (!data) {
      return {
        code: 404,
        data: null,
        message: '未找到该阶段的知识',
      }
    }
    return {
      code: 200,
      data,
      message: 'success',
    }
  }

  /**
   * 根据周期天数获取当前阶段知识
   * GET /api/knowledge/hormone-cycle/day/:day
   * day: 1-28
   */
  @Get('hormone-cycle/day/:day')
  async getHormoneCycleKnowledgeByDay(@Param('day') day: string) {
    const cycleDay = parseInt(day, 10)
    if (isNaN(cycleDay) || cycleDay < 1 || cycleDay > 28) {
      return {
        code: 400,
        data: null,
        message: '周期天数必须在 1-28 之间',
      }
    }
    const data = await getHormoneCycleKnowledgeByDay(cycleDay)
    return {
      code: 200,
      data,
      message: 'success',
    }
  }

  /**
   * 获取所有激素信息
   * GET /api/knowledge/hormones
   */
  @Get('hormones')
  async getHormoneInfo() {
    const data = await getAllHormoneInfo()
    return {
      code: 200,
      data,
      message: 'success',
    }
  }

  /**
   * 根据激素标识获取信息
   * GET /api/knowledge/hormones/:key
   * key: estrogen, progesterone, fsh, lh, hcg, oxytocin, testosterone
   */
  @Get('hormones/:key')
  async getHormoneInfoByKey(@Param('key') key: string) {
    const data = await getHormoneInfoByKey(key)
    if (!data) {
      return {
        code: 404,
        data: null,
        message: '未找到该激素的信息',
      }
    }
    return {
      code: 200,
      data,
      message: 'success',
    }
  }
}
