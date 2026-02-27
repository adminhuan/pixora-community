#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${APP_DIR}/.env"
LOG_FILE="${APP_DIR}/logs/ops-alert.log"
HOST_NAME="$(hostname)"

mkdir -p "$(dirname "${LOG_FILE}")"

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  source "${ENV_FILE}"
  set +a
fi

API_HEALTH_URL="${API_HEALTH_URL:-http://127.0.0.1:${PORT:-3300}${API_PREFIX:-/api/v1}/health}"
PROCESS_NAME="${PROCESS_NAME:-ai-community-server}"
DISK_ALERT_THRESHOLD="${DISK_ALERT_THRESHOLD:-85}"
ALERT_WEBHOOK_URL="${ALERT_WEBHOOK_URL:-}"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"
TELEGRAM_MESSAGE_THREAD_ID="${TELEGRAM_MESSAGE_THREAD_ID:-}"

send_telegram_alert() {
  local text="$1"
  if [[ -z "${TELEGRAM_BOT_TOKEN}" || -z "${TELEGRAM_CHAT_ID}" ]]; then
    return 0
  fi

  local telegram_api="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage"
  local curl_args=(
    -sS -m 8 -X POST "${telegram_api}"
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}"
    --data-urlencode "text=${text}"
    --data-urlencode "disable_web_page_preview=true"
  )

  if [[ -n "${TELEGRAM_MESSAGE_THREAD_ID}" ]]; then
    curl_args+=(--data-urlencode "message_thread_id=${TELEGRAM_MESSAGE_THREAD_ID}")
  fi

  curl "${curl_args[@]}" >/dev/null || true
}

alert() {
  local level="$1"
  shift
  local message="$*"
  local full_message="[${HOST_NAME}] [${level}] ${message}"
  local now
  now="$(date '+%Y-%m-%d %H:%M:%S')"
  echo "[${now}] ${full_message}" | tee -a "${LOG_FILE}" >&2

  if [[ -n "${ALERT_WEBHOOK_URL}" ]]; then
    curl -sS -m 8 -X POST "${ALERT_WEBHOOK_URL}" \
      -H 'Content-Type: application/json' \
      -d "{\"text\":\"${full_message}\"}" >/dev/null || true
  fi

  send_telegram_alert "${full_message}"
}

process_online() {
  pm2 jlist 2>/dev/null | node -e '
const fs = require("fs");
const processName = process.argv[1];
try {
  const input = fs.readFileSync(0, "utf8");
  const list = JSON.parse(input || "[]");
  const target = Array.isArray(list) ? list.find((item) => item?.name === processName) : null;
  if (target?.pm2_env?.status === "online") {
    process.exit(0);
  }
} catch (_) {
}
process.exit(1);
' "${PROCESS_NAME}"
}

if ! command -v pm2 >/dev/null 2>&1; then
  alert "ERROR" "pm2 未安装，无法检查后端进程"
  exit 1
fi

if ! process_online; then
  alert "WARN" "进程 ${PROCESS_NAME} 不在线，尝试自动重启"
  pm2 restart "${PROCESS_NAME}" >/dev/null 2>&1 || true
  sleep 3
  if ! process_online; then
    alert "ERROR" "进程 ${PROCESS_NAME} 重启失败"
    exit 1
  fi
  alert "INFO" "进程 ${PROCESS_NAME} 已自动恢复"
fi

if ! curl -fsS --max-time 10 "${API_HEALTH_URL}" >/dev/null; then
  alert "ERROR" "后端健康检查失败: ${API_HEALTH_URL}"
  exit 1
fi

root_usage="$(df -P / | awk 'NR==2 {gsub(/%/, "", $5); print $5}')"
if [[ -n "${root_usage}" && "${root_usage}" -ge "${DISK_ALERT_THRESHOLD}" ]]; then
  alert "WARN" "系统磁盘占用 ${root_usage}% (阈值 ${DISK_ALERT_THRESHOLD}%)"
fi

echo "health-check-ok"
