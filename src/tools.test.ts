import {
  add,
  extractPrologStatement,
  isStatementValidProlog,
} from "./tools.js";
import { test, expect } from "vitest";
import SWIPL from "swipl-wasm";

test("add returns sum of two numbers", () => {
  expect(add(2, 3)).toBe(5);
});

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

test("extractPrologStatement returns raw prolog when operation is not assert", () => {
  const vc = {
    credentialSubject: {
      operation: "consult",
      prolog: "facts.pl",
    },
  };

  const result = extractPrologStatement(vc);
  expect(result).toBe("facts.pl");
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
