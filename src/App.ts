import { BehaviorSubject, from, fromEvent, merge, Observable } from 'rxjs'
import {
  bufferCount, filter, finalize, map, mergeMap, startWith, switchMap, take, takeLast, takeUntil, tap
} from 'rxjs/operators'
import { inject, injectable } from 'inversify'
import { HarvestSync } from './tracking'
import Discord, { DiscordMessageFilter } from './Discord'


@injectable()
export default class {
  private in
  private keys = new Set()

  private msgFilter = new BehaviorSubject<DiscordMessageFilter>(DiscordMessageFilter.all)

  constructor(
    @inject("process") private process,
    private discord: Discord,
    private harvest: HarvestSync,
  ) {
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    this.in = fromEvent(process.stdin, 'data')

    this.whenKey('\u0003')
      .subscribe(() => process.exit())
  }

  private logInput() {
    this.in.pipe(
      map(input => JSON.stringify(input as string)),
      tap(console.log),
    )
  }

  private whenKey(keys, reason = '') {
    const value = { keys, reason }
    this.keys.add(value)

    return this.in.pipe(
      bufferCount(keys.length, 1),
      map((keys: any) => keys.join('')),
      filter(input => input === keys),
      finalize(() => { this.keys.delete(value) }),
    )
  }

  run() {
    const cls$ = this.whenKey('c', 'Clear screen')
      .pipe(tap(() => this.clearScreen()))
    const hlp$ = this.whenKey('?', 'Print help')
      .pipe(tap(() => this.printKeys()))
    const sch$ = this.whenKey('h', 'Sync harvest')
      .pipe(tap(() => this.harvest.sync()))

    merge(
      cls$,
      hlp$,
      sch$,
      this.initDiscord(),
    ).subscribe()
  }

  private initDiscord = () => {
    return this.whenKey('d', 'Login discord')
      .pipe(
        tap(() => console.log('Starting discord client...')),
        take(1),
        mergeMap(this.runDiscord),
        takeLast(1),
        tap(() => console.log('Stopping discord client...')),
        switchMap(this.initDiscord)
      )
  }
  private runDiscord = () => {
    return from(this.discord.login()).pipe(
      switchMap(() => {
        const wfh$ = this.whenKey('dm', 'Post wfh')
          .pipe(tap(() => this.discord.postWFH()))

        const test$ = this.whenKey('dt', 'Test')
          .pipe(tap(() => this.discord.postPM()))

        const filter$ = rotate({
          key: 'messages.show',
          options: Object.keys(DiscordMessageFilter),
          subject: this.msgFilter,
          trigger: this.whenKey('df', 'Switch discord message filter'),
        }).pipe(tap(value => this.discord.setMsgFilter(value)))

        const messages$ = this.discord.getMessages()
          .pipe(tap(this.logDiscordMessage))

        const logout$ = this.whenKey('dd', 'Logout discord')
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
  private logDiscordMessage(msg: any) {
    console.log(`${msg.channel.guild.name}/${msg.channel.name} ${msg.author.username}: ${msg.content}`)
  }

  private clearScreen() {
    this.process.stdout.write("\u001b[3J\u001b[2J\u001b[1J")
    console.clear()
  }
  private printKeys() {
    console.log('Key bindings\n' +
      Array.from(this.keys).reduce((a, v: any) => a + `  ${v.keys}\t${v.reason}\n`, ''))
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
