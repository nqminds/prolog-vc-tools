# Prolog Verifiable Credential (VC) Tools

This NPM package is used to make the translation between signed and verified VCs into the containing Prolog rules based on a specific content JSON schema.

## Usage

### `extractPrologStatement(vc)`

This function extracts a Prolog statement from a Verifiable Credential (VC). The `operation` in the VC's `credentialSubject` determines how the Prolog fact is wrapped.

Allowed operations are: `assert`, `asserta`, `assertz`, `retract`, `retractall`, and `abolish`.

**Example:**

```javascript
import { extractPrologStatement } from "prolog-vc-tools";

const vc = {
  credentialSubject: {
    operation: "assert",
    prolog: "likes(alice, pizza)",
  },
};

const statement = extractPrologStatement(vc);
// statement is "assert(likes(alice, pizza))."
```

### `isStatementValidProlog(statement, swiplEngine?)`

This function checks if a given Prolog statement is syntactically correct. It can be used with an existing SWI-Prolog engine instance, or it will create a new one.

**Example (with unowned engine):**

```javascript
import { isStatementValidProlog } from "prolog-vc-tools";

const statement = "assert(parent(john, mary)).";
const isValid = await isStatementValidProlog(statement);
// isValid is true
```

**Example (with owned engine):**

```javascript
import { isStatementValidProlog } from "prolog-vc-tools";
import SWIPL from "swipl-wasm";

const swiplEngine = await SWIPL();
const statement = "assert(parent(john, mary)).";
const isValid = await isStatementValidProlog(statement, swiplEngine);
// isValid is true
```
