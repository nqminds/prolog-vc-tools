import PrologStatementJSONSchema from "./schemas/PrologStatementCredentialSubject.schema.json" with { type: "json" };
import { Ajv } from "ajv";
import { type PrologStatementCredentialSubject } from "./types/PrologStatementCredentialSubject.types.js";

export const add = (a: number, b: number) => a + b;

export const extractPrologStatement = (
  verifiableCredential: any,
): string | null => {
  const ajv = new Ajv();
  const validate = ajv.compile(PrologStatementJSONSchema);

  const credentialSubject = (verifiableCredential as any).credentialSubject;
  if (!credentialSubject) return null;

  const valid = validate(credentialSubject);
  if (!valid) {
    console.error("Invalid VC:", validate.errors);
    return null;
  }

  // Credential subject is PrologStatementCredentialSubject
  const credentialSubjectTyped =
    credentialSubject as unknown as PrologStatementCredentialSubject;

  const prologRule: string = credentialSubjectTyped.prolog;

  const operation: string = credentialSubjectTyped.operation;
  if (operation && operation === "assert") {
    return `assert(${prologRule}).`;
  }

  return prologRule;
};
