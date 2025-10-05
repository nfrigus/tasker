import { merge } from 'rxjs'
import { injectable } from 'inversify'
import IO from './core/IO'
import { TrackingModule } from './tracking/TrackingModule'
import axios from 'axios'
import MarketModule from './market/MarketModule'


@injectable()
export default class {
  constructor(
    private io: IO,
    private tracking: TrackingModule,
    private market: MarketModule,
  ) {}

  run() {
    const argsc = process.argv.slice(2).length

    if (!argsc) {
      return this.runInteractive()
    }

    this.market.loadDjinniStats()
  }

  private runInteractive() {
    merge(
      this.io.plug(),
      this.tracking.plug(),
    ).subscribe()
  }
}
