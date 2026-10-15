import {
  annotation,
  field,
  objectLiteral,
  objectType,
  pluginInput,
  primitiveType,
  schema,
  stringLiteral,
  typeDef,
} from "@varavel/vdl-plugin-sdk/testing";
import { describe, expect, it } from "vitest";
import { generate } from "./generate";

function createBaseInput() {
  return pluginInput({
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
                  objectType([
                    field("roomId", primitiveType("string")),
                    field("text", primitiveType("string")),
                  ]),
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
            field(
              "events",
              objectType([
                field(
                  "input",
                  objectType([field("roomId", primitiveType("string"))]),
                ),
                field(
                  "output",
                  objectType([field("text", primitiveType("string"))]),
                ),
              ]),
              {
                annotations: [annotation("proc")],
              },
            ),
          ]),
          {
            annotations: [annotation("httpRpc")],
          },
        ),
      ],
    }),
    options: {
      package: "rpcpkg",
      typesImport: "fixture/internal/types",
    },
  });
}

describe("generate", () => {
  it("generates the client target", () => {
    const output = generate({
      ...createBaseInput(),
      options: {
        ...createBaseInput().options,
        target: "client",
      },
    });

    expect(output.errors).toBeUndefined();
    expect(output.files).toHaveLength(1);
    expect(output.files?.[0]?.path).toBe("client.go");
    expect(output.files?.[0]?.content).toContain(
      'vdltypes "fixture/internal/types"',
    );
    expect(output.files?.[0]?.content).toContain('json "encoding/json"');
    expect(output.files?.[0]?.content).toContain(
      "vdltypes.MessagesSendMessageInput",
    );
  });

  it("generates the server target", () => {
    const output = generate({
      ...createBaseInput(),
      options: {
        ...createBaseInput().options,
        target: "server",
      },
    });

    expect(output.errors).toBeUndefined();
    expect(output.files).toHaveLength(1);
    expect(output.files?.[0]?.path).toBe("server.go");
    expect(output.files?.[0]?.content).toContain(
      'vdltypes "fixture/internal/types"',
    );
    expect(output.files?.[0]?.content).toContain('json "encoding/json"');
    expect(output.files?.[0]?.content).toContain(
      "vdltypes.MessagesSendMessageInput",
    );
  });

  it("uses the configured jsonPackage in generated imports", () => {
    const output = generate({
      ...createBaseInput(),
      options: {
        ...createBaseInput().options,
        target: "client",
        jsonPackage: "github.com/goccy/go-json",
      },
    });

    expect(output.errors).toBeUndefined();
    expect(output.files?.[0]?.content).toContain(
      'json "github.com/goccy/go-json"',
    );
    expect(output.files?.[0]?.content).not.toContain('"encoding/json"');
    expect(output.files?.[0]?.content).toContain("json.Unmarshal");
  });

  it.each(["client", "server"] as const)(
    "renders the custom json import alias for the %s target",
    (target) => {
      const output = generate({
        ...createBaseInput(),
        options: {
          ...createBaseInput().options,
          target,
          jsonPackage: "github.com/goccy/go-json",
        },
      });

      expect(output.errors).toBeUndefined();

      const importBlock = output.files?.[0]?.content.match(
        /import \([\s\S]*?\n\)/,
      )?.[0];

      expect(importBlock).toContain('json "github.com/goccy/go-json"');
      expect(importBlock).toContain('vdltypes "fixture/internal/types"');
      expect(importBlock).not.toContain('"encoding/json"');
    },
  );

  it("generates without types import when typesImport is empty", () => {
    const input = createBaseInput();
    const output = generate({
      ...input,
      options: {
        ...input.options,
        target: "client",
        typesImport: "",
      },
    });

    expect(output.errors).toBeUndefined();
    expect(output.files?.[0]?.content).not.toContain('vdltypes "');
    expect(output.files?.[0]?.content).toContain("MessagesSendMessageInput");
    expect(output.files?.[0]?.content).not.toContain(
      "vdltypes.MessagesSendMessageInput",
    );
  });

  it("uses Void for procedures that omit input and output", () => {
    const output = generate(
      pluginInput({
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
        options: {
          package: "clientpkg",
          target: "client",
          typesImport: "fixture/internal/types",
        },
      }),
    );

    expect(output.errors).toBeUndefined();
    expect(output.files?.[0]?.content).toContain(
      "Execute(ctx context.Context, input Void) (Void, error)",
    );
  });

  it("exposes typed input accessors for middleware and interceptors", () => {
    const input = pluginInput({
      ir: schema({
        types: [
          typeDef(
            "Legacy",
            objectType([
              field("old", objectType([]), {
                annotations: [annotation("proc"), annotation("deprecated")],
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
      options: {
        package: "clientpkg",
        target: "client",
        typesImport: "fixture/internal/types",
      },
    });

    const client = generate({
      ...input,
      options: { ...input.options, target: "client" },
    });
    const server = generate({
      ...input,
      options: { ...input.options, target: "server" },
    });

    expect(client.errors).toBeUndefined();
    expect(client.files?.[0]?.content).toContain(
      "func (r RequestInfo) InputAs[O any]() (O, bool)",
    );
    expect(server.errors).toBeUndefined();
    expect(server.files?.[0]?.content).toContain(
      "func (h *HandlerContext[T, I]) InputAs[O any]() (O, bool)",
    );
  });

  it("exposes an HTTPHandler for standard net/http mounting", () => {
    const output = generate(
      pluginInput({
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
        options: {
          package: "serverpkg",
          target: "server",
          typesImport: "fixture/internal/types",
        },
      }),
    );

    expect(output.errors).toBeUndefined();
    expect(output.files?.[0]?.content).toContain(
      "func (s *Server[T]) HTTPHandler(propsFn PropsFunc[T]) http.Handler",
    );
    expect(output.files?.[0]?.content).toContain("ErrRequestBodyTooLarge");
    expect(output.files?.[0]?.content).toContain("SetMaxRequestBodyBytes");
    expect(output.files?.[0]?.content).toContain("unexpected input type %T");
  });

  it("renders Deprecated notes for deprecated services and procedures", () => {
    const input = pluginInput({
      ir: schema({
        types: [
          typeDef(
            "Legacy",
            objectType([
              field("old", objectType([]), {
                annotations: [annotation("proc"), annotation("deprecated")],
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
      options: {
        package: "clientpkg",
        target: "client",
        typesImport: "fixture/internal/types",
      },
    });

    const client = generate({
      ...input,
      options: { ...input.options, target: "client" },
    });
    const server = generate({
      ...input,
      options: { ...input.options, target: "server" },
    });

    for (const output of [client, server]) {
      expect(output.errors).toBeUndefined();
      expect(output.files?.[0]?.content).toContain(
        "Deprecated: Use NewLegacy.",
      );
      expect(output.files?.[0]?.content).toContain(
        "Deprecated: This symbol is deprecated and should not be used in new code.",
      );
    }
  });

  it("returns SDK RPC validation errors before modeling", () => {
    const output = generate(
      pluginInput({
        ir: schema({
          types: [
            typeDef(
              "Broken",
              objectType([
                field(
                  "oops",
                  objectType([field("input", primitiveType("string"))]),
                  {
                    annotations: [annotation("proc")],
                  },
                ),
              ]),
              {
                annotations: [annotation("httpRpc")],
              },
            ),
          ],
        }),
        options: {
          package: "serverpkg",
          target: "server",
          typesImport: "fixture/internal/types",
        },
      }),
    );

    expect(output.files).toBeUndefined();
    expect(output.errors).toEqual([
      expect.objectContaining({
        message:
          'Field "input" in operation "Broken.oops" must be an inline object type when present.',
      }),
    ]);
  });
});
