import { newGenerator } from "@varavel/gen";
import { dedent } from "@varavel/vdl-plugin-sdk/utils/strings";
import { lowerFirst } from "../../../shared/naming";
import type {
  GeneratorContext,
  ProcedureDescriptor,
  ServiceDescriptor,
} from "../../model/types";
import { joinSections } from "./helpers";
import {
  renderAnnotationsLiteral,
  renderCommentBlock,
  renderGoString,
} from "./renderers";

const CATALOG_HEADER = dedent(/* go */ `
  // -----------------------------------------------------------------------------
  // RPC Catalog
  // -----------------------------------------------------------------------------
`);

export function renderCatalog(context: GeneratorContext) {
  return joinSections([
    CATALOG_HEADER,
    renderPathCatalog(context.services),
    renderProcedureCatalog("VDLProcedures", context.procedures),
  ]);
}

/**
 * Renders the generated Go procedure catalog used by runtime code.
 */
function renderProcedureCatalog(
  constName: string,
  procedures: ProcedureDescriptor[],
): string {
  const summary =
    "VDLProcedures contains every generated procedure definition.";

  if (procedures.length === 0) {
    const g = newGenerator();
    g.line(renderCommentBlock({ summary }));
    g.line(`var ${constName} = []ProcedureDefinition{}`);
    return g.toString();
  }

  const entries = procedures.map((procedure) => {
    const g = newGenerator();
    g.line("{");
    g.block(() => {
      g.line(`RPCName: ${renderGoString(procedure.rpcName)},`);
      g.line(`RPCRoute: ${renderGoString(lowerFirst(procedure.rpcName))},`);
      g.line(`Name: ${renderGoString(procedure.name)},`);
      g.line(
        `Path: ${renderGoString(`/${lowerFirst(procedure.rpcName)}/${procedure.name}`)},`,
      );
      g.line(
        `Annotations: ${renderAnnotationsLiteral(procedure.annotations)},`,
      );
    });
    g.line("},");
    return g.toString().trim();
  });

  const g = newGenerator();
  g.line(renderCommentBlock({ summary }));
  g.line(`var ${constName} = []ProcedureDefinition{`);
  g.block(() => {
    for (const entry of entries) {
      g.line(entry);
    }
  });
  g.line("}");
  return g.toString();
}

/**
 * Renders a nested catalog of generated procedure paths.
 */
function renderPathCatalog(services: ServiceDescriptor[]): string {
  const g = newGenerator();
  g.line(
    renderCommentBlock({
      summary:
        "VDLPaths contains the generated path catalog for every procedure.",
    }),
  );

  g.line("var VDLPaths = struct {");
  g.block(() => {
    for (const service of services) {
      g.line(`${service.goName} struct {`);
      g.block(() => {
        for (const procedure of service.procedures) {
          g.line(`${procedure.goName} string`);
        }
      });
      g.line("}");
    }
  });

  g.line("}{");
  g.block(() => {
    for (const service of services) {
      g.line(`${service.goName}: struct {`);
      g.block(() => {
        for (const procedure of service.procedures) {
          g.line(`${procedure.goName} string`);
        }
      });
      g.line("}{");
      g.block(() => {
        for (const procedure of service.procedures) {
          g.line(
            `${procedure.goName}: ${renderGoString(`/${lowerFirst(service.name)}/${procedure.name}`)},`,
          );
        }
      });
      g.line("},");
    }
  });
  g.line("}");

  return joinSections([g.toString()]);
}
