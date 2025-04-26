import { Cli, Command, Option } from 'clipanion'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  MockInstance,
  test,
  vi,
} from 'vitest'
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

afterEach(() => {
  vi.restoreAllMocks()
})

test('successful parsing', async () => {
  expectation = (command) => {
    expect(command.standard).toBe('https://foo.bar.com')
    expect(command.corectionOption).toBe(123)
    expect(command.transformOption).toEqual({
      foo: 'bar',
    })
  }

  const code = await cli.run([
    'my-command',

    '--standard',
    'https://foo.bar.com',

    '--corece',
    '123',

    '--transform',
    '{"foo":"bar"}',
  ])

  expect(code).toBe(0)

  return promise
})

describe('failed parsing', () => {
  let stdout: typeof process.stdout & {
    write: MockInstance<typeof process.stdout.write>
  }

  beforeEach(() => {
    stdout = process.stdout as typeof process.stdout & {
      write: MockInstance<typeof process.stdout.write>
    }
    vi.spyOn(stdout, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('string types', async () => {
    const code = await cli.run(
      [
        'my-command',

        '--standard',
        'not a url',

        '--corece',
        '123',

        '--transform',
        '{"foo":"bar"}',
      ],
      {
        stdout,
      },
    )

    expect(code).not.toBe(0)

    expect(stdout.write).toHaveBeenCalledWith(
      expect.stringContaining('Invalid value for --standard: invalid url.'),
    )
  })

  test('number types', async () => {
    const code = await cli.run(
      [
        'my-command',

        '--standard',
        'https://foo.bar.com',

        '--corece',
        'not a number',

        '--transform',
        '{"foo":"bar"}',
      ],
      {
        stdout,
      },
    )

    expect(code).not.toBe(0)

    expect(stdout.write).toHaveBeenCalledWith(
      expect.stringContaining(
        'Invalid value for --corece: expected number, received nan.',
      ),
    )
  })

  test('transform types', async () => {
    const code = await cli.run(
      [
        'my-command',

        '--standard',
        'https://foo.bar.com',

        '--corece',
        '123',

        '--transform',
        '{"foo":"bar"',
      ],
      {
        stdout,
      },
    )

    expect(code).not.toBe(0)

    try {
      expect(stdout.write).toHaveBeenCalledWith(
        expect.stringContaining(
          "Invalid value for --transform: expected ',' or '}' after property value in JSON at position 12",
        ),
      )
    } catch (error) {
      expect(stdout.write).toHaveBeenCalledWith(
        expect.stringContaining(
          'Invalid value for --transform: unexpected end of JSON input',
        ),
      )
    }
  })
})
