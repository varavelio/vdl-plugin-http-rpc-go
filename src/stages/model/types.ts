import type {
  Annotation,
  Field,
  IrSchema,
  PluginInput,
  Position,
} from "@varavel/vdl-plugin-sdk";

/**
 * Supported generator target values.
 */
export type GeneratorTarget = "client" | "server";

/**
 * Resolved plugin options used by later generation stages.
 */
export type GeneratorOptions = {
  jsonPackage: string;
  packageName: string;
  target: GeneratorTarget;
  typesImport: string;
};

/**
 * Structured descriptor for a VPP-2 procedure discovered in the IR.
 */
export type ProcedureDescriptor = {
  rpcName: string;
  rpcGoName: string;
  name: string;
  goName: string;
  procedureTypeName: string;
  inputTypeName?: string;
  outputTypeName?: string;
  position: Position;
  doc?: string;
  deprecated?: string;
  annotations: Annotation[];
  inputField?: Field;
  outputField?: Field;
};

/**
 * Structured descriptor for a VPP-2 HTTP-RPC service.
 */
export type ServiceDescriptor = {
  name: string;
  goName: string;
  position: Position;
  doc?: string;
  deprecated?: string;
  annotations: Annotation[];
  procedures: ProcedureDescriptor[];
};

/**
 * Canonical generation context shared by emission stages.
 */
export type GeneratorContext = {
  input: PluginInput;
  schema: IrSchema;
  options: GeneratorOptions;
  services: ServiceDescriptor[];
  procedures: ProcedureDescriptor[];
};
