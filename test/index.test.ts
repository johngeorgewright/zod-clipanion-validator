import { Cli, Command, Option } from 'clipanion'
import { beforeEach, expect, test } from 'vitest'
import { z } from 'zod'
import { zodClipanionValidator } from '../src/index.js'
import { withResolvers } from './Promise.js'

let cli: Cli
let promise: Promise<void>
let resolve: (value: void | PromiseLike<void>) => void
let reject: (reason?: any) => void
let expectation: (command: MyCommand) => void = () => {}

class MyCommand extends Command {
  static override paths = [['my-command']]

  static override usage = Command.Usage({
    description: 'a test command',
  })

  standard = Option.String('-s,--standard', {
    required: true,
    validator: zodClipanionValidator(z.string().url()),
  })

  corectionOption = Option.String('-c,--corece', {
    required: true,
    validator: zodClipanionValidator(z.coerce.number()),
  })

  transformOption = Option.String('-t,--transform', {
    required: true,
    validator: zodClipanionValidator(
      z.string().transform((input, ctx) => {
        try {
          return JSON.parse(input)
        } catch (error: any) {
          ctx.addIssue({ code: 'custom', message: error.message })
        }
      }),
    ),
  })

  override async execute() {
    try {
      expectation(this)
      resolve()
    } catch (error) {
      reject(error)
    }
  }
}

beforeEach(() => {
  ;({ resolve, reject, promise } = withResolvers<void>())
  cli = new Cli()
  cli.register(MyCommand)
})

test('successful parsing', () => {
  expectation = (command) => {
    expect(command.standard).toBe('https://foo.bar.com')
    expect(command.corectionOption).toBe(123)
    expect(command.transformOption).toEqual({
      foo: 'bar',
    })
  }

  cli.run([
    'my-command',

    '--standard',
    'https://foo.bar.com',

    '--corece',
    '123',

    '--transform',
    '{"foo":"bar"}',
  ])

  return promise
})
