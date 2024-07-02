import { makeValidator, StrictValidator, ValidationState } from 'typanion'
import { infer as Infer, ZodTypeAny } from 'zod'

export function pushTypanionError(
  { errors, p }: ValidationState = {},
  message: string,
) {
  errors?.push(`${p ?? `.`}: ${message}`)
  return false
}

export function zodClipanionValidator<I, O extends ZodTypeAny>(
  parser: O,
): StrictValidator<I, Infer<O>> {
  return makeValidator({
    test: (value, state): value is Infer<O> => {
      const parseResult = parser.safeParse(value)

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
