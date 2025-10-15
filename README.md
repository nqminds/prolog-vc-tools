# Prolog VC Tools

This library provides a set of tools for converting Verifiable Credentials (VCs) into Prolog facts and rules. This allows for expressive and powerful policy-based access control and other logic-based systems to be built on top of a verifiable data model.

## Core Entities

The library is built around a set of schemas that define the structure of the VCs. These schemas represent the core concepts of a system that could be built using this library. Below are the categories of statements that get constructed using the VCs that implement the corressponding schema.

### Group

- **Group:** Represents a collection of users.

```prolog
assert(group(exampleGroupId)).
```

- **Group Custom Property:** Allows for adding arbitrary properties to a group.

```prolog
assert(group_custom_property(group1, department, engineering)).
```

### Person

- **Person:** Represents a user in the system.

```prolog
assert(person(personId)).
```

- **Person Custom Property:** Allows for adding arbitrary properties to a person.

```prolog
assert(person_x(person1, age, 30)).
```

### Relations

These are pre-defined rules that provide relations between our existing entities.

- **Person Belongs to Group:** A relationship that links a person to a group.

```prolog
assert(person_belongs_to_group(person1, group1))."
```

- **Resource Owned By Person:** A relationship that indicates a person owns a resource.

```prolog
assert(resource_owned_by_person(resource1, person1)).
```

- **Resource Shared With Person:** A relationship that indicates a resource is shared with a person.

```prolog
assert(resource_shared_with_person(resource1, person1)).
```

- **Resource Shared With Group:** A relationship that indicates a resource is shared with a group.

```prolog
assert(resource_shared_with_group(resource1, group1)).
```

- **Resource Contained In:** A relationship that links a resource to a folder.

```prolog
assert(resource_contained_in(resource1, folder1)).
```

### Resource

- **Resource:** A generic entity that can be accessed.

```prolog
assert(resource(resource1)).
```

- **File:** A specific type of resource.

```prolog
assert(file(resource1)).
```

- **Folder:** A container for other resources.

```prolog
assert(folder(resource1)).
```

### Rules

- **Rule:** Defines a custom rule using a JSON-based logic structure. Supports conjunction, disjunction and negation of other rules.

```prolog
assert(my_rule(X) :- (p(a), q(b))).
```

- **Rule Custom:** Defines a custom rule using raw Prolog.

```prolog
assert(my_rule(X) :- a(X), b(X)).
```

### Query

- **Query:** Represents a query to the Prolog system.

```prolog
parent(john, mary).
```

- **Query Custom:** Represents a custom query using raw Prolog.

```prolog
parent(john, X).
```

## How it Works

The library takes a VC as input, validates it against the corresponding schema, and then converts it into a Prolog fact or rule. These facts and rules can then be asserted into a Prolog engine to build a knowledge base.

### Example: Asserting a Person

Here is the schema for a VC's credentialSubject for a person:

```json
{
  "title": "Person",
  "type": "object",
  "properties": {
    "claimType": {
      "type": "string",
      "const": "person"
    },
    "id": { "type": "string", "description": "Person's ID" },
    "updateView": {
      "type": "string",
      "enum": ["assert", "retract", "assertz", "asserta"],
      "default": "assert"
    }
  },
  "required": ["claimType", "id", "updateView"]
}
```

So following that schema we can construct this VC:

```json
{
  "credentialSubject": {
    "claimType": "person",
    "id": "person1",
    "updateView": "assert"
  }
}
```

From which the library will generate the following Prolog fact:

```prolog
assert(person(person1)).
```

### Example: Asserting a Rule

Here is the schema for a VC's credentialSubject for a rule.

```json
{
  "title": "Rule Definition (Generalized Boolean Logic)",
  "type": "object",
  "properties": {
    "claimType": {
      "type": "string",
      "const": "rule"
    },
    "name": { "type": "string" },
    "evaluate": { "$ref": "#/$defs/logicNode" },
    "variables": {
      "type": "array",
      "items": { "type": "string" }
    },
    "returns": { "enum": ["boolean"] },
    "updateView": {
      "type": "string",
      "enum": ["assert", "retract"],
      "default": "assert"
    }
  },
  "required": [
    "claimType",
    "name",
    "evaluate",
    "variables",
    "returns",
    "updateView"
  ],

  "$defs": {
    "logicNode": {
      "description": "A logical expression node (predicate or combinator)",
      "type": "object",
      "oneOf": [
        {
          "description": "A predicate (atomic condition)",
          "properties": {
            "predicate": { "type": "string" },
            "args": {
              "type": "array",
              "items": { "type": "string" }
            }
          },
          "required": ["predicate", "args"],
          "additionalProperties": false
        },
        {
          "description": "Logical AND combinator",
          "properties": {
            "and": {
              "type": "array",
              "items": { "$ref": "#/$defs/logicNode" },
              "minItems": 1
            }
          },
          "required": ["and"],
          "additionalProperties": false
        },
        {
          "description": "Logical OR combinator",
          "properties": {
            "or": {
              "type": "array",
              "items": { "$ref": "#/$defs/logicNode" },
              "minItems": 1
            }
          },
          "required": ["or"],
          "additionalProperties": false
        },
        {
          "description": "Logical NOT combinator",
          "properties": {
            "not": { "$ref": "#/$defs/logicNode" }
          },
          "required": ["not"],
          "additionalProperties": false
        }
      ]
    }
  }
}
```

Which is a bit complicated but let's us chain and embed multiple rules with ANDs, ORs and NOTs.

Here is an example VC that follows this schema:

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
