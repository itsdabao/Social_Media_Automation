# Infrastructure

Local infrastructure is pending a step-by-step rebuild, starting with PostgreSQL. The previous Compose topology, MinIO source build, service initialization scripts, and infrastructure integration test have been removed at the user's request.

For each increment, explain the service purpose, alternatives, image selection, environment variables, ports, persistence, and verification before implementation. Add only the files needed by the approved increment.

The existing web/API health flow runs independently of these services. Application database integration and the Temporal worker remain pending.

The former local stack has been stopped. Its Docker named volumes and local images were retained; private environment configuration remains ignored. Reintroducing services must explicitly decide whether to reuse existing volumes and credentials. Local Compose does not establish production availability.
