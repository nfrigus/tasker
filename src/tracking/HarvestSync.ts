import { injectable } from 'inversify'
import * as chalk from 'chalk'
import * as moment from 'moment'
import IO from '../core/IO'
import { Harvest } from './Harvest'
import { HarvestReport } from './HarvestReport'
import { TaskTimer } from './TaskTimer'
import { TaskTimerReport } from './TaskTimerReport'


@injectable()
export class HarvestSync {
  constructor(
    private harvest: Harvest,
    private io: IO,
    private sheet: TaskTimer,
  ) {}

  async sync() {
    const [logged, report] = await Promise.all([
      this.sheet.getReport(),
      this.harvest.getReport(),
    ])

    const res = []

    for (const day of this.getSyncDays()) {
      const p = this.syncDay(
        day,
        report.getReportByDate(day),
        logged.getCombinedDayProjectLog(day, 'HubX'),
      )

      res.push(p)
    }

    await Promise.all(res)
  }

  public prepareSync(logged: TaskTimerReport, reported: HarvestReport) {
    const res = []

    for (const day of this.getSyncDays()) {
      const p = this.syncDay(
        day,
        reported.getReportByDate(day),
        logged.getCombinedDayProjectLog(day, 'HubX'),
      )

      res.push(p)
    }

    return Promise.all(res)
  }

  getSyncDays() {
    const days = []
    const week = moment().subtract(1, 'w').startOf('isoWeek')

    for (let i = 0; i < 7 * 2; i++) {
      days.push(`${week.format('YYYY-MM-DD')}`)
      week.add(1, 'd')

      if (moment() < week) break
    }

    return days
  }

  private async syncDay(day, r, e) {
    this.io.log(day, chalk.yellow(r.hours), e.effort)

    if (!e.effort && r.hours) {
      throw new Error('Unexpected report')
    }
    if (!e.effort) return

    if (!r.hours) {
      this.io.log(`Posting ${e.effort} hours`)
      await this.harvest.postTimeEntry({
        hours: e.effort,
        notes: e.description,
        spent_date: day,
      })
      return
    }

    if (r.hours !== e.effort || r.notes !== e.description) {
      this.io.log('Patching report...')
      await this.harvest.patchTimeEntry(r.id, {
        hours: e.effort,
        notes: e.description,
        spent_date: day,
      })
    }
  }
}
