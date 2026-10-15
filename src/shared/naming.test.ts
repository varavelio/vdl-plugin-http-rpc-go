import { describe, expect, it } from "vitest";
import {
  isValidGoPackageName,
  lowerFirst,
  toGoFieldName,
  toGoTypeName,
  toInlineTypeName,
} from "./naming";

describe("lowerFirst", () => {
  it("lowercases the first letter and keeps the rest untouched", () => {
    expect(lowerFirst("Calculator")).toBe("calculator");
    expect(lowerFirst("MyService")).toBe("myService");
    expect(lowerFirst("myProc")).toBe("myProc");
  });

  it("handles empty and single character values", () => {
    expect(lowerFirst("")).toBe("");
    expect(lowerFirst("A")).toBe("a");
  });

  it("leaves non-letters untouched", () => {
    expect(lowerFirst("123Abc")).toBe("123Abc");
  });
});

describe("go naming", () => {
  it("derives exported type and field names", () => {
    expect(toGoTypeName("my_service")).toBe("MyService");
    expect(toGoFieldName("my_field")).toBe("MyField");
  });

  it("keeps exported names valid against Go keywords", () => {
    expect(toGoTypeName("type")).toBe("Type");
  });

  it("derives inline type names like vdl-plugin-go", () => {
    expect(toInlineTypeName("Messages", "send")).toBe("MessagesSend");
    expect(toInlineTypeName("MessagesSend", "input")).toBe("MessagesSendInput");
  });

  it("validates Go package names", () => {
    expect(isValidGoPackageName("client")).toBe(true);
    expect(isValidGoPackageName("Client")).toBe(false);
    expect(isValidGoPackageName("type")).toBe(false);
  });
});
