import { injectable } from 'inversify'
import * as chalk from 'chalk'
import * as moment from 'moment'
import IO from '../core/IO'
import { Harvest } from './Harvest'
import { HarvestReport, TimeEntry } from './HarvestReport'
import { TaskTimer } from './TaskTimer'
import { ProjectDaySummary, TaskTimerReport } from './TaskTimerReport'


@injectable()
export class HarvestSync {
  constructor(
    private harvest: Harvest,
    private io: IO,
    private sheet: TaskTimer,
  ) {}

  async sync() {
    const [logged, report] = await this.loadReports()

    const handlers = HarvestSync.getSyncDays()
      .map((day) => {
        const harvestDay = report.getReportByDate(day) || { day, description: '', effort: 0 }
        const plan = this.createDaySync(
          toDayRecord(logged.getCombinedDayProjectLog(day, 'HubX')),
          toDayRecord(harvestDay))

        this.logDayPlan(plan)

        return plan
      })
      .filter(plan => plan.execute)
      .map(plan => plan.execute())

    await Promise.all(handlers)
  }

  static getSyncDays() {
    const start = moment().subtract(1, 'M').startOf('month')

    return HarvestSync.getDaysBetween(start, moment())
  }

  static getDaysBetween(start: moment.Moment, end: moment.Moment): string[] {
    const days = []

    for (let i = start; i <= end; i.add(1, 'd')) {
      days.push(`${i.format('YYYY-MM-DD')}`)
    }

    return days
  }

  private async loadReports(): Promise<[TaskTimerReport, HarvestReport]> {
    return Promise.all([
      this.sheet.getReport(),
      this.harvest.getReport(),
    ])
  }

  private createDaySync(source: DayRecord, target: DayRecord): DaySyncPlan {
    if (source.day !== target.day) {
      throw new Error(`Invalid sync days: ${source.day} to ${target.day}`)
    }

    if (!source.hours && target.hours) {
      throw new Error(`Day ${target.day} has Harvest entries but no TaskTimer records`)
    }


    const { day } = target

    const plan = {
      day,
      execute: null,
      hours: source.hours,
      notes: source.notes,
      text_changed: source.notes !== target.notes,
      time_diff: source.hours - target.hours,
      new_entry: source.hours && !target.hours,
    }

    if (plan.new_entry) {
      plan.execute = () => this.harvest.postTimeEntry({
        hours: source.hours,
        notes: source.notes,
        spent_date: day,
      })
    } else if (plan.time_diff || plan.text_changed) {
      plan.execute = () => this.harvest.patchTimeEntry(target.id, {
        hours: source.hours,
        notes: source.notes,
        spent_date: day,
      })
    }

    return plan
  }

  private logDayPlan(plan) {
    const { day } = plan

    const timeDiff = plan.time_diff > 0
      ? chalk.green(`+${plan.time_diff}`)
      : plan.time_diff < 0
        ? chalk.red(plan.time_diff)
        : ''

    const dayLog = plan.new_entry
      ? chalk.green(day)
      : plan.text_changed || plan.time_diff
        ? chalk.yellow(day)
        : day

    this.io.log(dayLog, plan.hours + plan.time_diff, timeDiff)
  }
}

interface DayRecord {
  id?: number
  day: string
  hours: number
  notes: string
}

interface DaySyncPlan {
  day: string
  execute: () => void
  hours: number
  new_entry: boolean
  notes: string
  text_changed: boolean
  time_diff: number
}

function toDayRecord(data: TimeEntry | ProjectDaySummary): DayRecord {
  if ('id' in data) {
    return {
      day: data.spent_date,
      hours: data.hours,
      id: data.id,
      notes: data.notes,
    }
  }

  return {
    day: data.day,
    hours: data.effort,
    notes: data.description,
  }
}
