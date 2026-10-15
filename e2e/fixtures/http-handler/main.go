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
	server.RPCs.Service().Procs.Echo().Handle(func(c *rpcserver.ServiceEchoHandlerContext[appProps]) (vdltypes.ServiceEchoOutput, error) {
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
