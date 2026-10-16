import { dedent } from "@varavel/vdl-plugin-sdk/utils/strings";

export const CLIENT_RUNTIME = dedent(/* go */ `
	// -----------------------------------------------------------------------------
	// Client Types
	// -----------------------------------------------------------------------------

	// RequestInfo contains information about the RPC request currently being executed.
	//
	// It is passed through interceptors and retry deciders so callers can
	// inspect the targeted RPC, procedure, request payload, and the
	// non-marker annotations declared on the VDL procedure.
	type RequestInfo struct {
		RPCName string
		ProcName string
		Input any
		Annotations []Annotation
	}

	// InputAs returns the request input as O and reports whether it holds that type.
	// Use it in interceptors and retry deciders, where Input is any.
	func (r RequestInfo) InputAs[O any]() (O, bool) {
		typed, ok := r.Input.(O)
		return typed, ok
	}

	// RetryDecisionContext contains the information passed to a retry decider.
	//
	// The generated client evaluates this context after each failed attempt so
	// callers can decide whether the request should be retried.
	type RetryDecisionContext struct {
		Request RequestInfo
		Attempt int
		ResponseStatus int
		Error error
	}

	// RetryDecider determines whether a failed procedure attempt should be retried.
	type RetryDecider func(ctx context.Context, info RetryDecisionContext) bool

	// RetryConfig defines retry behavior for generated procedure calls.
	//
	// Parameters:
	//   - MaxAttempts: Maximum number of retry attempts (default: 1)
	//   - InitialDelay: Initial delay between retries (default: 0)
	//   - MaxDelay: Maximum delay between retries (default: 0)
	//   - DelayMultiplier: Cumulative multiplier applied to InitialDelay on each retry (default: 1.0)
	//   - Jitter: Randomness factor used to avoid synchronized retries (default: 0.2)
	//   - ShouldRetry: Optional callback that can override the default retry decision function
	type RetryConfig struct {
		MaxAttempts int
		InitialDelay time.Duration
		MaxDelay time.Duration
		DelayMultiplier float64
		Jitter float64
		ShouldRetry RetryDecider
	}

	// TimeoutConfig defines timeout behavior for procedure calls.
	type TimeoutConfig struct {
		// Request Timeout (default: 30 seconds)
		Timeout time.Duration
	}

	// HeaderProvider receives the current headers and mutates them in place.
	//
	// It is called before every request, including retries.
	// If an error is returned, the request is aborted.
	type HeaderProvider func(ctx context.Context, h http.Header) error

	// Invoker is the final step in the interceptor chain that performs the actual request.
	type Invoker func(ctx context.Context, req RequestInfo) (Response[json.RawMessage], error)

	// Interceptor is middleware that wraps request execution.
	type Interceptor func(ctx context.Context, req RequestInfo, next Invoker) (Response[json.RawMessage], error)

	// -----------------------------------------------------------------------------
	// Internal Client Implementation
	// -----------------------------------------------------------------------------

	// internalClient is the core engine used by the generated client abstraction.
	//
	// It is safe for concurrent use and can be reused across procedure calls. The zero value is not usable; use newInternalClient.
	//
	// The zero value is not usable – use newInternalClient to construct one.
	type internalClient struct {
		// Immutable after construction.
		baseURL string
		httpClient *http.Client
		procDefs map[string]map[string]ProcDefinition

		// Dynamic components
		headerProviders []HeaderProvider
		interceptors []Interceptor

		// RPC specific header providers
		rpcHeaderProviders map[string][]HeaderProvider

		// Default Configurations
		globalRetryConf *RetryConfig
		globalTimeoutConf *TimeoutConfig

		// Per-RPC Default Configurations
		rpcRetryConf map[string]*RetryConfig
		rpcTimeoutConf map[string]*TimeoutConfig

		// Immutable after construction.
		maxResponseBodyBytes int64

		// mu protects concurrent access to the configuration maps
		mu sync.RWMutex
	}

	// internalClientOption configures an internal client during construction.
	type internalClientOption func(*internalClient)

	// withHTTPClient supplies a custom HTTP client implementation.
	func withHTTPClient(client *http.Client) internalClientOption {
		return func(value *internalClient) {
			if client != nil {
				value.httpClient = client
			}
		}
	}

	// withGlobalHeader registers a static header for every request.
	func withGlobalHeader(key string, value string) internalClientOption {
		return func(client *internalClient) {
			client.headerProviders = append(client.headerProviders, func(_ context.Context, h http.Header) error {
				h.Set(key, value)
				return nil
			})
		}
	}

	// withHeaderProvider registers a dynamic header provider.
	func withHeaderProvider(provider HeaderProvider) internalClientOption {
		return func(client *internalClient) {
			client.headerProviders = append(client.headerProviders, provider)
		}
	}

	// withInterceptor adds a transport interceptor.
	func withInterceptor(interceptor Interceptor) internalClientOption {
		return func(client *internalClient) {
			client.interceptors = append(client.interceptors, interceptor)
		}
	}

	// withGlobalRetryConfig sets the global default retry configuration.
	func withGlobalRetryConfig(conf RetryConfig) internalClientOption {
		return func(client *internalClient) {
			client.globalRetryConf = &conf
		}
	}

	// withGlobalTimeoutConfig sets the global default timeout configuration.
	func withGlobalTimeoutConfig(conf TimeoutConfig) internalClientOption {
		return func(client *internalClient) {
			client.globalTimeoutConf = &conf
		}
	}

	// defaultMaxResponseBodyBytes caps response bodies at 4 MiB unless tuned
	// with WithMaxResponseBodyBytes. It bounds memory per call so a hostile
	// server cannot exhaust the client with a huge payload.
	const defaultMaxResponseBodyBytes = 4 << 20

	// withMaxResponseBodyBytes caps response body bytes accepted per call.
	// Values <= 0 restore the 4 MiB default.
	func withMaxResponseBodyBytes(n int64) internalClientOption {
		return func(client *internalClient) {
			if n <= 0 {
				n = defaultMaxResponseBodyBytes
			}
			client.maxResponseBodyBytes = n
		}
	}

	// newInternalClient creates a new internalClient capable of talking to the VDL server.
	//
	// The caller can optionally pass functional options to customize transport
	// behavior, headers, interceptors, and retry policies.
	func newInternalClient(baseURL string, defs []ProcDefinition, opts ...internalClientOption) *internalClient {
		procDefs := make(map[string]map[string]ProcDefinition)

		ensureRPC := func(rpcName string) {
			if _, ok := procDefs[rpcName]; !ok {
				procDefs[rpcName] = make(map[string]ProcDefinition)
			}
		}

		for _, def := range defs {
			ensureRPC(def.RPCName)
			procDefs[def.RPCName][def.Name] = def
		}


		client := &internalClient{
			baseURL: strings.TrimRight(baseURL, "/"),
			httpClient: http.DefaultClient,
			maxResponseBodyBytes: defaultMaxResponseBodyBytes,
			procDefs: procDefs,
			headerProviders: []HeaderProvider{},
			interceptors: []Interceptor{},
			rpcHeaderProviders: make(map[string][]HeaderProvider),
			rpcRetryConf: make(map[string]*RetryConfig),
			rpcTimeoutConf: make(map[string]*TimeoutConfig),
		}

		// Apply functional options.
		for _, opt := range opts {
			opt(client)
		}

		return client
	}

	// setRPCRetryConfig sets the default retry configuration for a specific RPC service.
	func (c *internalClient) setRPCRetryConfig(rpcName string, conf RetryConfig) {
		c.mu.Lock()
		defer c.mu.Unlock()
		c.rpcRetryConf[rpcName] = &conf
	}

	// setRPCTimeoutConfig sets the default timeout configuration for a specific RPC service.
	func (c *internalClient) setRPCTimeoutConfig(rpcName string, conf TimeoutConfig) {
		c.mu.Lock()
		defer c.mu.Unlock()
		c.rpcTimeoutConf[rpcName] = &conf
	}

	// setRPCHeaderProvider adds a header provider for a specific RPC service.
	func (c *internalClient) setRPCHeaderProvider(rpcName string, provider HeaderProvider) {
		c.mu.Lock()
		defer c.mu.Unlock()
		c.rpcHeaderProviders[rpcName] = append(c.rpcHeaderProviders[rpcName], provider)
	}

	// mergeRetryConfig resolves retry configuration using this precedence:
	// procedure override > RPC override > global override > default.
	func (c *internalClient) mergeRetryConfig(rpcName string, opConf *RetryConfig) *RetryConfig {
		if opConf != nil {
			return opConf
		}
		c.mu.RLock()
		defer c.mu.RUnlock()
		if rpcConf, ok := c.rpcRetryConf[rpcName]; ok {
			return rpcConf
		}
		if c.globalRetryConf != nil {
			return c.globalRetryConf
		}
		return &RetryConfig{
			MaxAttempts: 1,
			InitialDelay: 0,
			MaxDelay: 0,
			DelayMultiplier: 1.0,
			Jitter: 0.2,
		}
	}

	// mergeTimeoutConfig resolves timeout configuration using this precedence:
	// procedure override > RPC override > global override > default.
	func (c *internalClient) mergeTimeoutConfig(rpcName string, opConf *TimeoutConfig) *TimeoutConfig {
		if opConf != nil {
			return opConf
		}
		c.mu.RLock()
		defer c.mu.RUnlock()

		if rpcConf, ok := c.rpcTimeoutConf[rpcName]; ok {
			return rpcConf
		}
		if c.globalTimeoutConf != nil {
			return c.globalTimeoutConf
		}
		return &TimeoutConfig{Timeout: 30 * time.Second}
	}

	// executeChain builds the interceptor chain and executes the final invoker.
	func (c *internalClient) executeChain(ctx context.Context, req RequestInfo, final Invoker) (Response[json.RawMessage], error) {
		chain := final
		for _, middleware := range slices.Backward(c.interceptors) {
			next := chain
			chain = func(callCtx context.Context, callReq RequestInfo) (Response[json.RawMessage], error) {
				return middleware(callCtx, callReq, next)
			}
		}
		return chain(ctx, req)
	}

	// lookupProc returns the generated procedure definition for the requested RPC member.
	func (c *internalClient) lookupProc(rpcName string, procName string) (ProcDefinition, bool) {
		if procs, ok := c.procDefs[rpcName]; ok {
			proc, ok := procs[procName]
			return proc, ok
		}
		return ProcDefinition{}, false
	}

	// proc invokes the given procedure and returns the raw wire envelope.
	func (c *internalClient) proc(
		ctx context.Context, 
		rpcName string, 
		procName string, 
		input any, 
		opHeaderProviders []HeaderProvider, 
		opRetryConf *RetryConfig,
		opTimeoutConf *TimeoutConfig,
	) Response[json.RawMessage] {
		proc, ok := c.lookupProc(rpcName, procName)
		if !ok {
			return Response[json.RawMessage]{
				Ok: false,
				Error: Error{
					Category: "ClientError",
					Code: "INVALID_PROC",
					Message: fmt.Sprintf("%s.%s procedure not found in schema", rpcName, procName),
					Details: map[string]any{"rpc": rpcName, "procedure": procName},
				},
			}
		}

		reqInfo := RequestInfo{
			RPCName: rpcName,
			ProcName: procName,
			Input: input,
			Annotations: cloneAnnotations(proc.Annotations),
		}

		invoker := func(callCtx context.Context, req RequestInfo) (Response[json.RawMessage], error) {
			retryConf := c.mergeRetryConfig(req.RPCName, opRetryConf)
			timeoutConf := c.mergeTimeoutConfig(req.RPCName, opTimeoutConf)
			maxAttempts := retryConf.MaxAttempts
			if maxAttempts < 1 {
				maxAttempts = 1
			}

			payload, err := encodeRequestPayload(req.Input)
			if err != nil {
				return Response[json.RawMessage]{
					Ok: false,
					Error: Error{
						Category: "ClientError",
						Code: "ENCODE_INPUT",
						Message: fmt.Sprintf("failed to marshal input for %s.%s: %v", req.RPCName, req.ProcName, err),
					},
				}, nil
			}

			url := c.baseURL + proc.Path
			var last Response[json.RawMessage]

			for attempt := 1; attempt <= maxAttempts; attempt++ {
				attemptCtx := callCtx
				var cancel context.CancelFunc
				if timeoutConf.Timeout > 0 {
					attemptCtx, cancel = context.WithTimeout(callCtx, timeoutConf.Timeout)
				}

				res, defaultRetry, statusCode, decisionErr := c.doRequest(attemptCtx, req, url, payload, opHeaderProviders)
				if cancel != nil {
					cancel()
				}

				last = res
				shouldRetry := defaultRetry
				if retryConf.ShouldRetry != nil {
					shouldRetry = retryConf.ShouldRetry(callCtx, RetryDecisionContext{
						Request: req,
						Attempt: attempt,
						ResponseStatus: statusCode,
						Error: decisionErr,
					})
				}

				if !shouldRetry || attempt >= maxAttempts {
					return res, nil
				}

				if err := waitForBackoff(callCtx, calculateBackoff(retryConf, attempt)); err != nil {
					return Response[json.RawMessage]{Ok: false, Error: ToError(err)}, nil
				}
			}

			return last, nil
		}

		res, err := c.executeChain(ctx, reqInfo, invoker)
		if err != nil {
			return Response[json.RawMessage]{Ok: false, Error: ToError(err)}
		}

		return res
	}

	// doRequest performs a single HTTP request attempt.
	func (c *internalClient) doRequest(
		ctx context.Context, 
		req RequestInfo, 
		url string, 
		payload []byte, 
		opHeaderProviders []HeaderProvider,
	) (Response[json.RawMessage], bool, int, error) {
		httpRequest, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(payload))
		if err != nil {
			wrapped := fmt.Errorf("failed to create HTTP request: %w", err)
			return Response[json.RawMessage]{Ok: false, Error: ToError(wrapped)}, false, 0, wrapped
		}

		httpRequest.Header.Set("Content-Type", "application/json")
		httpRequest.Header.Set("Accept", "application/json")

		if err := c.applyHeaderProviders(ctx, req.RPCName, httpRequest.Header, opHeaderProviders); err != nil {
			wrapped := fmt.Errorf("failed to apply headers: %w", err)
			return Response[json.RawMessage]{Ok: false, Error: ToError(wrapped)}, false, 0, wrapped
		}

		response, err := c.httpClient.Do(httpRequest)
		if err != nil {
			if errors.Is(ctx.Err(), context.Canceled) {
				wrapped := context.Canceled
				return Response[json.RawMessage]{Ok: false, Error: ToError(wrapped)}, false, 0, wrapped
			}

			if errors.Is(ctx.Err(), context.DeadlineExceeded) {
				timeoutErr := Error{
					Category: "TimeoutError",
					Code: "REQUEST_TIMEOUT",
					Message: "Request timeout",
				}
				return Response[json.RawMessage]{Ok: false, Error: timeoutErr}, true, 0, timeoutErr
			}

			wrapped := fmt.Errorf("http request failed: %w", err)
			return Response[json.RawMessage]{Ok: false, Error: ToError(wrapped)}, true, 0, wrapped
		}
		if response == nil {
			wrapped := fmt.Errorf("http request failed: empty response")
			return Response[json.RawMessage]{Ok: false, Error: ToError(wrapped)}, true, 0, wrapped
		}
		defer response.Body.Close()

		if response.StatusCode >= 500 {
			httpErr := Error{
				Category: "HTTPError",
				Code: "BAD_STATUS",
				Message: fmt.Sprintf("unexpected HTTP status: %s", response.Status),
				Details: map[string]any{"status": response.StatusCode},
			}
			return Response[json.RawMessage]{Ok: false, Error: httpErr}, true, response.StatusCode, httpErr
		}

		if response.StatusCode < 200 || response.StatusCode >= 300 {
			httpErr := Error{
				Category: "HTTPError",
				Code: "BAD_STATUS",
				Message: fmt.Sprintf("unexpected HTTP status: %s", response.Status),
				Details: map[string]any{"status": response.StatusCode},
			}
			return Response[json.RawMessage]{Ok: false, Error: httpErr}, false, response.StatusCode, httpErr
		}

		var raw struct {
			Ok bool \`json:"ok"\`
			Output json.RawMessage \`json:"output"\`
			Error Error \`json:"error"\`
		}

		rawBody, readErr := io.ReadAll(io.LimitReader(response.Body, c.maxResponseBodyBytes+1))
		if readErr != nil {
			wrapped := fmt.Errorf("failed to read response: %w", readErr)
			return Response[json.RawMessage]{Ok: false, Error: ToError(wrapped)}, false, response.StatusCode, wrapped
		}
		if int64(len(rawBody)) > c.maxResponseBodyBytes {
			wrapped := fmt.Errorf("response body too large")
			return Response[json.RawMessage]{Ok: false, Error: ToError(wrapped)}, false, response.StatusCode, wrapped
		}
		if err := json.NewDecoder(bytes.NewReader(rawBody)).Decode(&raw); err != nil {
			wrapped := fmt.Errorf("failed to decode response: %w", err)
			return Response[json.RawMessage]{Ok: false, Error: ToError(wrapped)}, false, response.StatusCode, wrapped
		}

		if !raw.Ok {
			return Response[json.RawMessage]{Ok: false, Error: raw.Error}, false, response.StatusCode, raw.Error
		}

		return Response[json.RawMessage]{Ok: true, Output: raw.Output}, false, response.StatusCode, nil
	}

	// applyHeaderProviders applies global, RPC-scoped, and per-procedure header providers in order.
	func (c *internalClient) applyHeaderProviders(ctx context.Context, rpcName string, header http.Header, opHeaderProviders []HeaderProvider) error {
		for _, provider := range c.headerProviders {
			if err := provider(ctx, header); err != nil {
				return fmt.Errorf("global header provider failed: %w", err)
			}
		}

		c.mu.RLock()
		rpcProviders := append([]HeaderProvider(nil), c.rpcHeaderProviders[rpcName]...)
		c.mu.RUnlock()

		for _, provider := range rpcProviders {
			if err := provider(ctx, header); err != nil {
				return fmt.Errorf("rpc header provider failed: %w", err)
			}
		}

		for _, provider := range opHeaderProviders {
			if err := provider(ctx, header); err != nil {
				return fmt.Errorf("procedure header provider failed: %w", err)
			}
		}

		return nil
	}

	// encodeRequestPayload marshals the request input using an empty JSON object when the input is nil.
	func encodeRequestPayload(input any) ([]byte, error) {
		if input == nil {
			return []byte("{}"), nil
		}

		return json.Marshal(input)
	}

	// calculateBackoff computes the delay for a retry attempt.
	func calculateBackoff(config *RetryConfig, attempt int) time.Duration {
		delay := config.InitialDelay
		for index := 1; index < attempt; index++ {
			delay = time.Duration(float64(delay) * config.DelayMultiplier)
		}

		if config.MaxDelay > 0 && delay > config.MaxDelay {
			delay = config.MaxDelay
		}

		return applyJitter(delay, config.Jitter)
	}

	// applyJitter applies bounded randomness to the given delay.
	func applyJitter(delay time.Duration, factor float64) time.Duration {
		if factor <= 0 || delay <= 0 {
			return delay
		}

		if factor > 1 {
			factor = 1
		}

		delta := float64(delay) * factor
		minimum := float64(delay) - delta
		maximum := float64(delay) + delta
		if minimum < 0 {
			minimum = 0
		}

		return time.Duration(minimum + (rand.Float64() * (maximum - minimum)))
	}

	// waitForBackoff waits for the given delay or returns when the context is cancelled.
	func waitForBackoff(ctx context.Context, delay time.Duration) error {
		if delay <= 0 {
			return nil
		}

		timer := time.NewTimer(delay)
		defer timer.Stop()

		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-timer.C:
			return nil
		}
	}

	// -----------------------------------------------------------------------------
	// Client Builder
	// -----------------------------------------------------------------------------

	// ClientBuilder collects configuration before a generated client is built.
	type ClientBuilder struct {
		baseURL string
		opts []internalClientOption
	}

	// WithHTTPClient supplies a custom HTTP client implementation.
	func (b *ClientBuilder) WithHTTPClient(client *http.Client) *ClientBuilder {
		b.opts = append(b.opts, withHTTPClient(client))
		return b
	}

	// WithHeader registers a static header that is sent with every request.
	func (b *ClientBuilder) WithHeader(key string, value string) *ClientBuilder {
		b.opts = append(b.opts, withGlobalHeader(key, value))
		return b
	}

	// WithHeaderProvider registers a dynamic header provider.
	func (b *ClientBuilder) WithHeaderProvider(provider HeaderProvider) *ClientBuilder {
		b.opts = append(b.opts, withHeaderProvider(provider))
		return b
	}

	// WithInterceptor registers a transport interceptor.
	func (b *ClientBuilder) WithInterceptor(interceptor Interceptor) *ClientBuilder {
		b.opts = append(b.opts, withInterceptor(interceptor))
		return b
	}

	// WithRetryConfig sets the default retry configuration for procedures.
	func (b *ClientBuilder) WithRetryConfig(conf RetryConfig) *ClientBuilder {
		b.opts = append(b.opts, withGlobalRetryConfig(conf))
		return b
	}

	// WithTimeoutConfig sets the default timeout configuration for procedures.
	func (b *ClientBuilder) WithTimeoutConfig(conf TimeoutConfig) *ClientBuilder {
		b.opts = append(b.opts, withGlobalTimeoutConfig(conf))
		return b
	}

	// WithMaxResponseBodyBytes caps response body bytes accepted per call.
	// Responses beyond the cap fail as transport errors before decoding.
	// Values <= 0 restore the 4 MiB default.
	func (b *ClientBuilder) WithMaxResponseBodyBytes(n int64) *ClientBuilder {
		b.opts = append(b.opts, withMaxResponseBodyBytes(n))
		return b
	}

	// Build creates the generated RPC client.
	func (b *ClientBuilder) Build() *Client {
		intClient := newInternalClient(b.baseURL, VDLProcs, b.opts...)
		return &Client{RPCs: &clientRPCRegistry{intClient: intClient}}
	}

	// -----------------------------------------------------------------------------
	// Client Implementation
	// -----------------------------------------------------------------------------

	// Client is the public entrypoint for generated RPC calls.
	type Client struct {
		RPCs *clientRPCRegistry
	}

	// NewClient creates a new generated RPC client builder.
	func NewClient(baseURL string) *ClientBuilder {
		return &ClientBuilder{baseURL: baseURL, opts: []internalClientOption{}}
	}

	// clientRPCRegistry exposes the generated RPC services.
	type clientRPCRegistry struct {
		intClient *internalClient
	}
`);
