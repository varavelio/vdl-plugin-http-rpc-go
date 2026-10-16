import type { PluginOutputFile } from "@varavel/vdl-plugin-sdk";
import type { GeneratorContext } from "../model/types";
import { generateClientFile } from "./files/client/generate";
import { generateServerFile } from "./files/server/generate";

/**
 * Emits the target-specific Go source files for the prepared HTTP-RPC context.
 */
export function generateFiles(context: GeneratorContext): PluginOutputFile[] {
  if (context.procs.length === 0) {
    return [];
  }

  return [
    context.options.target === "client"
      ? generateClientFile(context)
      : generateServerFile(context),
  ];
}
