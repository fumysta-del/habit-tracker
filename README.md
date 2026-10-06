# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Local listening Agent

`POST /api/language/recommendations` keeps the existing `{groups}` response. The Vite server starts the installed Codex desktop `codex.exe exec` in a read-only sandbox, reusing its login, configured model and MCP configuration. `CODEX_EXECUTABLE` can optionally specify an existing binary; otherwise the desktop installation is discovered automatically. No Python recommendation rules are used.

Each request instructs Codex to load the original `listen-language-content/SKILL.md`, `workflow.md` and `learning-profile.md`, make its own search and content decisions, and return a JSON-schema-constrained result. The adapter only validates URLs/fields, removes excluded/duplicate identifiers and limits each language to two entries; it does not rank content. No source or profile writes are allowed. Ratings remain in localStorage, including creator metadata for future feedback integration.

Request: `{language, duration, topic, excludedIds, count, history}`. Both initial search and “换一批” use the same Agent. Refresh keeps the successful query criteria and excludes all IDs/URLs shown in the mounted session. Old cards remain visible while loading and on failure.

Run with the existing local Vite development command. This endpoint is development-only, loopback/same-origin only, and serializes Agent runs. Each run has a ten-minute timeout. Private execution diagnostics and JSON are under `.listening-cache/agent/`, excluded from Git and Vite serving. Authentication/usage failures are errors, never static recommendation fallbacks. This local integration has not been deployed.
