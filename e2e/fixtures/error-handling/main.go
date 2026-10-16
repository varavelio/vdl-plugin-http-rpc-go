package main

// Fixture error-handling tests global versus RPC error handlers plus the ok:false envelope.
// Goal: prove handler precedence, application errors arriving with HTTP 200,
// and unencodable errors falling back without leaking internals.

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"

	rpcclient "fixture/internal/client"
	rpcserver "fixture/internal/server"
	vdltypes "fixture/internal/types"
)

func main() {
	server := rpcserver.NewServer[struct{}]()
	server.SetErrorHandler(func(c *rpcserver.HandlerContext[struct{}, any], err error) rpcserver.Error {
		return rpcserver.Error{Message: "Global: " + err.Error()}
	})
	server.RPCs.Auth().SetErrorHandler(func(c *rpcserver.HandlerContext[struct{}, any], err error) rpcserver.Error {
		return rpcserver.Error{Message: "Auth: " + err.Error()}
	})
	server.RPCs.Users().Procs.Get().Handle(func(c *rpcserver.UsersGetHandlerContext[struct{}]) (vdltypes.UsersGetOutput, error) {
		return vdltypes.UsersGetOutput{}, errors.New("fail")
	})
	server.RPCs.Auth().Procs.Login().Handle(func(c *rpcserver.AuthLoginHandlerContext[struct{}]) (vdltypes.AuthLoginOutput, error) {
		return vdltypes.AuthLoginOutput{}, errors.New("fail")
	})
	server.RPCs.Poison().SetErrorHandler(func(c *rpcserver.HandlerContext[struct{}, any], err error) rpcserver.Error {
		return rpcserver.Error{Message: "poison", Details: map[string]any{"fn": func() {}}}
	})
	server.RPCs.Poison().Procs.Pour().Handle(func(c *rpcserver.PoisonPourHandlerContext[struct{}]) (vdltypes.PoisonPourOutput, error) {
		return vdltypes.PoisonPourOutput{}, errors.New("fail")
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), struct{}{}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL + "/rpc").Build()
	_, err := client.RPCs.Users().Procs.Get().Execute(context.Background(), vdltypes.UsersGetInput{})
	assertError(err, "Global: fail")
	_, err = client.RPCs.Auth().Procs.Login().Execute(context.Background(), vdltypes.AuthLoginInput{})
	assertError(err, "Auth: fail")

	// Unencodable error details fall back to a generic envelope with no leaks.
	expectExactBody(ts.URL+"/rpc/poison/pour", `{"ok":false,"error":{"message":"Internal error"}}`)

	fmt.Println("error handling ok")
}

func expectExactBody(url string, expected string) {
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader([]byte(`{}`)))
	if err != nil {
		panic(err)
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		panic(err)
	}
	if string(raw) != expected+"\n" && string(raw) != expected {
		panic(fmt.Sprintf("expected %q, got %q", expected, string(raw)))
	}
}

func assertError(err error, expected string) {
	if err == nil {
		panic("expected error, got nil")
	}
	vdlErr, ok := err.(rpcclient.Error)
	if !ok {
		panic(fmt.Sprintf("expected rpcclient.Error, got %T", err))
	}
	if vdlErr.Message != expected {
		panic(fmt.Sprintf("expected %q, got %q", expected, vdlErr.Message))
	}
}
