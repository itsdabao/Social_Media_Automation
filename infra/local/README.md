# Local infrastructure

`compose.yaml` supplies application PostgreSQL, a separate Temporal PostgreSQL instance, Temporal Server/UI, and MinIO. `.env.example` documents the local settings; actual credentials belong in ignored `.env`.

From the repository root, run `npm run infra:config`, `npm run infra:up`, and `npm run infra:ps`. Stop with `npm run infra:down` to retain named-volume data. Schema and namespace initialization jobs should exit with code 0.

See the [local development guide](../../docs/guides/local-development.md) for first-time environment setup, ports, persistence, the startup chain, and isolated verification. Application API/web processes run through their existing commands and will connect to these dependencies in later parts.
