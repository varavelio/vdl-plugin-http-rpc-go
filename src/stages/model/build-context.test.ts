import {
  annotation,
  field,
  intLiteral,
  objectLiteral,
  objectType,
  pluginInput,
  primitiveType,
  schema,
  stringLiteral,
  typeDef,
} from "@varavel/vdl-plugin-sdk/testing";
import { describe, expect, it } from "vitest";
import { createGeneratorContext } from "./build-context";

describe("createGeneratorContext", () => {
  it("models annotation-based RPC services and procedures", () => {
    const input = pluginInput({
      ir: schema({
        types: [
          typeDef(
            "Messages",
            objectType([
              field(
                "sendMessage",
                objectType([
                  field(
                    "input",
                    objectType([field("text", primitiveType("string"))]),
                  ),
                  field(
                    "output",
                    objectType([field("accepted", primitiveType("bool"))]),
                  ),
                ]),
                {
                  annotations: [
                    annotation("proc"),
                    annotation(
                      "cache",
                      objectLiteral({
                        scope: stringLiteral("room"),
                      }),
                    ),
                  ],
                },
              ),
            ]),
            {
              annotations: [annotation("httpRpc")],
            },
          ),
        ],
      }),
    });

    const result = createGeneratorContext({
      input,
      generatorOptions: {
        jsonPackage: "encoding/json",
        packageName: "client",
        target: "client",
        typesImport: "fixture/internal/types",
      },
    });

    expect(result.errors).toEqual([]);
    expect(result.context?.services).toHaveLength(1);
    expect(result.context?.procs).toHaveLength(1);

    const service = result.context?.services[0];
    const proc = result.context?.procs[0];

    expect(service).toMatchObject({
      name: "Messages",
      goName: "Messages",
    });
    expect(proc).toMatchObject({
      rpcName: "Messages",
      name: "sendMessage",
      goName: "SendMessage",
      procTypeName: "MessagesSendMessage",
      inputTypeName: "MessagesSendMessageInput",
      outputTypeName: "MessagesSendMessageOutput",
    });
    expect(proc?.annotations.map((item) => item.name)).toEqual(["cache"]);
  });

  it("ignores non-proc fields inside httpRpc services", () => {
    const input = pluginInput({
      ir: schema({
        types: [
          typeDef(
            "Mixed",
            objectType([
              field("label", primitiveType("string")),
              field("ping", objectType([]), {
                annotations: [annotation("proc")],
              }),
            ]),
            {
              annotations: [annotation("httpRpc")],
            },
          ),
        ],
      }),
    });

    const result = createGeneratorContext({
      input,
      generatorOptions: {
        jsonPackage: "encoding/json",
        packageName: "client",
        target: "client",
        typesImport: "fixture/internal/types",
      },
    });

    expect(result.errors).toEqual([]);
    expect(result.context?.procs).toHaveLength(1);
    expect(result.context?.procs[0]?.name).toBe("ping");
  });

  it("allows procedures that omit input and output entirely", () => {
    const input = pluginInput({
      ir: schema({
        types: [
          typeDef(
            "Commands",
            objectType([
              field("ping", objectType([]), {
                annotations: [annotation("proc")],
              }),
            ]),
            {
              annotations: [annotation("httpRpc")],
            },
          ),
        ],
      }),
    });

    const result = createGeneratorContext({
      input,
      generatorOptions: {
        jsonPackage: "encoding/json",
        packageName: "client",
        target: "client",
        typesImport: "fixture/internal/types",
      },
    });

    expect(result.errors).toEqual([]);
    expect(result.context?.procs[0]).toMatchObject({
      name: "ping",
      inputTypeName: undefined,
      outputTypeName: undefined,
    });
  });

  it("marks deprecated services and procedures with SDK helpers", () => {
    const input = pluginInput({
      ir: schema({
        types: [
          typeDef(
            "Legacy",
            objectType([
              field("old", objectType([]), {
                annotations: [annotation("proc"), annotation("deprecated")],
              }),
              field("weird", objectType([]), {
                annotations: [
                  annotation("proc"),
                  annotation("deprecated", intLiteral(1)),
                ],
              }),
              field("fresh", objectType([]), {
                annotations: [annotation("proc")],
              }),
            ]),
            {
              annotations: [
                annotation("httpRpc"),
                annotation("deprecated", stringLiteral("Use NewLegacy.")),
              ],
            },
          ),
        ],
      }),
    });

    const result = createGeneratorContext({
      input,
      generatorOptions: {
        jsonPackage: "encoding/json",
        packageName: "client",
        target: "client",
        typesImport: "fixture/internal/types",
      },
    });

    expect(result.errors).toEqual([]);
    expect(result.context?.services[0]?.deprecated).toBe("Use NewLegacy.");
    expect(result.context?.procs[0]?.deprecated).toBe("");
    expect(result.context?.procs[1]?.deprecated).toBe("");
    expect(result.context?.procs[2]?.deprecated).toBeUndefined();
  });
});
