import { extractPrologStatement, isStatementValidProlog } from "./tools.js";
import { test, describe, expect, beforeAll } from "vitest";
import SWIPL from "swipl-wasm";

describe("Extract Prolog Statement", () => {
  const prolog = "likes(alice, pizza)";

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

  test("returns null when schema is missing prolog", () => {
    const vc = { credentialSubject: { operation: "assert" } };
    expect(extractPrologStatement(vc)).toBeNull();
  });

  test("returns null when operation is invalid", () => {
    const vc = {
      credentialSubject: { operation: "delete", prolog: "parent(john, mary)." },
    };
    expect(extractPrologStatement(vc)).toBeNull();
  });
});

describe("Is Statement Valid Prolog", () => {
  const valid = "assert(parent(john, mary)).";
  const invalid = "assert(parent((john, mary)).";

  describe("with owned engine", () => {
    let swiplEngine: any;

    beforeAll(async () => {
      swiplEngine = await SWIPL({ arguments: ["-q"] });
    });

    test("returns true for valid statement", async () => {
      expect(await isStatementValidProlog(valid, swiplEngine)).toBe(true);
    });

    test("returns false for invalid statement", async () => {
      expect(await isStatementValidProlog(invalid, swiplEngine)).toBe(false);
    });
  });

  describe("with unowned engine", () => {
    test("returns true for valid statement", async () => {
      expect(await isStatementValidProlog(valid)).toBe(true);
    });

    test("returns false for invalid statement", async () => {
      expect(await isStatementValidProlog(invalid)).toBe(false);
    });
  });
});
