import { extractPrologStatement, isStatementValidProlog } from "./tools.js";
import { test, describe, expect, beforeAll, vi } from "vitest";

describe("extractPrologStatement", () => {
  const prolog = "likes(alice, pizza)";

  describe("valid cases", () => {
    test.each([
      ["assert", "assert(likes(alice, pizza))."],
      ["asserta", "asserta(likes(alice, pizza))."],
      ["assertz", "assertz(likes(alice, pizza))."],
      ["retract", "retract(likes(alice, pizza))."],
      ["retractall", "retractall(likes(alice, pizza))."],
      ["abolish", "abolish(likes(alice, pizza))."],
    ])("wraps prolog in %s(...)", (operation, expected) => {
      const vc = { credentialSubject: { operation, prolog } };
      expect(extractPrologStatement(vc)).toBe(expected);
    });
  });

  describe("invalid cases", () => {
    test("returns null when credentialSubject is missing", () => {
      expect(extractPrologStatement({})).toBeNull();
    });

    test("returns null when prolog is missing", () => {
      const vc = { credentialSubject: { operation: "assert" } };
      expect(extractPrologStatement(vc)).toBeNull();
    });

    test("returns null when operation is invalid", () => {
      const vc = { credentialSubject: { operation: "delete", prolog } };
      expect(extractPrologStatement(vc)).toBeNull();
    });
  });
});

describe("isStatementValidProlog", () => {
  const validCases = [
    "parent(john, mary)",
    "likes(alice, pizza)",
    "friend(bob, carol)",
    "knows(dave, eve)",
    "parent(john, mary)", // for retract
  ];

  const invalidCases = [
    "likes(alice, pizza", // missing closing parenthesis
    "friend bob, carol)", // missing parentheses
    "knows[dave, eve]", // wrong brackets
    "parentjohn, mary)", // missing '(' after predicate
    "parent john, mary)", // missing parentheses around arguments
    "parent(john mary)", // missing comma between arguments
    "parent(john, 123mary)", // invalid atom
    "parent(john, )", // missing second argument
    "parent(john, mary) extra", // extra text after statement
  ];

  describe("valid cases", () => {
    test.each(validCases)(
      "returns true for valid statement: %s",
      async (statement) => {
        expect(await isStatementValidProlog(statement)).toBe(true);
      },
    );
  });

  describe("invalid cases", () => {
    test.each(invalidCases)(
      "returns false for invalid statement: %s",
      async (statement) => {
        expect(await isStatementValidProlog(statement)).toBe(false);
      },
    );
  });
});

describe.only("single case invalid isStatementValidProlog", () => {
  test("returns false for invalid statement", async () => {
    const statement = "knows[dave, eve]";
    expect(await isStatementValidProlog(statement)).toBe(false);
  });
});
