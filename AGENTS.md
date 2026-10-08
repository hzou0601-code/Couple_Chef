# Couple Chef development

- Read DELIVERY.html and its linked requirements, architecture, backlog and verification notes before changes. Follow the user's full scope and stop at MVP acceptance.
- Acquire the iteration lease using scripts/iteration-lock.ps1; respect active locks and preserve existing user changes. Renew long runs; release only your runId. Before stale-lock recovery inspect Git and the last checkpoint.
- Keep the Taro/React WeChat mini-program and Spring Boot modules. Database access belongs in backend services. Use migrations and environment variables; no real secrets.
- For every iteration that changes code, delegate a read-only review to the `strict_reviewer` agent. Its project definition is .codex/agents/strict-reviewer.toml; review procedure and report format are in docs/review-agent.md. User explicitly requested this independent strict review on 2026-10-08. Do not use implementation subagents merely because review is authorized.
- Review the final diff and evidence; fix reproducible P0/P1 findings before accepting the task. Missing required checks mean unverified, not passed. Record accepted deferred lower-priority findings with a stable task ID.
- Each run chooses one bounded highest-priority task, updates DELIVERY.html at plan/implementation/verification/delivery boundaries, records detailed history in docs/iterations and creates a traceable commit without resetting unrelated changes.
- Frontend skills must fit Taro/React; record source and pinned commit. Do not apply DOM, SSR or Next.js instructions to WeChat runtime.
- Notify only substantive progress, completion, failure or necessary user action. Never claim remote CI, deployment or platform review without evidence.
