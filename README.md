<p align="center">
  <img
    src="https://cdn.jsdelivr.net/gh/varavelio/vdl@9cb843/assets/png/vdl.png"
    alt="VDL logo"
    width="130"
  />
</p>

<h1 align="center">VDL HTTP RPC Golang Plugin</h1>

<p align="center">
  Generate Go <strong>HTTP RPC clients</strong> and <strong>HTTP RPC servers</strong> from annotation-based VDL services.
</p>

<p align="center">
  <a href="https://varavel.com">
    <img
      src="https://cdn.jsdelivr.net/gh/varavelio/brand@1.0.0/dist/badges/project.svg"
      alt="A Varavel project"
    />
  </a>
  <a href="https://varavel.com/vdl">
    <img
      src="https://cdn.jsdelivr.net/gh/varavelio/brand@1.0.0/dist/badges/vdl-plugin.svg"
      alt="VDL Plugin"
    />
  </a>
</p>

<p align="center">
  Strictly follows <a href="https://vdl.varavel.com/docs/protocols/http-rpc/">VPP-2: HTTP-RPC</a>.
</p>

This plugin generates HTTP RPC code only.

Data models come from [`varavelio/vdl-plugin-go`](https://github.com/varavelio/vdl-plugin-go): Generate types first, then point this plugin at them.

## Requirements

- Go `>= 1.27` (the generated code uses generic methods).

## Quick Start

Generate types, then the HTTP RPC client and/or server packages:

```vdl
const config = {
  version 1
  plugins [
    {
      src "varavelio/vdl-plugin-go@<version>" // Use a version from plugin releases
      schema "./schema.vdl"
      outDir "./internal/types"
      options {
        package "types"
      }
    }
    {
      src "varavelio/vdl-plugin-http-rpc-go@<version>" // Use a version from plugin releases
      schema "./schema.vdl"
      outDir "./internal/client"
      options {
        package "client"
        target "client"
        typesImport "example.com/project/internal/types"
      }
    }
    {
      src "varavelio/vdl-plugin-http-rpc-go@<version>" // Use a version from plugin releases
      schema "./schema.vdl"
      outDir "./internal/server"
      options {
        package "server"
        target "server"
        typesImport "example.com/project/internal/types"
      }
    }
  ]
}
```

If you only need one side, keep a single RPC block (`client` or `server`).

## Plugin Options

| Option        | Required | Default         | Meaning                                                                                                |
| ------------- | -------- | --------------- | ------------------------------------------------------------------------------------------------------ |
| `target`      | yes      | -               | What to generate: `client` or `server`.                                                                |
| `typesImport` | no       | -               | Import path of the types package. Empty means the RPC code lives in the same package as the types.     |
| `package`     | no       | `vdlrpc`        | Package name of the generated RPC files.                                                               |
| `jsonPackage` | no       | `encoding/json` | JSON implementation, always imported as `json`. Swap in a stdlib compatible one (e.g. `go-json`) here. |

`target "client"` writes `client.go`, `target "server"` writes `server.go`.

If the schema has no `@httpRpc` service, no RPC file is emitted.

## What You Get

For `target "client"`:

- `NewClient(baseURL).Build()` creates a typed client. `baseURL` is your RPC
  prefix (e.g. `/rpc`); the client appends `/{service}/{procedure}` per VPP-2.
- Typed builders under `client.RPCs.<Service>().Procs` for every procedure.
- Headers and header providers at global, RPC, and operation level.
- Interceptors plus retry and timeout policies per procedure.

For `target "server"`:

- `NewServer[Props]()` with typed handler contexts per procedure.
- Middleware at global, RPC, and procedure level.
- `SetErrorHandler` at global and RPC scope.
- `NewNetHTTPAdapter` + `HandleRequest` for manual wiring, or
  `Server.HTTPHandler` for standard `net/http` mounting.

Both targets include the operation catalogs `VDLPaths` and `VDLProcedures`, with operation annotations preserved as `Annotation` values.

## Services Look Like This

Services are plain VDL types: `@httpRpc` marks the service, `@proc` marks each procedure. `input` and `output` are optional; a missing payload becomes `Void`.

```vdl
@httpRpc
type Messages {
  @proc
  send {
    input {
      roomId string
      text string
    }

    output {
      accepted bool
    }
  }
}
```

## Usage Example

```go
package main

import (
  "context"
  "net/http"

  rpcclient "example.com/project/internal/client"
  rpcserver "example.com/project/internal/server"
  vdltypes "example.com/project/internal/types"
)

func example() {
  server := rpcserver.NewServer[struct{}]()

  server.RPCs.Messages().Procs.Send().Handle(
    func(c *rpcserver.MessagesSendHandlerContext[struct{}]) (vdltypes.MessagesSendOutput, error) {
      return vdltypes.MessagesSendOutput{Accepted: true}, nil
    },
  )

  mux := http.NewServeMux()
  mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
    adapter := rpcserver.NewNetHTTPAdapter(w, r)
    _ = server.HandleRequest(r.Context(), struct{}{}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
  })

  client := rpcclient.NewClient("http://localhost:8080/rpc").Build()
  _, _ = client.RPCs.Messages().Procs.Send().Execute(
    context.Background(),
    vdltypes.MessagesSendInput{RoomId: "room-1", Text: "hello"},
  )
}
```

### Serving with HTTPHandler

Manual wiring gives full control over routing and props. For standard `net/http` servers, `Server.HTTPHandler` removes the boilerplate: it routes `POST /{rpc}/{procedure}` below the mount point and builds props per request.

```go
mux := http.NewServeMux()
mux.Handle("/rpc/", http.StripPrefix("/rpc", server.HTTPHandler(
  func(r *http.Request) appProps {
    return appProps{UserID: r.Header.Get("X-User")}
  },
)))
```

Non-`POST` requests get `405`; paths without exactly two segments get `404`.

## Security

The generated code fails closed by default:

- Request bodies are capped at 4 MiB (`Server.SetMaxRequestBodyBytes` tunes it, `<= 0` restores the default). Oversized bodies get an `ok:false` envelope before any middleware or handler runs.
- Response bodies are capped at 4 MiB on the client (`Client.WithMaxResponseBodyBytes` tunes it), so a hostile server cannot exhaust client memory.
- A body must hold exactly one JSON value; trailing garbage is rejected.
- Inputs are validated against their declared shape before handlers run.
- Annotation data is copied per request, so middleware cannot leak state across requests.
- The default error handler answers `Internal error`: framework prefixes, type names, and decoder details never reach the client. Custom error handlers expose exactly what they return, by your choice.

TLS, rate limiting, and the URLs you trust remain your responsibility, as does whatever your handlers do.

See [SECURITY.md](SECURITY.md).

## License

Released under the MIT License. See [LICENSE](LICENSE).
