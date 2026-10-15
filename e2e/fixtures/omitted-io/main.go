package main

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"

	rpcclient "fixture/internal/client"
	rpcserver "fixture/internal/server"
)

func main() {
	server := rpcserver.NewServer[struct{}]()
	server.RPCs.Commands().Procs.Ping().Handle(func(c *rpcserver.CommandsPingHandlerContext[struct{}]) (rpcserver.Void, error) {
		return rpcserver.Void{}, nil
	})
	server.RPCs.Commands().Procs.Heartbeat().Handle(func(c *rpcserver.CommandsHeartbeatHandlerContext[struct{}]) (rpcserver.Void, error) {
		return rpcserver.Void{}, nil
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), struct{}{}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL + "/rpc").Build()
	if _, err := client.RPCs.Commands().Procs.Ping().Execute(context.Background(), rpcclient.Void{}); err != nil {
		panic(err)
	}

	if _, err := client.RPCs.Commands().Procs.Heartbeat().Execute(context.Background(), rpcclient.Void{}); err != nil {
		panic(err)
	}

	// VPP-2: server accepts missing body and missing Content-Type as empty input.
	req, err := http.NewRequest(http.MethodPost, ts.URL+"/rpc/commands/ping", nil)
	if err != nil {
		panic(err)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		panic(fmt.Sprintf("expected 200 for empty body, got %d", resp.StatusCode))
	}
	body := make([]byte, 64)
	n, _ := resp.Body.Read(body)
	if string(body[:n]) != `{"ok":true}`+"\n" && string(body[:n]) != `{"ok":true}` {
		panic(fmt.Sprintf("expected {\"ok\":true} for empty body, got %q", string(body[:n])))
	}

	fmt.Println("omitted io ok")
}
