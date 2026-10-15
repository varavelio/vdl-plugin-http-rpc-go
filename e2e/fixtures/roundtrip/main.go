package main

// Fixture roundtrip tests a typed procedure roundtrip with preserved annotations.
// Goal: prove input, output, and operation annotations survive client to server and back.

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"slices"

	rpcclient "fixture/internal/client"
	rpcserver "fixture/internal/server"
	vdltypes "fixture/internal/types"
)

type AppProps struct {
	AnnotationNames []string
}

func main() {
	server := rpcserver.NewServer[AppProps]()

	server.Use(func(next rpcserver.GlobalHandlerFunc[AppProps]) rpcserver.GlobalHandlerFunc[AppProps] {
		return func(c *rpcserver.HandlerContext[AppProps, any]) (any, error) {
			c.Props.AnnotationNames = annotationNames(c.Annotations)
			return next(c)
		}
	})

	server.RPCs.Chat().Procs.SendMessage().Handle(func(c *rpcserver.ChatSendMessageHandlerContext[AppProps]) (vdltypes.ChatSendMessageOutput, error) {
		expectAnnotationArg(c.Annotations, "cache", "scope", "room")
		return vdltypes.ChatSendMessageOutput{
			Accepted:        true,
			SeenAnnotations: c.Props.AnnotationNames,
		}, nil
	})

	server.RPCs.Chat().Procs.Events().Handle(func(c *rpcserver.ChatEventsHandlerContext[AppProps]) (vdltypes.ChatEventsOutput, error) {
		expectAnnotationArg(c.Annotations, "topic", "name", "messages")
		return vdltypes.ChatEventsOutput{
			Seq:             1,
			Text:            "hello",
			SeenAnnotations: c.Props.AnnotationNames,
		}, nil
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), AppProps{}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL + "/rpc").Build()

	procResult, err := client.RPCs.Chat().Procs.SendMessage().Execute(context.Background(), vdltypes.ChatSendMessageInput{
		RoomId:  "room-1",
		Message: "hello",
	})
	if err != nil {
		panic(err)
	}
	if !procResult.Accepted {
		panic("expected accepted response")
	}
	if !slices.Contains(procResult.SeenAnnotations, "cache") {
		panic(fmt.Sprintf("expected cache annotation in proc result, got %v", procResult.SeenAnnotations))
	}

	eventResult, err := client.RPCs.Chat().Procs.Events().Execute(context.Background(), vdltypes.ChatEventsInput{RoomId: "room-1"})
	if err != nil {
		panic(err)
	}
	if eventResult.Text != "hello" {
		panic(fmt.Sprintf("unexpected event text: %v", eventResult.Text))
	}
	if !slices.Contains(eventResult.SeenAnnotations, "topic") {
		panic(fmt.Sprintf("expected topic annotation in event result, got %v", eventResult.SeenAnnotations))
	}

	fmt.Println("roundtrip ok")
}

func annotationNames(annotations []rpcserver.Annotation) []string {
	result := make([]string, 0, len(annotations))
	for _, annotation := range annotations {
		result = append(result, annotation.Name)
	}
	return result
}

func expectAnnotationArg(annotations []rpcserver.Annotation, name string, key string, expected string) {
	for _, annotation := range annotations {
		if annotation.Name != name {
			continue
		}
		argument, ok := annotation.Argument.(map[string]any)
		if !ok {
			panic(fmt.Sprintf("expected object argument for %s", name))
		}
		value, ok := argument[key].(string)
		if !ok || value != expected {
			panic(fmt.Sprintf("unexpected annotation argument for %s: %#v", name, annotation.Argument))
		}
		return
	}

	panic(fmt.Sprintf("annotation %s not found", name))
}
