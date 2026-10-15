import type {
  Annotation,
  Field,
  PluginInput,
  TypeDef,
} from "@varavel/vdl-plugin-sdk";
import {
  getAnnotation,
  getAnnotationArg,
  unwrapLiteral,
} from "@varavel/vdl-plugin-sdk/utils/ir";
import {
  toGoFieldName,
  toGoTypeName,
  toInlineTypeName,
} from "../../shared/naming";
import type {
  GeneratorContext,
  GeneratorOptions,
  OperationDescriptor,
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

  const procedures: OperationDescriptor[] = [];

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
  const operations: OperationDescriptor[] = [];

  for (const field of typeDef.typeRef.objectFields ?? []) {
    const operation = buildOperationDescriptor(typeDef, field);
    if (operation) {
      operations.push(operation);
    }
  }

  return {
    name: typeDef.name,
    goName: toGoTypeName(typeDef.name),
    position: typeDef.position,
    doc: typeDef.doc,
    deprecated: getDeprecatedMessage(typeDef.annotations),
    annotations: typeDef.annotations,
    operations,
    procedures: operations,
  };
}

/**
 * Converts a `@proc` field into a procedure descriptor.
 */
function buildOperationDescriptor(
  serviceType: TypeDef,
  field: Field,
): OperationDescriptor | undefined {
  if (!getAnnotation(field.annotations, "proc")) {
    return undefined;
  }

  const inputField = findOperationField(field, "input");
  const outputField = findOperationField(field, "output");
  const rpcGoName = toGoTypeName(serviceType.name);
  const goName = toGoFieldName(field.name);
  const operationTypeName = toInlineTypeName(rpcGoName, field.name);

  return {
    rpcName: serviceType.name,
    rpcGoName,
    name: field.name,
    goName,
    operationTypeName,
    inputTypeName: inputField
      ? toInlineTypeName(operationTypeName, inputField.name)
      : undefined,
    outputTypeName: outputField
      ? toInlineTypeName(operationTypeName, outputField.name)
      : undefined,
    position: field.position,
    doc: field.doc,
    deprecated: getDeprecatedMessage(field.annotations),
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
function findOperationField(
  operationField: Field,
  name: string,
): Field | undefined {
  return operationField.typeRef.objectFields?.find(
    (field) => field.name === name,
  );
}

/**
 * Extracts the deprecation message from an annotation list when present.
 */
function getDeprecatedMessage(annotations: Annotation[]): string | undefined {
  const argument = getAnnotationArg(annotations, "deprecated");
  if (!getAnnotation(annotations, "deprecated")) {
    return undefined;
  }

  if (!argument) {
    return "";
  }

  return unwrapLiteral<string>(argument);
}
