import { injectable } from 'inversify'
import { tap } from 'rxjs/operators'
import IO from '../core/IO'
import { merge } from 'rxjs'
import { TaskTimer } from './TaskTimer'
const sheetId = "1S_EvpIkN62UQbW-iKEKPwZSdQLeYYFwf5yHXyfHexF4"

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

    return merge(
      books$,
    )
  }
}
