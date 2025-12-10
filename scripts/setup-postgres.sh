#!/usr/bin/env bash
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "This script must be run as root (e.g., via sudo)." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "Installing PostgreSQL packages..."
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib
fi

PG_DIR=$(find /etc/postgresql -maxdepth 1 -type d -regex ".*/[0-9]+" | head -n 1)
if [[ -z "${PG_DIR}" ]]; then
  echo "Unable to locate PostgreSQL config directory under /etc/postgresql." >&2
  exit 1
fi

PG_VERSION=$(basename "${PG_DIR}")
PG_HBA="${PG_DIR}/main/pg_hba.conf"
PG_CONF="${PG_DIR}/main/postgresql.conf"

if [[ ! -f "${PG_HBA}" || ! -f "${PG_CONF}" ]]; then
  echo "PostgreSQL configuration files not found (expected ${PG_HBA} and ${PG_CONF})." >&2
  exit 1
fi

if ! grep -Eq "^listen_addresses\s*=.*\*" "${PG_CONF}"; then
  echo "Configuring PostgreSQL to listen on all interfaces (localhost accessible)..."
  sed -i "s/^#\?listen_addresses.*/listen_addresses = '*' # managed by setup-postgres.sh/" "${PG_CONF}"
fi

add_hba_rule() {
  local rule="$1"
  if ! grep -Fq "$rule" "${PG_HBA}"; then
    echo "$rule" >>"${PG_HBA}"
  fi
}

echo "Ensuring password authentication for localhost connections..."
add_hba_rule "host    all             all             127.0.0.1/32            md5"
add_hba_rule "host    all             all             ::1/128                 md5"

pg_ctlcluster "${PG_VERSION}" main restart

psql_has_row() {
  local sql="$1"
  local expected="$2"
  su - postgres -c "psql -tAc \"${sql}\"" | grep -q "${expected}"
}

echo "Creating acme role and database if missing..."
if ! psql_has_row "SELECT 1 FROM pg_roles WHERE rolname='acme'" 1; then
  su - postgres -c "psql -tAc \"CREATE ROLE acme WITH LOGIN PASSWORD 'acme';\""
fi

if ! psql_has_row "SELECT 1 FROM pg_database WHERE datname='acme'" 1; then
  su - postgres -c "createdb -O acme acme"
fi

su - postgres -c "psql -tAc \"GRANT ALL PRIVILEGES ON DATABASE acme TO acme;\""

cat <<INFO
PostgreSQL is ready.
Connection string: postgres://acme:acme@localhost:5432/acme
INFO
