package main

// Fixture simple-rpc tests a basic procedure roundtrip plus route helpers.
// Goal: prove Calculator.add works and RPCRoute and Path expose the lowerFirst route.

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
	server := rpcserver.NewServer[struct{}]()
	server.RPCs.Calculator().Procs.Add().Handle(func(c *rpcserver.CalculatorAddHandlerContext[struct{}]) (vdltypes.CalculatorAddOutput, error) {
		if c.RPCRoute() != "calculator" {
			panic(fmt.Sprintf("expected RPCRoute calculator, got %q", c.RPCRoute()))
		}
		if c.Path() != "/calculator/add" {
			panic(fmt.Sprintf("expected Path /calculator/add, got %q", c.Path()))
		}
		return vdltypes.CalculatorAddOutput{Sum: c.Input.A + c.Input.B}, nil
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), struct{}{}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL + "/rpc").Build()
	result, err := client.
		RPCs.
		Calculator().
		Procs.
		Add().
		Execute(
			context.Background(),
			vdltypes.CalculatorAddInput{A: 10, B: 32},
		)
	if err != nil {
		panic(err)
	}
	if result.Sum != 42 {
		panic(fmt.Sprintf("expected 42, got %d", result.Sum))
	}

	fmt.Println("simple rpc ok")
}
