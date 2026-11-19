// Request bodies are logged (and stored in audit logs), so never write
// password fields such as password, current_password or new_password.
const SENSITIVE_LOG_KEY_PATTERN = /password/i;
const REDACTED_LOG_VALUE = '[REDACTED]';

export function toLogSafeValue(
  value: unknown,
  seen: WeakSet<object> = new WeakSet(),
): unknown {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Buffer.isBuffer(value)) {
    return value.toString('utf8');
  }

  if (Array.isArray(value)) {
    return value.map((item) => toLogSafeValue(item, seen));
  }

  if (typeof value === 'object') {
    if (seen.has(value)) {
      return '[Circular]';
    }

    seen.add(value);

    const entries = Object.entries(value).map(([key, nestedValue]) => [
      key,
      SENSITIVE_LOG_KEY_PATTERN.test(key)
        ? REDACTED_LOG_VALUE
        : toLogSafeValue(nestedValue, seen),
    ]);

    return Object.fromEntries(entries);
  }

  return String(value);
}

export function serializeHttpRequestForLog(request: any) {
  const rawRequest = request?.raw ?? request;
  const body =
    request?.body ??
    rawRequest?.body ??
    rawRequest?.raw?.body ??
    rawRequest?.request?.body;

  return {
    id: request?.id ?? rawRequest?.id,
    method: rawRequest?.method,
    url: rawRequest?.originalUrl ?? rawRequest?.url,
    query: toLogSafeValue(request?.query),
    params: toLogSafeValue(request?.params),
    headers: toLogSafeValue(rawRequest?.headers),
    remoteAddress: request?.ip ?? rawRequest?.ip ?? rawRequest?.socket?.remoteAddress,
    remotePort: rawRequest?.socket?.remotePort,
    body: toLogSafeValue(body),
  };
}

export function getRequestBodyForLog(request: any) {
  const rawRequest = request?.raw ?? request;
  return toLogSafeValue(
    request?.body ??
      rawRequest?.body ??
      rawRequest?.raw?.body ??
      rawRequest?.request?.body,
  );
}
