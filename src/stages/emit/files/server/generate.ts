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
import { SERVER_RUNTIME } from "./runtime";

/**
 * Generates the Go server file for the prepared RPC context.
 */
export function generateServerFile(
  context: GeneratorContext,
): PluginOutputFile {
  const body = joinSections([
    `package ${context.options.packageName}`,
    renderServerImports(context),
    renderCatalog(context),
    renderCoreRuntime(),
    SERVER_RUNTIME,
    renderServerServices(context),
  ]);

  return createGoFile("server.go", "", body);
}

/**
 * Renders the import block required by the generated server runtime.
 */
function renderServerImports(context: GeneratorContext): string {
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
    g.line('"fmt"');
    g.line('"io"');
    g.line('"net/http"');
    g.line('"sync"');
    if (needsTypesImport && hasExternalTypesImport) {
      g.break();
      g.line(`vdltypes ${renderGoString(context.options.typesImport)}`);
    }
  });
  g.line(")");
  return g.toString();
}

/**
 * Renders all service registries and typed procedure adapters for the server target.
 */
function renderServerServices(context: GeneratorContext): string {
  return context.services
    .map((service) => renderServerService(service, context))
    .join("\n\n");
}

/**
 * Renders the generated server API for a single RPC service.
 */
function renderServerService(
  service: ServiceDescriptor,
  context: GeneratorContext,
): string {
  const rpcStructName = `server${service.goName}RPC`;
  const procsStructName = `server${service.goName}Procs`;

  const g = newGenerator().withTabs();

  writeComment(
    g,
    `${service.goName} returns the server registry for the ${service.name} RPC service.`,
    service.doc,
    service.deprecated,
  );
  g.line(
    `func (r *serverRPCRegistry[T]) ${service.goName}() *${rpcStructName}[T] {`,
  );
  g.block(() => {
    g.line(`return &${rpcStructName}[T]{`);
    g.block(() => {
      g.line("intServer: r.intServer,");
      g.line(`Procs: &${procsStructName}[T]{intServer: r.intServer},`);
    });
    g.line("}");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `${rpcStructName} groups the generated server registration APIs for the ${service.name} RPC service.`,
  );
  g.line(`type ${rpcStructName}[T any] struct {`);
  g.block(() => {
    g.line("intServer *internalServer[T]");
    g.line(`Procs *${procsStructName}[T]`);
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `Use registers middleware that runs for every request inside the ${service.name} RPC service.`,
  );
  g.line(`func (r *${rpcStructName}[T]) Use(mw GlobalMiddlewareFunc[T]) {`);
  g.block(() => {
    g.line(`r.intServer.addRPCMiddleware(${renderGoString(service.name)}, mw)`);
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `SetErrorHandler sets the error handler for the ${service.name} RPC service.`,
  );
  g.line(
    `func (r *${rpcStructName}[T]) SetErrorHandler(handler ErrorHandlerFunc[T]) {`,
  );
  g.block(() => {
    g.line(
      `r.intServer.setRPCErrorHandler(${renderGoString(service.name)}, handler)`,
    );
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `${procsStructName} exposes the generated procedure registration APIs for the ${service.name} RPC service.`,
  );
  g.line(`type ${procsStructName}[T any] struct {`);
  g.block(() => {
    g.line("intServer *internalServer[T]");
  });
  g.line("}");
  g.break();

  for (const procedure of service.procedures) {
    g.break();
    g.break();
    g.raw(renderServerProcedure(service, procedure, context));
  }

  return g.toString();
}

/**
 * Renders the typed server adapter for a single procedure.
 */
function renderServerProcedure(
  service: ServiceDescriptor,
  procedure: ProcedureDescriptor,
  context: GeneratorContext,
): string {
  const registryName = `server${service.goName}Procs`;
  const entryName = `proc${procedure.procedureTypeName}Entry`;
  const handlerContextName = `${procedure.procedureTypeName}HandlerContext`;
  const handlerFuncName = `${procedure.procedureTypeName}HandlerFunc`;
  const middlewareFuncName = `${procedure.procedureTypeName}MiddlewareFunc`;
  const inputType = getServerInputType(procedure, context);
  const outputType = getServerOutputType(procedure, context);

  const g = newGenerator().withTabs();
  writeComment(
    g,
    `${procedure.goName} returns the registration entry for the ${service.name}.${procedure.name} procedure.`,
    procedure.doc,
    procedure.deprecated,
  );
  g.line(
    `func (r *${registryName}[T]) ${procedure.goName}() ${entryName}[T] {`,
  );
  g.block(() => {
    g.line(`return ${entryName}[T]{intServer: r.intServer}`);
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `${entryName} contains the generated registration API for the ${service.name}.${procedure.name} procedure.`,
  );
  g.line(`type ${entryName}[T any] struct {`);
  g.block(() => {
    g.line("intServer *internalServer[T]");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `${handlerContextName} is the typed handler context passed to ${service.name}.${procedure.name} procedure handlers.`,
  );
  g.line(`type ${handlerContextName}[T any] = HandlerContext[T, ${inputType}]`);
  g.break();

  writeComment(
    g,
    `${handlerFuncName} is the typed handler signature for the ${service.name}.${procedure.name} procedure.`,
  );
  g.line(
    `type ${handlerFuncName}[T any] func(c *${handlerContextName}[T]) (${outputType}, error)`,
  );
  g.break();

  writeComment(
    g,
    `${middlewareFuncName} is the typed middleware signature for the ${service.name}.${procedure.name} procedure.`,
  );
  g.line(
    `type ${middlewareFuncName}[T any] func(next ${handlerFuncName}[T]) ${handlerFuncName}[T]`,
  );
  g.break();

  writeComment(
    g,
    `Use registers typed middleware for the ${service.name}.${procedure.name} procedure.`,
  );
  g.line(`func (e ${entryName}[T]) Use(mw ${middlewareFuncName}[T]) {`);
  g.block(() => {
    g.line(
      `adapted := func(next ProcHandlerFunc[T, any, any]) ProcHandlerFunc[T, any, any] {`,
    );
    g.block(() => {
      g.line(`return func(cGeneric *HandlerContext[T, any]) (any, error) {`);
      g.block(() => {
        g.line(
          `typedNext := func(c *${handlerContextName}[T]) (${outputType}, error) {`,
        );
        g.block(() => {
          g.line("cGeneric.Props = c.Props");
          g.line("cGeneric.Input = c.Input");
          g.line("cGeneric.Annotations = cloneAnnotations(c.Annotations)");
          g.line("genericOutput, err := next(cGeneric)");
          g.line("if err != nil {");
          g.block(() => {
            g.line(`return ${outputType}{}, err`);
          });
          g.line("}");
          g.line(`typedOutput, _ := genericOutput.(${outputType})`);
          g.line("return typedOutput, nil");
        });
        g.line("}");
        g.line("typedChain := mw(typedNext)");
        g.line(`typedInput, _ := cGeneric.Input.(${inputType})`);
        g.line(`cSpecific := &${handlerContextName}[T]{`);
        g.block(() => {
          g.line("Props: cGeneric.Props,");
          g.line("Input: typedInput,");
          g.line("Context: cGeneric.Context,");
          g.line("Annotations: cloneAnnotations(cGeneric.Annotations),");
          g.line("procedure: cGeneric.procedure,");
        });
        g.line("}");
        g.line("return typedChain(cSpecific)");
      });
      g.line("}");
    });
    g.line("}");
    g.line(
      `e.intServer.addProcMiddleware(${renderGoString(service.name)}, ${renderGoString(procedure.name)}, adapted)`,
    );
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `Handle registers the typed business handler for the ${service.name}.${procedure.name} procedure.`,
  );
  g.line(`func (e ${entryName}[T]) Handle(handler ${handlerFuncName}[T]) {`);
  g.block(() => {
    g.line(
      `adaptedHandler := func(cGeneric *HandlerContext[T, any]) (any, error) {`,
    );
    g.block(() => {
      g.line(`typedInput, _ := cGeneric.Input.(${inputType})`);
      g.line(`cSpecific := &${handlerContextName}[T]{`);
      g.block(() => {
        g.line("Props: cGeneric.Props,");
        g.line("Input: typedInput,");
        g.line("Context: cGeneric.Context,");
        g.line("Annotations: cloneAnnotations(cGeneric.Annotations),");
        g.line("procedure: cGeneric.procedure,");
      });
      g.line("}");
      if (procedure.outputTypeName) {
        g.line("return handler(cSpecific)");
      } else {
        g.line("if _, err := handler(cSpecific); err != nil {");
        g.block(() => {
          g.line("return nil, err");
        });
        g.line("}");
        g.line("return nil, nil");
      }
    });
    g.line("}");

    g.line(`deserializer := func(raw json.RawMessage) (any, error) {`);
    g.block(() => {
      if (procedure.inputTypeName) {
        g.line("if len(bytes.TrimSpace(raw)) == 0 {");
        g.block(() => {
          g.line('raw = json.RawMessage("{}")');
        });
        g.line("}");
        g.line(`var input ${inputType}`);
        g.line("if err := json.Unmarshal(raw, &input); err != nil {");
        g.block(() => {
          g.line(
            `return nil, fmt.Errorf("failed to unmarshal ${service.name}.${procedure.name} input: %w", err)`,
          );
        });
        g.line("}");
        g.line("return input, nil");
      } else {
        g.line("return Void{}, nil");
      }
    });
    g.line("}");
    g.line(
      `e.intServer.setProcHandler(${renderGoString(service.name)}, ${renderGoString(procedure.name)}, adaptedHandler, deserializer)`,
    );
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
 * Resolves the generated server input type for a procedure.
 */
function getServerInputType(
  procedure: ProcedureDescriptor,
  context: GeneratorContext,
): string {
  return procedure.inputTypeName
    ? `${getTypesQualifier(context)}${procedure.inputTypeName}`
    : "Void";
}

/**
 * Resolves the generated server output type for a procedure.
 */
function getServerOutputType(
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
