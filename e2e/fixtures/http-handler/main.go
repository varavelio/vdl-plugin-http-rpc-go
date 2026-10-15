package main

// Fixture http-handler tests serving through Server.HTTPHandler on net/http.
// Goal: prove mounted routing, per-request props, and 404/405 transport statuses.

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

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL+"/rpc").WithHeader("X-User", "gopher").Build()
	// Default 4 MiB cap fails closed with 413 before any handler runs.
	expectStatusRaw(ts.URL+"/rpc/service/echo", bytes.Repeat([]byte("x"), 5<<20), http.StatusRequestEntityTooLarge)
	if echoed {
		panic("handler ran for oversized body")
	}

	// The cap is tunable per server.
	server.SetMaxRequestBodyBytes(64)
	expectStatusRaw(ts.URL+"/rpc/service/echo", bytes.Repeat([]byte(`{"data":"hi"}`), 8), http.StatusRequestEntityTooLarge)
	if echoed {
		panic("handler ran for over-cap body")
	}
	server.SetMaxRequestBodyBytes(0)

	// Trailing garbage after the JSON value is rejected as invalid input.
	expectBodyRaw(ts.URL+"/rpc/service/echo", []byte(`{"data":"hi"} junk`), `{"ok":false,`)
	if echoed {
		panic("handler ran for trailing-garbage body")
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

func expectStatusRaw(url string, body []byte, expected int) {
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
	if resp.StatusCode != expected {
		panic(fmt.Sprintf("expected %d for %s, got %d", expected, url, resp.StatusCode))
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
