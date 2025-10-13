import { extractPrologFact, isStringValidTerm, ClaimType } from "./tools.js";
import { test, describe, expect } from "vitest";

import personVC from "./inputs/person.json" with { type: "json" };
import groupVC from "./inputs/group.json" with { type: "json" };
import personBelongsToGroupVC from "./inputs/person_belongs_to_group.json" with { type: "json" };
import resourceOwnedByPersonVC from "./inputs/resource_owned_by_person.json" with { type: "json" };
import resourceSharedWithGroupVC from "./inputs/resource_shared_with_group.json" with { type: "json" };
import resourceSharedWithPersonVC from "./inputs/resource_shared_with_person.json" with { type: "json" };
import fileVC from "./inputs/file.json" with { type: "json" };
import folderVC from "./inputs/folder.json" with { type: "json" };
import resourceVC from "./inputs/resource.json" with { type: "json" };
import resourceContainedInVC from "./inputs/resource_contained_in.json" with { type: "json" };
import personCustomPropertyVC from "./inputs/person_custom_property.json" with { type: "json" };
import groupCustomPropertyVC from "./inputs/group_custom_property.json" with { type: "json" };
import queryVC from "./inputs/query.json" with { type: "json" };
import queryCustomVC from "./inputs/query_custom.json" with { type: "json" };
import ruleVC from "./inputs/rule.json" with { type: "json" };
import ruleCustomVC from "./inputs/rule_custom.json" with { type: "json" };

describe("extractPrologFact", () => {
  test("should extract prolog fact from person claim", () => {
    const result = extractPrologFact(personVC);
    expect(result).toEqual({
      fact: "person(person1).",
      type: ClaimType.Person,
    });
  });

  test("should extract prolog fact from group claim", () => {
    const result = extractPrologFact(groupVC);
    expect(result).toEqual({
      fact: "group(group1).",
      type: ClaimType.Group,
    });
  });

  test("should extract prolog fact from person_belongs_to_group claim", () => {
    const result = extractPrologFact(personBelongsToGroupVC);
    expect(result).toEqual({
      fact: "person_belongs_to_group(person1, group1).",
      type: ClaimType.PersonBelongsToGroup,
    });
  });

  test("should extract prolog fact from resource_owned_by_person claim", () => {
    const result = extractPrologFact(resourceOwnedByPersonVC);
    expect(result).toEqual({
      fact: "resource_owned_by_person(resource1, person1).",
      type: ClaimType.ResourceOwnedByPerson,
    });
  });

  test("should extract prolog fact from resource_shared_with_group claim", () => {
    const result = extractPrologFact(resourceSharedWithGroupVC);
    expect(result).toEqual({
      fact: "resource_shared_with_group(resource1, group1).",
      type: ClaimType.ResourceSharedWithGroup,
    });
  });

  test("should extract prolog fact from resource_shared_with_person claim", () => {
    const result = extractPrologFact(resourceSharedWithPersonVC);
    expect(result).toEqual({
      fact: "resource_shared_with_person(resource1, person1).",
      type: ClaimType.ResourceSharedWithPerson,
    });
  });

  test("should extract prolog fact from file claim", () => {
    const result = extractPrologFact(fileVC);
    expect(result).toEqual({
      fact: "file(resource1).",
      type: ClaimType.File,
    });
  });

  test("should extract prolog fact from folder claim", () => {
    const result = extractPrologFact(folderVC);
    expect(result).toEqual({
      fact: "folder(resource1).",
      type: ClaimType.Folder,
    });
  });

  test("should extract prolog fact from resource claim", () => {
    const result = extractPrologFact(resourceVC);
    expect(result).toEqual({
      fact: "resource(resource1).",
      type: ClaimType.Resource,
    });
  });

  test("should extract prolog fact from resource_contained_in claim", () => {
    const result = extractPrologFact(resourceContainedInVC);
    expect(result).toEqual({
      fact: "resource_contained_in(resource1, folder1).",
      type: ClaimType.ResourceContainedIn,
    });
  });

  test("should extract prolog fact from person_custom_property claim", () => {
    const result = extractPrologFact(personCustomPropertyVC);
    expect(result).toEqual({
      fact: "person_x(person1, age, 30).",
      type: ClaimType.PersonCustomProperty,
    });
  });

  test("should extract prolog fact from group_custom_property claim", () => {
    const result = extractPrologFact(groupCustomPropertyVC);
    expect(result).toEqual({
      fact: "group_custom_property(group1, department, engineering).",
      type: ClaimType.GroupCustomProperty,
    });
  });

  test("should extract prolog fact from query claim", () => {
    const result = extractPrologFact(queryVC);
    expect(result).toEqual({
      fact: "parent(john, mary).",
      type: ClaimType.Query,
    });
  });

  test("should extract prolog fact from query_custom claim", () => {
    const result = extractPrologFact(queryCustomVC);
    expect(result).toEqual({
      fact: "parent(X,Y) :- father(X,Y).",
      type: ClaimType.QueryCustom,
    });
  });

  test("should extract prolog fact from rule claim", () => {
    const result = extractPrologFact(ruleVC);
    expect(result).toEqual({
      fact: 'rule(my_rule, {"and":[{"predicate":"p","args":["a"]},{"predicate":"q","args":["b"]}]}).',
      type: ClaimType.Rule,
    });
  });

  test("should extract prolog fact from rule_custom claim", () => {
    const result = extractPrologFact(ruleCustomVC);
    expect(result).toEqual({
      fact: "my_rule(X) :- a(X), b(X).",
      type: ClaimType.RuleCustom,
    });
  });

  test("should return null for invalid credential subject", () => {
    const vc = { credentialSubject: { claimType: "invalid" } };
    expect(extractPrologFact(vc)).toBeNull();
  });

  test("should return null for missing credential subject", () => {
    const vc = {};
    expect(extractPrologFact(vc)).toBeNull();
  });
});

describe("isStringValidTerm", () => {
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
    "parentjohn, mary)", // missing '(' after predicatenpx
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
        expect(await isStringValidTerm(statement)).toBe(true);
      },
    );
  });

  describe("invalid cases", () => {
    test.each(invalidCases)(
      "returns false for invalid statement: %s",
      async (statement) => {
        expect(await isStringValidTerm(statement)).toBe(false);
      },
    );
  });
});
