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
import relationCustomSchema from "./schemas/relations/relation_custom.schema.json" with { type: "json" };
import fileSchema from "./schemas/resource/file.schema.json" with { type: "json" };
import folderSchema from "./schemas/resource/folder.schema.json" with { type: "json" };
import resourceSchema from "./schemas/resource/resource.schema.json" with { type: "json" };
import resourceContainedInSchema from "./schemas/resource/resource_contained_in.schema.json" with { type: "json" };
import ruleCustomSchema from "./schemas/rules/rule_custom.schema.json" with { type: "json" };
import ruleSchema from "./schemas/rules/rule.schema.json" with { type: "json" };
import entitySchema from "./schemas/entity/entity.schema.json" with { type: "json" };
import entityGroupSchema from "./schemas/entity_group/entity_group.schema.json" with { type: "json" };
import entityCustomSchema from "./schemas/entity/entity_custom_property.schema.json" with { type: "json" };
import entityGroupCustomSchema from "./schemas/entity_group/entity_group_custom_property.schema.json" with { type: "json" };
import entityBelongsToEntityGroupSchema from "./schemas/relations/entity_belongs_to_entity_group.schema.json" with { type: "json" };
import { Ajv } from "ajv";
import SWIPL from "swipl-wasm";

/**
 * Enum representing the different types of supported claims that can be processed.
 */
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
  RelationCustom = "relation_custom",
  File = "file",
  Folder = "folder",
  Resource = "resource",
  ResourceContainedIn = "resource_contained_in",
  RuleCustom = "rule_custom",
  Rule = "rule",
  Entity = "entity",
  EntityGroup = "entity_group",
  EntityCustomProperty = "entity_custom_property",
  EntityGroupCustomProperty = "entity_group_custom_property",
  EntityBelongsToEntityGroup = "entity_belongs_to_entity_group",
}

/**
 * A mapping of ClaimType values to their corresponding JSON schemas.
 */
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
  [ClaimType.RelationCustom]: relationCustomSchema,
  [ClaimType.File]: fileSchema,
  [ClaimType.Folder]: folderSchema,
  [ClaimType.Resource]: resourceSchema,
  [ClaimType.ResourceContainedIn]: resourceContainedInSchema,
  [ClaimType.RuleCustom]: ruleCustomSchema,
  [ClaimType.Rule]: ruleSchema,
  [ClaimType.Entity]: entitySchema,
  [ClaimType.EntityGroup]: entityGroupSchema,
  [ClaimType.EntityCustomProperty]: entityCustomSchema,
  [ClaimType.EntityGroupCustomProperty]: entityGroupCustomSchema,
  [ClaimType.EntityBelongsToEntityGroup]: entityBelongsToEntityGroupSchema,
};
/**
 * The result of attempting to extract a Prolog statement from a verifiable credential.
 */
export type PrologExtractionResult =
  | { fact: string; type: ClaimType; error?: undefined }
  | { fact?: undefined; type?: undefined; error: string };

/**
 * Enum representing the different update views for Prolog statements.
 * When passed in as an argument, this takes precedence over any updateView specified in the verifiable credential.
 */
export enum UpdateView {
  Assert = "assert",
  Asserta = "asserta",
  Assertz = "assertz",
  Retract = "retract",
}

/**
 * Extracts a prolog statement string from a verifiable credential that is of a supported schema.
 * @param verifiableCredential A verifiable credential object containing a credentialSubject with a claimType.
 * @param updateView Optional. An UpdateView value that specifies how to wrap the Prolog fact (e.g., assert, retract). This takes precedence over any updateView specified in the verifiable credential.
 * @returns An object containing either a Prolog fact string and its claim type, or an error message.
 */
