import { add, extractPrologStatement } from "./tools.js";
import { test, expect } from "vitest";

test("add function", () => {
  expect(add(2, 3)).toBe(5);
});

test("extractPrologStatement returns assert(...) wrapper when operation is assert", () => {
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

test("extractPrologStatement returns null for invalid schema (missing prolog)", () => {
  const vc = {
    credentialSubject: {
      operation: "assert",
    },
  };

  const result = extractPrologStatement(vc);
  expect(result).toBeNull();
});

test("extractPrologStatement returns null for invalid schema (bad operation)", () => {
  const vc = {
    credentialSubject: {
      operation: "delete", // not in enum
      prolog: "parent(john, mary).",
    },
  };

  const result = extractPrologStatement(vc);
  expect(result).toBeNull();
});
