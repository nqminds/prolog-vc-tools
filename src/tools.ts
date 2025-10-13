import queryCustomSchema from "./schemas/query/query_custom.schema.json" with { type: "json" };
import personCustomPropertySchema from "./schemas/person/person_custom_property.schema.json" with { type: "json" };
import groupCustomPropertySchema from "./schemas/group/group_custom_property.schema.json" with { type: "json" };
import groupSchema from "./schemas/group/group.schema.json" with { type: "json" };
import personSchema from "./schemas/person/person.schema.json" with { type: "json" };
import querySchema from "./schemas/query/query.schema.json" with { type: "json" };
import personBelongsToGroupSchema from "./schemas/relations/person_belongs_to_group.schema.json" with { type: "json" };
import resourceOwnedByPersonSchema from "./schemas/relations/resource_owned_by_person.schema.json" with { type: "json" };
import resourceSharedWithGroupSchema from "./schemas/relations/resource_shared_with_group.schema.json" with { type: "json" };
import resourceSharedWithPersonSchema from "./schemas/relations/resource_shared_with_person.schema.json" with { type: "json" };
import fileSchema from "./schemas/resource/file.schema.json" with { type: "json" };
import folderSchema from "./schemas/resource/folder.schema.json" with { type: "json" };
import resourceSchema from "./schemas/resource/resource.schema.json" with { type: "json" };
import resourceContainedInSchema from "./schemas/resource/resource_contained_in.schema.json" with { type: "json" };
import ruleCustomSchema from "./schemas/rules/rule_custom.schema.json" with { type: "json" };
import ruleSchema from "./schemas/rules/rule.schema.json" with { type: "json" };

import { Ajv } from "ajv";
import SWIPL from "swipl-wasm";

export enum ClaimType {
  QueryCustom = "query_custom",
  PersonCustomProperty = "person_custom_property",
  GroupCustomProperty = "group_custom_property",
  Group = "group",
  Person = "person",
  Query = "query",
  PersonBelongsToGroup = "person_belongs_to_group",
  ResourceOwnedByPerson = "resource_owned_by_person",
  ResourceSharedWithGroup = "resource_shared_with_group",
  ResourceSharedWithPerson = "resource_shared_with_person",
  File = "file",
  Folder = "folder",
  Resource = "resource",
  ResourceContainedIn = "resource_contained_in",
  RuleCustom = "rule_custom",
  Rule = "rule",
}

const schemas = {
  [ClaimType.QueryCustom]: queryCustomSchema,
  [ClaimType.PersonCustomProperty]: personCustomPropertySchema,
  [ClaimType.GroupCustomProperty]: groupCustomPropertySchema,
  [ClaimType.Group]: groupSchema,
  [ClaimType.Person]: personSchema,
  [ClaimType.Query]: querySchema,
  [ClaimType.PersonBelongsToGroup]: personBelongsToGroupSchema,
  [ClaimType.ResourceOwnedByPerson]: resourceOwnedByPersonSchema,
  [ClaimType.ResourceSharedWithGroup]: resourceSharedWithGroupSchema,
  [ClaimType.ResourceSharedWithPerson]: resourceSharedWithPersonSchema,
  [ClaimType.File]: fileSchema,
  [ClaimType.Folder]: folderSchema,
  [ClaimType.Resource]: resourceSchema,
  [ClaimType.ResourceContainedIn]: resourceContainedInSchema,
  [ClaimType.RuleCustom]: ruleCustomSchema,
  [ClaimType.Rule]: ruleSchema,
};

