# EquityLens

<div align="center">

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![No Backend](https://img.shields.io/badge/backend-none-lightgrey?style=flat-square)
![Privacy](https://img.shields.io/badge/data-local_only-teal?style=flat-square)

**Private equity share price forecasting — entirely in your browser.**

[Features](#features) · [Getting Started](#getting-started) · [Usage](#usage) · [Architecture](#architecture) · [Privacy](#privacy)

</div>

---

EquityLens helps employees with private company equity — options, RSUs, or direct shares — model potential exit values across valuation scenarios. Enter your cap table position, ARR forecast, and valuation assumptions, then drag a slider to instantly see gross proceeds, broker fees, and post-tax net value across Low / Mid / High scenarios.

> 🔒 **All data stays on your device.** Nothing is ever transmitted to a server. Computations run locally; simulations are saved only to your browser's `localStorage`.

---

## Features

### 📋 Company & Position
Set your company name, share class, shares held, total shares outstanding, and strike price / cost basis. Upload a cap table screenshot and OCR will automatically extract the total shares figure.

### 📈 ARR Timeline
Enter historical ARR from FY-3 through to your FY0 forecast. Year-over-year growth rates are calculated automatically and visualised as a sparkline chart.

### ⚙️ Valuation Inputs
Tune an ARR multiple range (Low → High) and four benchmark sliders — Gross Margin, NRR, Burn Multiple, and Discount Rate. Each slider is colour-coded against typical SaaS industry benchmarks so you can see at a glance how your assumptions compare.

### 💰 Equity Payout Estimator
Click **Low**, **Mid**, or **High** scenario chips to snap to a price, or drag the unified slider to explore any price within the full range. Four live metric cards update in real time:

| Card | Shows |
|---|---|
| Estimated Share Price | Selected price vs. Mid scenario |
| Gross Value of My Shares | Total value at selected price |
| Net Value After Commission | After broker fee and flat transaction fee |
| Implied EV at This Price | Implied enterprise value across all shares |

### 🧾 Commission Panel
Configure a percentage broker fee and a flat transaction fee. Toggle a post-tax estimate with a configurable tax rate. An animated waterfall summarises Gross → Net → After-Tax proceeds.

### 💾 Simulations Drawer
Save unlimited scenarios to `localStorage`, grouped by company name. For each saved simulation you can:

- **Load** — restore all inputs into the app
- **Copy** — duplicate as a new scenario
- **Download** — export as a `.equitylens.json` file named after the simulation
- **Import** — load any previously exported `.equitylens.json` file
- **Print** — generate a professional PDF-ready report in a new window (auto-triggers print dialog)
- **Delete** — remove permanently from local storage

---

## Tech Stack

| Library | Version | Purpose |
|---|---|---|
| [React](https://react.dev/) | 18 | UI, hooks, `useMemo`-driven reactivity |
| [Vite](https://vitejs.dev/) | 5 | Dev server & production build |
| [Tailwind CSS](https://tailwindcss.com/) | 3 | Utility-first styling with custom design tokens |
| [Recharts](https://recharts.org/) | 2 | ARR sparkline + scenario bar charts |
| [Radix UI](https://www.radix-ui.com/) | 1 | Accessible headless Slider, Dialog, Select, Switch, Tooltip |
| [Tesseract.js](https://tesseract.projectnaptha.com/) | 7 | In-browser OCR for cap table image parsing |
| [Lucide React](https://lucide.dev/) | 0.344 | Icon set |

**No backend. No database. No auth. No external API calls.**

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Installation

```bash
git clone https://github.com/your-username/equity-lens.git
cd equity-lens
npm install
```

### Development

```bash
npm run dev
# → http://127.0.0.1:5173
```

### Production Build

```bash
npm run build      # outputs to /dist
npm run preview    # serves the built output locally
```

---

## Usage

1. **Company & Position** — enter your shares held and total shares outstanding. Your ownership % is shown immediately.
2. **ARR Timeline** — enter your FY0 ARR forecast as a full dollar amount (e.g. `12000000` for $12M — not `12`).
3. **Valuation Inputs** — adjust the ARR multiple range and benchmark sliders to reflect your view of the company.
4. **Equity Payout Estimator** — click a scenario chip or drag the slider to model different exit prices and see your estimated payout.
5. **Commission Panel** — configure your broker fee and optionally enable the post-tax estimate.
6. **Save** — hit *Save Simulation* to persist the scenario. Open the *Simulations* drawer to manage all your scenarios.

### Importing & Exporting Simulations

Simulations can be exported as `.equitylens.json` files and re-imported on any device. The file contains all inputs (company, ARR, benchmarks, commission settings) but no personal financial credentials.

```
bull-case-testco.equitylens.json
```

---

## Architecture

```
src/
├── main.jsx                  — entry point
├── App.jsx                   — root state, all computed values, event handlers
├── index.css                 — Tailwind base + custom slider / scrollbar styles
├── lib/
│   └── utils.js              — formatCurrency, formatPercent, generateId, …
└── components/
    ├── Header.jsx             — sticky header, sim count badge, new-simulation dialog
    ├── CompanySetup.jsx       — company fields + OCR image upload (base64)
    ├── ARRTimeline.jsx        — FY inputs, growth rates, sparkline chart
    ├── ValuationInputs.jsx    — ARR multiple range + 4 benchmark sliders
    ├── OutcomeDashboard.jsx   — scenario chips, price slider, metric cards, bar charts
    ├── CommissionPanel.jsx    — broker %, flat fee, tax toggle, waterfall summary
    ├── SimulationsDrawer.jsx  — save / load / copy / download / import / print / delete
    └── ui/
        ├── Slider.jsx         — LabeledSlider with floating value bubble (Radix UI)
        └── Toast.jsx          — success / info / error toast notifications
```

### Key Design Decisions

- **All state in `App.jsx`** — every derived value is computed via `useMemo` and passed as props. No global state library required.
- **No backend** — `localStorage` is the only persistence layer, using the key prefix `equitylens_sim_`.
- **Valuation formula**:
  ```
  Adjusted ARR  = FY0 × (NRR / 100)
  Low EV        = Adjusted ARR × lowMultiple
  High EV       = Adjusted ARR × highMultiple
  Share Price   = EV / totalShares
  ```
- **Slider range** — the outcome slider spans `0.5× lowSharePrice` → `1.5× highSharePrice`, allowing exploration beyond the modelled band.
- **Auto default price** — once `hasData` is true, the selected price auto-initialises to the midpoint of Low and High.
- **Print reports** — generated as self-contained HTML with inline CSS in a new browser window; no library dependency needed.

### Design Tokens

| Token | Value | Usage |
|---|---|---|
| Background | `#F8F9FB` | Page background |
| Navy | `#0F1C2E` | Headings, body text |
| Teal | `#14B8A6` | Primary CTA, slider fill |
| Sky | `#0EA5E9` | Secondary accent |
| Card radius | `12px` | All card components |
| Fonts | DM Sans (body) · Sora (display) | Google Fonts |

---

## Privacy

EquityLens was deliberately designed with no server component:

- ✅ No analytics, tracking, or telemetry
- ✅ No network requests at runtime (Google Fonts load on first visit only)
- ✅ OCR processing runs entirely in-browser via WebAssembly (Tesseract.js)
- ✅ Simulation files never leave your device unless you explicitly export them
- ✅ Clearing your browser's site data removes all stored simulations

---

## Disclaimer

EquityLens is a personal modelling tool and does **not** constitute financial, legal, or investment advice. Private company valuations are inherently uncertain and actual outcomes may differ significantly from any projection. Consult a qualified financial advisor before making decisions based on equity valuations.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <sub>Built with React + Vite · Designed for personal use</sub>
</div>
