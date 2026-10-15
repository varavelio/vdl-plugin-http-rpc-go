import { newGenerator } from "@varavel/gen";
import { dedent } from "@varavel/vdl-plugin-sdk/utils/strings";
import { lowerFirst } from "../../../shared/naming";
import type {
  GeneratorContext,
  OperationDescriptor,
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
    renderOperationCatalog("VDLProcedures", context.procedures),
  ]);
}

/**
 * Renders the generated Go procedure catalog used by runtime code.
 */
function renderOperationCatalog(
  constName: string,
  operations: OperationDescriptor[],
): string {
  const summary =
    "VDLProcedures contains every generated procedure definition.";

  if (operations.length === 0) {
    const g = newGenerator();
    g.line(renderCommentBlock({ summary }));
    g.line(`var ${constName} = []OperationDefinition{}`);
    return g.toString();
  }

  const entries = operations.map((operation) => {
    const g = newGenerator();
    g.line("{");
    g.block(() => {
      g.line(`RPCName: ${renderGoString(operation.rpcName)},`);
      g.line(`Name: ${renderGoString(operation.name)},`);
      g.line(
        `Annotations: ${renderAnnotationsLiteral(operation.annotations)},`,
      );
    });
    g.line("},");
    return g.toString().trim();
  });

  const g = newGenerator();
  g.line(renderCommentBlock({ summary }));
  g.line(`var ${constName} = []OperationDefinition{`);
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
        for (const operation of service.operations) {
          g.line(`${operation.goName} string`);
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
        for (const operation of service.operations) {
          g.line(`${operation.goName} string`);
        }
      });
      g.line("}{");
      g.block(() => {
        for (const operation of service.operations) {
          g.line(
            `${operation.goName}: ${renderGoString(`/${lowerFirst(service.name)}/${operation.name}`)},`,
          );
        }
      });
      g.line("},");
    }
  });
  g.line("}");

  return joinSections([g.toString()]);
}
