# Environment Audit — RO-SUPREME-SETUP

**Date:** 2026-07-25  
**Scope:** Roland Gasparyan local development environment, GitHub access, Docker, VPS SSH, Codex tooling, and the recent voice-chat/deployment pull requests in `RolandGasparyan/6-empires-os`.

## Completed environment checks

| Area | Status | Evidence / action |
| --- | --- | --- |
| GitHub CLI | Needs re-authentication | `gh 2.96.0` is installed, but its configured OAuth token is invalid. The GitHub connector remained available for read-only PR review. |
| Git | Ready | `git 2.50.1` installed. |
| Node.js and npm | Ready | Node.js `26.5.0`, npm `11.17.0`. |
| Python and pip | Ready | Python `3.9.6` and pip are installed. A dependency conflict introduced during tooling installation was corrected; `python3 -m pip check` reports no broken requirements. |
| Docker | Ready | Docker CLI `29.6.1` installed. Docker Desktop was started and the daemon responds at `29.6.1`. |
| PM2 | Installed | `pm2 7.0.3`. |
| JavaScript quality tools | Installed | ESLint `10.8.0`, Prettier `3.9.6`, TypeScript `7.0.2`. |
| Python quality/security tools | Installed in isolated tooling environment | Ruff `0.16.0`, Bandit `1.8.6`, and pip-audit are available on PATH. Isolation avoids conflicts with existing Python packages. |
| SSH keys | Present | Local SSH key material is present; private-key contents were not inspected or exposed. |
| DigitalOcean VPS SSH | Ready | Passwordless, read-only SSH connection to `root@64.227.6.197` succeeded. |
| Codex MCP | Partially configured | Global configuration contains `computer-use`, `node_repl`, and `render` MCP servers. |
| Claude CLI | Not installed | No `claude` command was found. This is optional and was not installed because no project workflow declared it as a requirement. |
| Local Obsidian vault | Not detected | No local vault marker was found. This report is stored in the repository-backed `empire-ops/EMPIRE-Vault`, which is the documented Obsidian Brain source. |

## Recent voice-chat and deployment PR review

### PR #25 — automated Groq API key injection

**Purpose:** passes the GitHub `GROQ_API_KEY` secret to the VPS during deployment and writes it into the chat service environment.

**Review:** functional intent is clear, but direct shell substitution into a dotenv value can corrupt configuration when a secret contains shell-sensitive characters. Prefer a dedicated secret-management path or a robust dotenv writer. Verify that no action step or remote command can echo the secret.

### PR #26 — manual voice-chat repair workflow

**Purpose:** manually runs a VPS repair path and accepts a Groq API key workflow input.

**Critical risk:** workflow-dispatch string inputs are not GitHub secrets. Supplying a Groq key in `inputs.groq_api_key` risks exposure in workflow metadata, logs, or action context. Remove this input and consume only `secrets.GROQ_API_KEY`.

**Validation issue:** the STT probe posts an empty audio body. A successful HTTP connection does not prove transcription works. Use a small known-valid audio fixture and assert expected structured output.

### PR #27 — chat repair and Groq key update workflows

**Purpose:** audits the current Ollama setup, can repoint the chat router to local Ollama, then verifies chat/STT/TTS.

**Critical risk:** `update-groq-key.yml` again accepts a Groq key as a workflow input and embeds it directly into a shell heredoc. Treat that workflow as unsafe for real secrets; replace the input with a GitHub secret and ensure logs redact it.

**Safety issue:** `apply_fix` defaults to `true`. An operational repair workflow should default to audit-only, require an explicit enablement step, record the selected model before mutation, and retain a tested rollback command.

**Validation issues:**
- The chat request in the workflow lacks an authorization header even though other endpoint calls use one.
- Empty-body STT checks establish only endpoint reachability, not real STT success.
- TTS must validate a playable audio response with an expected content type and non-zero body size, not only an HTTP status.
- The hard-coded VPS IP should be replaced by a secret or environment-level configuration.

## Live voice-chat validation checklist

### 1. Preflight

- Confirm the deployed commit SHA equals the intended main-branch commit.
- Confirm `empire-ai` is active and the health endpoint reports ready.
- Confirm the configured model is present and returns a short chat completion.
- Confirm no secret values appear in Actions logs, service logs, or command output.

**Success:** deployment and service revision are known; health is ready; no secret leakage.

**Log if failing:** commit SHA, service status, sanitized last 50 log lines, health JSON, configured model name, and exact HTTP status.

### 2. Browser microphone flow

- Open `https://6-empires.com/chat` in a private browser window.
- Grant microphone permission.
- Record 3–5 seconds of clear English speech, then repeat in Armenian.
- Verify the UI indicates capture/upload progress and receives a transcription.
- Send the transcription and confirm the model returns a relevant response.
- Enable TTS and confirm response audio plays through the selected output device.

**Success:** each language returns a non-empty, intelligible transcription; chat response is relevant; TTS produces audible speech with no console/network errors.

**Log if failing:** browser and OS, timestamp/time zone, language, microphone permission state, audio duration/format, request URL/status, sanitized response body, browser console error, and correlation/request ID.

### 3. Direct STT verification

- Submit a small known-valid WAV or WebM fixture with valid authorization.
- Assert a successful response includes a non-empty transcript and expected schema.
- Repeat with Armenian and English samples.

**Success:** HTTP 2xx plus non-empty transcript matching the spoken phrase within normal STT tolerance.

**Log if failing:** content type, byte size, duration, HTTP code, sanitized error payload, provider/model identifier, and service logs around the request.

### 4. Direct TTS verification

- Submit short English and Armenian text using valid authorization.
- Assert a 2xx response, audio content type, non-zero body length, and a decodable/playable audio file.
- Measure time-to-first-byte and total response time.

**Success:** both responses are playable and intelligible; no provider errors; latency is acceptable for the product target.

**Log if failing:** text length and language, HTTP code, content type, byte size, latency, sanitized error payload, and service logs.

### 5. Resilience and security checks

- Test a denied request with no authorization and confirm it fails without revealing sensitive details.
- Test malformed/empty audio and confirm a clear 4xx validation error rather than a false success.
- Confirm failures leave the UI recoverable and do not interrupt normal typed chat.
- Confirm an audit-only repair run makes no configuration changes.

**Success:** fail-closed authorization, accurate validation errors, graceful UI recovery, and no unintended configuration mutation.

**Log if failing:** sanitized request metadata, exact status, user-visible behavior, service logs, and the before/after configuration checksum (without secrets).

## Recommended next actions

1. Re-authenticate the local GitHub CLI using the approved account.
2. Replace all Groq workflow inputs with GitHub Actions secrets and rotate any key ever entered as a workflow input.
3. Change repair workflows to default to audit-only and add an explicit rollback artifact.
4. Add real audio-fixture integration checks for STT and binary audio checks for TTS.
5. Run the checklist above after the secure workflow changes are deployed.
