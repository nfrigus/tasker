import { trim } from '../common'
import * as moment from 'moment'

export interface WorkLog {
  date: string
  description: string
  effort: number
  project: string
  scope: string
}

export interface ProjectDaySummary {
  day: string
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
      day: date,
      description,
      effort,
    }
  }

  getDateEffort(date: string) {
    return this.data
      .filter(i => i.date === date)
      .reduce((a, i) => a + i.effort, 0)
  }

  getYearDailyEffortReport() {
    const date = moment().startOf('year')
    const now = moment()
    const report: { day: string; effort: number }[] = []

    while (date < now) {
      const day = date.format('YYYY-MM-DD')
      const effort = this.getDateEffort(day)

      report.push({
        day,
        effort,
      })

      date.add(1, 'd')
    }

    return report
  }
}
