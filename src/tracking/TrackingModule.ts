import { injectable } from 'inversify'
import { tap } from 'rxjs/operators'
import IO from '../core/IO'
import { HarvestSync } from './HarvestSync'

@injectable()
export class TrackingModule {
  constructor(
    private harvest: HarvestSync,
    private io: IO,
  ) {}

  plug() {
    return this.initHarvest()
  }

  private initHarvest() {
    return this.io.whenKey('th', 'Sync harvest')
      .pipe(tap(() => this.harvest.sync()))
  }
}