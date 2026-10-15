package main

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

	server.RPCs.Jobs().Procs.Create().Handle(func(c *rpcserver.JobsCreateHandlerContext[struct{}]) (vdltypes.JobsCreateOutput, error) {
		return vdltypes.JobsCreateOutput{Attempts: 2}, nil
	})

	server.RPCs.Jobs().Procs.Updates().Handle(func(c *rpcserver.JobsUpdatesHandlerContext[struct{}]) (vdltypes.JobsUpdatesOutput, error) {
		return vdltypes.JobsUpdatesOutput{Seq: 1}, nil
	})

	var procAttempts atomic.Int32
	var updatesAttempts atomic.Int32

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		switch r.PathValue("operation") {
		case "create":
			if procAttempts.Add(1) == 1 {
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
		case "updates":
			if updatesAttempts.Add(1) == 1 {
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
		}

		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), struct{}{}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL + "/rpc").Build()

	var sawHighAnnotation atomic.Bool
	retryConf := rpcclient.RetryConfig{
		MaxAttempts:     2,
		InitialDelay:    10 * time.Millisecond,
		MaxDelay:        10 * time.Millisecond,
		DelayMultiplier: 1,
		Jitter:          0,
		ShouldRetry: func(_ context.Context, info rpcclient.RetryDecisionContext) bool {
			sawHighAnnotation.Store(matchAnnotation(info.Request.Annotations, "retryable", "level", "high"))
			return sawHighAnnotation.Load() && info.ResponseStatus == http.StatusInternalServerError
		},
	}

	procResult, err := client.RPCs.Jobs().Procs.Create().WithRetryConfig(retryConf).Execute(context.Background(), vdltypes.JobsCreateInput{Name: "demo"})
	if err != nil {
		panic(err)
	}
	if procResult.Attempts != 2 {
		panic(fmt.Sprintf("expected 2 attempts in proc output, got %d", procResult.Attempts))
	}
	if !sawHighAnnotation.Load() {
		panic("retry decider did not observe the retryable annotation")
	}

	var sawLowAnnotation atomic.Bool
	updatesRetryConf := rpcclient.RetryConfig{
		MaxAttempts:     2,
		InitialDelay:    10 * time.Millisecond,
		MaxDelay:        10 * time.Millisecond,
		DelayMultiplier: 1,
		Jitter:          0,
		ShouldRetry: func(_ context.Context, info rpcclient.RetryDecisionContext) bool {
			sawLowAnnotation.Store(matchAnnotation(info.Request.Annotations, "retryable", "level", "low"))
			return sawLowAnnotation.Load() && info.ResponseStatus == http.StatusInternalServerError
		},
	}

	updatesResult, err := client.RPCs.Jobs().Procs.Updates().WithRetryConfig(updatesRetryConf).Execute(context.Background(), vdltypes.JobsUpdatesInput{WorkerId: "worker-1"})
	if err != nil {
		panic(err)
	}
	if updatesResult.Seq != 1 {
		panic(fmt.Sprintf("expected updates seq 1, got %d", updatesResult.Seq))
	}
	if !sawLowAnnotation.Load() {
		panic("retry decider did not observe the low retryable annotation")
	}

	fmt.Println("client policies ok")
}

func matchAnnotation(annotations []rpcclient.Annotation, name string, key string, expected string) bool {
	for _, annotation := range annotations {
		if annotation.Name != name {
			continue
		}
		argument, ok := annotation.Argument.(map[string]any)
		if !ok {
			return false
		}
		value, ok := argument[key].(string)
		return ok && value == expected
	}

	return false
}
