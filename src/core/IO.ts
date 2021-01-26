import { fromEvent, merge, Observable, Subject } from 'rxjs'
import { bufferCount, filter, finalize, map, tap } from 'rxjs/operators'
import { inject, injectable } from 'inversify'
import * as chalk from 'chalk'


@injectable()
export default class IO {
  private in$: Observable<string>
  private keys = new Set<KeyBond>()
  private out$ = new Subject<string>()

  constructor(
    @inject("process") private process,
  ) {
    this.in$ = fromEvent(this.process.stdin, 'data')
  }

  public init() {
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    const ext$ = this.whenKey('\u0003', '')
      .pipe(tap(() => process.exit()))
    const cls$ = this.whenKey('c', 'Clear screen')
      .pipe(tap(() => this.clearScreen()))
    const hlp$ = this.whenKey('?', 'Print help')
      .pipe(tap(() => this.printKeys()))
    const out$ = this.out$.pipe(tap(str => process.stdout.write(str + '\n')))

    return merge(
      cls$,
      ext$,
      hlp$,
      out$,
    )
  }
  public whenKey(keys, reason = '') {
    const value = { keys, reason }
    this.keys.add(value)

    this.logKey('key.register', keys, reason)

    return this.in$.pipe(
      bufferCount(keys.length, 1),
      map((keys: any) => keys.join('')),
      filter(input => input === keys),
      tap(() => this.logKey('key.trigger', keys, reason)),
      finalize(() => {
        this.logKey('key.unregister', keys, reason)
        this.keys.delete(value)
      }),
    )
  }
  public log = (...args) => {
    this.out$.next(args.join(' '))
  }

  private logInput() {
    this.in$.pipe(
      map(input => JSON.stringify(input as string)),
      tap(this.log),
    )
  }

  private clearScreen() {
    this.out$.next("\u001b[3J\u001b[2J\u001b[1J")
    console.clear()
  }

  private printKeys() {
    const keys: KeyBond[] = Array.from(this.keys)
      .sort((a, b) => a.keys.localeCompare(b.keys))

    this.log('Key bindings\n' +
      keys.reduce((a, v: any) => a + `  ${chalk.yellow(v.keys)}\t${v.reason}\n`, ''))
  }

  private logKey(event, key, subject) {
    this.log(chalk.dim(event), chalk.yellow(key), subject)
  }
}

interface KeyBond {
  keys: string
  reason: string
}
