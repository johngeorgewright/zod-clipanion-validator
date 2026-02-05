import {
  makeValidator,
  type StrictValidator,
  type ValidationState,
} from 'typanion'
import { safeParse } from 'zod'
import { type output, type $ZodType } from 'zod/v4/core'

export function pushTypanionError(
  { errors, p }: ValidationState = {},
  message: string,
) {
  errors?.push(`${p ?? `.`}: ${message}`)
  return false
}

export function zodClipanionValidator<I, O extends $ZodType<any>>(
  parser: O,
): StrictValidator<I, output<O>> {
  return makeValidator({
    test: (value, state): value is output<O> => {
      const parseResult = safeParse(parser, value)

      if (!parseResult.success) {
        for (const issue of parseResult.error.issues) {
          pushTypanionError(
            state,
            `${issue.message}.${issue.path.length ? ` At ${issue.path.join(', ')}` : ''}`,
          )
        }
        return false
      }

      state?.coercion?.(parseResult.data)
      return parseResult.success
    },
  })
}
