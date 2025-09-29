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
  const valid = "assert(parent(john, mary)).";
  const invalid = "assert(parent((john, mary)).";

  describe("with unowned engine", () => {
    test("returns true for valid statement", async () => {
      expect(await isStatementValidProlog(valid)).toBe(true);
    });

    test("returns false for invalid statement", async () => {
      expect(await isStatementValidProlog(invalid)).toBe(false);
    });
  });
});
