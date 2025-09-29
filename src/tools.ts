import PrologStatementJSONSchema from "./schemas/PrologStatementCredentialSubject.schema.json" with { type: "json" };
import { Ajv } from "ajv";
import { type PrologStatementCredentialSubject } from "./types/PrologStatementCredentialSubject.types.js";
import SWIPL from "swipl-wasm";

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
  return `${operation}(${prologRule}).`;
};

export const isStringValidTerm = async (
  statement: string,
): Promise<boolean> => {
  const swiplEngine: any = await SWIPL({ arguments: ["-q"] });

  try {
    const escapedStatement = statement.replace(/"/g, '\\"');

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
