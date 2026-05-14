# schemashift

> Library for diffing and migrating JSON Schema definitions with human-readable change reports.

---

## Installation

```bash
npm install schemashift
```

---

## Usage

```typescript
import { diff, migrate, report } from "schemashift";

const oldSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    age:  { type: "number" },
  },
  required: ["name"],
};

const newSchema = {
  type: "object",
  properties: {
    name:  { type: "string" },
    age:   { type: "integer" },
    email: { type: "string", format: "email" },
  },
  required: ["name", "email"],
};

// Compute the diff between two schemas
const changes = diff(oldSchema, newSchema);

// Print a human-readable change report
console.log(report(changes));
// → [modified]  properties.age.type        : "number" → "integer"
// → [added]     properties.email           : { type: "string", format: "email" }
// → [added]     required[1]                : "email"

// Apply changes to migrate data payloads
const migratedData = migrate({ name: "Alice", age: 30 }, changes);
```

---

## API

| Function          | Description                                              |
|-------------------|----------------------------------------------------------|
| `diff(a, b)`      | Returns a structured list of changes between two schemas |
| `report(changes)` | Formats changes into a readable string                   |
| `migrate(data, changes)` | Applies schema changes to a data payload          |

---

## License

[MIT](./LICENSE)