import { BehaviorSubject, from, merge, Observable } from 'rxjs'
import { map, mergeMap, startWith, switchMap, take, takeLast, takeUntil, tap } from 'rxjs/operators'
import { inject, injectable } from 'inversify'
import { HarvestSync } from './tracking'
import Discord, { DiscordMessageFilter } from './Discord'
import IO from './core/IO'
import * as chalk from 'chalk'
import * as moment from 'moment'


@injectable()
export default class {
  private msgFilter = new BehaviorSubject<DiscordMessageFilter>(DiscordMessageFilter.all)

  constructor(
    @inject("process") private process,
    private discord: Discord,
    private harvest: HarvestSync,
    private io: IO,
  ) {}

  run() {
    merge(
      this.initDiscord(),
      this.initHarvest(),
      this.io.init(),
    ).subscribe()
  }

  private initHarvest() {
    return this.io.whenKey('h', 'Sync harvest')
      .pipe(tap(() => this.harvest.sync()))
  }

  private initDiscord = () => {
    return this.io.whenKey('d', 'Login discord')
      .pipe(
        take(1),
        mergeMap(this.runDiscord),
        takeLast(1),
        switchMap(this.initDiscord)
      )
  }
  private runDiscord = () => {
    return from(this.discord.login()).pipe(
      switchMap(() => {
        const wfh$ = this.io.whenKey('dm', 'Post wfh')
          .pipe(tap(() => this.discord.postWFH()))

        const test$ = this.io.whenKey('dt', 'Test')
          .pipe(tap(() => this.discord.postPM()))

        const filter$ = rotate({
          key: 'messages.show',
          options: Object.keys(DiscordMessageFilter),
          subject: this.msgFilter,
          trigger: this.io.whenKey('df', 'Switch discord message filter'),
        }).pipe(tap(value => this.discord.setMsgFilter(value)))

        const messages$ = this.discord.getMessages()
          .pipe(tap(this.logDiscordMessage))

        const logout$ = this.io.whenKey('dd', 'Logout discord')
          .pipe(tap(() => this.discord.logout()))

        return merge(
          filter$,
          messages$,
          test$,
          wfh$,
        ).pipe(takeUntil(logout$))
      }),
      startWith(null as string),
    )
  }
  private logDiscordMessage = (msg: any) => {
    this.io.log(
      chalk.red(moment(msg.createdAt).format('Y-MM-DD HH:mm:ss')),
      chalk.dim(`${msg.channel.guild?.name || ''}/${msg.channel.name}`),
      chalk.blue(msg.author.username),
      msg.content
    )
  }
}

function rotate(params: LeakRotateParameters) {
  let i = 0, l = params.options.length

  return params.trigger.pipe(
    map(() => {
      i = (i + 1) % l
      const v = params.options[i]
      params.subject.next(v)

      return v
    }),
    tap(v => console.log(params.key, v)),
  )
}

interface LeakRotateParameters {
  key: string
  options: any[],
  trigger: Observable<any>
  subject: BehaviorSubject<any>
}
