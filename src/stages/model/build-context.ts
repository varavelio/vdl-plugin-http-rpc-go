import type {
  Annotation,
  Field,
  PluginInput,
  TypeDef,
} from "@varavel/vdl-plugin-sdk";
import {
  getDeprecationMessage,
  isDeprecated,
} from "@varavel/vdl-plugin-sdk/utils/deprecations";
import { getAnnotation } from "@varavel/vdl-plugin-sdk/utils/ir";
import {
  toGoFieldName,
  toGoTypeName,
  toInlineTypeName,
} from "../../shared/naming";
import type {
  GeneratorContext,
  GeneratorOptions,
  ProcedureDescriptor,
  ServiceDescriptor,
} from "./types";

/**
 * Builds the intermediate HTTP-RPC generation context from the VPP-2 IR.
 */
export function createGeneratorContext(options: {
  input: PluginInput;
  generatorOptions: GeneratorOptions;
}): { context?: GeneratorContext; errors: [] } {
  const services: ServiceDescriptor[] = [];

  for (const typeDef of options.input.ir.types) {
    if (!getAnnotation(typeDef.annotations, "httpRpc")) {
      continue;
    }

    services.push(buildServiceDescriptor(typeDef));
  }

  const procedures: ProcedureDescriptor[] = [];

  for (const service of services) {
    procedures.push(...service.procedures);
  }

  return {
    errors: [],
    context: {
      input: options.input,
      schema: options.input.ir,
      options: options.generatorOptions,
      services,
      procedures,
    },
  };
}

/**
 * Converts an `@httpRpc`-annotated type into a service descriptor.
 */
function buildServiceDescriptor(typeDef: TypeDef): ServiceDescriptor {
  const proceduresLocal: ProcedureDescriptor[] = [];

  for (const field of typeDef.typeRef.objectFields ?? []) {
    const procedure = buildProcedureDescriptor(typeDef, field);
    if (procedure) {
      proceduresLocal.push(procedure);
    }
  }

  return {
    name: typeDef.name,
    goName: toGoTypeName(typeDef.name),
    position: typeDef.position,
    doc: typeDef.doc,
    deprecated: deprecationNote(typeDef.annotations),
    annotations: typeDef.annotations,
    procedures: proceduresLocal,
  };
}

/**
 * Converts a `@proc` field into a procedure descriptor.
 */
function buildProcedureDescriptor(
  serviceType: TypeDef,
  field: Field,
): ProcedureDescriptor | undefined {
  if (!getAnnotation(field.annotations, "proc")) {
    return undefined;
  }

  const inputField = findProcedureField(field, "input");
  const outputField = findProcedureField(field, "output");
  const rpcGoName = toGoTypeName(serviceType.name);
  const goName = toGoFieldName(field.name);
  const procedureTypeName = toInlineTypeName(rpcGoName, field.name);

  return {
    rpcName: serviceType.name,
    rpcGoName,
    name: field.name,
    goName,
    procedureTypeName,
    inputTypeName: inputField
      ? toInlineTypeName(procedureTypeName, inputField.name)
      : undefined,
    outputTypeName: outputField
      ? toInlineTypeName(procedureTypeName, outputField.name)
      : undefined,
    position: field.position,
    doc: field.doc,
    deprecated: deprecationNote(field.annotations),
    annotations: field.annotations.filter(
      (annotation) => annotation.name !== "proc",
    ),
    inputField,
    outputField,
  };
}

/**
 * Finds the named `input` or `output` field inside a procedure object.
 */
function findProcedureField(
  procedureField: Field,
  name: string,
): Field | undefined {
  return procedureField.typeRef.objectFields?.find(
    (field) => field.name === name,
  );
}

/**
 * Keeps bare `@deprecated` visible: an empty note renders the default message.
 */
function deprecationNote(annotations: Annotation[]): string | undefined {
  if (!isDeprecated(annotations)) {
    return undefined;
  }

  return getDeprecationMessage(annotations) ?? "";
}
