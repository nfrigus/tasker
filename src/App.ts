import { merge } from 'rxjs'
import { injectable } from 'inversify'
import IO from './core/IO'
import { DiscordModule } from './discord/DiscordModule'
import { TrackingModule } from './tracking/TrackingModule'


@injectable()
export default class {
  constructor(
    private discord: DiscordModule,
    private io: IO,
    private tracking: TrackingModule,
  ) {}

  run() {
    const io = this.io.plug()
    merge(
      io,
      this.discord.plug(),
      this.tracking.plug(),
    ).subscribe()
  }
}
