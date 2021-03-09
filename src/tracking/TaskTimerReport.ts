import { trim } from '../common'
import * as moment from 'moment'

export interface WorkLog {
  date: string
  description: string
  effort: number
  project: string
  scope: string
}

interface ProjectDaySummary {
  description: string
  effort: number
}

export class TaskTimerReport {
  private data: WorkLog[]

  constructor(data: WorkLog[]) {
    this.data = data
  }

  getCombinedDayProjectLog(date: string, project: string): ProjectDaySummary {
    const tasks = this.data
      .filter(i => i.project === project && i.date === date)

    const effort = tasks.reduce((a, c) => a + +c.effort, 0)
    const description = tasks.map(i => trim(i.description, '"')).join('\n')

    return {
      description,
      effort,
    }
  }
}
