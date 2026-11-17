#!/bin/sh
set -eu

: "${TEMPORAL_ADDRESS:?TEMPORAL_ADDRESS is required}"
: "${TEMPORAL_NAMESPACE:?TEMPORAL_NAMESPACE is required}"

MAX_ATTEMPTS=30
RETRY_DELAY_SECONDS=2
attempt=1

# The TCP health check can pass before all Temporal services are ready.
while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
  if temporal operator cluster health --address "$TEMPORAL_ADDRESS" >/dev/null 2>&1; then
    if temporal operator namespace describe --address "$TEMPORAL_ADDRESS" \
      --namespace "$TEMPORAL_NAMESPACE" >/dev/null 2>&1; then
      echo "Local Temporal namespace is ready."
      exit 0
    fi

    if temporal operator namespace create --address "$TEMPORAL_ADDRESS" \
      --namespace "$TEMPORAL_NAMESPACE" --retention 72h; then
      echo "Local Temporal namespace was created."
      exit 0
    fi
  fi

  if [ "$attempt" -lt "$MAX_ATTEMPTS" ]; then
    sleep "$RETRY_DELAY_SECONDS"
  fi
  attempt=$((attempt + 1))
done

echo "Local Temporal health/namespace setup failed after bounded retries." >&2
exit 1
