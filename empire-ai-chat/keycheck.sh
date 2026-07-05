#!/usr/bin/env bash
# EMPIRE chat key + model health check. Prints one status block.
KJ=/root/6-empires-os-full/apps/api/keys.json
GK=$(python3 -c "import json;print(json.load(open('$KJ')).get('FREE_GROQ_KEY',''))" 2>/dev/null)
AK=$(python3 -c "import json;print(json.load(open('$KJ')).get('OPENAI_API_KEY',''))" 2>/dev/null)

echo "=== GROQ ==="
if [ -z "$GK" ]; then echo "GROQ: MISSING"; else
  gs=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 https://api.groq.com/openai/v1/chat/completions -H "Authorization: Bearer $GK" -H 'Content-Type: application/json' -d '{"model":"llama-3.3-70b-versatile","messages":[{"role":"user","content":"hi"}],"max_tokens":3}')
  case "$gs" in
    200) echo "GROQ: OK (200)";;
    429) echo "GROQ: RATE-LIMITED today (429) — valid key, daily cap hit; AIML covers it";;
    401) echo "GROQ: DEAD (401 invalid key) — needs a fresh key at /chat/keys";;
    *)   echo "GROQ: unexpected ($gs)";;
  esac
fi

echo "=== AIML (fallback) ==="
if [ -z "$AK" ]; then echo "AIML: MISSING — no fallback! add key at /chat/keys"; else
  as=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 https://api.aimlapi.com/v1/chat/completions -H "Authorization: Bearer $AK" -H 'Content-Type: application/json' -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"hi"}],"max_tokens":3}')
  case "$as" in
    200) echo "AIML: OK (200)";;
    401|403) echo "AIML: DEAD ($as invalid/expired) — needs a fresh AIML key at /chat/keys";;
    429) echo "AIML: RATE-LIMITED ($as) — AIML plan cap hit";;
    *)   echo "AIML: unexpected ($as)";;
  esac
fi

echo "=== LIVE CHAT (Armenian, must be fast + clean) ==="
t0=$(date +%s.%N)
b=$(curl -s --max-time 40 -X POST http://127.0.0.1:8090/api/chat -H 'Content-Type: application/json' -d '{"model":"empire-prime","mode":"empire","messages":[{"role":"user","content":"Բարև, կարճ պատասխանիր հայերենով։"}]}')
t1=$(date +%s.%N)
el=$(echo "$t1 - $t0" | bc)
arm=$(python3 -c "import sys;t=sys.argv[1];print('yes' if any('Ա'<=c<='֏' for c in t) else 'no')" "$b" 2>/dev/null)
echo "elapsed: ${el}s | armenian: $arm | reply: ${b:0:120}"
# verdict
if python3 -c "import sys;exit(0 if float(sys.argv[1])<6 and sys.argv[2]=='yes' else 1)" "$el" "$arm" 2>/dev/null; then
  echo "VERDICT: GREEN (fast + clean Armenian)"
else
  echo "VERDICT: DEGRADED (slow or non-Armenian -> a cloud key is down, chat fell to local model)"
fi
