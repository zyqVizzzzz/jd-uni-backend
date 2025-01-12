export interface TaskStatus {
  type: TaskType;
  points: number;
  description: string;
  completed: boolean;
}

export enum TaskType {
  SWIM_500M = 'SWIM_500M',
  SWIM_1000M = 'SWIM_1000M',
  POST_STATUS = 'POST_STATUS',
  SHARE_DATA = 'SHARE_DATA',
}

export const POINTS_CONFIG = {
  [TaskType.SWIM_500M]: {
    points: 50,
    description: '游泳距离达到500米',
  },
  [TaskType.SWIM_1000M]: {
    points: 100,
    description: '游泳距离达到1000米',
  },
  [TaskType.POST_STATUS]: {
    points: 20,
    description: '发布动态',
  },
  [TaskType.SHARE_DATA]: {
    points: 30,
    description: '分享游泳数据',
  },
};
