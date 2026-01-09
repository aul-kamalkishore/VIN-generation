# Dummy VIN generator — VIN Generator & Validator (React + TypeScript)

Offline VIN generation and validation that follows ISO 3779 structure and the ISO/NHTSA check-digit algorithm (no external APIs).

## What this app does

- Generates ISO 3779–structured 17-character VINs (WMI + VDS + VIS)
- Computes/validates check digit (position 9) via transliteration + weights → mod 11, with 10 → `X`
- Uses model year codes in position 10 for 1980–2039
- Excludes `I`, `O`, `Q` characters
- Provides a UI for generating 1 / generating a batch / validating VINs
- Exports generated rows as CSV and supports one-click copy

## Standards / references

- Check digit algorithm (transliteration + weights): https://en.wikibooks.org/wiki/Vehicle_Identification_Numbers_(VIN_codes)/Check_digit
- Model year chart for position 10 (1980–2039): https://www.faxvin.com/vin-year-chart
- VIN structure summary (WMI/VDS/VIS): https://unece.org/transport/vehicle-regulations/vin-vehicle-identification-number

## Project layout

- VIN utilities: [src/lib/vin.ts](src/lib/vin.ts)
- Unit tests: [src/lib/vin.test.ts](src/lib/vin.test.ts)
- UI: [src/App.tsx](src/App.tsx)

## Scripts

```bash
npm run dev
npm run build
npm test
npm run lint
npm run format
```

## Deploy to GitHub Pages

This repo is set up to deploy via GitHub Actions (builds `dist/` and publishes it to Pages).

1. Push to the `main` branch.
2. In GitHub go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Do **not** choose the **Jekyll** workflow/template. Jekyll is for Jekyll sites and won’t run the Vite build.
	- If GitHub offers templates like **Static HTML** vs **Jekyll**, choose **Static HTML** (or skip templates entirely).
	- This repo already contains the workflow at `.github/workflows/deploy.yml`.

Your site URL will be:

`https://<your-username>.github.io/<repo-name>/`

## Notes

- Model year codes repeat every 30 years; this app supports 1980–2039 as requested.
- Generated VINs are synthetic and are not tied to real manufacturers.
