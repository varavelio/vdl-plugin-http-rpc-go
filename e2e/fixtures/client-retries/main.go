package main

// Fixture client-retries tests automatic retries of a flaky procedure failing with 500s.
// Goal: prove the call succeeds once the server recovers within MaxAttempts,
// and empty transport responses surface as errors instead of panics.

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"time"

	rpcclient "fixture/internal/client"
	rpcserver "fixture/internal/server"
	vdltypes "fixture/internal/types"
)

func main() {
	server := rpcserver.NewServer[struct{}]()
	var attempts atomic.Int32

	server.RPCs.Service().Procs.Flaky().Handle(func(c *rpcserver.ServiceFlakyHandlerContext[struct{}]) (vdltypes.ServiceFlakyOutput, error) {
		if attempts.Add(1) < 3 {
			panic("simulated server error")
		}
		return vdltypes.ServiceFlakyOutput{}, nil
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if recover() != nil {
				w.WriteHeader(http.StatusInternalServerError)
			}
		}()
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), struct{}{}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL + "/rpc").Build()

	// A transport that answers nothing surfaces as an error, never a panic.
	nilClient := rpcclient.NewClient(ts.URL + "/rpc").WithHTTPClient(&http.Client{Transport: nilTransport{}}).Build()
	if _, err := nilClient.RPCs.Service().Procs.Flaky().Execute(context.Background(), vdltypes.ServiceFlakyInput{}); err == nil {
		panic("expected error for empty transport response")
	}

	// MaxAttempts below 1 clamps to a single attempt instead of skipping the call.
	base := attempts.Load()
	if _, err := client.RPCs.Service().Procs.Flaky().WithRetryConfig(rpcclient.RetryConfig{}).Execute(context.Background(), vdltypes.ServiceFlakyInput{}); err == nil {
		panic("expected transport error for single failed attempt")
	}
	if attempts.Load()-base != 1 {
		panic(fmt.Sprintf("expected 1 attempt, got %d", attempts.Load()-base))
	}
	attempts.Store(0)

	retryConf := rpcclient.RetryConfig{
		MaxAttempts:     3,
		InitialDelay:    10 * time.Millisecond,
		MaxDelay:        100 * time.Millisecond,
		DelayMultiplier: 1,
		Jitter:          0,
	}

	if _, err := client.RPCs.Service().Procs.Flaky().WithRetryConfig(retryConf).Execute(context.Background(), vdltypes.ServiceFlakyInput{}); err != nil {
		panic(err)
	}
	if attempts.Load() != 3 {
		panic(fmt.Sprintf("expected 3 attempts, got %d", attempts.Load()))
	}

	fmt.Println("client retries ok")
}

type nilTransport struct{}

func (nilTransport) RoundTrip(*http.Request) (*http.Response, error) {
	return nil, nil
}
