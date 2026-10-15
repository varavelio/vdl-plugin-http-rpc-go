"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  generate: () => generate2
});
module.exports = __toCommonJS(index_exports);

// node_modules/@varavel/vdl-plugin-sdk/dist/core/errors.js
var _a;
var PluginError = (_a = class extends Error {
  constructor(message, position) {
    super(message);
    this.name = "PluginError";
    this.position = position;
  }
}, __name(_a, "PluginError"), _a);
function fail(message, position) {
  throw new PluginError(message, position);
}
__name(fail, "fail");
function assert(condition, message, position) {
  if (!condition) throw new PluginError(message, position);
}
__name(assert, "assert");

// node_modules/@varavel/vdl-plugin-sdk/dist/core/define-plugin.js
function definePlugin(handler) {
  return (input) => {
    try {
      return handler(input);
    } catch (error) {
      return {
        files: [],
        errors: [toPluginError(error)]
      };
    }
  };
}
__name(definePlugin, "definePlugin");
function toPluginError(error) {
  if (error instanceof PluginError) return {
    message: error.message,
    position: error.position
  };
  if (error instanceof Error) return { message: error.message };
  return { message: "An unknown generation error occurred." };
}
__name(toPluginError, "toPluginError");

// node_modules/@varavel/vdl-plugin-sdk/dist/_virtual/_@oxc-project_runtime@0.154.0/helpers/esm/typeof.js
function _typeof(o) {
  "@babel/helpers - typeof";
  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof(o);
}
__name(_typeof, "_typeof");

