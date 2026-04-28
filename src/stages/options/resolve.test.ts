import { pluginInput } from "@varavel/vdl-plugin-sdk/testing";
import { describe, expect, it } from "vitest";
import { resolveGeneratorOptions } from "./resolve";

describe("resolveGeneratorOptions", () => {
  it("reports missing required options", () => {
    const result = resolveGeneratorOptions(pluginInput());

    expect(result.options).toBeUndefined();
    expect(result.errors).toHaveLength(1);
    expect(result.errors.map((error) => error.message)).toEqual([
      'Missing or invalid option "target". Use either "client" or "server".',
    ]);
  });

  it("accepts an empty typesImport for same-package generation", () => {
    const result = resolveGeneratorOptions(
      pluginInput({
        options: {
          package: "rpcclient",
          target: "client",
        },
      }),
    );

    expect(result.errors).toEqual([]);
    expect(result.options).toEqual({
      packageName: "rpcclient",
      target: "client",
      typesImport: "",
    });
  });

  it("returns validated options when configuration is correct", () => {
    const result = resolveGeneratorOptions(
      pluginInput({
        options: {
          package: "rpcclient",
          target: "client",
          typesImport: "fixture/internal/types",
        },
      }),
    );

    expect(result.errors).toEqual([]);
    expect(result.options).toEqual({
      packageName: "rpcclient",
      target: "client",
      typesImport: "fixture/internal/types",
    });
  });
});
