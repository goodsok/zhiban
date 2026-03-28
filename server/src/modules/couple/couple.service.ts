import { Injectable } from '@nestjs/common';

@Injectable()
export class CoupleService {
  // 模拟数据库存储
  private coupleData = {
    myName: '小明',
    partnerName: '小红',
    startDate: '2024-01-01',
    nextDate: '明天下午3点',
  };

  getCoupleInfo() {
    const startDate = new Date(this.coupleData.startDate);
    const today = new Date();
    const days = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      code: 200,
      data: {
        ...this.coupleData,
        days: days > 0 ? days : 15, // 默认15天
      },
      message: 'success',
    };
  }

  updateCoupleInfo(body: { myName?: string; partnerName?: string }) {
    if (body.myName) {
      this.coupleData.myName = body.myName;
    }
    if (body.partnerName) {
      this.coupleData.partnerName = body.partnerName;
    }
    return {
      code: 200,
      data: this.coupleData,
      message: 'success',
    };
  }
}