// node_modules/@varavel/vdl-plugin-sdk/dist/_virtual/_@oxc-project_runtime@0.154.0/helpers/esm/toPrimitive.js
function toPrimitive(t, r) {
  if ("object" != _typeof(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
__name(toPrimitive, "toPrimitive");

// node_modules/@varavel/vdl-plugin-sdk/dist/_virtual/_@oxc-project_runtime@0.154.0/helpers/esm/toPropertyKey.js
function toPropertyKey(t) {
  var i = toPrimitive(t, "string");
  return "symbol" == _typeof(i) ? i : i + "";
}
__name(toPropertyKey, "toPropertyKey");

// node_modules/@varavel/vdl-plugin-sdk/dist/_virtual/_@oxc-project_runtime@0.154.0/helpers/esm/defineProperty.js
function _defineProperty(e, r, t) {
  return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: true,
    configurable: true,
    writable: true
  }) : e[r] = t, e;
}
__name(_defineProperty, "_defineProperty");

// node_modules/@varavel/vdl-plugin-sdk/dist/_virtual/_@oxc-project_runtime@0.154.0/helpers/esm/objectSpread2.js
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
__name(ownKeys, "ownKeys");
function _objectSpread2(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
      _defineProperty(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
__name(_objectSpread2, "_objectSpread2");

// node_modules/@varavel/vdl-plugin-sdk/dist/utils/rpc/assert-valid-ir-for-http-rpc.js
var HTTP_RPC_ANNOTATION_NAME = "httpRpc";
var PROC_ANNOTATION_NAME = "proc";
function assertValidIrForHttpRpc(ir) {
  const rpcTypes = ir.types.filter((typeDef) => {
    return hasAnnotation(typeDef.annotations, HTTP_RPC_ANNOTATION_NAME);
  });
  for (const rpcType of rpcTypes) assertValidHttpRpcType(rpcType);
}
__name(assertValidIrForHttpRpc, "assertValidIrForHttpRpc");
function assertValidHttpRpcType(typeDef) {
  var _typeDef$typeRef$obje;
  const rpcAnnotation = findAnnotation(typeDef.annotations, HTTP_RPC_ANNOTATION_NAME);
  if ((rpcAnnotation === null || rpcAnnotation === void 0 ? void 0 : rpcAnnotation.argument) !== void 0) fail(`Type ${JSON.stringify(typeDef.name)} annotation @httpRpc must not have arguments.`, rpcAnnotation.position);
  assert(typeDef.typeRef.kind === "object", `Type ${JSON.stringify(typeDef.name)} is annotated with @httpRpc and must be an object type.`, typeDef.position);
  const fields = (_typeDef$typeRef$obje = typeDef.typeRef.objectFields) !== null && _typeDef$typeRef$obje !== void 0 ? _typeDef$typeRef$obje : [];
  for (const field of fields) assertValidHttpRpcOperationField(typeDef, field);
}
__name(assertValidHttpRpcType, "assertValidHttpRpcType");
function assertValidHttpRpcOperationField(rpcType, field) {
  const procAnnotation = findAnnotation(field.annotations, PROC_ANNOTATION_NAME);
  if (!procAnnotation) return;
  if (procAnnotation.argument !== void 0) fail(`Field ${JSON.stringify(`${rpcType.name}.${field.name}`)} annotation @proc must not have arguments.`, procAnnotation.position);
  assert(field.typeRef.kind === "object", `Field ${JSON.stringify(`${rpcType.name}.${field.name}`)} is annotated with @proc and must be an inline object type.`, field.position);
  const inputField = findFieldByName(field.typeRef.objectFields, "input");
  const outputField = findFieldByName(field.typeRef.objectFields, "output");
  if (inputField && inputField.typeRef.kind !== "object") fail(`Field "input" in operation ${JSON.stringify(`${rpcType.name}.${field.name}`)} must be an inline object type when present.`, withFallbackFile(inputField.position, field.position));
  if (outputField && outputField.typeRef.kind !== "object") fail(`Field "output" in operation ${JSON.stringify(`${rpcType.name}.${field.name}`)} must be an inline object type when present.`, withFallbackFile(outputField.position, field.position));
}
__name(assertValidHttpRpcOperationField, "assertValidHttpRpcOperationField");
function hasAnnotation(annotations, name) {
  return annotations.some((annotation) => annotation.name === name);
}
__name(hasAnnotation, "hasAnnotation");
function findAnnotation(annotations, name) {
  return annotations.find((annotation) => annotation.name === name);
}
__name(findAnnotation, "findAnnotation");
function findFieldByName(fields, name) {
  return fields === null || fields === void 0 ? void 0 : fields.find((field) => field.name === name);
}
__name(findFieldByName, "findFieldByName");
function withFallbackFile(primary, fallback) {
  if (primary.file.length > 0 || fallback.file.length === 0) return primary;
  return _objectSpread2(_objectSpread2({}, primary), {}, { file: fallback.file });
}
__name(withFallbackFile, "withFallbackFile");

// src/shared/errors.ts
var _GenerationError = class _GenerationError extends Error {
  /**
   * Creates a generation error with an optional VDL source position.
   */
  constructor(message, position) {
    super(message);
    this.name = "GenerationError";
    this.position = position;
  }
};
__name(_GenerationError, "GenerationError");
var GenerationError = _GenerationError;
function toPluginOutputError(error) {
  if (error instanceof GenerationError) {
    return {
      message: error.message,
      position: error.position
    };
  }
  if (error instanceof Error) {
    const position = error.position;
    return position ? {
      message: error.message,
      position
    } : {
      message: error.message
    };
  }
  return {
    message: "An unknown generation error occurred."
  };
}
__name(toPluginOutputError, "toPluginOutputError");

// node_modules/@varavel/gen/dist/index.js
var _a2;
var Generator = (_a2 = class {
  constructor() {
    this.chunks = [];
    this.indentLevel = 0;
    this.indentUnit = "  ";
    this.atStartOfLine = true;
  }
  /**
  * Uses spaces for one indent level.
  *
  * Example: `withSpaces(2)` makes each level equal to two spaces.
  */
  withSpaces(spaces) {
    this.indentUnit = " ".repeat(Math.max(0, spaces));
    return this;
  }
  /**
  * Uses one tab character for each indent level.
  */
  withTabs() {
    this.indentUnit = "	";
    return this;
  }
  /**
  * Moves one indentation level deeper for future writes.
  */
  indent() {
    this.indentLevel++;
    return this;
  }
  /**
  * Moves one indentation level up for future writes.
  *
  * If already at zero, it stays at zero.
  */
  dedent() {
    if (this.indentLevel > 0) this.indentLevel--;
    return this;
  }
  /**
  * Writes text exactly as given.
  *
  * It does not add indentation or newlines.
  */
  raw(content) {
    if (content.length === 0) return this;
    this.chunks.push(content);
    this.atStartOfLine = content.endsWith("\n");
    return this;
  }
  /**
  * Writes exactly one newline character.
  */
  break() {
    this.chunks.push("\n");
    this.atStartOfLine = true;
    return this;
  }
  /**
  * Writes text on the current line.
  *
  * It adds indentation only when writing at the start of a line.
  */
  inline(content) {
    if (content.length === 0) return this;
    const sublines = content.split("\n");
    for (let index = 0; index < sublines.length; index++) {
      var _sublines$index;
      const subline = (_sublines$index = sublines[index]) !== null && _sublines$index !== void 0 ? _sublines$index : "";
      if (index > 0) {
        this.chunks.push("\n");
        this.atStartOfLine = true;
      }
      if (subline.length > 0) {
        if (this.atStartOfLine) this.chunks.push(this.indentUnit.repeat(this.indentLevel));
        this.chunks.push(subline);
        this.atStartOfLine = false;
      }
    }
    if (content.endsWith("\n")) this.atStartOfLine = true;
    return this;
  }
  /**
  * Same as `inline` but adds one newline at the end of the content.
  */
  line(content) {
    this.inline(content);
    this.break();
    return this;
  }
  /**
  * Runs a callback one level deeper, then restores the previous level.
  */
  block(run) {
    this.indent();
    try {
      run();
    } finally {
      this.dedent();
    }
    return this;
  }
  /**
  * Returns all generated content as a single string.
  */
  toString() {
    return this.chunks.join("");
  }
}, __name(_a2, "Generator"), _a2);
function newGenerator() {
  return new Generator();
}
__name(newGenerator, "newGenerator");

// node_modules/@varavel/vdl-plugin-sdk/dist/utils/strings/words.js
var ACRONYM_TO_CAPITALIZED_WORD_BOUNDARY_RE = /([A-Z]+)([A-Z][a-z])/g;
var LOWERCASE_OR_DIGIT_TO_UPPERCASE_BOUNDARY_RE = /([a-z0-9])([A-Z])/g;
var NON_ALPHANUMERIC_SEQUENCE_RE = /[^A-Za-z0-9]+/g;
var WHITESPACE_SEQUENCE_RE = /\s+/;
function words(str) {
  const normalized = str.replace(ACRONYM_TO_CAPITALIZED_WORD_BOUNDARY_RE, "$1 $2").replace(LOWERCASE_OR_DIGIT_TO_UPPERCASE_BOUNDARY_RE, "$1 $2").replace(NON_ALPHANUMERIC_SEQUENCE_RE, " ").trim();
  return normalized.length === 0 ? [] : normalized.split(WHITESPACE_SEQUENCE_RE);
}
__name(words, "words");

// node_modules/@varavel/vdl-plugin-sdk/dist/utils/strings/pascal-case.js
function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}
__name(capitalize, "capitalize");
function pascalCase(str) {
  return words(str).map(capitalize).join("");
}
__name(pascalCase, "pascalCase");

// node_modules/@varavel/vdl-plugin-sdk/dist/node_modules/dedent/dist/dedent.js
function ownKeys2(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    enumerableOnly && (symbols = symbols.filter(function(sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    })), keys.push.apply(keys, symbols);
  }
  return keys;
}
__name(ownKeys2, "ownKeys");
function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = null != arguments[i] ? arguments[i] : {};
    i % 2 ? ownKeys2(Object(source), true).forEach(function(key) {
      _defineProperty2(target, key, source[key]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys2(Object(source)).forEach(function(key) {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
  }
  return target;
}
__name(_objectSpread, "_objectSpread");
function _defineProperty2(obj, key, value) {
  key = _toPropertyKey(key);
  if (key in obj) Object.defineProperty(obj, key, {
    value,
    enumerable: true,
    configurable: true,
    writable: true
  });
  else obj[key] = value;
  return obj;
}
__name(_defineProperty2, "_defineProperty");
function _toPropertyKey(arg) {
  var key = _toPrimitive(arg, "string");
  return typeof key === "symbol" ? key : String(key);
}
__name(_toPropertyKey, "_toPropertyKey");
function _toPrimitive(input, hint) {
  if (typeof input !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== void 0) {
    var res = prim.call(input, hint || "default");
    if (typeof res !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
__name(_toPrimitive, "_toPrimitive");
var dedent = createDedent({});
function createDedent(options) {
  dedent3.withOptions = (newOptions) => createDedent(_objectSpread(_objectSpread({}, options), newOptions));
  return dedent3;
  function dedent3(strings, ...values) {
    const raw = typeof strings === "string" ? [strings] : strings.raw;
    const { alignValues = false, escapeSpecialCharacters = Array.isArray(strings), trimWhitespace = true } = options;
    let result = "";
    for (let i = 0; i < raw.length; i++) {
      let next = raw[i];
      if (escapeSpecialCharacters) next = next.replace(/\\\n[ \t]*/g, "").replace(/\\`/g, "`").replace(/\\\$/g, "$").replace(/\\\{/g, "{");
      result += next;
      if (i < values.length) {
        const value = alignValues ? alignValue(values[i], result) : values[i];
        result += value;
      }
    }
    const lines = result.split("\n");
    let mindent = null;
    for (const l of lines) {
      const m = l.match(/^(\s+)\S+/);
      if (m) {
        const indent2 = m[1].length;
        if (!mindent) mindent = indent2;
        else mindent = Math.min(mindent, indent2);
      }
    }
    if (mindent !== null) {
      const m = mindent;
      result = lines.map((l) => l[0] === " " || l[0] === "	" ? l.slice(m) : l).join("\n");
    }
    if (trimWhitespace) result = result.trim();
    if (escapeSpecialCharacters) result = result.replace(/\\n/g, "\n").replace(/\\t/g, "	").replace(/\\r/g, "\r").replace(/\\v/g, "\v").replace(/\\b/g, "\b").replace(/\\f/g, "\f").replace(/\\0/g, "\0").replace(/\\x([\da-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\u\{([\da-fA-F]{1,6})\}/g, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/\\u([\da-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
    if (typeof Bun !== "undefined") result = result.replace(/\\u(?:\{([\da-fA-F]{1,6})\}|([\da-fA-F]{4}))/g, (_, braced, unbraced) => {
      var _ref;
      const hex = (_ref = braced !== null && braced !== void 0 ? braced : unbraced) !== null && _ref !== void 0 ? _ref : "";
      return String.fromCodePoint(parseInt(hex, 16));
    });
    return result;
  }
  __name(dedent3, "dedent");
}
__name(createDedent, "createDedent");
function alignValue(value, precedingText) {
  if (typeof value !== "string" || !value.includes("\n")) return value;
  const indentMatch = precedingText.slice(precedingText.lastIndexOf("\n") + 1).match(/^(\s+)/);
  if (indentMatch) {
    const indent2 = indentMatch[1];
    return value.replace(/\n/g, `
${indent2}`);
  }
  return value;
}
__name(alignValue, "alignValue");

// node_modules/@varavel/vdl-plugin-sdk/dist/utils/strings/dedent.js
function dedent2(input) {
  return dedent(input);
}
__name(dedent2, "dedent");

// node_modules/@varavel/vdl-plugin-sdk/dist/utils/strings/limit-blank-lines.js
var cache = /* @__PURE__ */ new Map();
function limitBlankLines(str, maxConsecutive = 0) {
  const limit = Math.max(0, maxConsecutive);
  let regex = cache.get(limit);
  if (!regex) {
    regex = new RegExp(`(\\r?\\n\\s*){${limit + 2},}`, "g");
    cache.set(limit, regex);
  }
  return str.replace(regex, "\n".repeat(limit + 1));
}
__name(limitBlankLines, "limitBlankLines");

// src/shared/naming.ts
var GO_KEYWORDS = /* @__PURE__ */ new Set([
  "break",
  "case",
  "chan",
  "const",
  "continue",
  "default",
  "defer",
  "else",
  "fallthrough",
  "for",
  "func",
  "go",
  "goto",
  "if",
  "import",
  "interface",
  "map",
  "package",
  "range",
  "return",
  "select",
  "struct",
  "switch",
  "type",
  "var"
]);
var GO_PACKAGE_RE = /^[a-z_][a-z0-9_]*$/;
function isGoKeyword(value) {
  return GO_KEYWORDS.has(value);
}
__name(isGoKeyword, "isGoKeyword");
function isValidGoPackageName(value) {
  return GO_PACKAGE_RE.test(value) && !isGoKeyword(value);
}
__name(isValidGoPackageName, "isValidGoPackageName");
function toGoTypeName(value) {
  return escapeGoIdentifier(pascalCase(value));
}
__name(toGoTypeName, "toGoTypeName");
function toGoFieldName(value) {
  return escapeGoIdentifier(pascalCase(value));
}
__name(toGoFieldName, "toGoFieldName");
function lowerFirst(value) {
  if (value.length === 0) {
    return value;
  }
  const [first, ...rest] = Array.from(value);
  return first.toLowerCase() + rest.join("");
}
__name(lowerFirst, "lowerFirst");
function toInlineTypeName(parentTypeName, fieldName) {
  return `${parentTypeName}${toGoFieldName(fieldName)}`;
}
__name(toInlineTypeName, "toInlineTypeName");
function escapeGoIdentifier(value) {
  return isGoKeyword(value) ? `${value}_` : value;
}
__name(escapeGoIdentifier, "escapeGoIdentifier");

// src/stages/emit/shared/helpers.ts
function createGoFile(path, header, body) {
  let content = "";
  content = joinSections([header, body]);
  content = limitBlankLines(content, 1);
  return {
    path,
    content
  };
}
__name(createGoFile, "createGoFile");
function joinSections(sections) {
  return `${sections.filter(Boolean).join("\n\n").trim()}
`;
}
__name(joinSections, "joinSections");
function indent(value, depth = 1) {
  const prefix = "	".repeat(depth);
  return value.split("\n").map((line) => line.length > 0 ? `${prefix}${line}` : line).join("\n");
}
__name(indent, "indent");

// src/stages/emit/shared/renderers.ts
function renderGoString(value) {
  return JSON.stringify(value);
}
__name(renderGoString, "renderGoString");
function renderAnnotationsLiteral(annotations) {
  if (annotations.length === 0) {
    return "[]Annotation{}";
  }
  const items = annotations.map((annotation) => {
    return [
      "{",
      indent(
        [
          `Name: ${renderGoString(annotation.name)},`,
          `Argument: ${renderLiteralValue(annotation.argument)},`
        ].join("\n")
      ),
      "},"
    ].join("\n");
  });
  return ["[]Annotation{", indent(items.join("\n")), "}"].join("\n");
}
__name(renderAnnotationsLiteral, "renderAnnotationsLiteral");
function renderLiteralValue(value) {
  var _a3, _b, _c, _d, _e;
  if (!value) {
    return "nil";
  }
  switch (value.kind) {
    case "string":
      return renderGoString((_a3 = value.stringValue) != null ? _a3 : "");
    case "int":
      return `int64(${(_b = value.intValue) != null ? _b : 0})`;
    case "float":
      return `float64(${String((_c = value.floatValue) != null ? _c : 0)})`;
    case "bool":
      return value.boolValue ? "true" : "false";
    case "array":
      return renderArrayLiteral((_d = value.arrayItems) != null ? _d : []);
    case "object":
      return renderObjectLiteral((_e = value.objectEntries) != null ? _e : []);
    default:
      return "nil";
  }
}
__name(renderLiteralValue, "renderLiteralValue");
function renderArrayLiteral(items) {
  if (items.length === 0) {
    return "[]any{}";
  }
  return [
    "[]any{",
    indent(items.map((item) => `${renderLiteralValue(item)},`).join("\n")),
    "}"
  ].join("\n");
}
__name(renderArrayLiteral, "renderArrayLiteral");
function renderObjectLiteral(entries) {
  if (entries.length === 0) {
    return "map[string]any{}";
  }
  return [
    "map[string]any{",
    indent(
      entries.map(
        (entry) => `${renderGoString(entry.key)}: ${renderLiteralValue(entry.value)},`
      ).join("\n")
    ),
    "}"
  ].join("\n");
}
__name(renderObjectLiteral, "renderObjectLiteral");
function renderCommentBlock(options) {
  const lines = [options.summary];
  if (options.doc) {
    lines.push("", ...options.doc.split("\n"));
  }
  if (options.deprecated !== void 0) {
    const description = options.deprecated.length > 0 ? options.deprecated : "This symbol is deprecated and should not be used in new code.";
    lines.push("", `Deprecated: ${description}`);
  }
  return lines.map((line) => `// ${line}`).join("\n");
}
__name(renderCommentBlock, "renderCommentBlock");

// src/stages/emit/shared/catalog.ts
var CATALOG_HEADER = dedent2(
  /* go */
  `
  // -----------------------------------------------------------------------------
  // RPC Catalog
  // -----------------------------------------------------------------------------
`
);
function renderCatalog(context) {
  return joinSections([
    CATALOG_HEADER,
    renderPathCatalog(context.services),
    renderProcedureCatalog("VDLProcedures", context.procedures)
  ]);
}
__name(renderCatalog, "renderCatalog");
function renderProcedureCatalog(constName, procedures) {
  const summary = "VDLProcedures contains every generated procedure definition.";
  if (procedures.length === 0) {
    const g2 = newGenerator();
    g2.line(renderCommentBlock({ summary }));
    g2.line(`var ${constName} = []ProcedureDefinition{}`);
    return g2.toString();
  }
  const entries = procedures.map((procedure) => {
    const g2 = newGenerator();
    g2.line("{");
    g2.block(() => {
      g2.line(`RPCName: ${renderGoString(procedure.rpcName)},`);
      g2.line(`RPCRoute: ${renderGoString(lowerFirst(procedure.rpcName))},`);
      g2.line(`Name: ${renderGoString(procedure.name)},`);
      g2.line(
        `Path: ${renderGoString(`/${lowerFirst(procedure.rpcName)}/${procedure.name}`)},`
      );
      g2.line(
        `Annotations: ${renderAnnotationsLiteral(procedure.annotations)},`
      );
    });
    g2.line("},");
    return g2.toString().trim();
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
__name(renderProcedureCatalog, "renderProcedureCatalog");
function renderPathCatalog(services) {
  const g = newGenerator();
  g.line(
    renderCommentBlock({
      summary: "VDLPaths contains the generated path catalog for every procedure."
    })
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
            `${procedure.goName}: ${renderGoString(`/${lowerFirst(service.name)}/${procedure.name}`)},`
          );
        }
      });
      g.line("},");
    }
  });
  g.line("}");
  return joinSections([g.toString()]);
}
__name(renderPathCatalog, "renderPathCatalog");

// src/stages/emit/shared/runtime.ts
function renderCoreRuntime() {
  return dedent2(
    /* go */
    `
    // -----------------------------------------------------------------------------
    // RPC Core Types
    // -----------------------------------------------------------------------------

    // Annotation represents procedure-level annotation metadata preserved from VDL.
    type Annotation struct {
      // Name is the annotation identifier without the @ prefix.
      Name string
      // Argument contains the resolved annotation payload when one was declared.
      Argument any
    }

    // ProcedureDefinition describes a generated procedure.
    type ProcedureDefinition struct {
      // RPCName is the VDL service name that owns the procedure.
      RPCName string
      // RPCRoute is the lowerFirst transport segment precomputed by the generator.
      RPCRoute string
      // Name is the VDL field name of the procedure.
      Name string
      // Path is the VPP-2 transport path precomputed by the generator.
      Path string
      // Annotations contains every non-marker annotation declared on the procedure.
      Annotations []Annotation
    }

    // cloneAnnotations returns a shallow copy of the given annotations slice.
    func cloneAnnotations(annotations []Annotation) []Annotation {
      if len(annotations) == 0 {
        return nil
      }
      clone := make([]Annotation, len(annotations))
      copy(clone, annotations)
      return clone
    }

    // Void represents the absence of an input or output payload.
    type Void struct{}

    // Response represents the response of a VDL call.
    type Response[T any] struct {
      Ok     bool  \`json:"ok"\`
      Output T     \`json:"output,omitempty,omitzero"\`
      Error  Error \`json:"error,omitzero"\`
    }

    // Write writes the response as JSON to the provided writer.
    func (r Response[T]) Write(w io.Writer) error {
      return json.NewEncoder(w).Encode(r)
    }

    // String returns the response as a JSON string.
    func (r Response[T]) String() string {
      encoded, err := json.Marshal(r)
      if err != nil {
        return fmt.Sprintf(\`{"ok":false,"error":{"message":%q}}\`, "failed to marshal response: "+err.Error())
      }
      return string(encoded)
    }

    // Bytes returns the response as a JSON byte slice.
    func (r Response[T]) Bytes() []byte {
      return []byte(r.String())
    }

    // Error represents a standardized error in the VDL system.
    //
    // It provides structured information about errors that occur within the system,
    // enabling consistent error handling across servers and clients.
    //
    // Fields:
    //   - Message: A human-readable description of the error.
    //   - Category: Optional. Categorizes the error by its nature or source (e.g., "ValidationError", "DatabaseError").
    //   - Code: Optional. A machine-readable identifier for the specific error condition (e.g., "INVALID_EMAIL").
    //   - Details: Optional. Additional information about the error.
    //
    // The struct implements the error interface.
    type Error struct {
      // Message provides a human-readable description of the error.
      //
      // This message can be displayed to end-users or used for logging and debugging purposes.
      //
      // Use Cases:
      //   1. Message can be directly shown to the user to inform them of the issue.
      //   2. Developers can use Message in logs to diagnose problems during development or in production.
      Message string \`json:"message"\`
      // Category categorizes the error by its nature or source.
      //
      // Examples:
      //   - "ValidationError" for input validation errors.
      //   - "DatabaseError" for errors originating from database operations.
      //   - "AuthenticationError" for authentication-related issues.
      //
      // Use Cases:
      //   1. In middleware, you can use Category to determine how to handle the error.
      //      For instance, you might log "InternalError" types and return a generic message to the client.
      //   2. Clients can inspect the Category to decide whether to prompt the user for action,
      //      such as re-authentication if the Category is "AuthenticationError".
      Category string \`json:"category,omitzero"\`
      // Code is a machine-readable identifier for the specific error condition.
      //
      // Examples:
      //   - "INVALID_EMAIL" when an email address fails validation.
      //   - "USER_NOT_FOUND" when a requested user does not exist.
      //   - "RATE_LIMIT_EXCEEDED" when a client has made too many requests.
      //
      // Use Cases:
      //   1. Clients can map Codes to localized error messages for internationalization (i18n),
      //      displaying appropriate messages based on the user's language settings.
      //   2. Clients or middleware can implement specific logic based on the Code,
      //      such as retry mechanisms for "TEMPORARY_FAILURE" or showing captcha for "RATE_LIMIT_EXCEEDED".
      Code string \`json:"code,omitzero"\`
      // Details contains optional additional information about the error.
      //
      // This field can include any relevant data that provides more context about the error.
      // The contents should be serializable to JSON.
      //
      // Use Cases:
      //   1. Providing field-level validation errors, e.g., Details could be:
      //      {"fields": {"email": "Email is invalid", "password": "Password is too short"}}
      //   2. Including diagnostic information such as timestamps, request IDs, or stack traces
      //      (ensure sensitive information is not exposed to clients).
      Details map[string]any \`json:"details,omitempty"\`
    }

    // Error implements the standard error interface.
    func (e Error) Error() string {
      return e.Message
    }

    // String implements fmt.Stringer.
    func (e Error) String() string {
      return e.Message
    }

    // Is reports whether the target error matches this error.
    //
    // It checks if the target is of type Error (or *Error) and compares
    // their Code and Message fields.
    //
    // Matching Logic:
    //  1. If both errors have a Code, they match if the Codes are identical.
    //  2. If one or both lack a Code, they match if the Messages are identical.
    //  3. Details and Category are ignored for comparison to avoid issues with non-comparable map types.
    func (e Error) Is(target error) bool {
      var t Error
      switch err := target.(type) {
      case Error:
        t = err
      case *Error:
        t = *err
      default:
        return false
      }
      if e.Code != "" && t.Code != "" {
        return e.Code == t.Code
      }
      return e.Message == t.Message
    }

    // ToJSON returns the Error as a JSON-formatted string including all its fields.
    // This is useful for logging and debugging purposes.
    func (e Error) ToJSON() string {
      b, err := json.Marshal(e)
      if err != nil {
        return fmt.Sprintf(
          \`{"message":%q,"details":{"message":%q}}\`,
          "failed to marshal VDL Error: "+err.Error(), e.Message,
        )
      }
      return string(b)
    }

    // ToError converts any error into an Error.
    //
    // If the provided error is already a Error, it returns it as is.
    // Otherwise, it wraps the error message into a new Error.
    //
    // This function ensures that all errors conform to the Error structure,
    // facilitating consistent error handling across the system.
    func ToError(err error) Error {
      switch e := err.(type) {
      case Error:
        return e
      case *Error:
        return *e
      default:
        return Error{
          Message: err.Error(),
        }
      }
    }
  `
  );
}
__name(renderCoreRuntime, "renderCoreRuntime");

// src/stages/emit/files/client/runtime.ts
var CLIENT_RUNTIME = dedent2(
  /* go */
  `
	// -----------------------------------------------------------------------------
	// Client Types
	// -----------------------------------------------------------------------------

	// RequestInfo contains information about the RPC request currently being executed.
	//
	// It is passed through interceptors and retry deciders so callers can
	// inspect the targeted RPC, procedure, request payload, and the
	// non-marker annotations declared on the VDL procedure.
	type RequestInfo struct {
		RPCName string
		ProcedureName string
		Input any
		Annotations []Annotation
	}

	// RetryDecisionContext contains the information passed to a retry decider.
	//
	// The generated client evaluates this context after each failed attempt so
	// callers can decide whether the request should be retried.
	type RetryDecisionContext struct {
		Request RequestInfo
		Attempt int
		ResponseStatus int
		Error error
	}

	// RetryDecider determines whether a failed procedure attempt should be retried.
	type RetryDecider func(ctx context.Context, info RetryDecisionContext) bool

	// RetryConfig defines retry behavior for generated procedure calls.
	//
	// Parameters:
	//   - MaxAttempts: Maximum number of retry attempts (default: 1)
	//   - InitialDelay: Initial delay between retries (default: 0)
	//   - MaxDelay: Maximum delay between retries (default: 0)
	//   - DelayMultiplier: Cumulative multiplier applied to InitialDelay on each retry (default: 1.0)
	//   - Jitter: Randomness factor used to avoid synchronized retries (default: 0.2)
	//   - ShouldRetry: Optional callback that can override the default retry decision function
	type RetryConfig struct {
		MaxAttempts int
		InitialDelay time.Duration
		MaxDelay time.Duration
		DelayMultiplier float64
		Jitter float64
		ShouldRetry RetryDecider
	}

	// TimeoutConfig defines timeout behavior for procedure calls.
	type TimeoutConfig struct {
		// Request Timeout (default: 30 seconds)
		Timeout time.Duration
	}

	// HeaderProvider receives the current headers and mutates them in place.
	//
	// It is called before every request, including retries.
	// If an error is returned, the request is aborted.
	type HeaderProvider func(ctx context.Context, h http.Header) error

	// Invoker is the final step in the interceptor chain that performs the actual request.
	type Invoker func(ctx context.Context, req RequestInfo) (Response[json.RawMessage], error)

	// Interceptor is middleware that wraps request execution.
	type Interceptor func(ctx context.Context, req RequestInfo, next Invoker) (Response[json.RawMessage], error)

  // -----------------------------------------------------------------------------
  // Internal Client Implementation
  // -----------------------------------------------------------------------------

	// internalClient is the core engine used by the generated client abstraction.
	//
	// It is safe for concurrent use and can be reused across procedure calls. The zero value is not usable; use newInternalClient.
	//
	// The zero value is not usable \u2013 use newInternalClient to construct one.
	type internalClient struct {
		// Immutable after construction.
		baseURL string
		httpClient *http.Client
		procedureDefs map[string]map[string]ProcedureDefinition

		// Dynamic components
		headerProviders []HeaderProvider
		interceptors []Interceptor

		// RPC specific header providers
		rpcHeaderProviders map[string][]HeaderProvider

		// Default Configurations
		globalRetryConf *RetryConfig
		globalTimeoutConf *TimeoutConfig

		// Per-RPC Default Configurations
		rpcRetryConf map[string]*RetryConfig
		rpcTimeoutConf map[string]*TimeoutConfig

		// mu protects concurrent access to the configuration maps
		mu sync.RWMutex
	}

	// internalClientOption configures an internal client during construction.
	type internalClientOption func(*internalClient)

	// withHTTPClient supplies a custom HTTP client implementation.
	func withHTTPClient(client *http.Client) internalClientOption {
		return func(value *internalClient) {
			if client != nil {
				value.httpClient = client
			}
		}
	}

	// withGlobalHeader registers a static header for every request.
	func withGlobalHeader(key string, value string) internalClientOption {
		return func(client *internalClient) {
			client.headerProviders = append(client.headerProviders, func(_ context.Context, h http.Header) error {
				h.Set(key, value)
				return nil
			})
		}
	}

	// withHeaderProvider registers a dynamic header provider.
	func withHeaderProvider(provider HeaderProvider) internalClientOption {
		return func(client *internalClient) {
			client.headerProviders = append(client.headerProviders, provider)
		}
	}

	// withInterceptor adds a transport interceptor.
	func withInterceptor(interceptor Interceptor) internalClientOption {
		return func(client *internalClient) {
			client.interceptors = append(client.interceptors, interceptor)
		}
	}

	// withGlobalRetryConfig sets the global default retry configuration.
	func withGlobalRetryConfig(conf RetryConfig) internalClientOption {
		return func(client *internalClient) {
			client.globalRetryConf = &conf
		}
	}

	// withGlobalTimeoutConfig sets the global default timeout configuration.
	func withGlobalTimeoutConfig(conf TimeoutConfig) internalClientOption {
		return func(client *internalClient) {
			client.globalTimeoutConf = &conf
		}
	}

	// newInternalClient creates a new internalClient capable of talking to the VDL server.
	//
	// The caller can optionally pass functional options to customize transport
	// behavior, headers, interceptors, and retry policies.
	func newInternalClient(baseURL string, procDefs []ProcedureDefinition, opts ...internalClientOption) *internalClient {
		procedureDefs := make(map[string]map[string]ProcedureDefinition)

		ensureRPC := func(rpcName string) {
			if _, ok := procedureDefs[rpcName]; !ok {
				procedureDefs[rpcName] = make(map[string]ProcedureDefinition)
			}
		}

		for _, def := range procDefs {
			ensureRPC(def.RPCName)
			procedureDefs[def.RPCName][def.Name] = def
		}


		client := &internalClient{
			baseURL: strings.TrimRight(baseURL, "/"),
			httpClient: http.DefaultClient,
			procedureDefs: procedureDefs,
			headerProviders: []HeaderProvider{},
			interceptors: []Interceptor{},
			rpcHeaderProviders: make(map[string][]HeaderProvider),
			rpcRetryConf: make(map[string]*RetryConfig),
			rpcTimeoutConf: make(map[string]*TimeoutConfig),
		}

		// Apply functional options.
		for _, opt := range opts {
			opt(client)
		}

		return client
	}

	// setRPCRetryConfig sets the default retry configuration for a specific RPC service.
	func (c *internalClient) setRPCRetryConfig(rpcName string, conf RetryConfig) {
		c.mu.Lock()
		defer c.mu.Unlock()
		c.rpcRetryConf[rpcName] = &conf
	}

	// setRPCTimeoutConfig sets the default timeout configuration for a specific RPC service.
	func (c *internalClient) setRPCTimeoutConfig(rpcName string, conf TimeoutConfig) {
		c.mu.Lock()
		defer c.mu.Unlock()
		c.rpcTimeoutConf[rpcName] = &conf
	}

	// setRPCHeaderProvider adds a header provider for a specific RPC service.
	func (c *internalClient) setRPCHeaderProvider(rpcName string, provider HeaderProvider) {
		c.mu.Lock()
		defer c.mu.Unlock()
		c.rpcHeaderProviders[rpcName] = append(c.rpcHeaderProviders[rpcName], provider)
	}

	// mergeRetryConfig resolves retry configuration using this precedence:
	// procedure override > RPC override > global override > default.
	func (c *internalClient) mergeRetryConfig(rpcName string, opConf *RetryConfig) *RetryConfig {
		if opConf != nil {
			return opConf
		}
		c.mu.RLock()
		defer c.mu.RUnlock()
		if rpcConf, ok := c.rpcRetryConf[rpcName]; ok {
			return rpcConf
		}
		if c.globalRetryConf != nil {
			return c.globalRetryConf
		}
		return &RetryConfig{
			MaxAttempts: 1,
			InitialDelay: 0,
			MaxDelay: 0,
			DelayMultiplier: 1.0,
			Jitter: 0.2,
		}
	}

	// mergeTimeoutConfig resolves timeout configuration using this precedence:
	// procedure override > RPC override > global override > default.
	func (c *internalClient) mergeTimeoutConfig(rpcName string, opConf *TimeoutConfig) *TimeoutConfig {
		if opConf != nil {
			return opConf
		}
		c.mu.RLock()
		defer c.mu.RUnlock()

		if rpcConf, ok := c.rpcTimeoutConf[rpcName]; ok {
			return rpcConf
		}
		if c.globalTimeoutConf != nil {
			return c.globalTimeoutConf
		}
		return &TimeoutConfig{Timeout: 30 * time.Second}
	}

	// executeChain builds the interceptor chain and executes the final invoker.
	func (c *internalClient) executeChain(ctx context.Context, req RequestInfo, final Invoker) (Response[json.RawMessage], error) {
		chain := final
		for index := len(c.interceptors) - 1; index >= 0; index-- {
			middleware := c.interceptors[index]
			next := chain
			chain = func(callCtx context.Context, callReq RequestInfo) (Response[json.RawMessage], error) {
				return middleware(callCtx, callReq, next)
			}
		}
		return chain(ctx, req)
	}

	// lookupProcedure returns the generated procedure definition for the requested RPC member.
	func (c *internalClient) lookupProcedure(rpcName string, procedureName string) (ProcedureDefinition, bool) {
		if procedures, ok := c.procedureDefs[rpcName]; ok {
			procedure, ok := procedures[procedureName]
			return procedure, ok
		}
		return ProcedureDefinition{}, false
	}

	// proc invokes the given procedure and returns the raw wire envelope.
	func (c *internalClient) proc(
		ctx context.Context, 
		rpcName string, 
		procName string, 
		input any, 
		opHeaderProviders []HeaderProvider, 
		opRetryConf *RetryConfig,
		opTimeoutConf *TimeoutConfig,
	) Response[json.RawMessage] {
		procedure, ok := c.lookupProcedure(rpcName, procName)
		if !ok {
			return Response[json.RawMessage]{
				Ok: false,
				Error: Error{
					Category: "ClientError",
					Code: "INVALID_PROC",
					Message: fmt.Sprintf("%s.%s procedure not found in schema", rpcName, procName),
					Details: map[string]any{"rpc": rpcName, "procedure": procName},
				},
			}
		}

		reqInfo := RequestInfo{
			RPCName: rpcName,
			ProcedureName: procName,
			Input: input,
			Annotations: cloneAnnotations(procedure.Annotations),
		}

		invoker := func(callCtx context.Context, req RequestInfo) (Response[json.RawMessage], error) {
			retryConf := c.mergeRetryConfig(req.RPCName, opRetryConf)
			timeoutConf := c.mergeTimeoutConfig(req.RPCName, opTimeoutConf)
			maxAttempts := retryConf.MaxAttempts
			if maxAttempts < 1 {
				maxAttempts = 1
			}

			payload, err := encodeRequestPayload(req.Input)
			if err != nil {
				return Response[json.RawMessage]{
					Ok: false,
					Error: Error{
						Category: "ClientError",
						Code: "ENCODE_INPUT",
						Message: fmt.Sprintf("failed to marshal input for %s.%s: %v", req.RPCName, req.ProcedureName, err),
					},
				}, nil
			}

			url := c.baseURL + procedure.Path
			var last Response[json.RawMessage]

			for attempt := 1; attempt <= maxAttempts; attempt++ {
				attemptCtx := callCtx
				var cancel context.CancelFunc
				if timeoutConf.Timeout > 0 {
					attemptCtx, cancel = context.WithTimeout(callCtx, timeoutConf.Timeout)
				}

				res, defaultRetry, statusCode, decisionErr := c.doRequest(attemptCtx, req, url, payload, opHeaderProviders)
				if cancel != nil {
					cancel()
				}

				last = res
				shouldRetry := defaultRetry
				if retryConf.ShouldRetry != nil {
					shouldRetry = retryConf.ShouldRetry(callCtx, RetryDecisionContext{
						Request: req,
						Attempt: attempt,
						ResponseStatus: statusCode,
						Error: decisionErr,
					})
				}

				if !shouldRetry || attempt >= maxAttempts {
					return res, nil
				}

				if err := waitForBackoff(callCtx, calculateBackoff(retryConf, attempt)); err != nil {
					return Response[json.RawMessage]{Ok: false, Error: ToError(err)}, nil
				}
			}

			return last, nil
		}

		res, err := c.executeChain(ctx, reqInfo, invoker)
		if err != nil {
			return Response[json.RawMessage]{Ok: false, Error: ToError(err)}
		}

		return res
	}

	// doRequest performs a single HTTP request attempt.
	func (c *internalClient) doRequest(
		ctx context.Context, 
		req RequestInfo, 
		url string, 
		payload []byte, 
		opHeaderProviders []HeaderProvider,
	) (Response[json.RawMessage], bool, int, error) {
		httpRequest, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(payload))
		if err != nil {
			wrapped := fmt.Errorf("failed to create HTTP request: %w", err)
			return Response[json.RawMessage]{Ok: false, Error: ToError(wrapped)}, false, 0, wrapped
		}

		httpRequest.Header.Set("Content-Type", "application/json")
		httpRequest.Header.Set("Accept", "application/json")

		if err := c.applyHeaderProviders(ctx, req.RPCName, httpRequest.Header, opHeaderProviders); err != nil {
			wrapped := fmt.Errorf("failed to apply headers: %w", err)
			return Response[json.RawMessage]{Ok: false, Error: ToError(wrapped)}, false, 0, wrapped
		}

		response, err := c.httpClient.Do(httpRequest)
		if err != nil {
			if errors.Is(ctx.Err(), context.Canceled) {
				wrapped := context.Canceled
				return Response[json.RawMessage]{Ok: false, Error: ToError(wrapped)}, false, 0, wrapped
			}

			if errors.Is(ctx.Err(), context.DeadlineExceeded) {
				timeoutErr := Error{
					Category: "TimeoutError",
					Code: "REQUEST_TIMEOUT",
					Message: "Request timeout",
				}
				return Response[json.RawMessage]{Ok: false, Error: timeoutErr}, true, 0, timeoutErr
			}

			wrapped := fmt.Errorf("http request failed: %w", err)
			return Response[json.RawMessage]{Ok: false, Error: ToError(wrapped)}, true, 0, wrapped
		}
		defer response.Body.Close()

		if response.StatusCode >= 500 {
			httpErr := Error{
				Category: "HTTPError",
				Code: "BAD_STATUS",
				Message: fmt.Sprintf("unexpected HTTP status: %s", response.Status),
				Details: map[string]any{"status": response.StatusCode},
			}
			return Response[json.RawMessage]{Ok: false, Error: httpErr}, true, response.StatusCode, httpErr
		}

		if response.StatusCode < 200 || response.StatusCode >= 300 {
			httpErr := Error{
				Category: "HTTPError",
				Code: "BAD_STATUS",
				Message: fmt.Sprintf("unexpected HTTP status: %s", response.Status),
				Details: map[string]any{"status": response.StatusCode},
			}
			return Response[json.RawMessage]{Ok: false, Error: httpErr}, false, response.StatusCode, httpErr
		}

		var raw struct {
			Ok bool \`json:"ok"\`
			Output json.RawMessage \`json:"output"\`
			Error Error \`json:"error"\`
		}

		if err := json.NewDecoder(response.Body).Decode(&raw); err != nil {
			wrapped := fmt.Errorf("failed to decode VDL response: %w", err)
			return Response[json.RawMessage]{Ok: false, Error: ToError(wrapped)}, false, response.StatusCode, wrapped
		}

		if !raw.Ok {
			return Response[json.RawMessage]{Ok: false, Error: raw.Error}, false, response.StatusCode, raw.Error
		}

		return Response[json.RawMessage]{Ok: true, Output: raw.Output}, false, response.StatusCode, nil
	}

	// applyHeaderProviders applies global, RPC-scoped, and per-procedure header providers in order.
	func (c *internalClient) applyHeaderProviders(ctx context.Context, rpcName string, header http.Header, opHeaderProviders []HeaderProvider) error {
		for _, provider := range c.headerProviders {
			if err := provider(ctx, header); err != nil {
				return fmt.Errorf("global header provider failed: %w", err)
			}
		}

		c.mu.RLock()
		rpcProviders := append([]HeaderProvider(nil), c.rpcHeaderProviders[rpcName]...)
		c.mu.RUnlock()

		for _, provider := range rpcProviders {
			if err := provider(ctx, header); err != nil {
				return fmt.Errorf("rpc header provider failed: %w", err)
			}
		}

		for _, provider := range opHeaderProviders {
			if err := provider(ctx, header); err != nil {
				return fmt.Errorf("procedure header provider failed: %w", err)
			}
		}

		return nil
	}

	// encodeRequestPayload marshals the request input using an empty JSON object when the input is nil.
	func encodeRequestPayload(input any) ([]byte, error) {
		if input == nil {
			return []byte("{}"), nil
		}

		return json.Marshal(input)
	}

	// calculateBackoff computes the delay for a retry attempt.
	func calculateBackoff(config *RetryConfig, attempt int) time.Duration {
		delay := config.InitialDelay
		for index := 1; index < attempt; index++ {
			delay = time.Duration(float64(delay) * config.DelayMultiplier)
		}

		if config.MaxDelay > 0 && delay > config.MaxDelay {
			delay = config.MaxDelay
		}

		return applyJitter(delay, config.Jitter)
	}

	// applyJitter applies bounded randomness to the given delay.
	func applyJitter(delay time.Duration, factor float64) time.Duration {
		if factor <= 0 || delay <= 0 {
			return delay
		}

		if factor > 1 {
			factor = 1
		}

		delta := float64(delay) * factor
		minimum := float64(delay) - delta
		maximum := float64(delay) + delta
		if minimum < 0 {
			minimum = 0
		}

		return time.Duration(minimum + (rand.Float64() * (maximum - minimum)))
	}

	// waitForBackoff waits for the given delay or returns when the context is cancelled.
	func waitForBackoff(ctx context.Context, delay time.Duration) error {
		if delay <= 0 {
			return nil
		}

		timer := time.NewTimer(delay)
		defer timer.Stop()

		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-timer.C:
			return nil
		}
	}

	// -----------------------------------------------------------------------------
  // Client Builder
  // -----------------------------------------------------------------------------

	// clientBuilder collects configuration before a generated client is built.
	type clientBuilder struct {
		baseURL string
		opts []internalClientOption
	}

	// WithHTTPClient supplies a custom HTTP client implementation.
	func (b *clientBuilder) WithHTTPClient(client *http.Client) *clientBuilder {
		b.opts = append(b.opts, withHTTPClient(client))
		return b
	}

	// WithHeader registers a static header that is sent with every request.
	func (b *clientBuilder) WithHeader(key string, value string) *clientBuilder {
		b.opts = append(b.opts, withGlobalHeader(key, value))
		return b
	}

	// WithHeaderProvider registers a dynamic header provider.
	func (b *clientBuilder) WithHeaderProvider(provider HeaderProvider) *clientBuilder {
		b.opts = append(b.opts, withHeaderProvider(provider))
		return b
	}

	// WithInterceptor registers a transport interceptor.
	func (b *clientBuilder) WithInterceptor(interceptor Interceptor) *clientBuilder {
		b.opts = append(b.opts, withInterceptor(interceptor))
		return b
	}

	// WithRetryConfig sets the default retry configuration for procedures.
	func (b *clientBuilder) WithRetryConfig(conf RetryConfig) *clientBuilder {
		b.opts = append(b.opts, withGlobalRetryConfig(conf))
		return b
	}

	// WithTimeoutConfig sets the default timeout configuration for procedures.
	func (b *clientBuilder) WithTimeoutConfig(conf TimeoutConfig) *clientBuilder {
		b.opts = append(b.opts, withGlobalTimeoutConfig(conf))
		return b
	}

	// Build creates the generated RPC client.
	func (b *clientBuilder) Build() *Client {
		intClient := newInternalClient(b.baseURL, VDLProcedures, b.opts...)
		return &Client{RPCs: &clientRPCRegistry{intClient: intClient}}
	}

  // -----------------------------------------------------------------------------
  // Client Implementation
  // -----------------------------------------------------------------------------

	// Client is the public entrypoint for generated RPC calls.
	type Client struct {
		RPCs *clientRPCRegistry
	}

	// NewClient creates a new generated RPC client builder.
	func NewClient(baseURL string) *clientBuilder {
		return &clientBuilder{baseURL: baseURL, opts: []internalClientOption{}}
	}

	// clientRPCRegistry exposes the generated RPC services.
	type clientRPCRegistry struct {
		intClient *internalClient
	}
`
);

// src/stages/emit/files/client/generate.ts
function generateClientFile(context) {
  const body = joinSections([
    `package ${context.options.packageName}`,
    renderClientImports(context),
    renderCatalog(context),
    renderCoreRuntime(),
    CLIENT_RUNTIME,
    renderClientServices(context)
  ]);
  return createGoFile("client.go", "", body);
}
__name(generateClientFile, "generateClientFile");
function renderClientImports(context) {
  const needsTypesImport = context.services.some(
    (service) => service.procedures.some(
      (procedure) => procedure.inputTypeName || procedure.outputTypeName
    )
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
__name(renderClientImports, "renderClientImports");
function renderClientServices(context) {
  return context.services.map((service) => renderClientService(service, context)).join("\n\n");
}
__name(renderClientServices, "renderClientServices");
function renderClientService(service, context) {
  const rpcStructName = `client${service.goName}RPC`;
  const procsStructName = `client${service.goName}Procs`;
  const g = newGenerator().withTabs();
  writeComment(
    g,
    `${service.goName} returns the client registry for the ${service.name} RPC service.`,
    service.doc,
    service.deprecated
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
    `${rpcStructName} groups the generated client builders for the ${service.name} RPC service.`
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
    `WithRetryConfig sets the default retry configuration for every procedure in the ${service.name} RPC service.`
  );
  g.line(
    `func (r *${rpcStructName}) WithRetryConfig(conf RetryConfig) *${rpcStructName} {`
  );
  g.block(() => {
    g.line(
      `r.intClient.setRPCRetryConfig(${renderGoString(service.name)}, conf)`
    );
    g.line("return r");
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `WithTimeoutConfig sets the default timeout configuration for every procedure in the ${service.name} RPC service.`
  );
  g.line(
    `func (r *${rpcStructName}) WithTimeoutConfig(conf TimeoutConfig) *${rpcStructName} {`
  );
  g.block(() => {
    g.line(
      `r.intClient.setRPCTimeoutConfig(${renderGoString(service.name)}, conf)`
    );
    g.line("return r");
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `WithHeaderProvider adds a header provider for every request in the ${service.name} RPC service.`
  );
  g.line(
    `func (r *${rpcStructName}) WithHeaderProvider(provider HeaderProvider) *${rpcStructName} {`
  );
  g.block(() => {
    g.line(
      `r.intClient.setRPCHeaderProvider(${renderGoString(service.name)}, provider)`
    );
    g.line("return r");
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `WithHeader adds a static header for every request in the ${service.name} RPC service.`
  );
  g.line(
    `func (r *${rpcStructName}) WithHeader(key string, value string) *${rpcStructName} {`
  );
  g.block(() => {
    g.line(
      `r.intClient.setRPCHeaderProvider(${renderGoString(service.name)}, func(_ context.Context, h http.Header) error {`
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
    `${procsStructName} exposes the generated procedure builders for the ${service.name} RPC service.`
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
__name(renderClientService, "renderClientService");
function renderClientProcedure(service, procedure, context) {
  const registryName = `client${service.goName}Procs`;
  const builderName = `clientBuilder${procedure.procedureTypeName}`;
  const inputType = getClientInputType(procedure, context);
  const outputType = getClientOutputType(procedure, context);
  const g = newGenerator().withTabs();
  writeComment(
    g,
    `${procedure.goName} creates a call builder for the ${service.name}.${procedure.name} procedure.`,
    procedure.doc,
    procedure.deprecated
  );
  g.line(
    `func (registry *${registryName}) ${procedure.goName}() *${builderName} {`
  );
  g.block(() => {
    g.line(
      `return &${builderName}{client: registry.intClient, headerProviders: []HeaderProvider{}, rpcName: ${renderGoString(service.name)}, procedureName: ${renderGoString(procedure.name)}}`
    );
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `${builderName} configures and executes calls to the ${service.name}.${procedure.name} procedure.`
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
    `WithHeader adds a static header to the ${service.name}.${procedure.name} procedure call.`
  );
  g.line(
    `func (b *${builderName}) WithHeader(key string, value string) *${builderName} {`
  );
  g.block(() => {
    g.line(
      "b.headerProviders = append(b.headerProviders, func(_ context.Context, h http.Header) error {"
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
    `WithHeaderProvider adds a dynamic header provider to the ${service.name}.${procedure.name} procedure call.`
  );
  g.line(
    `func (b *${builderName}) WithHeaderProvider(provider HeaderProvider) *${builderName} {`
  );
  g.block(() => {
    g.line("b.headerProviders = append(b.headerProviders, provider)");
    g.line("return b");
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `WithRetryConfig overrides retry behavior for the ${service.name}.${procedure.name} procedure call.`
  );
  g.line(
    `func (b *${builderName}) WithRetryConfig(conf RetryConfig) *${builderName} {`
  );
  g.block(() => {
    g.line("b.retryConf = &conf");
    g.line("return b");
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `WithTimeoutConfig overrides timeout behavior for the ${service.name}.${procedure.name} procedure call.`
  );
  g.line(
    `func (b *${builderName}) WithTimeoutConfig(conf TimeoutConfig) *${builderName} {`
  );
  g.block(() => {
    g.line("b.timeoutConf = &conf");
    g.line("return b");
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `Execute sends a request to the ${service.name}.${procedure.name} procedure.`
  );
  g.line(
    `func (b *${builderName}) Execute(ctx context.Context, input ${inputType}) (${outputType}, error) {`
  );
  g.block(() => {
    g.line(
      "raw := b.client.proc(ctx, b.rpcName, b.procedureName, input, b.headerProviders, b.retryConf, b.timeoutConf)"
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
          `return ${outputType}{}, Error{Message: fmt.Sprintf("failed to decode ${service.name}.${procedure.name} output: %v", err)}`
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
__name(renderClientProcedure, "renderClientProcedure");
function writeComment(g, summary, doc, deprecated) {
  g.raw(renderCommentBlock({ summary, doc, deprecated }));
  g.break();
}
__name(writeComment, "writeComment");
function getClientInputType(procedure, context) {
  return procedure.inputTypeName ? `${getTypesQualifier(context)}${procedure.inputTypeName}` : "Void";
}
__name(getClientInputType, "getClientInputType");
function getClientOutputType(procedure, context) {
  return procedure.outputTypeName ? `${getTypesQualifier(context)}${procedure.outputTypeName}` : "Void";
}
__name(getClientOutputType, "getClientOutputType");
function getTypesQualifier(context) {
  return context.options.typesImport.length > 0 ? "vdltypes." : "";
}
__name(getTypesQualifier, "getTypesQualifier");

// src/stages/emit/files/server/runtime.ts
var SERVER_RUNTIME = dedent2(
  /* go */
  `
  // -----------------------------------------------------------------------------
  // Server Types
  // -----------------------------------------------------------------------------

  // HTTPAdapter defines the interface required by VDL server to handle
  // incoming HTTP requests and write responses to clients. This abstraction allows
  // the server to work with different HTTP frameworks while maintaining the same
  // core functionality.
  //
  // Implementations must provide methods to read request bodies, set response headers,
  // write response data, and flush the response buffer to ensure immediate delivery
  // to the client.
  type HTTPAdapter interface {
    // RequestBody returns the body reader for the incoming HTTP request.
    // The returned io.Reader allows the server to read the request payload
    // containing RPC call data.
    RequestBody() io.Reader
    // SetHeader sets a response header with the specified key-value pair.
    // This is used to configure response headers like Content-Type and
    // caching directives for procedure responses.
    SetHeader(key, value string)
    // Write writes the provided data to the response body.
    // Returns the number of bytes written and any error encountered.
    // For procedures, this writes the complete JSON response.
    Write(data []byte) (int, error)
    // Flush immediately sends any buffered response data to the client.
    // Returns an error if the flush operation fails.
    Flush() error
  }

  // NetHTTPAdapter implements HTTPAdapter for Go's standard net/http package.
  // This adapter bridges the VDL server with the standard HTTP library, allowing
  // seamless integration with existing HTTP servers and middlewares.
  type NetHTTPAdapter struct {
    responseWriter http.ResponseWriter
    request        *http.Request
  }

  // NewNetHTTPAdapter creates a new NetHTTPAdapter that implements the
  // HTTPAdapter interface for net/http.
  //
  // Parameters:
  //   - w: The http.ResponseWriter to write responses to
  //   - r: The *http.Request containing the incoming request data
  //
  // Returns a HTTPAdapter implementation ready for use with VDL server.
  func NewNetHTTPAdapter(w http.ResponseWriter, r *http.Request) HTTPAdapter {
    return &NetHTTPAdapter{
      responseWriter: w,
      request:        r,
    }
  }

  // RequestBody returns the body reader for the HTTP request.
  // This provides access to the request payload containing the RPC call data.
  func (r *NetHTTPAdapter) RequestBody() io.Reader {
    return r.request.Body
  }

  // SetHeader sets a response header with the specified key-value pair.
  // This configures headers for the HTTP response, such as Content-Type
  // for JSON responses.
  func (r *NetHTTPAdapter) SetHeader(key, value string) {
    r.responseWriter.Header().Set(key, value)
  }

  // Write writes the provided data to the HTTP response body.
  // Returns the number of bytes written and any error encountered during writing.
  func (r *NetHTTPAdapter) Write(data []byte) (int, error) {
    return r.responseWriter.Write(data)
  }

  // Flush immediately sends any buffered response data to the client.
  // Flush is a no-op when the writer does not support flushing.
  // If the underlying ResponseWriter doesn't support flushing, this is a no-op.
  func (r *NetHTTPAdapter) Flush() error {
    if f, ok := r.responseWriter.(http.Flusher); ok {
      f.Flush()
    }
    return nil
  }

  // -----------------------------------------------------------------------------
  // Middleware-based Server Architecture
  // -----------------------------------------------------------------------------

  // HandlerContext is the unified container for all request information and state
  // that flows through the entire request processing pipeline.
  //
  // The generic type P represents the user-defined container for application
  // dependencies and request data (e.g., UserID, DB connection, etc.).
  //
  // The generic type I represents the input type, which can be any type depending
  // on the procedure.
  //
  //   - T: The type of the Props field, which is a user-defined container for application and request data.
  //   - I: The type of the Input field, which contains the deserialized request body. For global middlewares, this will be any.
  type HandlerContext[T any, I any] struct {
    // Props is the user-defined container, created per request,
    // for application dependencies and request data (e.g., UserID).
    Props T
    // Input contains the request body, already deserialized and typed.
    // For global middlewares, the type I will be any.
    Input I
    // Context is the standard Go context.Context for cancellations and deadlines.
    Context context.Context
    // Annotations is a slice of annotation objects associated with the request.
    Annotations []Annotation
    // procedure is the details of the RPC procedure including its RPC name and procedure name.
    procedure ProcedureDefinition
  }

  // RPCName returns the name of the RPC service
  func (h *HandlerContext[T, I]) RPCName() string { return h.procedure.RPCName }

  // ProcedureName returns the name of the procedure (e.g. "CreateUser", "GetPost", etc.)
  func (h *HandlerContext[T, I]) ProcedureName() string { return h.procedure.Name }

  // RPCRoute returns the lowerFirst transport segment for the RPC service.
  func (h *HandlerContext[T, I]) RPCRoute() string { return h.procedure.RPCRoute }

  // Path returns the VPP-2 transport path for the current procedure.
  func (h *HandlerContext[T, I]) Path() string { return h.procedure.Path }

  // GlobalHandlerFunc is the signature for a global handler function for procedures.
  //
  //   - T: Application-defined context type (props).
  type GlobalHandlerFunc[T any] func(c *HandlerContext[T, any]) (any, error)

  // GlobalMiddlewareFunc is the signature for a middleware applied to all requests.
  //
  //   - T: Application-defined context type (props).
  type GlobalMiddlewareFunc[T any] func(next GlobalHandlerFunc[T]) GlobalHandlerFunc[T]

  // ProcHandlerFunc is the signature of the final business handler for a proc.
  //
  //   - T: Application-defined context type (props).
  //   - I: Input payload type for the procedure.
  //   - O: Output payload type for the procedure.
  type ProcHandlerFunc[T any, I any, O any] func(c *HandlerContext[T, I]) (O, error)

  // ProcMiddlewareFunc is the signature for a proc-specific typed middleware.
  // It uses a wrapper pattern for a clean composition.
  //
  // This is the same as [GlobalMiddlewareFunc] but for specific procedures and with types.
  //
  //   - T: Application-defined context type (props).
  //   - I: Input payload type for the procedure.
  //   - O: Output payload type for the procedure.
  type ProcMiddlewareFunc[T any, I any, O any] func(next ProcHandlerFunc[T, I, O]) ProcHandlerFunc[T, I, O]

  // DeserializerFunc function convert raw JSON input into typed input prior to handler execution.
  type DeserializerFunc func(raw json.RawMessage) (any, error)

  // ErrorHandlerFunc transforms an internal Go error into a public VDL Error.
  //
  // The handler receives the full request context, enabling structured logging
  // with access to Props, RPC Name, Procedure Name, and other metadata.
  //
  //   - T: Application-defined context type (props).
  type ErrorHandlerFunc[T any] func(c *HandlerContext[T, any], err error) Error

  // Internal Server Implementation
  // -----------------------------------------------------------------------------

  // internalServer manages RPC request handling and middleware execution for procedures. It maintains handler registrations, middleware
  // chains, and coordinates the complete request lifecycle.
  //
  // The generic type P represents the user context type, allowing users to pass
  // custom data (authentication info, user sessions, etc.) through the entire
  // request processing pipeline.
  //
  //   - T: Application-defined context type (props).
  type internalServer[T any] struct {
    // handlersMu protects all handler maps and middleware slices from concurrent access
    handlersMu sync.RWMutex

    // procedureDefs contains the definition of all registered procedures.
    // Map format: rpcName -> procedureName -> ProcedureDefinition.
    procedureDefs map[string]map[string]ProcedureDefinition

    // procHandlers stores the final implementation functions for procedures
    // Map format: rpcName -> procName -> handler
    procHandlers map[string]map[string]ProcHandlerFunc[T, any, any]


    // globalMiddlewares contains middlewares that run for every procedure request
    globalMiddlewares []GlobalMiddlewareFunc[T]

    // rpcMiddlewares contains middlewares that run for every request within a specific RPC
    // Map format: rpcName -> middlewares
    rpcMiddlewares map[string][]GlobalMiddlewareFunc[T]

    // procMiddlewares contains per-procedure middlewares
    // Map format: rpcName -> procName -> middlewares
    procMiddlewares map[string]map[string][]ProcMiddlewareFunc[T, any, any]



    // procDeserializers contains per-procedure input deserializers
    // Map format: rpcName -> procName -> deserializer
    procDeserializers map[string]map[string]DeserializerFunc





    // globalErrorHandler is the global error handler
    globalErrorHandler ErrorHandlerFunc[T]

    // rpcErrorHandlers contains per-RPC error handlers
    // Map format: rpcName -> handler
    rpcErrorHandlers map[string]ErrorHandlerFunc[T]
  }

  // newInternalServer creates a new VDL server instance with the specified
  // procedure definitions. The server is initialized with empty handler
  // maps and middleware slices, ready for registration.
  //
  // The generic type T represents the user context type, used to pass additional
  // data to handlers, such as authentication information, user sessions, or any
  // other request-scoped data.
  //
  // Parameters:
  //   - procDefs: List of procedure definitions that this server will handle
  //   - T: Application-defined context type (props).
  //
  // Returns a new internalServer instance ready for handler and middleware registration.
  func newInternalServer[T any](procDefs []ProcedureDefinition) *internalServer[T] {
    // Initialize maps
    procedureDefs := make(map[string]map[string]ProcedureDefinition)
    procHandlers := make(map[string]map[string]ProcHandlerFunc[T, any, any])
    rpcMiddlewares := make(map[string][]GlobalMiddlewareFunc[T])
    procMiddlewares := make(map[string]map[string][]ProcMiddlewareFunc[T, any, any])
    procDeserializers := make(map[string]map[string]DeserializerFunc)
    rpcErrorHandlers := make(map[string]ErrorHandlerFunc[T])

    // Helper to ensure RPC map existence
    ensureRPC := func(rpcName string) {
      if _, ok := procedureDefs[rpcName]; !ok {
        procedureDefs[rpcName] = make(map[string]ProcedureDefinition)
        procHandlers[rpcName] = make(map[string]ProcHandlerFunc[T, any, any])
        procMiddlewares[rpcName] = make(map[string][]ProcMiddlewareFunc[T, any, any])
        procDeserializers[rpcName] = make(map[string]DeserializerFunc)
      }
    }

    for _, def := range procDefs {
      ensureRPC(def.RPCName)
      procedureDefs[def.RPCName][def.Name] = def
    }

    return &internalServer[T]{
      handlersMu:            sync.RWMutex{},
      procedureDefs:       procedureDefs,
      procHandlers:          procHandlers,
      globalMiddlewares:     []GlobalMiddlewareFunc[T]{},
      rpcMiddlewares:        rpcMiddlewares,
      procMiddlewares:       procMiddlewares,
      procDeserializers:     procDeserializers,
      globalErrorHandler:    nil,
      rpcErrorHandlers:      rpcErrorHandlers,
    }
  }

  // addGlobalMiddleware registers a global middleware that executes for every procedure request.
  // Middlewares are executed in the order they were registered.
  func (s *internalServer[T]) addGlobalMiddleware(
    mw GlobalMiddlewareFunc[T],
  ) *internalServer[T] {
    s.handlersMu.Lock()
    defer s.handlersMu.Unlock()
    s.globalMiddlewares = append(s.globalMiddlewares, mw)
    return s
  }

  // addRPCMiddleware registers a middleware that executes for every request within a specific RPC.
  // Middlewares are executed in the order they were registered.
  func (s *internalServer[T]) addRPCMiddleware(
    rpcName string,
    mw GlobalMiddlewareFunc[T],
  ) *internalServer[T] {
    s.handlersMu.Lock()
    defer s.handlersMu.Unlock()
    s.rpcMiddlewares[rpcName] = append(s.rpcMiddlewares[rpcName], mw)
    return s
  }

  // addProcMiddleware registers a wrapper middleware for a specific procedure.
  // Middlewares are executed in the order they were registered.
  func (s *internalServer[T]) addProcMiddleware(
    rpcName string,
    procName string,
    mw ProcMiddlewareFunc[T, any, any],
  ) *internalServer[T] {
    s.handlersMu.Lock()
    defer s.handlersMu.Unlock()
    s.procMiddlewares[rpcName][procName] = append(s.procMiddlewares[rpcName][procName], mw)
    return s
  }

  // setGlobalErrorHandler sets the global error handler.
  func (s *internalServer[T]) setGlobalErrorHandler(handler ErrorHandlerFunc[T]) *internalServer[T] {
    s.handlersMu.Lock()
    defer s.handlersMu.Unlock()
    s.globalErrorHandler = handler
    return s
  }

  // setRPCErrorHandler sets the error handler for a specific RPC.
  func (s *internalServer[T]) setRPCErrorHandler(rpcName string, handler ErrorHandlerFunc[T]) *internalServer[T] {
    s.handlersMu.Lock()
    defer s.handlersMu.Unlock()
    s.rpcErrorHandlers[rpcName] = handler
    return s
  }

  // resolveErrorHandler returns the appropriate error handler for the given RPC name.
  // Precedence: RPC > Global > Default (Passthrough)
  func (s *internalServer[T]) resolveErrorHandler(rpcName string) ErrorHandlerFunc[T] {
    s.handlersMu.RLock()
    defer s.handlersMu.RUnlock()

    if handler, ok := s.rpcErrorHandlers[rpcName]; ok && handler != nil {
      return handler
    }
    if s.globalErrorHandler != nil {
      return s.globalErrorHandler
    }

    // Default: Passthrough
    return func(c *HandlerContext[T, any], err error) Error {
      return ToError(err)
    }
  }

  // setProcHandler registers the final implementation function and deserializer for the specified procedure name.
  // The provided functions are stored as-is. Middlewares are composed at request time.
  //
  // Panics if a handler is already registered for the given procedure name.
  func (s *internalServer[T]) setProcHandler(
    rpcName string,
    procName string,
    handler ProcHandlerFunc[T, any, any],
    deserializer DeserializerFunc,
  ) *internalServer[T] {
    s.handlersMu.Lock()
    defer s.handlersMu.Unlock()
    if _, exists := s.procHandlers[rpcName][procName]; exists {
      panic(fmt.Sprintf("the procedure handler for %s.%s is already registered", rpcName, procName))
    }
    s.procHandlers[rpcName][procName] = handler
    s.procDeserializers[rpcName][procName] = deserializer
    return s
  }

  // handleRequest processes an incoming procedure request by parsing the request body,
  // building the global middleware chain, and dispatching to the procedure handler.
  //
  // The request body must contain a JSON object with the input data for the handler.
  // An empty body is accepted as empty input per VPP-2.
  //
  // Parameters:
  //   - ctx: The request context
  //   - props: The VDL context containing user-defined data
  //   - rpcName: The RPC service name from the request URL (lowerFirst form)
  //   - procedureName: The name of the procedure to invoke
  //   - httpAdapter: The HTTP adapter for reading requests and writing responses
  //
  // Returns an error if request processing fails at the transport level.
  func (s *internalServer[T]) handleRequest(
    ctx context.Context,
    props T,
    rpcName string,
    procedureName string,
    httpAdapter HTTPAdapter,
  ) error {
    if httpAdapter == nil {
      return fmt.Errorf("the HTTP adapter is nil, please provide a valid adapter")
    }

    // Decode the request body into a json.RawMessage. An empty body is valid
    // empty input per VPP-2 and must not fail the transport.
    var rawInput json.RawMessage
    if err := json.NewDecoder(httpAdapter.RequestBody()).Decode(&rawInput); err != nil {
      if err != io.EOF {
        // Tolerate empty bodies reported as EOF or unexpected EOF with no bytes.
        if len(bytes.TrimSpace(rawInput)) != 0 {
          res := Response[any]{
            Ok:    false,
            Error: Error{Message: "Invalid request body"},
          }
          return s.writeProcResponse(httpAdapter, res)
        }
      }
      rawInput = nil
    }
    if len(bytes.TrimSpace(rawInput)) == 0 {
      rawInput = nil
    }

    procedure, canonicalRPC, canonicalProcedure, procedureExists := s.lookupProcedure(rpcName, procedureName)
    if !procedureExists {
      res := Response[any]{
        Ok:    false,
        Error: Error{Message: fmt.Sprintf("Invalid procedure: %s.%s", rpcName, procedureName)},
      }
      return s.writeProcResponse(httpAdapter, res)
    }

    // Build the unified handler context (raw input at this point).
    c := &HandlerContext[T, any]{
      Input:   rawInput,
      Props:   props,
      Context: ctx,
      Annotations: cloneAnnotations(procedure.Annotations),
      procedure: ProcedureDefinition{
        RPCName:      procedure.RPCName,
        RPCRoute:     procedure.RPCRoute,
        Name:         procedure.Name,
        Path:         procedure.Path,
        Annotations:  cloneAnnotations(procedure.Annotations),
      },
    }

    // Handle Procedure
    output, err := s.handleProcRequest(c, canonicalRPC, canonicalProcedure, rawInput)
    response := Response[any]{}
    if err != nil {
      response.Ok = false
      errorHandler := s.resolveErrorHandler(canonicalRPC)
      response.Error = errorHandler(c, err)
    } else {
      response.Ok = true
      response.Output = output
    }

    return s.writeProcResponse(httpAdapter, response)
  }

  // lookupProcedure resolves an incoming route to its canonical procedure definition.
  //
  // The RPC segment matches the VPP-2 lowerFirst transport form. The canonical
  // VDL service name is returned for handler and middleware lookup.
  func (s *internalServer[T]) lookupProcedure(rpcName string, procedureName string) (ProcedureDefinition, string, string, bool) {
    s.handlersMu.RLock()
    defer s.handlersMu.RUnlock()
    for canonicalRPC, procedures := range s.procedureDefs {
      if procedure, ok := procedures[procedureName]; ok {
        if canonicalRPC == rpcName || procedure.RPCRoute == rpcName {
          return procedure, canonicalRPC, procedureName, true
        }
      }
    }
    return ProcedureDefinition{}, "", "", false
  }

  // handleProcRequest builds the per-request middleware chain for a procedure and executes it.
  // It returns the procedure output (as any) and an error if the handler failed.
  func (s *internalServer[T]) handleProcRequest(
    c *HandlerContext[T, any],
    rpcName string,
    procName string,
    rawInput json.RawMessage,
  ) (any, error) {
    // Snapshot handler, middlewares, and deserializer under read lock
    s.handlersMu.RLock()
    baseHandler, ok := s.procHandlers[rpcName][procName]
    mws := s.procMiddlewares[rpcName][procName]
    rpcMws := s.rpcMiddlewares[rpcName]
    deserialize := s.procDeserializers[rpcName][procName]
    s.handlersMu.RUnlock()

    if !ok {
      return nil, fmt.Errorf("%s.%s procedure not implemented", rpcName, procName)
    }
    if deserialize == nil {
      return nil, fmt.Errorf("%s.%s procedure deserializer not registered", rpcName, procName)
    }

    // Deserialize, validate and transform input into its typed form
    typedInput, err := deserialize(rawInput)
    if err != nil {
      return nil, err
    }
    c.Input = typedInput

    // Compose specific per-proc middlewares around the base handler (reverse registration order)
    final := baseHandler
    if len(mws) > 0 {
      mwChain := append([]ProcMiddlewareFunc[T, any, any](nil), mws...)
      for i := len(mwChain) - 1; i >= 0; i-- {
        final = mwChain[i](final)
      }
    }

    // Wrap the specific chain with RPC-level middlewares (executed before specific ones)
    exec := func(c *HandlerContext[T, any]) (any, error) { return final(c) }
    if len(rpcMws) > 0 {
      mwChain := append([]GlobalMiddlewareFunc[T](nil), rpcMws...)
      for i := len(mwChain) - 1; i >= 0; i-- {
        exec = mwChain[i](exec)
      }
    }

    // Wrap the chain with global middlewares (executed before RPC-level ones)
    if len(s.globalMiddlewares) > 0 {
      mwChain := append([]GlobalMiddlewareFunc[T](nil), s.globalMiddlewares...)
      for i := len(mwChain) - 1; i >= 0; i-- {
        exec = mwChain[i](exec)
      }
    }

    return exec(c)
  }

  // writeProcResponse writes a procedure response to the client as JSON.
  // This helper method sets the appropriate Content-Type header and marshals
  // the response data before sending it to the client.
  //
  // Parameters:
  //   - httpAdapter: The HTTP adapter for writing the response
  //   - response: The response data to send to the client
  //
  // Returns an error if writing the response fails.
  func (s *internalServer[T]) writeProcResponse(
    httpAdapter HTTPAdapter,
    response Response[any],
  ) error {
    httpAdapter.SetHeader("Content-Type", "application/json")
    _, err := httpAdapter.Write(response.Bytes())
    if err != nil {
      return fmt.Errorf("failed to write response: %w", err)
    }
    return nil
  }

  // -----------------------------------------------------------------------------
  // Server Implementation
  // -----------------------------------------------------------------------------

	// Server provides a high-level, type-safe API for building a VDL RPC server.
  //
	// It exposes:
	//   - Procs: typed entries to register middlewares and the business handler per procedure
	//   - Use: a global middleware API that runs for every procedure
	//
	// The generic type parameter T is your application context (props) that flows through
	// the entire request lifecycle (authentication, per-request data, dependencies, etc.).
  type Server[T any] struct {
    intServer *internalServer[T]
    RPCs      *serverRPCRegistry[T]
  }

	// NewServer creates a new VDL RPC server instance ready to handle all
	// defined procedures using the middleware-based architecture.
	//
	// The generic type parameter T is your application context (props) that flows through
	// the entire request lifecycle (authentication, per-request data, dependencies, etc.).
	//
	// Example:
  //
	//   type AppProps struct {
	//       UserID string
	//   }
	//   s := NewServer[AppProps]()
  func NewServer[T any]() *Server[T] {
    intServer := newInternalServer[T](VDLProcedures)
    return &Server[T]{
      intServer: intServer,
      RPCs: newServerRPCRegistry(intServer),
    }
  }

	// Use registers a global middleware that executes for every procedure request.
	//
	// Middlewares are executed in registration order and can:
	//   - read/augment the HandlerContext
	//   - short-circuit by returning an error
	//   - call next to continue the chain
  func (s *Server[T]) Use(mw GlobalMiddlewareFunc[T]) {
    s.intServer.addGlobalMiddleware(mw)
  }

  // SetErrorHandler sets a global error handler that intercepts and transforms errors
	// from all RPCs before sending them to the client.
	//
	// This handler applies to all RPCs unless a specific handler is registered for an RPC.
	func (s *Server[T]) SetErrorHandler(handler ErrorHandlerFunc[T]) {
    s.intServer.setGlobalErrorHandler(handler)
  }

  // HandleRequest processes an incoming RPC request and drives the complete
	// request lifecycle (parsing, middleware chains, handler dispatch, response).
	//
	// rpcName and procedureName must be extracted from the request URL (e.g. /rpc/MyService/GetUser -> "MyService", "GetUser").
  //
	// httpAdapter bridges VDL RPC with your HTTP framework (use NewNetHTTPAdapter for net/http or compatible).
	//
	// Example (net/http):
  //
	//   http.HandleFunc("POST /rpc/{rpcName}/{procedureName}", func(w http.ResponseWriter, r *http.Request) {
	//       ctx := r.Context()
	//       props := AppProps{UserID: "abc"}
	//       adapter := NewNetHTTPAdapter(w, r)
	//       _ = server.HandleRequest(ctx, props, r.PathValue("rpcName"), r.PathValue("procedureName"), adapter)
	//   })
  func (s *Server[T]) HandleRequest(ctx context.Context, props T, rpcName string, procedureName string, httpAdapter HTTPAdapter) error {
    return s.intServer.handleRequest(ctx, props, rpcName, procedureName, httpAdapter)
  }

  // serverRPCRegistry provides typed access to register handlers and middlewares for procedures within a specific RPC service.
  type serverRPCRegistry[T any] struct {
    intServer *internalServer[T]
  }

  // newServerRPCRegistry creates a new serverRPCRegistry for the given internal server instance.
  func newServerRPCRegistry[T any](intServer *internalServer[T]) *serverRPCRegistry[T] {
    return &serverRPCRegistry[T]{intServer: intServer}
  }
`
);

// src/stages/emit/files/server/generate.ts
function generateServerFile(context) {
  const body = joinSections([
    `package ${context.options.packageName}`,
    renderServerImports(context),
    renderCatalog(context),
    renderCoreRuntime(),
    SERVER_RUNTIME,
    renderServerServices(context)
  ]);
  return createGoFile("server.go", "", body);
}
__name(generateServerFile, "generateServerFile");
function renderServerImports(context) {
  const needsTypesImport = context.services.some(
    (service) => service.procedures.some(
      (procedure) => procedure.inputTypeName || procedure.outputTypeName
    )
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
__name(renderServerImports, "renderServerImports");
function renderServerServices(context) {
  return context.services.map((service) => renderServerService(service, context)).join("\n\n");
}
__name(renderServerServices, "renderServerServices");
function renderServerService(service, context) {
  const rpcStructName = `server${service.goName}RPC`;
  const procsStructName = `server${service.goName}Procs`;
  const g = newGenerator().withTabs();
  writeComment2(
    g,
    `${service.goName} returns the server registry for the ${service.name} RPC service.`,
    service.doc,
    service.deprecated
  );
  g.line(
    `func (r *serverRPCRegistry[T]) ${service.goName}() *${rpcStructName}[T] {`
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
  writeComment2(
    g,
    `${rpcStructName} groups the generated server registration APIs for the ${service.name} RPC service.`
  );
  g.line(`type ${rpcStructName}[T any] struct {`);
  g.block(() => {
    g.line("intServer *internalServer[T]");
    g.line(`Procs *${procsStructName}[T]`);
  });
  g.line("}");
  g.break();
  writeComment2(
    g,
    `Use registers middleware that runs for every request inside the ${service.name} RPC service.`
  );
  g.line(`func (r *${rpcStructName}[T]) Use(mw GlobalMiddlewareFunc[T]) {`);
  g.block(() => {
    g.line(`r.intServer.addRPCMiddleware(${renderGoString(service.name)}, mw)`);
  });
  g.line("}");
  g.break();
  writeComment2(
    g,
    `SetErrorHandler sets the error handler for the ${service.name} RPC service.`
  );
  g.line(
    `func (r *${rpcStructName}[T]) SetErrorHandler(handler ErrorHandlerFunc[T]) {`
  );
  g.block(() => {
    g.line(
      `r.intServer.setRPCErrorHandler(${renderGoString(service.name)}, handler)`
    );
  });
  g.line("}");
  g.break();
  writeComment2(
    g,
    `${procsStructName} exposes the generated procedure registration APIs for the ${service.name} RPC service.`
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
__name(renderServerService, "renderServerService");
function renderServerProcedure(service, procedure, context) {
  const registryName = `server${service.goName}Procs`;
  const entryName = `proc${procedure.procedureTypeName}Entry`;
  const handlerContextName = `${procedure.procedureTypeName}HandlerContext`;
  const handlerFuncName = `${procedure.procedureTypeName}HandlerFunc`;
  const middlewareFuncName = `${procedure.procedureTypeName}MiddlewareFunc`;
  const inputType = getServerInputType(procedure, context);
  const outputType = getServerOutputType(procedure, context);
  const g = newGenerator().withTabs();
  writeComment2(
    g,
    `${procedure.goName} returns the registration entry for the ${service.name}.${procedure.name} procedure.`,
    procedure.doc,
    procedure.deprecated
  );
  g.line(
    `func (r *${registryName}[T]) ${procedure.goName}() ${entryName}[T] {`
  );
  g.block(() => {
    g.line(`return ${entryName}[T]{intServer: r.intServer}`);
  });
  g.line("}");
  g.break();
  writeComment2(
    g,
    `${entryName} contains the generated registration API for the ${service.name}.${procedure.name} procedure.`
  );
  g.line(`type ${entryName}[T any] struct {`);
  g.block(() => {
    g.line("intServer *internalServer[T]");
  });
  g.line("}");
  g.break();
  writeComment2(
    g,
    `${handlerContextName} is the typed handler context passed to ${service.name}.${procedure.name} procedure handlers.`
  );
  g.line(`type ${handlerContextName}[T any] = HandlerContext[T, ${inputType}]`);
  g.break();
  writeComment2(
    g,
    `${handlerFuncName} is the typed handler signature for the ${service.name}.${procedure.name} procedure.`
  );
  g.line(
    `type ${handlerFuncName}[T any] func(c *${handlerContextName}[T]) (${outputType}, error)`
  );
  g.break();
  writeComment2(
    g,
    `${middlewareFuncName} is the typed middleware signature for the ${service.name}.${procedure.name} procedure.`
  );
  g.line(
    `type ${middlewareFuncName}[T any] func(next ${handlerFuncName}[T]) ${handlerFuncName}[T]`
  );
  g.break();
  writeComment2(
    g,
    `Use registers typed middleware for the ${service.name}.${procedure.name} procedure.`
  );
  g.line(`func (e ${entryName}[T]) Use(mw ${middlewareFuncName}[T]) {`);
  g.block(() => {
    g.line(
      `adapted := func(next ProcHandlerFunc[T, any, any]) ProcHandlerFunc[T, any, any] {`
    );
    g.block(() => {
      g.line(`return func(cGeneric *HandlerContext[T, any]) (any, error) {`);
      g.block(() => {
        g.line(
          `typedNext := func(c *${handlerContextName}[T]) (${outputType}, error) {`
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
      `e.intServer.addProcMiddleware(${renderGoString(service.name)}, ${renderGoString(procedure.name)}, adapted)`
    );
  });
  g.line("}");
  g.break();
  writeComment2(
    g,
    `Handle registers the typed business handler for the ${service.name}.${procedure.name} procedure.`
  );
  g.line(`func (e ${entryName}[T]) Handle(handler ${handlerFuncName}[T]) {`);
  g.block(() => {
    g.line(
      `adaptedHandler := func(cGeneric *HandlerContext[T, any]) (any, error) {`
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
            `return nil, fmt.Errorf("failed to unmarshal ${service.name}.${procedure.name} input: %w", err)`
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
      `e.intServer.setProcHandler(${renderGoString(service.name)}, ${renderGoString(procedure.name)}, adaptedHandler, deserializer)`
    );
  });
  g.line("}");
  return g.toString();
}
__name(renderServerProcedure, "renderServerProcedure");
function writeComment2(g, summary, doc, deprecated) {
  g.raw(renderCommentBlock({ summary, doc, deprecated }));
  g.break();
}
__name(writeComment2, "writeComment");
function getServerInputType(procedure, context) {
  return procedure.inputTypeName ? `${getTypesQualifier2(context)}${procedure.inputTypeName}` : "Void";
}
__name(getServerInputType, "getServerInputType");
function getServerOutputType(procedure, context) {
  return procedure.outputTypeName ? `${getTypesQualifier2(context)}${procedure.outputTypeName}` : "Void";
}
__name(getServerOutputType, "getServerOutputType");
function getTypesQualifier2(context) {
  return context.options.typesImport.length > 0 ? "vdltypes." : "";
}
__name(getTypesQualifier2, "getTypesQualifier");

// src/stages/emit/generate-files.ts
function generateFiles(context) {
  if (context.procedures.length === 0) {
    return [];
  }
  return [
    context.options.target === "client" ? generateClientFile(context) : generateServerFile(context)
  ];
}
__name(generateFiles, "generateFiles");

// node_modules/@varavel/vdl-plugin-sdk/dist/utils/ir/get-annotation.js
function getAnnotation(annotations, name) {
  if (!annotations) return void 0;
  return annotations.find((anno) => anno.name === name);
}
__name(getAnnotation, "getAnnotation");

// node_modules/@varavel/vdl-plugin-sdk/dist/utils/ir/get-annotation-arg.js
function getAnnotationArg(annotations, name) {
  const anno = getAnnotation(annotations, name);
  return anno === null || anno === void 0 ? void 0 : anno.argument;
}
__name(getAnnotationArg, "getAnnotationArg");

// node_modules/@varavel/vdl-plugin-sdk/dist/utils/ir/unwrap-literal.js
function unwrapLiteral(value) {
  return unwrapLiteralValue(value);
}
__name(unwrapLiteral, "unwrapLiteral");
function unwrapLiteralValue(value) {
  switch (value.kind) {
    case "string":
      return value.stringValue;
    case "int":
      return value.intValue;
    case "float":
      return value.floatValue;
    case "bool":
      return value.boolValue;
    case "object": {
      var _value$objectEntries;
      const resolvedObject = {};
      const entries = (_value$objectEntries = value.objectEntries) !== null && _value$objectEntries !== void 0 ? _value$objectEntries : [];
      for (const entry of entries) resolvedObject[entry.key] = unwrapLiteralValue(entry.value);
      return resolvedObject;
    }
    case "array":
      var _value$arrayItems;
      return ((_value$arrayItems = value.arrayItems) !== null && _value$arrayItems !== void 0 ? _value$arrayItems : []).map((item) => unwrapLiteralValue(item));
    default:
      return null;
  }
}
__name(unwrapLiteralValue, "unwrapLiteralValue");

// src/stages/model/build-context.ts
function createGeneratorContext(options) {
  const services = [];
  for (const typeDef of options.input.ir.types) {
    if (!getAnnotation(typeDef.annotations, "httpRpc")) {
      continue;
    }
    services.push(buildServiceDescriptor(typeDef));
  }
  const procedures = [];
  for (const service of services) {
    procedures.push(...service.procedures);
  }
  return {
    errors: [],
    context: {
      input: options.input,
      schema: options.input.ir,
      options: options.generatorOptions,
      services,
      procedures
    }
  };
}
__name(createGeneratorContext, "createGeneratorContext");
function buildServiceDescriptor(typeDef) {
  var _a3;
  const proceduresLocal = [];
  for (const field of (_a3 = typeDef.typeRef.objectFields) != null ? _a3 : []) {
    const procedure = buildProcedureDescriptor(typeDef, field);
    if (procedure) {
      proceduresLocal.push(procedure);
    }
  }
  return {
    name: typeDef.name,
    goName: toGoTypeName(typeDef.name),
    position: typeDef.position,
    doc: typeDef.doc,
    deprecated: getDeprecatedMessage(typeDef.annotations),
    annotations: typeDef.annotations,
    procedures: proceduresLocal
  };
}
__name(buildServiceDescriptor, "buildServiceDescriptor");
function buildProcedureDescriptor(serviceType, field) {
  if (!getAnnotation(field.annotations, "proc")) {
    return void 0;
  }
  const inputField = findProcedureField(field, "input");
  const outputField = findProcedureField(field, "output");
  const rpcGoName = toGoTypeName(serviceType.name);
  const goName = toGoFieldName(field.name);
  const procedureTypeName = toInlineTypeName(rpcGoName, field.name);
  return {
    rpcName: serviceType.name,
    rpcGoName,
    name: field.name,
    goName,
    procedureTypeName,
    inputTypeName: inputField ? toInlineTypeName(procedureTypeName, inputField.name) : void 0,
    outputTypeName: outputField ? toInlineTypeName(procedureTypeName, outputField.name) : void 0,
    position: field.position,
    doc: field.doc,
    deprecated: getDeprecatedMessage(field.annotations),
    annotations: field.annotations.filter(
      (annotation) => annotation.name !== "proc"
    ),
    inputField,
    outputField
  };
}
__name(buildProcedureDescriptor, "buildProcedureDescriptor");
function findProcedureField(procedureField, name) {
  var _a3;
  return (_a3 = procedureField.typeRef.objectFields) == null ? void 0 : _a3.find(
    (field) => field.name === name
  );
}
__name(findProcedureField, "findProcedureField");
function getDeprecatedMessage(annotations) {
  const argument = getAnnotationArg(annotations, "deprecated");
  if (!getAnnotation(annotations, "deprecated")) {
    return void 0;
  }
  if (!argument) {
    return "";
  }
  return unwrapLiteral(argument);
}
__name(getDeprecatedMessage, "getDeprecatedMessage");

// node_modules/@varavel/vdl-plugin-sdk/dist/utils/options/get-option-string.js
function getOptionString(options, key, defaultValue) {
  const value = options === null || options === void 0 ? void 0 : options[key];
  return value === void 0 ? defaultValue : value;
}
__name(getOptionString, "getOptionString");

// src/stages/options/resolve.ts
var DEFAULT_JSON_PACKAGE = "encoding/json";
var DEFAULT_PACKAGE_NAME = "vdlrpc";
function resolveGeneratorOptions(input) {
  const packageName = getOptionString(input.options, "package", DEFAULT_PACKAGE_NAME).trim();
  const typesImport = getOptionString(input.options, "typesImport", "").trim();
  const jsonPackage = getOptionString(input.options, "jsonPackage", DEFAULT_JSON_PACKAGE).trim();
  const targetRaw = getOptionString(input.options, "target", "").trim();
  const target = isGeneratorTarget(targetRaw) ? targetRaw : void 0;
  const errors = [];
  if (!target) {
    errors.push({
      message: 'Missing or invalid option "target". Use either "client" or "server".'
    });
  }
  if (!packageName) {
    errors.push({
      message: 'Option "package" cannot be empty when provided.'
    });
  } else if (!isValidGoPackageName(packageName)) {
    errors.push({
      message: `Invalid Go package name ${JSON.stringify(packageName)}. Use a lowercase Go identifier.`
    });
  }
  if (errors.length > 0 || !target) {
    return { errors };
  }
  return {
    errors: [],
    options: {
      jsonPackage: jsonPackage || DEFAULT_JSON_PACKAGE,
      packageName,
      target,
      typesImport
    }
  };
}
__name(resolveGeneratorOptions, "resolveGeneratorOptions");
function isGeneratorTarget(value) {
  return value === "client" || value === "server";
}
__name(isGeneratorTarget, "isGeneratorTarget");

// src/generate.ts
function generate(input) {
  try {
    const optionsResult = resolveGeneratorOptions(input);
    if (optionsResult.errors.length > 0 || !optionsResult.options) {
      return { errors: optionsResult.errors };
    }
    assertValidIrForHttpRpc(input.ir);
    const contextResult = createGeneratorContext({
      input,
      generatorOptions: optionsResult.options
    });
    if (contextResult.errors.length > 0 || !contextResult.context) {
      return { errors: contextResult.errors };
    }
    return {
      files: generateFiles(contextResult.context)
    };
  } catch (error) {
    return {
      errors: [toPluginOutputError(error)]
    };
  }
}
__name(generate, "generate");

// src/index.ts
var generate2 = definePlugin((input) => generate(input));
