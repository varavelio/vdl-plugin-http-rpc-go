import { newGenerator } from "@varavel/gen";
import type { PluginOutputFile } from "@varavel/vdl-plugin-sdk";
import type {
  GeneratorContext,
  ProcedureDescriptor,
  ServiceDescriptor,
} from "../../../model/types";
import {
  createGoFile,
  joinSections,
  renderCatalog,
  renderCommentBlock,
  renderCoreRuntime,
  renderGoString,
} from "../../shared/index";
import { CLIENT_RUNTIME } from "./runtime";

/**
 * Generates the Go client file for the prepared RPC context.
 */
export function generateClientFile(
  context: GeneratorContext,
): PluginOutputFile {
  const body = joinSections([
    `package ${context.options.packageName}`,
    renderClientImports(context),
    renderCatalog(context),
    renderCoreRuntime(),
    CLIENT_RUNTIME,
    renderClientServices(context),
  ]);

  return createGoFile("client.go", "", body);
}

/**
 * Renders the import block required by the generated client runtime.
 */
function renderClientImports(context: GeneratorContext): string {
  const needsTypesImport = context.services.some((service) =>
    service.procedures.some(
      (procedure) => procedure.inputTypeName || procedure.outputTypeName,
    ),
  );
  const hasExternalTypesImport = context.options.typesImport.length > 0;

  const g = newGenerator().withTabs();
  g.line("import (");
  g.block(() => {
    g.line('"bytes"');
    g.line('"context"');
    g.line(`json ${renderGoString(context.options.jsonPackage)}`);
    g.line('"errors"');
    g.line('"fmt"');
    g.line('"io"');
    g.line('"math/rand"');
    g.line('"net/http"');
    g.line('"slices"');
    g.line('"strings"');
    g.line('"sync"');
    g.line('"time"');
    if (needsTypesImport && hasExternalTypesImport) {
      g.break();
      g.line(`vdltypes ${renderGoString(context.options.typesImport)}`);
    }
  });
  g.line(")");
  return g.toString();
}

/**
 * Renders all client-facing service registries and procedure builders.
 */
function renderClientServices(context: GeneratorContext): string {
  return context.services
    .map((service) => renderClientService(service, context))
    .join("\n\n");
}

/**
 * Renders the generated client API for a single RPC service.
 */
