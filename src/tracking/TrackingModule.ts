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
      console.error(e.response.data)
      this.io.log(
        `Token update link: \n` +
        `https://webapi.timedoctor.com/oauth/v2/auth?client_id=1_1bhjinec22m84ww044k0808kgs4c8g8o0s8ccsgo0048400ooo&redirect_uri=https%3A%2F%2Fadmin.timedoctor.com%2Fv2%2Fcontent%2Fget_api_key.php&response_type=token`
      )
    }
  }
}
