# Security

This document describes how the generated code protects itself, and where
that protection ends.

## What the generated code handles

**Request size.** The server reads at most 4 MiB per request. Anything
bigger is rejected before middleware or handlers run. You can change the
limit with `SetMaxRequestBodyBytes`; passing zero or a negative value
restores the default.

**Response size.** The client applies the same rule in the other direction:
at most 4 MiB per response, tunable with `WithMaxResponseBodyBytes`.
A compromised or misbehaving server cannot exhaust client memory.

**Malformed bodies.** A body must contain exactly one JSON value. Empty
bodies are valid empty input, as the protocol requires. Anything else,
including trailing garbage after a valid value, is answered with an
`ok:false` envelope and never reaches a handler.

**Input validation.** The generated types check the shape of every input
before the handler runs: required fields must be present and values must
match their declared types. Invalid input stops there.

**Request isolation.** Annotation data is copied for each request, so a
middleware that touches it cannot leak state into other requests.

**Errors.** Internal failures (a body that cannot be read, a type that does
not match where it should) are returned as errors, never as silent zero
values. Responses that cannot be encoded fall back to a safe error
envelope.

**Concurrency.** Handler tables are protected with read-write locks,
tunable limits use atomics, and the fixtures run clean under the race
detector.

## What it does not handle

TLS, timeouts of your own servers, rate limiting, and trusting the URLs
you configure are your responsibility, as usual. The same goes for
whatever your handlers and middleware do: the transport validates and
isolates, but it cannot fix insecure application logic.

## Reporting

If you find a way to break any of the guarantees above through the
generated code alone, please report it with a reproduction: schema,
request bytes, and observed behavior.
