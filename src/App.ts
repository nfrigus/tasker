import { merge } from 'rxjs'
import { injectable } from 'inversify'
import IO from './core/IO'
import { TrackingModule } from './tracking/TrackingModule'


@injectable()
export default class {
  constructor(
    private io: IO,
    private tracking: TrackingModule,
  ) {}

  run() {
    const io = this.io.plug()
    merge(
      io,
      this.tracking.plug(),
    ).subscribe()
  }
}
