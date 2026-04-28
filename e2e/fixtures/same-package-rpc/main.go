package main

import (
	"context"
	"fmt"

	rpc "fixture/internal/types"
)

func main() {
	_ = rpc.CalculatorAddInput{A: 10, B: 32}
	client := rpc.NewClient("http://127.0.0.1/rpc").Build()
	_, _ = client.RPCs.Calculator().Procs.Add().Execute(
		context.Background(),
		rpc.CalculatorAddInput{A: 10, B: 32},
	)

	fmt.Println("same package rpc ok")
}
