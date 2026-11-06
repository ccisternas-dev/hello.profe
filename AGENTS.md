# Working efficiently in this repository

- Keep responses brief. Explain meaningful changes in plain language.
- For ambiguous requests, ask one concise scope question before dependent implementation. Resolve local preview versus public deployment early.
- Work on one agreed milestone. Ask before expanding scope or starting another milestone; do not infer extra features from “continue.”
- Read only relevant files and bounded excerpts. Reuse established repository facts and prior test results.
- Batch independent checks. Run required checks once after implementation; repeat only for changed behavior or failures. Do not test documentation-only edits beyond basic diff validation.
- Avoid frequent CI polling. Use one watch process and wait for useful output.
- Do not spawn subagents unless explicitly requested. Avoid unrelated refactors, new dependencies, or extra browser runs.
- Treat small tasks as small tasks. State when a request is likely to require substantial implementation before beginning it.
- Prefer a fresh conversation for a new issue, using repository docs and a short handoff rather than the full project chat history.
- Do not claim exact token use or remaining account allowance without actual metering. These are efficiency preferences, not an enforceable token cap.

- Always use `GH_CONFIG_DIR="$HOME/.config/gh-personal"` for GitHub CLI and authenticated Git operations in this project (account `ccisternas-dev`).
