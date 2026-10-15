package main

// Fixture omitted-io tests the VPP-2 omitted input and output vectors.
// Goal: prove empty {} bodies, exact {"ok":true} envelopes, and no-body acceptance.

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"sync"

	rpcclient "fixture/internal/client"
	rpcserver "fixture/internal/server"
	vdltypes "fixture/internal/types"
)

type captured struct {
	body        string
	contentType string
}

func main() {
	var mu sync.Mutex
	seen := map[string]captured{}

	server := rpcserver.NewServer[struct{}]()
	server.RPCs.Commands().Procs.Ping().Handle(func(c *rpcserver.CommandsPingHandlerContext[struct{}]) (rpcserver.Void, error) {
		return rpcserver.Void{}, nil
	})
	server.RPCs.Commands().Procs.Heartbeat().Handle(func(c *rpcserver.CommandsHeartbeatHandlerContext[struct{}]) (rpcserver.Void, error) {
		return rpcserver.Void{}, nil
	})
	server.RPCs.Commands().Procs.ClearCache().Handle(func(c *rpcserver.CommandsClearCacheHandlerContext[struct{}]) (rpcserver.Void, error) {
		if c.Input.Namespace != "sessions" {
			panic(fmt.Sprintf("expected namespace sessions, got %q", c.Input.Namespace))
		}
		if c.Path() != "/commands/clearCache" {
			panic(fmt.Sprintf("expected path /commands/clearCache, got %q", c.Path()))
		}
		return rpcserver.Void{}, nil
	})
	server.RPCs.Commands().Procs.RotateKeys().Handle(func(c *rpcserver.CommandsRotateKeysHandlerContext[struct{}]) (vdltypes.CommandsRotateKeysOutput, error) {
		return vdltypes.CommandsRotateKeysOutput{RotatedAt: "now"}, nil
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		raw, _ := io.ReadAll(r.Body)
		r.Body = io.NopCloser(bytes.NewReader(raw))
		mu.Lock()
		seen[r.PathValue("operation")] = captured{body: string(raw), contentType: r.Header.Get("Content-Type")}
		mu.Unlock()

		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), struct{}{}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL + "/rpc").Build()

	// VPP-2: no input sends {} with JSON content type.
	if _, err := client.RPCs.Commands().Procs.Ping().Execute(context.Background(), rpcclient.Void{}); err != nil {
		panic(err)
	}
	expectCaptured(seen, &mu, "ping", "{}", "application/json")

	if _, err := client.RPCs.Commands().Procs.Heartbeat().Execute(context.Background(), rpcclient.Void{}); err != nil {
		panic(err)
	}

	// VPP-2: input-only sends input and receives exactly {"ok":true}.
	if _, err := client.RPCs.Commands().Procs.ClearCache().Execute(context.Background(), vdltypes.CommandsClearCacheInput{Namespace: "sessions"}); err != nil {
		panic(err)
	}
	expectBody(postJSON(ts.URL+"/rpc/commands/clearCache", `{"namespace":"sessions"}`), `{"ok":true}`)

	// VPP-2: output-only sends {} and receives {"ok":true,"output":{...}}.
	rotated, err := client.RPCs.Commands().Procs.RotateKeys().Execute(context.Background(), rpcclient.Void{})
	if err != nil {
		panic(err)
	}
	if rotated.RotatedAt != "now" {
		panic(fmt.Sprintf("expected rotatedAt now, got %q", rotated.RotatedAt))
	}
	expectCaptured(seen, &mu, "rotateKeys", "{}", "application/json")
	expectBody(postJSON(ts.URL+"/rpc/commands/rotateKeys", `{}`), `{"ok":true,"output":{"rotatedAt":"now"}}`)

	// VPP-2: server accepts missing body and missing Content-Type as empty input.
	expectBody(postNoBody(ts.URL+"/rpc/commands/ping"), `{"ok":true}`)

	fmt.Println("omitted io ok")
}

func expectCaptured(seen map[string]captured, mu *sync.Mutex, operation string, body string, contentType string) {
	mu.Lock()
	defer mu.Unlock()
	got, ok := seen[operation]
	if !ok {
		panic(fmt.Sprintf("no request captured for %s", operation))
	}
	if got.body != body {
		panic(fmt.Sprintf("expected body %q for %s, got %q", body, operation, got.body))
	}
	if got.contentType != contentType {
		panic(fmt.Sprintf("expected content type %q for %s, got %q", contentType, operation, got.contentType))
	}
}

func postJSON(url string, body string) *http.Response {
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader([]byte(body)))
	if err != nil {
		panic(err)
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	return resp
}

func postNoBody(url string) *http.Response {
	req, err := http.NewRequest(http.MethodPost, url, nil)
	if err != nil {
		panic(err)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	return resp
}

func expectBody(resp *http.Response, expected string) {
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		panic(fmt.Sprintf("expected 200, got %d", resp.StatusCode))
	}
	if got := resp.Header.Get("Content-Type"); got != "application/json" {
		panic(fmt.Sprintf("expected response content type application/json, got %q", got))
	}
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		panic(err)
	}
	if string(raw) != expected+"\n" && string(raw) != expected {
		panic(fmt.Sprintf("expected %q, got %q", expected, string(raw)))
	}
}
