import { newGenerator } from "@varavel/gen";
import { dedent } from "@varavel/vdl-plugin-sdk/utils/strings";
import { lowerFirst } from "../../../shared/naming";
import type {
  GeneratorContext,
  ProcDescriptor,
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
    renderProcCatalog("VDLProcs", context.procs),
  ]);
}

/**
 * Renders the generated Go procedure catalog used by runtime code.
 */
function renderProcCatalog(constName: string, procs: ProcDescriptor[]): string {
  const summary = "VDLProcs contains every generated procedure definition.";

  if (procs.length === 0) {
    const g = newGenerator().withTabs();
    g.line(renderCommentBlock({ summary }));
    g.line(`var ${constName} = []ProcDefinition{}`);
    return g.toString();
  }

  const entries = procs.map((proc) => {
    const g = newGenerator().withTabs();
    g.line("{");
    g.block(() => {
      g.line(`RPCName: ${renderGoString(proc.rpcName)},`);
      g.line(`RPCRoute: ${renderGoString(lowerFirst(proc.rpcName))},`);
      g.line(`Name: ${renderGoString(proc.name)},`);
      g.line(
        `Path: ${renderGoString(`/${lowerFirst(proc.rpcName)}/${proc.name}`)},`,
      );
      g.line(`Annotations: ${renderAnnotationsLiteral(proc.annotations)},`);
    });
    g.line("},");
    return g.toString().trim();
  });

  const g = newGenerator().withTabs();
  g.line(renderCommentBlock({ summary }));
  g.line(`var ${constName} = []ProcDefinition{`);
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
  const g = newGenerator().withTabs();
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
        for (const proc of service.procs) {
          g.line(`${proc.goName} string`);
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
        for (const proc of service.procs) {
          g.line(`${proc.goName} string`);
        }
      });
      g.line("}{");
      g.block(() => {
        for (const proc of service.procs) {
          g.line(
            `${proc.goName}: ${renderGoString(`/${lowerFirst(service.name)}/${proc.name}`)},`,
          );
        }
      });
      g.line("},");
    }
  });
  g.line("}");

  return joinSections([g.toString()]);
}
