import "chai"
import { describe, it } from "mocha"
import IO from "./IO"
import { Readable, Writable } from 'stream'
import { Container } from 'inversify'
import { take, takeUntil, tap } from 'rxjs/operators'
import { Subject } from 'rxjs'

describe("IO", () => {
  const whenKeyCases: [string, Record<string, number>][] = [
    ['aba', {
      a: 2,
      aba: 0,
      b: 1,
    }],
    ['abc', {
      a: 1,
      ab: 0,
      abc: 0,
      ac: 0,
      b: 1,
      bc: 0,
      c: 1,
      d: 0,
    }]
  ]

  whenKeyCases.forEach(([input, cases]) => it(`whenKey combo ${input}`, async () => {
    const { entity, stdin, stdout } = setup()
    const end = new Subject()
    const result = Object.fromEntries(Object.keys(cases).map(key => [key, 0]))

    Object.entries(cases)
      .map(([combo, count]) => entity
        .whenKey(combo, '')
        .pipe(
          take(count),
          takeUntil(end),
          tap(key => result[key]++),
        )
        .subscribe())

    input.split("").forEach(char => stdin.emit('data', char))

    end.next()

    result.should.eqls(cases)
  }))

  it('plug has help command', done => {
    const { entity, stdin } = setup()
    entity.plug()
      .pipe(take(1))
      .subscribe(() => done())
    stdin.emit('data', '?')
  })
})

function setup() {
  let output = ''
  const stdin = Object.assign(Readable.from(''), {
    resume: () => null,
    setEncoding: () => null,
    setRawMode: () => null,
  })
  const stdout = new Writable({
    write(buffer, type, done) {
      output += buffer.toString()
      done()
    },
  })
  const container = new Container

  container
    .bind("process")
    .toConstantValue({})
  container
    .bind("stdin")
    .toConstantValue(stdin)
  container
    .bind("stdout")
    .toConstantValue(stdout)

  const entity = container.resolve(IO)

  Object.assign(stdout, {
    getOutput: () => {
      const _output = output
      output = ''
      return _output
    }
  })

  return {
    entity,
    stdin,
    stdout,
  }
}
