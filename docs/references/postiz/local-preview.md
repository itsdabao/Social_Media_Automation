# Local Postiz preview

Start Docker Desktop with the Linux engine, then run these commands in PowerShell.

```powershell
Set-Location D:\Social_Media_Automation\reference\postiz-app
docker compose -p postiz-preview -f docker-compose.yaml -f .secrets/preview.compose.yaml up -d postiz temporal
```

The local override at `.secrets/preview.compose.yaml` contains the generated JWT signing secret and is ignored by the reference repository. Keep that file for subsequent starts so sessions use the same signing secret.

The override also adds readiness checks for Temporal's PostgreSQL, Elasticsearch, and Temporal itself. Postiz waits for Temporal to become healthy. Temporal dependencies use restart policies to recover from startup failures.

Open http://localhost:4007 after startup. Use the registration page to create a local preview account. Configure authorized provider apps and accounts when testing actual social integrations.

This runs the published `ghcr.io/gitroomhq/postiz-app:latest` image configured by the reference Compose file. Its version can differ from the checked-out source. Local source changes require a source-development setup or a custom image build.

The selected services include the application, its PostgreSQL and Redis, and Temporal with its PostgreSQL and Elasticsearch dependencies. Application data and uploads use Docker volumes. The Temporal UI is omitted from this startup command because the existing Celesnity stack occupies port 8080.

Check status and application logs with these commands.

```powershell
docker compose -p postiz-preview -f docker-compose.yaml -f .secrets/preview.compose.yaml ps
docker compose -p postiz-preview -f docker-compose.yaml -f .secrets/preview.compose.yaml logs --tail 100 postiz
```

Stop the preview services with this command.

```powershell
docker compose -p postiz-preview -f docker-compose.yaml -f .secrets/preview.compose.yaml stop
```