function renderClientService(
  service: ServiceDescriptor,
  context: GeneratorContext,
): string {
  const rpcStructName = `client${service.goName}RPC`;
  const procsStructName = `client${service.goName}Procs`;

  const g = newGenerator().withTabs();

  writeComment(
    g,
    `${service.goName} returns the client registry for the ${service.name} RPC service.`,
    service.doc,
    service.deprecated,
  );
  g.line(`func (r *clientRPCRegistry) ${service.goName}() *${rpcStructName} {`);
  g.block(() => {
    g.line(`return &${rpcStructName}{`);
    g.block(() => {
      g.line("intClient: r.intClient,");
      g.line(`Procs: &${procsStructName}{intClient: r.intClient},`);
    });
    g.line("}");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `${rpcStructName} groups the generated client builders for the ${service.name} RPC service.`,
  );
  g.line(`type ${rpcStructName} struct {`);
  g.block(() => {
    g.line("intClient *internalClient");
    g.line(`Procs *${procsStructName}`);
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `WithRetryConfig sets the default retry configuration for every procedure in the ${service.name} RPC service.`,
  );
  g.line(
    `func (r *${rpcStructName}) WithRetryConfig(conf RetryConfig) *${rpcStructName} {`,
  );
  g.block(() => {
    g.line(
      `r.intClient.setRPCRetryConfig(${renderGoString(service.name)}, conf)`,
    );
    g.line("return r");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `WithTimeoutConfig sets the default timeout configuration for every procedure in the ${service.name} RPC service.`,
  );
  g.line(
    `func (r *${rpcStructName}) WithTimeoutConfig(conf TimeoutConfig) *${rpcStructName} {`,
  );
  g.block(() => {
    g.line(
      `r.intClient.setRPCTimeoutConfig(${renderGoString(service.name)}, conf)`,
    );
    g.line("return r");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `WithHeaderProvider adds a header provider for every request in the ${service.name} RPC service.`,
  );
  g.line(
    `func (r *${rpcStructName}) WithHeaderProvider(provider HeaderProvider) *${rpcStructName} {`,
  );
  g.block(() => {
    g.line(
      `r.intClient.setRPCHeaderProvider(${renderGoString(service.name)}, provider)`,
    );
    g.line("return r");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `WithHeader adds a static header for every request in the ${service.name} RPC service.`,
  );
  g.line(
    `func (r *${rpcStructName}) WithHeader(key string, value string) *${rpcStructName} {`,
  );
  g.block(() => {
    g.line(
      `r.intClient.setRPCHeaderProvider(${renderGoString(service.name)}, func(_ context.Context, h http.Header) error {`,
    );
    g.block(() => {
      g.line("h.Set(key, value)");
      g.line("return nil");
    });
    g.line("})");
    g.line("return r");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `${procsStructName} exposes the generated procedure builders for the ${service.name} RPC service.`,
  );
  g.line(`type ${procsStructName} struct {`);
  g.block(() => {
    g.line("intClient *internalClient");
  });
  g.line("}");
  g.break();

  for (const procedure of service.procedures) {
    g.break();
    g.break();
    g.raw(renderClientProcedure(service, procedure, context));
  }

  return g.toString();
}

/**
 * Renders a client procedure builder and execute method.
 */
function renderClientProcedure(
  service: ServiceDescriptor,
  procedure: ProcedureDescriptor,
  context: GeneratorContext,
): string {
  const registryName = `client${service.goName}Procs`;
  const builderName = `clientBuilder${procedure.procedureTypeName}`;
  const inputType = getClientInputType(procedure, context);
  const outputType = getClientOutputType(procedure, context);

  const g = newGenerator().withTabs();
  writeComment(
    g,
    `${procedure.goName} creates a call builder for the ${service.name}.${procedure.name} procedure.`,
    procedure.doc,
    procedure.deprecated,
  );
  g.line(
    `func (registry *${registryName}) ${procedure.goName}() *${builderName} {`,
  );
  g.block(() => {
    g.line(
      `return &${builderName}{client: registry.intClient, headerProviders: []HeaderProvider{}, rpcName: ${renderGoString(service.name)}, procedureName: ${renderGoString(procedure.name)}}`,
    );
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `${builderName} configures and executes calls to the ${service.name}.${procedure.name} procedure.`,
  );
  g.line(`type ${builderName} struct {`);
  g.block(() => {
    g.line("rpcName string");
    g.line("procedureName string");
    g.line("client *internalClient");
    g.line("headerProviders []HeaderProvider");
    g.line("retryConf *RetryConfig");
    g.line("timeoutConf *TimeoutConfig");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `WithHeader adds a static header to the ${service.name}.${procedure.name} procedure call.`,
  );
  g.line(
    `func (b *${builderName}) WithHeader(key string, value string) *${builderName} {`,
  );
  g.block(() => {
    g.line(
      "b.headerProviders = append(b.headerProviders, func(_ context.Context, h http.Header) error {",
    );
    g.block(() => {
      g.line("h.Set(key, value)");
      g.line("return nil");
    });
    g.line("})");
    g.line("return b");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `WithHeaderProvider adds a dynamic header provider to the ${service.name}.${procedure.name} procedure call.`,
  );
  g.line(
    `func (b *${builderName}) WithHeaderProvider(provider HeaderProvider) *${builderName} {`,
  );
  g.block(() => {
    g.line("b.headerProviders = append(b.headerProviders, provider)");
    g.line("return b");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `WithRetryConfig overrides retry behavior for the ${service.name}.${procedure.name} procedure call.`,
  );
  g.line(
    `func (b *${builderName}) WithRetryConfig(conf RetryConfig) *${builderName} {`,
  );
  g.block(() => {
    g.line("b.retryConf = &conf");
    g.line("return b");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `WithTimeoutConfig overrides timeout behavior for the ${service.name}.${procedure.name} procedure call.`,
  );
  g.line(
    `func (b *${builderName}) WithTimeoutConfig(conf TimeoutConfig) *${builderName} {`,
  );
  g.block(() => {
    g.line("b.timeoutConf = &conf");
    g.line("return b");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `Execute sends a request to the ${service.name}.${procedure.name} procedure.`,
  );
  g.line(
    `func (b *${builderName}) Execute(ctx context.Context, input ${inputType}) (${outputType}, error) {`,
  );
  g.block(() => {
    g.line(
      "raw := b.client.proc(ctx, b.rpcName, b.procedureName, input, b.headerProviders, b.retryConf, b.timeoutConf)",
    );
    g.line("if !raw.Ok {");
    g.block(() => {
      g.line(`return ${outputType}{}, raw.Error`);
    });
    g.line("}");
    if (procedure.outputTypeName) {
      g.line(`var out ${outputType}`);
      g.line("if err := json.Unmarshal(raw.Output, &out); err != nil {");
      g.block(() => {
        g.line(
          `return ${outputType}{}, Error{Message: fmt.Sprintf("failed to decode ${service.name}.${procedure.name} output: %v", err)}`,
        );
      });
      g.line("}");
      g.line("return out, nil");
    } else {
      g.line(`return ${outputType}{}, nil`);
    }
  });
  g.line("}");
  return g.toString();
}

/**
 * Writes a formatted Go comment block into a generator.
 */
function writeComment(
  g: ReturnType<typeof newGenerator>,
  summary: string,
  doc?: string,
  deprecated?: string,
): void {
  g.raw(renderCommentBlock({ summary, doc, deprecated }));
  g.break();
}

/**
 * Resolves the generated client input type for a procedure.
 */
function getClientInputType(
  procedure: ProcedureDescriptor,
  context: GeneratorContext,
): string {
  return procedure.inputTypeName
    ? `${getTypesQualifier(context)}${procedure.inputTypeName}`
    : "Void";
}

/**
 * Resolves the generated client output type for a procedure.
 */
function getClientOutputType(
  procedure: ProcedureDescriptor,
  context: GeneratorContext,
): string {
  return procedure.outputTypeName
    ? `${getTypesQualifier(context)}${procedure.outputTypeName}`
    : "Void";
}

/**
 * Returns the type qualifier used by generated procedure signatures.
 */
function getTypesQualifier(context: GeneratorContext): string {
  return context.options.typesImport.length > 0 ? "vdltypes." : "";
}
