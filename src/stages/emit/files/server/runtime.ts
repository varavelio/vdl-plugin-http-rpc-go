import { dedent } from "@varavel/vdl-plugin-sdk/utils/strings";

export const SERVER_RUNTIME = dedent(/* go */ `
	// -----------------------------------------------------------------------------
	// Server Types
	// -----------------------------------------------------------------------------

	// HTTPAdapter defines the interface required by VDL server to handle
	// incoming HTTP requests and write responses to clients. This abstraction allows
	// the server to work with different HTTP frameworks while maintaining the same
	// core functionality.
	//
	// Implementations must provide methods to read request bodies, set response headers,
	// write response data, and flush the response buffer to ensure immediate delivery
	// to the client.
	type HTTPAdapter interface {
		// RequestBody returns the body reader for the incoming HTTP request.
		// The returned io.Reader allows the server to read the request payload
		// containing RPC call data.
		RequestBody() io.Reader
		// SetHeader sets a response header with the specified key-value pair.
		// This is used to configure response headers like Content-Type and
		// caching directives for procedure responses.
		SetHeader(key, value string)
		// Write writes the provided data to the response body.
		// Returns the number of bytes written and any error encountered.
		// For procedures, this writes the complete JSON response.
		Write(data []byte) (int, error)
		// Flush immediately sends any buffered response data to the client.
		// Returns an error if the flush operation fails.
		Flush() error
	}

	// NetHTTPAdapter implements HTTPAdapter for Go's standard net/http package.
	// This adapter bridges the VDL server with the standard HTTP library, allowing
	// seamless integration with existing HTTP servers and middlewares.
	type NetHTTPAdapter struct {
		responseWriter http.ResponseWriter
		request        *http.Request
	}

	// NewNetHTTPAdapter creates a new NetHTTPAdapter that implements the
	// HTTPAdapter interface for net/http.
	//
	// Parameters:
	//   - w: The http.ResponseWriter to write responses to
	//   - r: The *http.Request containing the incoming request data
	//
	// Returns a HTTPAdapter implementation ready for use with VDL server.
	func NewNetHTTPAdapter(w http.ResponseWriter, r *http.Request) HTTPAdapter {
		if w == nil {
			panic("vdl rpc: NewNetHTTPAdapter requires a non-nil ResponseWriter")
		}
		if r == nil {
			panic("vdl rpc: NewNetHTTPAdapter requires a non-nil Request")
		}
		return &NetHTTPAdapter{
			responseWriter: w,
			request:        r,
		}
	}

	// RequestBody returns the body reader for the HTTP request.
	// This provides access to the request payload containing the RPC call data.
	func (r *NetHTTPAdapter) RequestBody() io.Reader {
		return r.request.Body
	}

	// SetHeader sets a response header with the specified key-value pair.
	// This configures headers for the HTTP response, such as Content-Type
	// for JSON responses.
	func (r *NetHTTPAdapter) SetHeader(key, value string) {
		r.responseWriter.Header().Set(key, value)
	}

	// Write writes the provided data to the HTTP response body.
	// Returns the number of bytes written and any error encountered during writing.
	func (r *NetHTTPAdapter) Write(data []byte) (int, error) {
		return r.responseWriter.Write(data)
	}

	// Flush immediately sends any buffered response data to the client.
	// Flush is a no-op when the writer does not support flushing.
	// If the underlying ResponseWriter doesn't support flushing, this is a no-op.
	func (r *NetHTTPAdapter) Flush() error {
		if f, ok := r.responseWriter.(http.Flusher); ok {
			f.Flush()
		}
		return nil
	}

	// -----------------------------------------------------------------------------
	// Middleware-based Server Architecture
	// -----------------------------------------------------------------------------

	// HandlerContext is the unified container for all request information and state
	// that flows through the entire request processing pipeline.
	//
	// The generic type P represents the user-defined container for application
	// dependencies and request data (e.g., UserID, DB connection, etc.).
	//
	// The generic type I represents the input type, which can be any type depending
	// on the procedure.
	//
	//   - T: The type of the Props field, which is a user-defined container for application and request data.
	//   - I: The type of the Input field, which contains the deserialized request body. For global middlewares, this will be any.
	type HandlerContext[T any, I any] struct {
		// Props is the user-defined container, created per request,
		// for application dependencies and request data (e.g., UserID).
		Props T
		// Input contains the request body, already deserialized and typed.
		// For global middlewares, the type I will be any.
		Input I
		// Context is the standard Go context.Context for cancellations and deadlines.
		Context context.Context
		// Annotations is a slice of annotation objects associated with the request.
		Annotations []Annotation
		// procedure is the details of the RPC procedure including its RPC name and procedure name.
		procedure ProcedureDefinition
	}

	// RPCName returns the name of the RPC service
	func (h *HandlerContext[T, I]) RPCName() string { return h.procedure.RPCName }

	// ProcedureName returns the name of the procedure (e.g. "CreateUser", "GetPost", etc.)
	func (h *HandlerContext[T, I]) ProcedureName() string { return h.procedure.Name }

	// RPCRoute returns the lowerFirst transport segment for the RPC service.
	func (h *HandlerContext[T, I]) RPCRoute() string { return h.procedure.RPCRoute }

	// Path returns the VPP-2 transport path for the current procedure.
	func (h *HandlerContext[T, I]) Path() string { return h.procedure.Path }

	// InputAs returns the request input as O and reports whether it holds that type.
	// Use it in global middleware and error handlers, where Input is any.
	func (h *HandlerContext[T, I]) InputAs[O any]() (O, bool) {
		typed, ok := any(h.Input).(O)
		return typed, ok
	}

	// GlobalHandlerFunc is the signature for a global handler function for procedures.
	//
	//   - T: Application-defined context type (props).
	type GlobalHandlerFunc[T any] func(c *HandlerContext[T, any]) (any, error)

	// GlobalMiddlewareFunc is the signature for a middleware applied to all requests.
	//
	//   - T: Application-defined context type (props).
	type GlobalMiddlewareFunc[T any] func(next GlobalHandlerFunc[T]) GlobalHandlerFunc[T]

	// ProcHandlerFunc is the signature of the final business handler for a proc.
	//
	//   - T: Application-defined context type (props).
	//   - I: Input payload type for the procedure.
	//   - O: Output payload type for the procedure.
	type ProcHandlerFunc[T any, I any, O any] func(c *HandlerContext[T, I]) (O, error)

	// ProcMiddlewareFunc is the signature for a proc-specific typed middleware.
	// It uses a wrapper pattern for a clean composition.
	//
	// This is the same as [GlobalMiddlewareFunc] but for specific procedures and with types.
	//
	//   - T: Application-defined context type (props).
	//   - I: Input payload type for the procedure.
	//   - O: Output payload type for the procedure.
	type ProcMiddlewareFunc[T any, I any, O any] func(next ProcHandlerFunc[T, I, O]) ProcHandlerFunc[T, I, O]

	// DeserializerFunc function convert raw JSON input into typed input prior to handler execution.
	type DeserializerFunc func(raw json.RawMessage) (any, error)

	// ErrorHandlerFunc transforms an internal Go error into a public VDL Error.
	//
	// The handler receives the full request context, enabling structured logging
	// with access to Props, RPC Name, Procedure Name, and other metadata.
	//
	//   - T: Application-defined context type (props).
	type ErrorHandlerFunc[T any] func(c *HandlerContext[T, any], err error) Error

	// -----------------------------------------------------------------------------
	// Internal Server Implementation
	// -----------------------------------------------------------------------------

	// defaultMaxRequestBodyBytes caps request bodies at 4 MiB unless tuned
	// with SetMaxRequestBodyBytes. It bounds memory per request so a hostile
	// client cannot exhaust the server with a huge payload.
	const defaultMaxRequestBodyBytes = 4 << 20

	// internalServer manages RPC request handling and middleware execution for procedures. It maintains handler registrations, middleware
	// chains, and coordinates the complete request lifecycle.
	//
	// The generic type P represents the user context type, allowing users to pass
	// custom data (authentication info, user sessions, etc.) through the entire
	// request processing pipeline.
	//
	//   - T: Application-defined context type (props).
	type internalServer[T any] struct {
		// handlersMu protects all handler maps and middleware slices from concurrent access
		handlersMu sync.RWMutex

		// procedureDefs contains the definition of all registered procedures.
		// Map format: rpcName -> procedureName -> ProcedureDefinition.
		procedureDefs map[string]map[string]ProcedureDefinition

		// procHandlers stores the final implementation functions for procedures
		// Map format: rpcName -> procName -> handler
		procHandlers map[string]map[string]ProcHandlerFunc[T, any, any]

		// maxRequestBodyBytes caps request body bytes per call. Atomic because
		// handleRequest reads it on every request without holding handlersMu.
		maxRequestBodyBytes atomic.Int64

		// globalMiddlewares contains middlewares that run for every procedure request
		globalMiddlewares []GlobalMiddlewareFunc[T]

		// rpcMiddlewares contains middlewares that run for every request within a specific RPC
		// Map format: rpcName -> middlewares
		rpcMiddlewares map[string][]GlobalMiddlewareFunc[T]

		// procMiddlewares contains per-procedure middlewares
		// Map format: rpcName -> procName -> middlewares
		procMiddlewares map[string]map[string][]ProcMiddlewareFunc[T, any, any]

		// procDeserializers contains per-procedure input deserializers
		// Map format: rpcName -> procName -> deserializer
		procDeserializers map[string]map[string]DeserializerFunc

		// globalErrorHandler is the global error handler
		globalErrorHandler ErrorHandlerFunc[T]

		// rpcErrorHandlers contains per-RPC error handlers
		// Map format: rpcName -> handler
		rpcErrorHandlers map[string]ErrorHandlerFunc[T]
	}

	// newInternalServer creates a new VDL server instance with the specified
	// procedure definitions. The server is initialized with empty handler
	// maps and middleware slices, ready for registration.
	//
	// The generic type T represents the user context type, used to pass additional
	// data to handlers, such as authentication information, user sessions, or any
	// other request-scoped data.
	//
	// Parameters:
	//   - procDefs: List of procedure definitions that this server will handle
	//   - T: Application-defined context type (props).
	//
	// Returns a new internalServer instance ready for handler and middleware registration.
	func newInternalServer[T any](procDefs []ProcedureDefinition) *internalServer[T] {
		// Initialize maps
		procedureDefs := make(map[string]map[string]ProcedureDefinition)
		procHandlers := make(map[string]map[string]ProcHandlerFunc[T, any, any])
		rpcMiddlewares := make(map[string][]GlobalMiddlewareFunc[T])
		procMiddlewares := make(map[string]map[string][]ProcMiddlewareFunc[T, any, any])
		procDeserializers := make(map[string]map[string]DeserializerFunc)
		rpcErrorHandlers := make(map[string]ErrorHandlerFunc[T])

		// Helper to ensure RPC map existence
		ensureRPC := func(rpcName string) {
			if _, ok := procedureDefs[rpcName]; !ok {
				procedureDefs[rpcName] = make(map[string]ProcedureDefinition)
				procHandlers[rpcName] = make(map[string]ProcHandlerFunc[T, any, any])
				procMiddlewares[rpcName] = make(map[string][]ProcMiddlewareFunc[T, any, any])
				procDeserializers[rpcName] = make(map[string]DeserializerFunc)
			}
		}

		for _, def := range procDefs {
			ensureRPC(def.RPCName)
			procedureDefs[def.RPCName][def.Name] = def
		}

		built := &internalServer[T]{
			handlersMu:         sync.RWMutex{},
			procedureDefs:      procedureDefs,
			procHandlers:       procHandlers,
			globalMiddlewares:  []GlobalMiddlewareFunc[T]{},
			rpcMiddlewares:     rpcMiddlewares,
			procMiddlewares:    procMiddlewares,
			procDeserializers:  procDeserializers,
			globalErrorHandler: nil,
			rpcErrorHandlers:   rpcErrorHandlers,
		}

		built.maxRequestBodyBytes.Store(defaultMaxRequestBodyBytes)
		return built
	}

	// addGlobalMiddleware registers a global middleware that executes for every procedure request.
	// Middlewares are executed in the order they were registered.
	func (s *internalServer[T]) addGlobalMiddleware(
		mw GlobalMiddlewareFunc[T],
	) *internalServer[T] {
		s.handlersMu.Lock()
		defer s.handlersMu.Unlock()
		s.globalMiddlewares = append(s.globalMiddlewares, mw)
		return s
	}

	// addRPCMiddleware registers a middleware that executes for every request within a specific RPC.
	// Middlewares are executed in the order they were registered.
	func (s *internalServer[T]) addRPCMiddleware(
		rpcName string,
		mw GlobalMiddlewareFunc[T],
	) *internalServer[T] {
		s.handlersMu.Lock()
		defer s.handlersMu.Unlock()
		s.rpcMiddlewares[rpcName] = append(s.rpcMiddlewares[rpcName], mw)
		return s
	}

	// addProcMiddleware registers a wrapper middleware for a specific procedure.
	// Middlewares are executed in the order they were registered.
	func (s *internalServer[T]) addProcMiddleware(
		rpcName string,
		procName string,
		mw ProcMiddlewareFunc[T, any, any],
	) *internalServer[T] {
		s.handlersMu.Lock()
		defer s.handlersMu.Unlock()
		s.procMiddlewares[rpcName][procName] = append(s.procMiddlewares[rpcName][procName], mw)
		return s
	}

	// setGlobalErrorHandler sets the global error handler.
	func (s *internalServer[T]) setGlobalErrorHandler(handler ErrorHandlerFunc[T]) *internalServer[T] {
		s.handlersMu.Lock()
		defer s.handlersMu.Unlock()
		s.globalErrorHandler = handler
		return s
	}

	// setRPCErrorHandler sets the error handler for a specific RPC.
	func (s *internalServer[T]) setRPCErrorHandler(rpcName string, handler ErrorHandlerFunc[T]) *internalServer[T] {
		s.handlersMu.Lock()
		defer s.handlersMu.Unlock()
		s.rpcErrorHandlers[rpcName] = handler
		return s
	}

	// resolveErrorHandler returns the appropriate error handler for the given RPC name.
	// Precedence: RPC > Global > Default (Passthrough)
	func (s *internalServer[T]) resolveErrorHandler(rpcName string) ErrorHandlerFunc[T] {
		s.handlersMu.RLock()
		defer s.handlersMu.RUnlock()

		if handler, ok := s.rpcErrorHandlers[rpcName]; ok && handler != nil {
			return handler
		}
		if s.globalErrorHandler != nil {
			return s.globalErrorHandler
		}

		// Default: sanitized. Internal details (framework prefixes, type names,
		// decoder offsets) never reach the client. Custom handlers receive the
		// raw error and decide what to expose themselves.
		return func(c *HandlerContext[T, any], err error) Error {
			return Error{Message: "Internal error"}
		}
	}

	// setProcHandler registers the final implementation function and deserializer for the specified procedure name.
	// The provided functions are stored as-is. Middlewares are composed at request time.
	//
	// Panics if a handler is already registered for the given procedure name.
	func (s *internalServer[T]) setProcHandler(
		rpcName string,
		procName string,
		handler ProcHandlerFunc[T, any, any],
		deserializer DeserializerFunc,
	) *internalServer[T] {
		s.handlersMu.Lock()
		defer s.handlersMu.Unlock()
		if _, exists := s.procHandlers[rpcName][procName]; exists {
			panic(fmt.Sprintf("the procedure handler for %s.%s is already registered", rpcName, procName))
		}
		s.procHandlers[rpcName][procName] = handler
		s.procDeserializers[rpcName][procName] = deserializer
		return s
	}

	// handleRequest processes an incoming procedure request by parsing the request body,
	// building the global middleware chain, and dispatching to the procedure handler.
	//
	// The request body must contain a JSON object with the input data for the handler.
	// An empty body is accepted as empty input per VPP-2.
	//
	// Parameters:
	//   - ctx: The request context
	//   - props: The VDL context containing user-defined data
	//   - rpcName: The RPC service name from the request URL (lowerFirst form)
	//   - procedureName: The name of the procedure to invoke
	//   - httpAdapter: The HTTP adapter for reading requests and writing responses
	//
	// Returns an error if request processing fails at the transport level.
	func (s *internalServer[T]) handleRequest(
		ctx context.Context,
		props T,
		rpcName string,
		procedureName string,
		httpAdapter HTTPAdapter,
	) error {
		if httpAdapter == nil {
			return fmt.Errorf("the HTTP adapter is nil, please provide a valid adapter")
		}

		// Read the bounded body first so a hostile client cannot exhaust memory.
		// An empty body stays valid empty input per VPP-2. Oversized bodies fail
		// closed with an ok:false envelope before any handler runs.
		maxBody := s.maxRequestBodyBytes.Load()
		body := httpAdapter.RequestBody()
		if body == nil {
			body = bytes.NewReader(nil)
		}
		raw, readErr := io.ReadAll(io.LimitReader(body, maxBody+1))
		if readErr != nil {
			res := Response[any]{
				Ok:    false,
				Error: Error{Message: "Invalid request body"},
			}
			return s.writeProcResponse(httpAdapter, res)
		}
		if int64(len(raw)) > maxBody {
			res := Response[any]{
				Ok:    false,
				Error: Error{Message: "Request body too large"},
			}
			return s.writeProcResponse(httpAdapter, res)
		}

		var rawInput json.RawMessage
		if len(bytes.TrimSpace(raw)) == 0 {
			rawInput = nil
		} else {
			decoder := json.NewDecoder(bytes.NewReader(raw))
			if err := decoder.Decode(&rawInput); err != nil {
				res := Response[any]{
					Ok:    false,
					Error: Error{Message: "Invalid request body"},
				}
				return s.writeProcResponse(httpAdapter, res)
			}
			var trailing any
			if err := decoder.Decode(&trailing); err != io.EOF {
				res := Response[any]{
					Ok:    false,
					Error: Error{Message: "Invalid request body"},
				}
				return s.writeProcResponse(httpAdapter, res)
			}
		}

		procedure, canonicalRPC, canonicalProcedure, procedureExists := s.lookupProcedure(rpcName, procedureName)
		if !procedureExists {
			res := Response[any]{
				Ok:    false,
				Error: Error{Message: fmt.Sprintf("Invalid procedure: %s.%s", rpcName, procedureName)},
			}
			return s.writeProcResponse(httpAdapter, res)
		}

		// Build the unified handler context (raw input at this point).
		c := &HandlerContext[T, any]{
			Input:   rawInput,
			Props:   props,
			Context: ctx,
			Annotations: cloneAnnotations(procedure.Annotations),
			procedure: ProcedureDefinition{
				RPCName:      procedure.RPCName,
				RPCRoute:     procedure.RPCRoute,
				Name:         procedure.Name,
				Path:         procedure.Path,
				Annotations:  cloneAnnotations(procedure.Annotations),
			},
		}

		// Handle Procedure
		output, err := s.handleProcRequest(c, canonicalRPC, canonicalProcedure, rawInput)
		response := Response[any]{}
		if err != nil {
			response.Ok = false
			errorHandler := s.resolveErrorHandler(canonicalRPC)
			response.Error = errorHandler(c, err)
		} else {
			response.Ok = true
			response.Output = output
		}

		return s.writeProcResponse(httpAdapter, response)
	}

	// lookupProcedure resolves an incoming route to its canonical procedure definition.
	//
	// The RPC segment matches the VPP-2 lowerFirst transport form. The canonical
	// VDL service name is returned for handler and middleware lookup.
	func (s *internalServer[T]) lookupProcedure(rpcName string, procedureName string) (ProcedureDefinition, string, string, bool) {
		s.handlersMu.RLock()
		defer s.handlersMu.RUnlock()
		for canonicalRPC, procedures := range s.procedureDefs {
			if procedure, ok := procedures[procedureName]; ok {
				if canonicalRPC == rpcName || procedure.RPCRoute == rpcName {
					return procedure, canonicalRPC, procedureName, true
				}
			}
		}
		return ProcedureDefinition{}, "", "", false
	}

	// handleProcRequest builds the per-request middleware chain for a procedure and executes it.
	// It returns the procedure output (as any) and an error if the handler failed.
	func (s *internalServer[T]) handleProcRequest(
		c *HandlerContext[T, any],
		rpcName string,
		procName string,
		rawInput json.RawMessage,
	) (any, error) {
		// Snapshot handler, middlewares, and deserializer under read lock
		s.handlersMu.RLock()
		baseHandler, ok := s.procHandlers[rpcName][procName]
		mws := s.procMiddlewares[rpcName][procName]
		rpcMws := s.rpcMiddlewares[rpcName]
		deserialize := s.procDeserializers[rpcName][procName]
		s.handlersMu.RUnlock()

		if !ok {
			return nil, fmt.Errorf("%s.%s procedure not implemented", rpcName, procName)
		}
		if deserialize == nil {
			return nil, fmt.Errorf("%s.%s procedure deserializer not registered", rpcName, procName)
		}

		// Deserialize, validate and transform input into its typed form
		typedInput, err := deserialize(rawInput)
		if err != nil {
			return nil, err
		}
		c.Input = typedInput

		// Compose specific per-proc middlewares around the base handler (reverse registration order)
		final := baseHandler
		if len(mws) > 0 {
			mwChain := append([]ProcMiddlewareFunc[T, any, any](nil), mws...)
			for _, m := range slices.Backward(mwChain) {
				final = m(final)
			}
		}

		// Wrap the specific chain with RPC-level middlewares (executed before specific ones)
		exec := func(c *HandlerContext[T, any]) (any, error) { return final(c) }
		if len(rpcMws) > 0 {
			mwChain := append([]GlobalMiddlewareFunc[T](nil), rpcMws...)
			for _, m := range slices.Backward(mwChain) {
				exec = m(exec)
			}
		}

		// Wrap the chain with global middlewares (executed before RPC-level ones)
		if len(s.globalMiddlewares) > 0 {
			mwChain := append([]GlobalMiddlewareFunc[T](nil), s.globalMiddlewares...)
			for _, m := range slices.Backward(mwChain) {
				exec = m(exec)
			}
		}

		return exec(c)
	}

	// writeProcResponse writes a procedure response to the client as JSON.
	// This helper method sets the appropriate Content-Type header and marshals
	// the response data before sending it to the client.
	//
	// Parameters:
	//   - httpAdapter: The HTTP adapter for writing the response
	//   - response: The response data to send to the client
	//
	// Returns an error if writing the response fails.
	func (s *internalServer[T]) writeProcResponse(
		httpAdapter HTTPAdapter,
		response Response[any],
	) error {
		httpAdapter.SetHeader("Content-Type", "application/json")
		_, err := httpAdapter.Write(response.Bytes())
		if err != nil {
			return fmt.Errorf("failed to write response: %w", err)
		}
		return nil
	}

	// -----------------------------------------------------------------------------
	// Server Implementation
	// -----------------------------------------------------------------------------

	// Server provides a high-level, type-safe API for building a VDL RPC server.
	//
	// It exposes:
	//   - Procs: typed entries to register middlewares and the business handler per procedure
	//   - Use: a global middleware API that runs for every procedure
	//
	// The generic type parameter T is your application context (props) that flows through
	// the entire request lifecycle (authentication, per-request data, dependencies, etc.).
	type Server[T any] struct {
		intServer *internalServer[T]
		RPCs      *serverRPCRegistry[T]
	}

	// NewServer creates a new VDL RPC server instance ready to handle all
	// defined procedures using the middleware-based architecture.
	//
	// The generic type parameter T is your application context (props) that flows through
	// the entire request lifecycle (authentication, per-request data, dependencies, etc.).
	//
	// Example:
	//
	//   type AppProps struct {
	//       UserID string
	//   }
	//   s := NewServer[AppProps]()
	func NewServer[T any]() *Server[T] {
		intServer := newInternalServer[T](VDLProcedures)
		return &Server[T]{
			intServer: intServer,
			RPCs: newServerRPCRegistry(intServer),
		}
	}

	// Use registers a global middleware that executes for every procedure request.
	//
	// Middlewares are executed in registration order and can:
	//   - read/augment the HandlerContext
	//   - short-circuit by returning an error
	//   - call next to continue the chain
	func (s *Server[T]) Use(mw GlobalMiddlewareFunc[T]) {
		s.intServer.addGlobalMiddleware(mw)
	}

	// SetErrorHandler sets a global error handler that intercepts and transforms errors
	// from all RPCs before sending them to the client.
	//
	// This handler applies to all RPCs unless a specific handler is registered for an RPC.
	func (s *Server[T]) SetErrorHandler(handler ErrorHandlerFunc[T]) {
		s.intServer.setGlobalErrorHandler(handler)
	}

	// SetMaxRequestBodyBytes caps request body bytes accepted per procedure call.
	// Bodies beyond the cap fail closed with an ok:false envelope before any
	// handler or middleware runs. Values <= 0 restore the 4 MiB default.
	func (s *Server[T]) SetMaxRequestBodyBytes(n int64) {
		if n <= 0 {
			n = defaultMaxRequestBodyBytes
		}
		s.intServer.maxRequestBodyBytes.Store(n)
	}

	// HandleRequest processes an incoming RPC request and drives the complete
	// request lifecycle (parsing, middleware chains, handler dispatch, response).
	//
	// rpcName and procedureName must be extracted from the request URL (e.g. /rpc/MyService/GetUser -> "MyService", "GetUser").
	//
	// httpAdapter bridges VDL RPC with your HTTP framework (use NewNetHTTPAdapter for net/http or compatible).
	//
	// Example (net/http):
	//
	//   http.HandleFunc("POST /rpc/{rpcName}/{procedureName}", func(w http.ResponseWriter, r *http.Request) {
	//       ctx := r.Context()
	//       props := AppProps{UserID: "abc"}
	//       adapter := NewNetHTTPAdapter(w, r)
	//       _ = server.HandleRequest(ctx, props, r.PathValue("rpcName"), r.PathValue("procedureName"), adapter)
	//   })
	func (s *Server[T]) HandleRequest(ctx context.Context, props T, rpcName string, procedureName string, httpAdapter HTTPAdapter) error {
		return s.intServer.handleRequest(ctx, props, rpcName, procedureName, httpAdapter)
	}

	// PropsFunc builds request-scoped props from the incoming HTTP request.
	//
	// Use it with HTTPHandler to derive per-request dependencies (auth data,
	// tenants, request IDs) from headers or context before any middleware runs.
	type PropsFunc[T any] func(r *http.Request) T

	// HTTPHandler returns an http.Handler serving every registered procedure.
	//
	// Mount it under the RPC base path; segments below the mount point must be
	// /{rpc}/{procedure} using the VPP-2 lowerFirst transport form:
	//
	//   mux.Handle("/rpc/", http.StripPrefix("/rpc", server.HTTPHandler(newProps)))
	//
	// Only POST requests route to procedures; anything else gets 405. Paths
	// without exactly two segments get 404. Unknown procedures keep the
	// standard envelope behavior through HandleRequest.
	//
	// propsFn must not be nil; a nil props function panics.
	func (s *Server[T]) HTTPHandler(propsFn PropsFunc[T]) http.Handler {
		if propsFn == nil {
			panic("vdl rpc: HTTPHandler requires a non-nil props function")
		}

		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodPost {
				w.Header().Set("Allow", http.MethodPost)
				http.Error(w, "method not allowed, use POST", http.StatusMethodNotAllowed)
				return
			}

			segments := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
			if len(segments) != 2 || segments[0] == "" || segments[1] == "" {
				http.NotFound(w, r)
				return
			}

			adapter := NewNetHTTPAdapter(w, r)
			_ = s.HandleRequest(r.Context(), propsFn(r), segments[0], segments[1], adapter)
		})
	}

	// serverRPCRegistry provides typed access to register handlers and middlewares for procedures within a specific RPC service.
	type serverRPCRegistry[T any] struct {
		intServer *internalServer[T]
	}

	// newServerRPCRegistry creates a new serverRPCRegistry for the given internal server instance.
	func newServerRPCRegistry[T any](intServer *internalServer[T]) *serverRPCRegistry[T] {
		return &serverRPCRegistry[T]{intServer: intServer}
	}
`);
