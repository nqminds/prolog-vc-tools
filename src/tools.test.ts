import { extractPrologStatement, isStatementValidProlog } from "./tools.js";
import { test, expect } from "vitest";
import SWIPL from "swipl-wasm";

test("extractPrologStatement wraps prolog in assert(...) when operation is assert", () => {
  const vc = {
    credentialSubject: {
      operation: "assert",
      prolog: "likes(alice, pizza)",
    },
  };

  const result = extractPrologStatement(vc);
  expect(result).toBe("assert(likes(alice, pizza)).");
});
test("extractPrologStatement wraps prolog in asserta(...) when operation is asserta", () => {
  const vc = {
    credentialSubject: {
      operation: "asserta",
      prolog: "likes(alice, pizza)",
    },
  };

  const result = extractPrologStatement(vc);
  expect(result).toBe("asserta(likes(alice, pizza)).");
});

test("extractPrologStatement wraps prolog in assertz(...) when operation is assertz", () => {
  const vc = {
    credentialSubject: {
      operation: "assert",
      prolog: "likes(alice, pizza)",
    },
  };

  const result = extractPrologStatement(vc);
  expect(result).toBe("assert(likes(alice, pizza)).");
});

test("extractPrologStatement wraps prolog in retract(...) when operation is retract", () => {
  const vc = {
    credentialSubject: {
      operation: "retract",
      prolog: "likes(alice, pizza)",
    },
  };

  const result = extractPrologStatement(vc);
  expect(result).toBe("retract(likes(alice, pizza)).");
});

test("extractPrologStatement wraps prolog in retractall(...) when operation is retractall", () => {
  const vc = {
    credentialSubject: {
      operation: "retractall",
      prolog: "likes(alice, pizza)",
    },
  };

  const result = extractPrologStatement(vc);
  expect(result).toBe("retractall(likes(alice, pizza)).");
});

test("extractPrologStatement wraps prolog in abolish(...) when operation is abolish", () => {
  const vc = {
    credentialSubject: {
      operation: "abolish",
      prolog: "likes(alice, pizza)",
    },
  };

  const result = extractPrologStatement(vc);
  expect(result).toBe("abolish(likes(alice, pizza)).");
});

test("extractPrologStatement returns null when schema is missing prolog", () => {
  const vc = {
    credentialSubject: {
      operation: "assert",
    },
  };

  const result = extractPrologStatement(vc);
  expect(result).toBeNull();
});

test("extractPrologStatement returns null when operation is invalid", () => {
  const vc = {
    credentialSubject: {
      operation: "delete", // not allowed
      prolog: "parent(john, mary).",
    },
  };

  const result = extractPrologStatement(vc);
  expect(result).toBeNull();
});

test("isStatementValidProlog returns true for valid statement with owned engine", async () => {
  const swiplEngine = await SWIPL();
  const statement = "assert(parent(john, mary)).";

  const isValid = await isStatementValidProlog(statement, swiplEngine);
  expect(isValid).toBe(true);
});

test("isStatementValidProlog returns false for invalid statement with owned engine", async () => {
  const swiplEngine = await SWIPL();
  const statement = "assert(parent((john, mary)).";

  const isValid = await isStatementValidProlog(statement, swiplEngine);
  expect(isValid).toBe(false);
});

test("isStatementValidProlog returns true for valid statement with unowned engine", async () => {
  const statement = "assert(parent(john, mary)).";

  const isValid = await isStatementValidProlog(statement);
  expect(isValid).toBe(true);
});

test("isStatementValidProlog returns false for invalid statement with unowned engine", async () => {
  const statement = "assert(parent((john, mary)).";

  const isValid = await isStatementValidProlog(statement);
  expect(isValid).toBe(false);
});
