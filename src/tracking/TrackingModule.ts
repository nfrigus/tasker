import { injectable } from 'inversify'
import { tap } from 'rxjs/operators'
import IO from '../core/IO'
import { merge } from 'rxjs'
import { TaskTimer } from './TaskTimer'

@injectable()
export class TrackingModule {
  constructor(
    private io: IO,
    private tracker: TaskTimer,
  ) {}

  plug() {
    const books$ = this.io.whenKey('bv', 'Verify book')
      .pipe(tap(async () => {
        await this.tracker.verifyBook()
        this.io.log('Book is valid')
      }))
    const wlog$ = this.io.whenKey('bw', 'Worklog')
      .pipe(tap(async () => {
        const report = await this.tracker.getReport()
        const records = report.filterLastWeeks().getJiraLogCalls()
        this.io.log(records.join('\n'))
      }))

    return merge(
      books$,
      wlog$,
    )
  }
}
