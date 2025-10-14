# Prolog VC Tools

This library provides a set of tools for converting Verifiable Credentials (VCs) into Prolog facts and rules. This allows for expressive and powerful policy-based access control and other logic-based systems to be built on top of a verifiable data model.

## Core Concepts

The library is built around a set of schemas that define the structure of the VCs. These schemas represent the core concepts of a system that could be built using this library.

### Group

- **Group:** Represents a collection of users.
- **Group Custom Property:** Allows for adding arbitrary properties to a group.

### Person

- **Person:** Represents a user in the system.
- **Person Custom Property:** Allows for adding arbitrary properties to a person.

### Query

- **Query:** Represents a query to the Prolog system.
- **Query Custom:** Represents a custom query using raw Prolog.

### Relations

- **Person Belongs to Group:** A relationship that links a person to a group.
- **Resource Owned By Person:** A relationship that indicates a person owns a resource.
- **Resource Shared With Person:** A relationship that indicates a resource is shared with a person.
- **Resource Shared With Group:** A relationship that indicates a resource is shared with a group.
- **Resource Contained In:** A relationship that links a resource to a folder.

### Resource

- **Resource:** A generic entity that can be accessed.
- **File:** A specific type of resource.
- **Folder:** A container for other resources.

### Rules

- **Rule:** Defines a custom rule using a JSON-based logic structure.
- **Rule Custom:** Defines a custom rule using raw Prolog.

## How it Works

The library takes a VC as input, validates it against the corresponding schema, and then converts it into a Prolog fact or rule. These facts and rules can then be asserted into a Prolog engine to build a knowledge base.

### Example: Asserting a Person

Given the following VC:

```json
{
  "credentialSubject": {
    "claimType": "person",
    "id": "person1",
    "updateView": "assert"
  }
}
```

The library will generate the following Prolog fact:

```prolog
assert(person(person1)).
```

### Example: Asserting a Rule

Given the following VC:

```json
{
  "credentialSubject": {
    "claimType": "rule",
    "name": "my_rule",
    "evaluate": {
      "and": [
        { "predicate": "p", "args": ["a"] },
        { "predicate": "q", "args": ["b"] }
      ]
    },
    "variables": ["X"],
    "returns": "boolean",
    "updateView": "assert"
  }
}
```

The library will generate the following Prolog rule:

```prolog
assert(my_rule(X) :- (p(a), q(b))).
```

## Usage

The primary function of this library is `extractPrologStatement`, which takes a VC and returns a Prolog statement.

```typescript
import { extractPrologStatement } from "prolog-vc-tools";

const vc = {
  credentialSubject: {
    claimType: "person",
    id: "person1",
    updateView: "assert",
  },
};

const { fact, type } = extractPrologStatement(vc);

console.log(fact); // assertz(person(person1)).
```

The library also provides a function `isStringValidTerm` to check if a string is a valid Prolog term.

```typescript
import { isStringValidTerm } from "prolog-vc-tools";

const isValid = await isStringValidTerm("person(person1).");

console.log(isValid); // true
```