export const extractPrologStatement = (
  verifiableCredential: any,
): { fact: string; type: ClaimType } | null => {
  const credentialSubject = (verifiableCredential as any).credentialSubject;
  if (!credentialSubject || typeof credentialSubject.claimType !== "string") {
    console.error("Invalid credential subject: missing or invalid claimType");
    return null;
  }

  const claimType = credentialSubject.claimType as ClaimType;
  const schema = schemas[claimType];

  if (!schema) {
    console.error(`Unknown claimType: ${claimType}`);
    return null;
  }

  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  const valid = validate(credentialSubject);

  if (!valid) {
    console.error(`Invalid ${claimType} claim:`, validate.errors);
    return null;
  }

  let fact = "";
  switch (claimType) {
    case ClaimType.Person:
      fact = `person(${credentialSubject.id}).`;
      break;
    case ClaimType.Group:
      fact = `group(${credentialSubject.id}).`;
      break;
    case ClaimType.PersonBelongsToGroup:
      fact = `person_belongs_to_group(${credentialSubject.person_id}, ${credentialSubject.group_id}).`;
      break;
    case ClaimType.ResourceOwnedByPerson:
      fact = `resource_owned_by_person(${credentialSubject.resource_id}, ${credentialSubject.person_id}).`;
      break;
    case ClaimType.ResourceSharedWithGroup:
      fact = `resource_shared_with_group(${credentialSubject.resource_id}, ${credentialSubject.group_id}).`;
      break;
    case ClaimType.ResourceSharedWithPerson:
      fact = `resource_shared_with_person(${credentialSubject.resource_id}, ${credentialSubject.person_id}).`;
      break;
    case ClaimType.File:
      fact = `file(${credentialSubject.resource_id}).`;
      break;
    case ClaimType.Folder:
      fact = `folder(${credentialSubject.resource_id}).`;
      break;
    case ClaimType.Resource:
      fact = `resource(${credentialSubject.id}).`;
      break;
    case ClaimType.ResourceContainedIn:
      fact = `resource_contained_in(${credentialSubject.resource_id}, ${credentialSubject.folder_id}).`;
      break;
    case ClaimType.PersonCustomProperty:
      fact = `person_x(${credentialSubject.id}, ${credentialSubject.property}, ${credentialSubject.value}).`;
      break;
    case ClaimType.GroupCustomProperty:
      fact = `group_custom_property(${credentialSubject.id}, ${credentialSubject.property}, ${credentialSubject.value}).`;
      break;
    case ClaimType.Query:
      if (Array.isArray(credentialSubject.args)) {
        const args = credentialSubject.args.join(", ");
        fact = `${credentialSubject.predicate}(${args}).`;
      }
      break;
    case ClaimType.QueryCustom:
    case ClaimType.RuleCustom:
      if (typeof credentialSubject.prolog === "string") {
        fact = credentialSubject.prolog;
      }
      break;
    case ClaimType.Rule:
      const ruleName = credentialSubject.name;
      const variables = Array.isArray(credentialSubject.variables)
        ? credentialSubject.variables.join(", ")
        : "";
      const ruleBody = jsonToProlog(credentialSubject.evaluate);
      fact = `${ruleName}(${variables}) :- ${ruleBody}.`;
      break;
  }

  return { fact, type: claimType };
};

const jsonToProlog = (evaluate: any): string => {
  if (evaluate.and) {
    return `(${evaluate.and.map(jsonToProlog).join(", ")})`;
  } else if (evaluate.or) {
    return `(${evaluate.or.map(jsonToProlog).join("; ")})`;
  } else if (evaluate.not) {
    return `\+(${jsonToProlog(evaluate.not)})`;
  } else if (evaluate.predicate) {
    const args = evaluate.args.join(", ");
    return `${evaluate.predicate}(${args})`;
  }
  return "";
};

export const isStringValidTerm = async (
  statement: string,
): Promise<boolean> => {
  const swiplEngine: any = await SWIPL({ arguments: ["-q"] });

  try {
    const escapedStatement = statement.replace(/"/g, '"');

    // Attempt to assert the term; if it fails, catch it
    const result = await swiplEngine.prolog
      .query(
        `
      catch(assertz(${escapedStatement}), _, fail).
    `,
      )
      .once();

    return result.success === true;
  } catch (e) {
    console.error("Error during Prolog assertion check:", e);
    return false;
  }
};
