import * as chalk from 'chalk'
import { injectable } from 'inversify'
import { tap } from 'rxjs/operators'
import IO from '../core/IO'
import { HarvestSync } from './HarvestSync'
import { TimeDoctor } from './TimeDoctor'
import { merge } from 'rxjs'

@injectable()
export class TrackingModule {
  constructor(
    private harvest: HarvestSync,
    private io: IO,
    private timeDoctor: TimeDoctor,
  ) {}

  plug() {
    return merge(
      this.initHarvest(),
      this.initTimeDoctor(),
    )
  }

  private initHarvest() {
    return this.io.whenKey('th', 'Sync harvest')
      .pipe(tap(() => this.harvest.sync()))
  }

  private initTimeDoctor() {
    return this.io.whenKey('td', 'Time Doctor report')
      .pipe(tap(async () => {
        const [m, w] = await Promise.all([
          this.timeDoctor.getTimeLoggedPerMonth(),
          this.timeDoctor.getTimeLoggedPerWeek(),
        ]).then(a => a.map(i =>
          chalk.yellow(i.toFixed(1))))

        this.io.log(`TimeDoctor time logged:\n` +
          `  this month:\t${m} hours\n` +
          `  this week:\t${w} hours`)
      }))
  }
}
