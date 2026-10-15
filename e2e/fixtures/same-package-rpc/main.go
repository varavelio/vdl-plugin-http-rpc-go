package main

// Fixture same-package-rpc tests client code generated into the types package.
// Goal: prove no self-import occurs when typesImport is empty.

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
