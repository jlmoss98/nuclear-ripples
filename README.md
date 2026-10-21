# Nuclear Ripples

**Can you avoid a tsunami?**

Nuclear Ripples is an interactive atlas for exploring East Asian nuclear proliferation escalation scenarios Scores compare scenarios; they are not probabilities or forecasts.

## Use the public atlas

[Open Nuclear Ripples](https://jlmoss98.github.io/nuclear-ripples/)

The atlas runs entirely in the browser. It does not require an account, API key, or installation. Scenario choices can be shared through the atlas’s **Share scenario** button.

## Reading the atlas

Country fill shows comparative escalation exposure. The military symbols show the selected conditions and model-predicted posture reactions that helped produce those scores:

- One icon represents a Level 1 or moderate qualitative change; three icons represent Level 2 or a major change.
- Solid warheads are postures selected by the user. Outlined warheads are reactions predicted by the model.
- Other symbols distinguish crises, missile defense, counterstrike capability, U.S. force presence and assurance, cooperation, doctrine, ASEAN cohesion, and domestic nuclear policy.

Icon counts show qualitative intensity—not literal quantities of weapons, ships, or systems.

## Local development

Requires Node.js 22.12 or newer.

```bash
npm install
npm run dev
```

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:browser
```

The browser suite expects Playwright’s Chromium binary. Install it once with `npx playwright install chromium` if it is not already present.

## Architecture

- `src/model`: deterministic scenario types, URL validation, and the two-wave calculation engine.
- `src/data`: strategic-control copy, citations, and evidence metadata.
- `src/ui`: unified scenario controls, D3/SVG map, results table, and explanation surfaces.
- `public/data`: local Natural Earth map-unit geometry; no map service or API key is used.

## Public deployment

The public atlas is deployed to GitHub Pages from the `gh-pages` branch. The
editable application source lives on `main`; `gh-pages` contains only the
compiled static site built for the `/nuclear-ripples/` repository path.

No environment variables, external APIs, or backend services are required.

## Geography and neutrality

The site uses a local subset of Natural Earth 1:50m Admin 0 map-unit geometry. Names and boundaries are navigational and do not express a position on sovereignty, legal status, or disputed boundaries, including those concerning Taiwan.
