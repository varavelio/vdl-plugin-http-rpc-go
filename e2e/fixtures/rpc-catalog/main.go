package main

// Fixture rpc-catalog tests the generated VDLPaths and VDLProcedures metadata.
// Goal: prove precomputed RPCRoute and Path values match the VPP-2 routes.

import (
	"fmt"
	"os"

	rpcclient "fixture/internal/client"
)

func main() {
	if rpcclient.VDLPaths.MyService.MyProc != "/myService/myProc" {
		fail("VDLPaths.MyService.MyProc", "/myService/myProc", rpcclient.VDLPaths.MyService.MyProc)
	}
	if rpcclient.VDLPaths.MyService.MyOtherProc != "/myService/myOtherProc" {
		fail("VDLPaths.MyService.MyOtherProc", "/myService/myOtherProc", rpcclient.VDLPaths.MyService.MyOtherProc)
	}

	found := map[string]bool{}
	for _, operation := range rpcclient.VDLProcedures {
		if operation.RPCName == "MyService" && operation.Name == "myProc" {
			found["myProc"] = true
			if operation.RPCRoute != "myService" {
				fail("VDLProcedures RPCRoute", "myService", operation.RPCRoute)
			}
			if operation.Path != "/myService/myProc" {
				fail("VDLProcedures Path", "/myService/myProc", operation.Path)
			}
		}
		if operation.RPCName == "MyService" && operation.Name == "myOtherProc" {
			found["myOtherProc"] = true
			if operation.RPCRoute != "myService" {
				fail("VDLProcedures RPCRoute", "myService", operation.RPCRoute)
			}
			if operation.Path != "/myService/myOtherProc" {
				fail("VDLProcedures Path", "/myService/myOtherProc", operation.Path)
			}
		}
	}
	if !found["myProc"] {
		fmt.Fprintln(os.Stderr, "myProc not found in VDLProcedures")
		os.Exit(1)
	}
	if !found["myOtherProc"] {
		fmt.Fprintln(os.Stderr, "myOtherProc not found in VDLProcedures")
		os.Exit(1)
	}

	fmt.Println("rpc catalog ok")
}

func fail(name string, expected string, actual string) {
	fmt.Fprintf(os.Stderr, "%s mismatch: expected %q, got %q\n", name, expected, actual)
	os.Exit(1)
}
