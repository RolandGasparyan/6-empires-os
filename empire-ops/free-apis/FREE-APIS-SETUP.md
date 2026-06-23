# 6-EMPIRE — Free LLM API Integration

Pulled from `awesome-free-llm-apis`. **19 free, OpenAI-compatible LLM providers** are now
catalogued and wired into the EMPIRE router. Adding any one is a single env var — no code change.

Why this matters: several of these (Groq, Cerebras, SambaNova) run at **hundreds–thousands of
tokens/sec for free** — far faster than the local CPU model. Add one key and EMPIRE becomes near-instant.

---

## How it works

- Catalog: `apps/api/free_llm_providers.json` (19 providers, base URLs, models, priority)
- Loader: `apps/api/free_providers.py` — auto-activates any provider whose key is in the env
- The router tries active free providers in **speed priority** order, falling back to local Ollama.

Check what's active any time:
```
docker exec $(docker ps -q --filter publish=8000) python3 /app/free_providers.py
```

---

## Add a key (one line each — only you can create these, they're free)

Each link is the provider's free API-key page. Get a key, then add the matching line to
`/root/6-empires-os-full/.env` on the server and restart the router.

| Provider | Speed | Free tier | Get key | Env var |
|---|---|---|---|---|
| **Groq** ⚡ | fastest | generous free | https://console.groq.com/keys | `FREE_GROQ_KEY=` |
| **Cerebras** ⚡ | fastest | free tier | https://cloud.cerebras.ai | `FREE_CEREBRAS_KEY=` |
| **SambaNova** ⚡ | very fast | free tier | https://cloud.sambanova.ai | `FREE_SAMBANOVA_KEY=` |
| **Google Gemini** | fast | free (non-EU) | https://aistudio.google.com/app/apikey | `FREE_GOOGLE_GEMINI_KEY=` |
| **Cloudflare Workers AI** | fast | 10k neurons/day | https://dash.cloudflare.com | `FREE_CLOUDFLARE_WORKERS_AI_KEY=` |
| **NVIDIA NIM** | fast | free credits | https://build.nvidia.com | `FREE_NVIDIA_NIM_KEY=` |
| **OpenRouter** | varies | many `:free` models | https://openrouter.ai/keys | `FREE_OPENROUTER_KEY=` |
| **Mistral AI** | fast | free tier | https://console.mistral.ai | `FREE_MISTRAL_AI_KEY=` |
| **GitHub Models** | fast | free w/ GH account | https://github.com/marketplace/models | `FREE_GITHUB_MODELS_KEY=` |
| **SiliconFlow** | fast | free tier | https://siliconflow.cn | `FREE_SILICONFLOW_KEY=` |
| **OVHcloud AI** | fast | free endpoints | https://endpoints.ai.cloud.ovh.net | `FREE_OVHCLOUD_AI_ENDPOINTS_KEY=` |
| **Hugging Face** | medium | free inference | https://huggingface.co/settings/tokens | `FREE_HUGGING_FACE_KEY=` |
| Cohere | medium | 1k calls/mo | https://dashboard.cohere.com/api-keys | `FREE_COHERE_KEY=` |
| Aion Labs | medium | 20k tok/day | https://www.aionlabs.ai | `FREE_AION_LABS_KEY=` |
| Z AI (Zhipu) | medium | free tier | https://open.bigmodel.cn | `FREE_Z_AI_ZHIPU_AI_KEY=` |
| Kilo Code | varies | free models | https://kilo.ai | `FREE_KILO_CODE_KEY=` |
| LLM7.io | varies | free | https://llm7.io | `FREE_LLM7IO_KEY=` |
| ModelScope | varies | free | https://modelscope.cn | `FREE_MODELSCOPE_KEY=` |
| Ollama Cloud | varies | free tier | https://ollama.com | `FREE_OLLAMA_CLOUD_KEY=` |

### Recommended: start with Groq
1. Get a free key at https://console.groq.com/keys
2. On the server:
   ```
   echo 'FREE_GROQ_KEY=gsk_your_key_here' >> /root/6-empires-os-full/.env
   cd /root/6-empires-os-full && docker compose restart api
   ```
3. Verify it's active:
   ```
   docker exec $(docker ps -q --filter publish=8000) python3 /app/free_providers.py
   ```
   You'll see `✓ Groq` — and EMPIRE now has an instant cloud model.

---

## Note on the other two repos
`public-apis/public-apis` and `public-api-lists/public-api-lists` are general API directories
(1400+ APIs: weather, finance, crypto, news, etc.) — they are catalogs, not installable packages.
The full lists are cloned for reference. Pull individual ones in as you need them (e.g. a free
crypto-price API for EMPIRE TRADING) and I'll wire them to the relevant agent.
