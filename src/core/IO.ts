import { fromEvent, merge, Observable, Subject } from "rxjs"
import { finalize, map, mapTo, tap } from "rxjs/operators"
import { inject, injectable } from "inversify"
import * as chalk from "chalk"
import { KeyComboMatcher } from "./KeyComboMatcher"

@injectable()
export default class IO {
  private combo: KeyComboMatcher
  private in$: Observable<string>
  private keys = new Set<KeyBond>()
  private out$ = new Subject<string>()

  constructor(
    @inject("process") private process,
    @inject("stdin") private stdin,
    @inject("stdout") private stdout,
  ) {
    this.in$ = fromEvent(this.stdin, "data")
    this.combo = new KeyComboMatcher(this.in$)
  }

  public plug() {
    return merge(...this.setupInteractiveMode(), this.in$)
  }

  private setupInteractiveMode() {
    this.stdin.setRawMode(true)
    this.stdin.resume()
    this.stdin.setEncoding("utf8")

    return [
      this.whenKey("\u0003", "").pipe(tap(() => this.process.exit())),
      this.whenKey("c", "Clear screen").pipe(tap(() => this.clearScreen())),
      this.whenKey("?", "Print help").pipe(tap(() => this.printKeys())),
      this.out$.pipe(tap((str) => this.stdout.write(str + "\n"))),
    ]
  }

  public whenKey(keys, reason = "") {
    const value = { keys, reason }
    this.keys.add(value)

    this.logKey("key.register", keys, reason)

    return this.combo.register(keys).pipe(
      mapTo(keys),
      tap(() => this.logKey("key.trigger", keys, reason)),
      finalize(() => {
        this.logKey("key.unregister", keys, reason)
        this.keys.delete(value)
        this.combo.unregister(keys)
      })
    )
  }
  public log = (...args) => {
    this.out$.next(args.join(" "))
  }

  private logInput() {
    this.in$.pipe(
      map((input) => JSON.stringify(input as string)),
      tap(this.log)
    )
  }

  private clearScreen() {
    this.out$.next("\u001b[3J\u001b[2J\u001b[1J")
    console.clear()
  }

  private printKeys() {
    const keys: KeyBond[] = Array.from(this.keys).sort((a, b) =>
      a.keys.localeCompare(b.keys)
    )

    this.log(
      "Key bindings\n" +
      keys.reduce(
        (a, v: any) => a + `  ${chalk.yellow(v.keys)}\t${v.reason}\n`,
        ""
      )
    )
  }

  private logKey(event, key, subject) {
    this.log(chalk.dim(event), chalk.yellow(key), subject)
  }
}

interface KeyBond {
  keys: string
  reason: string
}
