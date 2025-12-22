#!/usr/bin/env bash

APP_NAME="booking-app"
APP_DIR="$HOME/CSC3074-Cloud-Final-Assignment"
LOG_DIR="$APP_DIR/logs"
PID_FILE="$APP_DIR/app.pid"

mkdir -p "$LOG_DIR"

start_app() {
  if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
    echo "❌ App already running (PID $(cat $PID_FILE))"
    exit 1
  fi

  echo "🚀 Starting npm app..."
  cd "$APP_DIR" || exit 1
  # Use setsid to create a new process group for clean shutdown
  setsid npm run dev > "$LOG_DIR/app.log" 2>&1 &
  echo $! > "$PID_FILE"
  echo "✅ App started (PID $!)"
}

stop_app() {
  if [ ! -f "$PID_FILE" ]; then
    echo "⚠️ App not running"
    exit 0
  fi

  PID=$(cat "$PID_FILE")
  echo "🛑 Stopping app (PID $PID)..."
  # Kill the process group to ensure all children (nodemon, node) are stopped
  kill -- -"$PID" 2>/dev/null
  rm -f "$PID_FILE"
  echo "✅ App stopped"
}

status_app() {
  if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
    echo "✅ App is RUNNING (PID $(cat $PID_FILE))"
  else
    echo "❌ App is STOPPED"
  fi
}

update_app() {
  echo "🔄 Pulling latest code..."
  cd "$APP_DIR" || exit 1
  git fetch origin && git reset --hard origin/main
  echo "✅ Code updated"
}

cpu_burn() {
  echo "🔥 Starting CPU burn (~80%)"
  CORES=$(nproc)
  BURN=$((CORES * 80 / 100))
  if [ "$BURN" -lt 1 ]; then BURN=1; fi
  for i in $(seq 1 "$BURN"); do
    yes > /dev/null &
  done
  echo $! > "$APP_DIR/cpu_burn.pid"
  echo "⚠️ CPU burn running"
}

cpu_stop() {
  echo "🧯 Stopping CPU burn"
  pkill yes
  rm -f "$APP_DIR/cpu_burn.pid"
  echo "✅ CPU normalized"
}

case "$1" in
  start) start_app ;;
  stop) stop_app ;;
  restart) stop_app; start_app ;;
  status) status_app ;;
  update) update_app ;;
  burn) cpu_burn ;;
  burn-stop) cpu_stop ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|update|burn|burn-stop}"
    ;;
esac
