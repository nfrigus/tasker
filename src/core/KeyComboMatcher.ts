import { Observable, Subject } from 'rxjs'


export class KeyComboMatcher {
  private targets = new Map<Combo, Track>()

  constructor(
    private readonly input$: Observable<any>,
  ) {
    input$.subscribe({
      complete: this._complete,
      error: this._error,
      next: this._next,
    })
  }

  register(combo: string): Observable<void> {
    if (this.targets.has(combo)) {
      this.unregister(combo)
    }
    const destination = new Subject<void>()
    this.targets.set(combo, {
      combo,
      destination,
      keysMatched: 0,
    })

    return destination.pipe()
  }

  unregister(combo: string) {
    const target = this.targets.get(combo)

    if (target) {
      target.destination.complete()
      this.targets.delete(combo)
      return true
    }

    return false
  }

  private _complete = () => {}
  private _error = () => {}
  private _next = key => {
    const targets = Array.from(this.targets.values())

    targets
      .forEach(target => {
        if (key === target.combo[target.keysMatched]) {
          target.keysMatched++
        } else {
          target.keysMatched = 0
        }
      })

    const matched = targets
      .filter(target => target.combo.length === target.keysMatched)

    if (matched.length) {
      targets.forEach(target => {
        target.keysMatched = 0
      })
      matched[0].destination.next()
    }
  }
}

type Combo = string
interface Track {
  keysMatched: number
  combo: Combo
  destination: Subject<void>
}