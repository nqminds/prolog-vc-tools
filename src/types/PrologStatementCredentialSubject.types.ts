export interface PrologStatementCredentialSubject {
  operation: "assert" | "asserta" | "assertz" | "retract" | "retractall";
  prolog: string;
  metadata?: {
    createdBy?: string;
    permissions?: string[];
    description?: string;
  };
}
