package main

// Fixture annotations tests annotation propagation across the full spectrum.
// Goal: prove proc annotations (bare, scalar, and object args) reach handlers
// and interceptors verbatim, and service-level annotations stay out.

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"

	rpcclient "fixture/internal/client"
	rpcserver "fixture/internal/server"
	vdltypes "fixture/internal/types"
)

func main() {
	server := rpcserver.NewServer[struct{}]()
	server.RPCs.Service().Procs.Check().Handle(func(c *rpcserver.ServiceCheckHandlerContext[struct{}]) (vdltypes.ServiceCheckOutput, error) {
		expectProcAnnotations(namesOf(c.Annotations, serverName, serverArgument), "handler")
		return vdltypes.ServiceCheckOutput{Ok: true}, nil
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), struct{}{}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL + "/rpc").WithInterceptor(func(ctx context.Context, req rpcclient.RequestInfo, next rpcclient.Invoker) (rpcclient.Response[json.RawMessage], error) {
		expectProcAnnotations(namesOf(req.Annotations, clientName, clientArgument), "interceptor")
		return next(ctx, req)
	}).Build()

	result, err := client.RPCs.Service().Procs.Check().Execute(context.Background(), vdltypes.ServiceCheckInput{Id: "x"})
	if err != nil {
		panic(err)
	}
	if !result.Ok {
		panic("expected ok")
	}

	fmt.Println("annotations ok")
}

func serverName(annotation rpcserver.Annotation) string  { return annotation.Name }
func serverArgument(annotation rpcserver.Annotation) any { return annotation.Argument }
func clientName(annotation rpcclient.Annotation) string  { return annotation.Name }
func clientArgument(annotation rpcclient.Annotation) any { return annotation.Argument }

func namesOf[A any](annotations []A, name func(A) string, argument func(A) any) map[string]any {
	names := map[string]any{}
	for _, annotation := range annotations {
		names[name(annotation)] = argument(annotation)
	}
	return names
}

func expectProcAnnotations(names map[string]any, side string) {
	if _, ok := names["audited"]; !ok {
		panic(fmt.Sprintf("%s: missing bare marker audited", side))
	}
	if names["audited"] != nil {
		panic(fmt.Sprintf("%s: bare marker must carry no argument", side))
	}

	quota, ok := names["quota"].(map[string]any)
	if !ok {
		panic(fmt.Sprintf("%s: missing quota object", side))
	}
	if max, ok := quota["max"].(int64); !ok || max != 100 {
		panic(fmt.Sprintf("%s: bad quota.max: %#v", side, quota["max"]))
	}
	if burst, ok := quota["burst"].(bool); !ok || !burst {
		panic(fmt.Sprintf("%s: bad quota.burst: %#v", side, quota["burst"]))
	}
	tags, ok := quota["tags"].([]any)
	if !ok || len(tags) != 2 || tags[0] != "a" || tags[1] != "b" {
		panic(fmt.Sprintf("%s: bad quota.tags: %#v", side, quota["tags"]))
	}

	if _, ok := names["serviceTag"]; ok {
		panic(fmt.Sprintf("%s: service-level annotations must not propagate", side))
	}
}
