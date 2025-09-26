export interface PrologStatementCredentialSubject {
  operation: "assert" | "assertz" | "retract" | "consult" | "none";
  prolog: string;
  metadata?: {
    createdBy?: string;
    permissions?: string[];
    description?: string;
  };
}
