#!/bin/sh
set -eu

: "${SQL_HOST:?SQL_HOST is required}"
: "${SQL_PORT:?SQL_PORT is required}"
: "${SQL_USER:?SQL_USER is required}"
: "${SQL_PASSWORD:?SQL_PASSWORD is required}"

setupDatabaseSchema() {
  databaseName="$1"
  schemaDirectory="$2"

  # setup-schema retains a higher existing schema version; never use --overwrite.
  temporal-sql-tool --plugin postgres12 --ep "$SQL_HOST" -p "$SQL_PORT" \
    -u "$SQL_USER" --db "$databaseName" setup-schema -v 0.0

  temporal-sql-tool --plugin postgres12 --ep "$SQL_HOST" -p "$SQL_PORT" \
    -u "$SQL_USER" --db "$databaseName" update-schema -d "$schemaDirectory"
}

setupDatabaseSchema temporal /etc/temporal/schema/postgresql/v12/temporal/versioned
setupDatabaseSchema temporal_visibility /etc/temporal/schema/postgresql/v12/visibility/versioned
