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
export const isStatementValidProlog = async (
  statement: string,
): Promise<boolean> => {
  // Instantiate SWI-Prolog engine if not already initialized
  const swiplEngine: any = await SWIPL({ arguments: ["-q"] });

  try {
    // Define the check_syntax predicate in Prolog
    await swiplEngine.prolog
      .query(
        `
assertz((
  check_syntax(String) :-
      catch(
          read_term_from_atom(String, Term, [syntax_errors(error)]),
          error(syntax_error(_), _),
          fail
      ),
      format("Parsed OK: ~w~n", [Term])
)).
`,
      )
      .once();

    // Run check_syntax on the provided statement
    const result = swiplEngine.prolog
      .query(`check_syntax("${statement}").`)
      .once();
    return result.success;
  } catch (e) {
    console.error("Error during Prolog syntax check:", e);
    return false;
  }
};
