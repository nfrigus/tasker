import "chai"
import { describe, it } from "mocha"
import { takeUntil, tap } from 'rxjs/operators'
import { Subject } from 'rxjs'
import { KeyComboMatcher } from './KeyComboMatcher'

describe("KeyComboMatcher", () => {
  const whenKeyCases: [string, Record<string, number>][] = [
    ['aba', {
      a: 2,
      aba: 0,
      ba: 0,
      b: 1,
    }],
    ['abc', {
      a: 1,
      ab: 0,
      ac: 0,
      b: 1,
      bc: 0,
      c: 1,
      d: 0,
    }],
    ['abcbc', {
      abcd: 0,
      cb: 1,
    }]
  ]

  whenKeyCases.forEach(([given, expect]) => it(`linear match for ${given}`, async () => {
    const { entity, input } = setup()
    const result = toZeros(expect)

    const terminate = withTerminator(terminator => {
      Object.entries(expect)
        .map(([combo]) => entity
          .register(combo)
          .pipe(
            takeUntil(terminator),
            tap(() => result[combo]++),
          )
          .subscribe())
    })

    input(given)
    terminate()

    result.should.eqls(expect)
  }))
})

function setup() {
  const input = new Subject()
  const entity = new KeyComboMatcher(input)

  return {
    entity,
    input: str => str.split('').forEach(char => input.next(char)),
  }
}

function withTerminator(contructor) {
  const terminator = new Subject()

  contructor(terminator)

  return () => terminator.complete()
}

function toZeros(expect) {
  return Object.fromEntries(Object.keys(expect).map(key => [key, 0]))
}
