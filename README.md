# zod-clipanion-validator

> Use Zod for you Clipanion validators

## Usage

```typescript
import { Cli, Command, Option } from 'clipanion'
import { z } from 'zod'
import { zodClipanionValidator } from 'zod-clipanion-validator'

class MyCommand extends Command {
  static override paths = [['my-command']]

  static override usage = Command.Usage({
    description: 'a test command',
  })

  url = Option.String('-u,--url', {
    required: true,
    validator: zodClipanionValidator(z.string().url()),
  })

  number = Option.String('-n,--number', {
    required: true,
    validator: zodClipanionValidator(z.coerce.number()),
  })

  override async execute() {
    // ...
  }
}
```
