import { BehaviorSubject, from, merge, Observable } from 'rxjs'
import { map, mergeMap, startWith, switchMap, take, takeLast, takeUntil, tap } from 'rxjs/operators'
import { injectable } from 'inversify'
import * as chalk from 'chalk'
import * as moment from 'moment'
import Discord, { DiscordMessageFilter } from './Discord'
import IO from '../core/IO'


@injectable()
export class DiscordModule {
  private msgFilter = new BehaviorSubject<DiscordMessageFilter>(DiscordMessageFilter.all)

  constructor(
    private discord: Discord,
    private io: IO,
  ) {}

  plug() {
    return this.initDiscord()
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
        return merge(
          this.listMembersAction(),
          this.streamMessages(),
          this.toggleFilterAction(),
          this.WFHAction(),
        ).pipe(takeUntil(this.logoutAction()))
      }),
      startWith(null as string),
    )
  }

  private listMembersAction() {
    return this.io.whenKey('dn', 'Print last joined members')
      .pipe(tap(async () => {
        const messages = await this.discord.getMembersJoinedLast365Days()
        messages.each(msg => {
          this.io.log(
            chalk.yellow(moment(msg.createdAt).format('Y-MM-DD HH:mm')),
            "\t", msg.author.username,
          )
        })
      }))
  }
  private logoutAction() {
    return this.io.whenKey('dd', 'Logout discord')
      .pipe(tap(() => this.discord.logout()))
  }
  private streamMessages() {
    return this.discord.getMessages()
      .pipe(tap(this.logDiscordMessage))
  }
  private toggleFilterAction() {
    return rotate({
      key: 'messages.show',
      options: Object.keys(DiscordMessageFilter),
      subject: this.msgFilter,
      trigger: this.io.whenKey('df', 'Switch discord message filter'),
    }).pipe(tap(value => this.discord.setMsgFilter(value)))
  }
  private WFHAction() {
    const wfh$ = this.io.whenKey('dm', 'Post wfh')
      .pipe(tap(() => this.discord.postWFH()))
    return wfh$
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
