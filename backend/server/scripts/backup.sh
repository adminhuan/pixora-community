#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${APP_DIR}/.env"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "缺少环境文件: ${ENV_FILE}" >&2
  exit 1
fi

set -a
source "${ENV_FILE}"
set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL 未配置" >&2
  exit 1
fi

parse_database_url() {
  node -e '
const rawUrl = process.argv[1];
try {
  const parsed = new URL(rawUrl);
  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new Error("仅支持 postgres/postgresql 协议");
  }
  const dbName = decodeURIComponent((parsed.pathname || "").replace(/^\/+/, ""));
  if (!dbName) {
    throw new Error("DATABASE_URL 缺少数据库名");
  }
  const host = parsed.hostname || "";
  const port = parsed.port || "5432";
  const user = decodeURIComponent(parsed.username || "");
  const password = decodeURIComponent(parsed.password || "");
  process.stdout.write([host, port, user, password, dbName].join("\n"));
} catch (error) {
  process.stderr.write(String(error?.message || error));
  process.exit(1);
}
' "${DATABASE_URL}"
}

mapfile -t DB_PARTS < <(parse_database_url)
if [[ "${#DB_PARTS[@]}" -lt 5 ]]; then
  echo "DATABASE_URL 解析失败，请检查格式" >&2
  exit 1
fi

DB_HOST="${DB_PARTS[0]}"
DB_PORT="${DB_PARTS[1]}"
DB_USER="${DB_PARTS[2]}"
DB_PASSWORD="${DB_PARTS[3]}"
DB_NAME="${DB_PARTS[4]}"

if [[ -z "${DB_HOST}" ]]; then
  echo "DATABASE_URL 缺少主机地址" >&2
  exit 1
fi

BACKUP_ROOT="${BACKUP_ROOT:-${APP_DIR}/backups}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
DATE_DIR="$(date +%Y%m%d)"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

DB_BACKUP_DIR="${BACKUP_ROOT}/db/${DATE_DIR}"
UPLOAD_BACKUP_DIR="${BACKUP_ROOT}/uploads/${DATE_DIR}"

mkdir -p "${DB_BACKUP_DIR}" "${UPLOAD_BACKUP_DIR}"

DB_FILE="${DB_BACKUP_DIR}/ai-community-db-${TIMESTAMP}.sql.gz"
UPLOAD_FILE="${UPLOAD_BACKUP_DIR}/ai-community-uploads-${TIMESTAMP}.tar.gz"

PG_DUMP_ARGS=(--no-owner --no-privileges -h "${DB_HOST}" -p "${DB_PORT}" -d "${DB_NAME}")
if [[ -n "${DB_USER}" ]]; then
  PG_DUMP_ARGS+=(-U "${DB_USER}")
fi

if [[ -n "${DB_PASSWORD}" ]]; then
  PGPASSWORD="${DB_PASSWORD}" pg_dump "${PG_DUMP_ARGS[@]}" | gzip -9 > "${DB_FILE}"
else
  pg_dump "${PG_DUMP_ARGS[@]}" | gzip -9 > "${DB_FILE}"
fi

if [[ -d "${APP_DIR}/uploads" ]]; then
  tar -czf "${UPLOAD_FILE}" -C "${APP_DIR}" uploads
fi

find "${BACKUP_ROOT}/db" -type f -name "*.gz" -mtime "+${KEEP_DAYS}" -delete 2>/dev/null || true
find "${BACKUP_ROOT}/uploads" -type f -name "*.gz" -mtime "+${KEEP_DAYS}" -delete 2>/dev/null || true

echo "备份完成: ${DB_FILE}"
if [[ -f "${UPLOAD_FILE}" ]]; then
  echo "备份完成: ${UPLOAD_FILE}"
fi
