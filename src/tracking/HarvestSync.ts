import { injectable } from 'inversify'
import { Harvest } from './Harvest'
import { TaskTimer } from './TaskTimer'


@injectable()
export class HarvestSync {
  constructor(
    private harvest: Harvest,
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
    console.log(day, r.hours, e.effort)

    if (!e.effort && r.hours) {
      throw new Error('Unexpected report')
    }
    if (!e.effort) return

    if (!r.hours) {
      console.log(`Posting ${e.effort} hours`)
      await this.harvest.postTimeEntry({
        hours: e.effort,
        notes: e.description,
        spent_date: day,
      })
      return
    }

    if (r.hours !== e.effort || r.notes !== e.description) {
      console.log('Patching report...')
      await this.harvest.patchTimeEntry(r.id, {
        hours: e.effort,
        notes: e.description,
        spent_date: day,
      })
    }
  }
}
