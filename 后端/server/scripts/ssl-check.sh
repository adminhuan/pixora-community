#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${APP_DIR}/.env"

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  source "${ENV_FILE}"
  set +a
fi

CERT_FILE="${CERT_FILE:-/etc/letsencrypt/live/pixora.vip/cert.pem}"
ALERT_DAYS="${SSL_ALERT_DAYS:-20}"
WEBHOOK_URL="${ALERT_WEBHOOK_URL:-}"
LOG_FILE="${SSL_ALERT_LOG:-${APP_DIR}/logs/ssl-alert.log}"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"
TELEGRAM_MESSAGE_THREAD_ID="${TELEGRAM_MESSAGE_THREAD_ID:-}"
HOST_NAME="$(hostname)"

mkdir -p "$(dirname "${LOG_FILE}")"

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
  if [[ -n "${WEBHOOK_URL}" ]]; then
    curl -sS -m 8 -X POST "${WEBHOOK_URL}" \
      -H 'Content-Type: application/json' \
      -d "{\"text\":\"${full_message}\"}" >/dev/null || true
  fi
  send_telegram_alert "${full_message}"
}

if [[ ! -f "${CERT_FILE}" ]]; then
  alert "ERROR" "证书文件不存在: ${CERT_FILE}"
  exit 1
fi

end_date="$(openssl x509 -enddate -noout -in "${CERT_FILE}" | cut -d= -f2)"
end_epoch="$(date -d "${end_date}" +%s)"
now_epoch="$(date +%s)"
days_left="$(((end_epoch - now_epoch) / 86400))"

if [[ "${days_left}" -le "${ALERT_DAYS}" ]]; then
  alert "WARN" "SSL 证书将于 ${days_left} 天后过期 (${end_date})"
else
  echo "ssl-check-ok: ${days_left} days left"
fi
