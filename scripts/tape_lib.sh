# tape_lib.sh — the Service Tape recorder.
#
# Sourced by refresh.sh. Records what the pipeline actually did — step labels,
# real start/end timestamps, durations, exit statuses, and a few structured
# metrics parsed from known-safe output — into .tape-run.json (gitignored).
# scripts/build_tape.py then turns that into _data/tape/YYYY-MM-DD.yml, which
# /tonight/ replays in the browser.
#
# Honesty rules, enforced by construction:
#   - No raw command output is ever recorded. Only our own labels, timings,
#     statuses, and numbers parsed from whitelisted patterns.
#   - Tapes record only on local runs (CI sets $CI; per-push CI runs are not
#     "the night shift" and would overwrite the real one).
#   - A tape failure must never break the pipeline: every recorder call is
#     guarded. The site publishing matters more than the film of it.
#   - The trigger is recorded (nightly cron vs manual), never faked.

TAPE_FILE=".tape-run.json"
TAPE_ACTIVE=0

tape_begin() {
  [ "${CI:-}" != "" ] && return 0
  TAPE_ACTIVE=1
  # Trigger label: RICHIE_TAPE_TRIGGER wins; otherwise a run starting inside
  # the scheduled service window (04:00–04:25 UTC = 23:00 CT nightly cron) is
  # the night shift, anything else is a manual run. The cron job itself is
  # locked configuration and is never modified to pass this through.
  if [ -n "${RICHIE_TAPE_TRIGGER:-}" ]; then
    TAPE_TRIGGER="$RICHIE_TAPE_TRIGGER"
  else
    _hm=$(date -u '+%H%M')
    if [ "$_hm" -ge 0400 ] && [ "$_hm" -lt 0425 ] 2>/dev/null; then
      TAPE_TRIGGER="nightly"
    else
      TAPE_TRIGGER="manual"
    fi
  fi
  {
    printf '{"schema":1,"date":"%s","started":"%s","trigger":"%s","steps":[' \
      "$(date -u '+%Y-%m-%d')" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$TAPE_TRIGGER"
  } > "$TAPE_FILE" 2>/dev/null || TAPE_ACTIVE=0
  TAPE_FIRST=1
}

# tape_step <slug> <human label> <command...>
# Runs the command (streaming its output through untouched), timing it.
# Propagates the command's exit status so set -e behavior is preserved.
tape_step() {
  local slug="$1"; shift
  local label="$1"; shift
  local t0 t1 rc
  t0=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
  local s0=$SECONDS
  rc=0
  "$@" || rc=$?
  local dur=$((SECONDS - s0))
  t1=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
  if [ "$TAPE_ACTIVE" = "1" ]; then
    {
      [ "$TAPE_FIRST" = "1" ] || printf ','
      printf '{"slug":"%s","label":"%s","start":"%s","end":"%s","dur_s":%d,"status":"%s"}' \
        "$slug" "$label" "$t0" "$t1" "$dur" "$([ $rc -eq 0 ] && echo ok || echo error)"
    } >> "$TAPE_FILE" 2>/dev/null || true
    TAPE_FIRST=0
  fi
  return $rc
}

tape_end() {
  [ "$TAPE_ACTIVE" = "1" ] || return 0
  printf '],"ended":"%s"}\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" >> "$TAPE_FILE" 2>/dev/null || true
  # Fold the raw run record into the published tape data, then rebuild so
  # tonight's tape ships in tonight's site (builds are sub-second). Guarded:
  # a tape failure is reported but never fails the pipeline.
  if "$PY" scripts/build_tape.py; then
    bundle exec jekyll build >/dev/null 2>&1 || true
  else
    echo "WARN: tape build failed — night not filmed, pipeline unaffected." >&2
  fi
}
