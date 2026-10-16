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
  ProcDescriptor,
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

  const procs: ProcDescriptor[] = [];

  for (const service of services) {
    procs.push(...service.procs);
  }

  return {
    errors: [],
    context: {
      input: options.input,
      schema: options.input.ir,
      options: options.generatorOptions,
      services,
      procs,
    },
  };
}

/**
 * Converts an `@httpRpc`-annotated type into a service descriptor.
 */
function buildServiceDescriptor(typeDef: TypeDef): ServiceDescriptor {
  const procLocals: ProcDescriptor[] = [];

  for (const field of typeDef.typeRef.objectFields ?? []) {
    const proc = buildProcDescriptor(typeDef, field);
    if (proc) {
      procLocals.push(proc);
    }
  }

  return {
    name: typeDef.name,
    goName: toGoTypeName(typeDef.name),
    position: typeDef.position,
    doc: typeDef.doc,
    deprecated: deprecationNote(typeDef.annotations),
    annotations: typeDef.annotations,
    procs: procLocals,
  };
}

/**
 * Converts a `@proc` field into a procedure descriptor.
 */
function buildProcDescriptor(
  serviceType: TypeDef,
  field: Field,
): ProcDescriptor | undefined {
  if (!getAnnotation(field.annotations, "proc")) {
    return undefined;
  }

  const inputField = findProcField(field, "input");
  const outputField = findProcField(field, "output");
  const rpcGoName = toGoTypeName(serviceType.name);
  const goName = toGoFieldName(field.name);
  const procTypeName = toInlineTypeName(rpcGoName, field.name);

  return {
    rpcName: serviceType.name,
    rpcGoName,
    name: field.name,
    goName,
    procTypeName,
    inputTypeName: inputField
      ? toInlineTypeName(procTypeName, inputField.name)
      : undefined,
    outputTypeName: outputField
      ? toInlineTypeName(procTypeName, outputField.name)
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
function findProcField(procField: Field, name: string): Field | undefined {
  return procField.typeRef.objectFields?.find((field) => field.name === name);
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
