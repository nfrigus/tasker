import { injectable } from 'inversify'
import { Harvest } from './Harvest'
import { TaskTimer } from './TaskTimer'
import IO from '../core/IO'
import chalk = require('chalk')


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

    for (const day of this.harvest.getSyncDays()) {
      const p = this.syncDay(
        day,
        report.getReportByDate(day),
        logged.getCombinedDayProjectLog(day, 'HubX'),
      )

      res.push(p)
    }

    await Promise.all(res)
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