export const extractPrologStatement = (
  verifiableCredential: any,
  updateView?: UpdateView,
): PrologExtractionResult => {
  const credentialSubject = (verifiableCredential as any)?.credentialSubject;
  if (!credentialSubject) {
    return {
      error:
        "Verifiable credential must contain a 'credentialSubject' property.",
    };
  }

  if (typeof credentialSubject.claimType !== "string") {
    return {
      error: "Credential subject must contain a string property 'claimType'.",
    };
  }

  const claimType = credentialSubject.claimType as ClaimType;
  const schema = schemas[claimType];

  if (!schema) {
    return { error: `Unknown or unsupported claimType: '${claimType}'.` };
  }

  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  const valid = validate(credentialSubject);

  if (!valid) {
    const errorDetails =
      validate.errors
        ?.map((e) => `${e.instancePath || "claim"} ${e.message}`)
        .join(", ") || "unknown validation error";
    return { error: `Invalid '${claimType}' claim: ${errorDetails}.` };
  }

  let updateViewToUse =
    updateView ||
    verifiableCredential.credentialSubject.updateView ||
    UpdateView.Assert;

  let fact = "";
  switch (claimType) {
    case ClaimType.Person:
      fact = `person(${credentialSubject.id})`;
      break;
    case ClaimType.Group:
      fact = `group(${credentialSubject.id})`;
      break;
    case ClaimType.PersonBelongsToGroup:
      fact = `person_belongs_to_group(${credentialSubject.person_id}, ${credentialSubject.group_id})`;
      break;
    case ClaimType.ResourceOwnedByPerson:
      fact = `resource_owned_by_person(${credentialSubject.resource_id}, ${credentialSubject.person_id})`;
      break;
    case ClaimType.ResourceSharedWithGroup:
      fact = `resource_shared_with_group(${credentialSubject.sharer_id}, ${credentialSubject.resource_id}, ${credentialSubject.group_id})`;
      break;
    case ClaimType.ResourceSharedWithPerson:
      fact = `resource_shared_with_person(${credentialSubject.sharer_id}, ${credentialSubject.resource_id}, ${credentialSubject.person_id})`;
      break;
    case ClaimType.RelationCustom:
      if (Array.isArray(credentialSubject.variables)) {
        fact = `${credentialSubject.name}(${credentialSubject.variables.join(", ")})`;
      } else {
        return {
          error: `Invalid 'variables' property for claimType '${claimType}'.`,
        };
      }
      break;
    case ClaimType.File:
      fact = `file(${credentialSubject.resource_id})`;
      break;
    case ClaimType.Folder:
      fact = `folder(${credentialSubject.resource_id})`;
      break;
    case ClaimType.Resource:
      fact = `resource(${credentialSubject.id})`;
      break;
    case ClaimType.ResourceContainedIn:
      fact = `resource_contained_in(${credentialSubject.resource_id}, ${credentialSubject.folder_id})`;
      break;
    case ClaimType.PersonCustomProperty:
      fact = `person_custom_property(${credentialSubject.id}, ${credentialSubject.property}, ${credentialSubject.value})`;
      break;
    case ClaimType.GroupCustomProperty:
      fact = `group_custom_property(${credentialSubject.id}, ${credentialSubject.property}, ${credentialSubject.value})`;
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
      fact = `${ruleName}(${variables}) :- ${ruleBody}`;
      break;
    case ClaimType.Entity:
      fact = `entity(${credentialSubject.id})`;
      break;
    case ClaimType.EntityCustomProperty:
      fact = `entity_custom_property(${credentialSubject.id}, ${credentialSubject.property}, ${credentialSubject.value})`;
      break;
    case ClaimType.EntityGroup:
      fact = `entity_group(${credentialSubject.id})`;
      break;
    case ClaimType.EntityGroupCustomProperty:
      fact = `entity_group_custom_property(${credentialSubject.id}, ${credentialSubject.property}, ${credentialSubject.value})`;
      break;
    case ClaimType.EntityBelongsToEntityGroup:
      fact = `entity_belongs_to_entity_group(${credentialSubject.entity_id}, ${credentialSubject.entity_group_id})`;
      break;
  }

  if (fact === "") {
    return {
      error: `Could not generate a Prolog fact for claimType '${claimType}'.`,
    };
  }

  const shouldWrapWithUpdateView =
    ClaimType.QueryCustom !== claimType && ClaimType.Query !== claimType;

  if (!shouldWrapWithUpdateView) {
    return { fact: `${fact}`, type: claimType };
  }

  switch (updateViewToUse) {
    case "assert":
      return { fact: `assert(${fact}).`, type: claimType };
    case "assertz":
      return { fact: `assertz(${fact}).`, type: claimType };
    case "asserta":
      return { fact: `asserta(${fact}).`, type: claimType };
    case "retract":
      return { fact: `retract(${fact}).`, type: claimType };
    default:
      return {
        error: `Unknown updateView action: '${updateViewToUse}'.`,
      };
  }
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

/**
 * Validates a Prolog statement string by attempting to assert it in the Prolog engine.
 * @deprecated Not sure this is going to be reliable enough to use in the "custom prolog statement" use case.
 * @param statement A Prolog statement string to validate.
 * @returns True if the statement is valid, false otherwise.
 */
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
