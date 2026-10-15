package main

// Fixture context-cancellation tests cancelling an in-flight procedure call.
// Goal: prove the cancelled call returns promptly and the handler observes Done.

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"time"

	rpcclient "fixture/internal/client"
	rpcserver "fixture/internal/server"
	vdltypes "fixture/internal/types"
)

func main() {
	server := rpcserver.NewServer[struct{}]()
	server.RPCs.Service().Procs.Counter().Handle(func(c *rpcserver.ServiceCounterHandlerContext[struct{}]) (vdltypes.ServiceCounterOutput, error) {
		select {
		case <-c.Context.Done():
			return vdltypes.ServiceCounterOutput{}, c.Context.Err()
		case <-time.After(5 * time.Second):
			return vdltypes.ServiceCounterOutput{Count: 1}, nil
		}
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), struct{}{}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL + "/rpc").Build()
	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan error, 1)
	go func() {
		_, err := client.RPCs.Service().Procs.Counter().Execute(ctx, vdltypes.ServiceCounterInput{})
		done <- err
	}()

	time.Sleep(200 * time.Millisecond)
	cancel()

	select {
	case err := <-done:
		if err == nil {
			panic("expected cancellation error, got nil")
		}
	case <-time.After(3 * time.Second):
		panic("expected cancelled proc to finish")
	}

	fmt.Println("context cancellation ok")
}
