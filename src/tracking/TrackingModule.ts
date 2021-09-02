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
      .pipe(tap(this.printTimeDoctorStats))
  }

  private printTimeDoctorStats = async () => {
    try {
      const stats = await this.timeDoctor.getStats()
        .then(this.timeDoctor.formatStatsReport)

      this.io.log(`TimeDoctor time logged:\n${stats}`)
    } catch (e) {
      console.error(e?.response?.data)
      const wizardUrl = this.timeDoctor.authWizard()
      this.io.log(`Auth broken. Follow URL to renew:\n${wizardUrl}`)
    }
  }
}
