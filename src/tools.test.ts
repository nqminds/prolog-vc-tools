import { add } from "./tools.js";

import { test, expect } from "vitest";

test("add function", () => {
  expect(add(2, 3)).toBe(5);
});
