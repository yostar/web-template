# Repository overview

This project is the **Sharetribe Web Template** – a React/Redux single page application with a Node.js/Express server.  The app is designed to be customised for a marketplace and it relies on Sharetribe Flex APIs.

## Key directories

- `src/` – Client side code (React components, containers, Redux ducks, routing and utilities).
- `server/` – Express server used for server‑side rendering and API endpoints.
- `public/` – Static assets served as‑is. `index.html` is used by the server to render pages.
- `scripts/` – Helper scripts. `config.js` creates `.env` files, `audit.js` checks `yarn audit` output and `translations.js` helps maintain translation files.
- `ext/` – Transaction process definitions.
- `patches/` – Patches applied via `patch-package`.
- `server/extensions/` and `src/extensions/` – Optional features that extend the template (e.g. exchange rate, category configuration, agent training etc.).

## Configuration

The application is configured through environment variables. Use `yarn run config` to generate a `.env` file from `.env-template`. Mandatory variables include Sharetribe client id/secret, Stripe and Mapbox keys. Development defaults live in `.env.development` and testing defaults in `.env.test`.

Client‑side runtime configuration is kept under `src/config/`. `configDefault.js` exposes settings such as marketplace name, currency, and map provider options. Server side helpers for reading these settings exist in `server/env.js` and related modules.

## Running and building

- **Development** – `yarn run dev` launches both the client (port 3000) and the API server (port 3500).
- **Production build** – `yarn run build` runs `build-web` and `build-server` via `sharetribe-scripts`.
- **Tests** – `yarn test` runs the client tests. Server tests are run via `yarn run test-server`.

## Coding standards

Formatting is enforced with **Prettier**. Run `yarn format` to apply formatting or `yarn format-ci` for CI style checks. Prettier configuration is defined in `package.json`:

```json
"prettier": {
  "singleQuote": true,
  "trailingComma": "es5",
  "proseWrap": "always"
}
```

An `.editorconfig` file ensures two space indentation, UTF‑8 encoding and trimming trailing whitespace.

The codebase follows a *ducks* pattern for Redux logic (see `src/ducks`). Page level React components are placed in `src/containers` and smaller reusable components in `src/components`. Route configuration is in `src/routing/routeConfiguration.js` and page routes are rendered in `src/routing/Routes.js`.

Server side logic is written using Express. `server/index.js` starts the production server and performs server‑side rendering with data loaders and chunk extractors. Local API routes live under `server/api` and `server/apiRouter.js` wires them under the `/api` prefix.

Dynamic resources like the sitemap, robots.txt and web manifest are generated in `server/resources`.

## Patterns to know

- **Environment variables** beginning with `REACT_APP_` are exposed to the client bundle.
- **Extensions** allow optional features both in the client (`src/extensions`) and server (`server/extensions`).
- **Transaction processes** under `ext/transaction-processes` provide default processes for the marketplace.

