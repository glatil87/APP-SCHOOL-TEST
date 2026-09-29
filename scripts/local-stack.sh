#!/usr/bin/env bash
# Starts Docker (if needed) and the local Supabase stack used by tests.
set -euo pipefail
if ! docker info >/dev/null 2>&1; then
  (nohup dockerd >/tmp/dockerd.log 2>&1 &)
  for _ in $(seq 1 30); do docker info >/dev/null 2>&1 && break; sleep 1; done
fi
npx supabase start -x studio,realtime,edge-runtime,logflare,vector,imgproxy,supavisor,postgres-meta >/dev/null
echo "local Supabase is running"
