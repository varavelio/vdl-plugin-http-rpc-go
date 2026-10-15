package main

// Fixture void-ops tests procedures with empty input and output objects.
// Goal: prove empty structs roundtrip cleanly through the envelope.

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"

	rpcclient "fixture/internal/client"
	rpcserver "fixture/internal/server"
	vdltypes "fixture/internal/types"
)

func main() {
	isCalled := false

	server := rpcserver.NewServer[struct{}]()
	server.RPCs.Service().Procs.Ping().Handle(func(c *rpcserver.ServicePingHandlerContext[struct{}]) (vdltypes.ServicePingOutput, error) {
		if isCalled {
			panic("ping called multiple times")
		}
		isCalled = true
		return vdltypes.ServicePingOutput{}, nil
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), struct{}{}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL + "/rpc").Build()
	if _, err := client.RPCs.Service().Procs.Ping().Execute(context.Background(), vdltypes.ServicePingInput{}); err != nil {
		panic(err)
	}

	if !isCalled {
		panic("ping not called")
	}

	fmt.Println("void ops ok")
}
