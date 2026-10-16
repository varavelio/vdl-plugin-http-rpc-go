package main

// Fixture http-handler tests serving through Server.HTTPHandler on net/http.
// Goal: prove mounted routing, per-request props, 404/405 transport statuses,
// and request/response body caps on both wirings.

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"

	rpcclient "fixture/internal/client"
	rpcserver "fixture/internal/server"
	vdltypes "fixture/internal/types"
)

type appProps struct {
	User string
}

func main() {
	server := rpcserver.NewServer[appProps]()
	echoed := false
	server.RPCs.Service().Procs.Blob().Handle(func(c *rpcserver.ServiceBlobHandlerContext[appProps]) (vdltypes.ServiceBlobOutput, error) {
		return vdltypes.ServiceBlobOutput{Data: strings.Repeat("x", 5<<20)}, nil
	})
	server.RPCs.Service().Procs.Echo().Handle(func(c *rpcserver.ServiceEchoHandlerContext[appProps]) (vdltypes.ServiceEchoOutput, error) {
		echoed = true
		return vdltypes.ServiceEchoOutput{Data: c.Input.Data, User: c.Props.User}, nil
	})

	mux := http.NewServeMux()
	mux.Handle(
		"/rpc/",
		http.StripPrefix("/rpc", server.HTTPHandler(func(r *http.Request) appProps {
			return appProps{User: r.Header.Get("X-User")}
		})),
	)
	mux.HandleFunc("POST /manual/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), appProps{User: r.Header.Get("X-User")}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL+"/rpc").WithHeader("X-User", "gopher").Build()
	// Oversized bodies fail closed with ok:false before any handler runs, on both wirings.
	expectBodyRaw(ts.URL+"/rpc/service/echo", bytes.Repeat([]byte("x"), 5<<20), `{"ok":false,`)
	expectBodyRaw(ts.URL+"/manual/service/echo", bytes.Repeat([]byte("x"), 5<<20), `{"ok":false,`)
	if echoed {
		panic("handler ran for oversized body")
	}

	// The cap is tunable per server.
	server.SetMaxRequestBodyBytes(64)
	expectBodyRaw(ts.URL+"/rpc/service/echo", bytes.Repeat([]byte(`{"data":"hi"}`), 8), `{"ok":false,`)
	if echoed {
		panic("handler ran for over-cap body")
	}
	server.SetMaxRequestBodyBytes(0)

	// Trailing garbage after the JSON value is rejected as invalid input.
	expectBodyRaw(ts.URL+"/rpc/service/echo", []byte(`{"data":"hi"} junk`), `{"ok":false,`)

	// Default error path sanitizes internals: wrong types fail without leaking.
	expectBodyRaw(ts.URL+"/rpc/service/echo", []byte(`{"data":123}`), `{"ok":false,"error":{"message":"Internal error"}}`)
	if echoed {
		panic("handler ran for trailing-garbage body")
	}

	// Oversized responses fail as client transport errors before decoding.
	if _, err := client.RPCs.Service().Procs.Blob().Execute(context.Background(), rpcclient.Void{}); err == nil {
		panic("expected transport error for oversized response")
	}
	bigClient := rpcclient.NewClient(ts.URL + "/rpc").WithMaxResponseBodyBytes(8 << 20).Build()
	blob, err := bigClient.RPCs.Service().Procs.Blob().Execute(context.Background(), rpcclient.Void{})
	if err != nil {
		panic(err)
	}
	if len(blob.Data) != 5<<20 {
		panic(fmt.Sprintf("expected 5MiB blob, got %d bytes", len(blob.Data)))
	}

	result, err := client.RPCs.Service().Procs.Echo().Execute(context.Background(), vdltypes.ServiceEchoInput{Data: "hi"})
	if err != nil {
		panic(err)
	}
	if result.Data != "hi" || result.User != "gopher" {
		panic(fmt.Sprintf("unexpected echo: %#v", result))
	}

	expectStatus(ts.URL+"/rpc/service/echo", http.MethodGet, "", http.StatusMethodNotAllowed)
	expectStatus(ts.URL+"/rpc/service", http.MethodPost, "{}", http.StatusNotFound)
	expectStatus(ts.URL+"/rpc/service/echo/extra", http.MethodPost, "{}", http.StatusNotFound)

	// Unknown procedures keep the standard envelope behavior.
	expectBody(ts.URL+"/rpc/service/nope", `{"ok":false`)
	expectBody(ts.URL+"/rpc/norpc/echo", `{"ok":false`)

	fmt.Println("http handler ok")
}

func expectStatus(url string, method string, body string, expected int) {
	var reader io.Reader
	if body != "" {
		reader = bytes.NewReader([]byte(body))
	}
	req, err := http.NewRequest(method, url, reader)
	if err != nil {
		panic(err)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != expected {
		panic(fmt.Sprintf("expected %d for %s %s, got %d", expected, method, url, resp.StatusCode))
	}
}

func expectBodyRaw(url string, body []byte, prefix string) {
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		panic(err)
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		panic(fmt.Sprintf("expected 200 for %s, got %d", url, resp.StatusCode))
	}
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		panic(err)
	}
	if !strings.HasPrefix(string(raw), prefix) {
		panic(fmt.Sprintf("expected body prefix %q for %s, got %q", prefix, url, string(raw)))
	}
}

func expectBody(url string, prefix string) {
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
	if resp.StatusCode != http.StatusOK {
		panic(fmt.Sprintf("expected 200 for %s, got %d", url, resp.StatusCode))
	}
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		panic(err)
	}
	if !strings.HasPrefix(string(raw), prefix) {
		panic(fmt.Sprintf("expected body prefix %q for %s, got %q", prefix, url, string(raw)))
	}
}
