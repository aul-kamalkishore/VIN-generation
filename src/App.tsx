import { useMemo, useState } from 'react';

import { computeCheckDigit, generateVIN, isValidVIN, yearToCode } from './lib/vin';
import './App.css';

type VinRow = {
  vin: string;
  wmi: string;
  year: number;
  plant: string;
  serial: string;
  generatedAt: string;
};

type WmiOption = {
  wmi: string;
  label: string;
  country: string;
};

const WMI_OPTIONS: WmiOption[] = [
  { wmi: '1M8', label: 'Example (test VIN)', country: 'USA' },
  { wmi: '1HG', label: 'Honda', country: 'USA' },
  { wmi: '1FA', label: 'Ford', country: 'USA' },
  { wmi: '1G1', label: 'Chevrolet', country: 'USA' },
  { wmi: '1C4', label: 'Chrysler', country: 'USA' },
  { wmi: '2HG', label: 'Honda', country: 'Canada' },
  { wmi: '3VW', label: 'Volkswagen', country: 'Mexico' },
  { wmi: 'JHM', label: 'Honda', country: 'Japan' },
  { wmi: 'JTD', label: 'Toyota', country: 'Japan' },
  { wmi: 'WVW', label: 'Volkswagen', country: 'Germany' },
  { wmi: 'WBA', label: 'BMW', country: 'Germany' },
  { wmi: 'SAL', label: 'Land Rover', country: 'United Kingdom' },
  { wmi: 'YS3', label: 'Saab', country: 'Sweden' },
  { wmi: 'ZFA', label: 'Fiat', country: 'Italy' },
  { wmi: 'KNA', label: 'Kia', country: 'South Korea' },
];

const PLANT_OPTIONS = '0123456789ABCDEFGHJKLMNPRSTUVWXYZ'.split('');

const BATCH_OPTIONS = [1, 5, 10, 25, 50, 100];

const YEAR_OPTIONS: number[] = Array.from({ length: 2039 - 1980 + 1 }, (_, i) => 1980 + i);

function toCsvValue(value: string): string {
  if (/[\n\r,"]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function App() {
  const [wmi, setWmi] = useState('1M8');
  const [year, setYear] = useState<number>(2024);
  const [plant, setPlant] = useState('K');
  const [batchSize, setBatchSize] = useState<number>(10);

  const [vinInput, setVinInput] = useState('');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const [rows, setRows] = useState<VinRow[]>([]);

  const canExport = rows.length > 0;
  const normalizedVinInput = useMemo(() => vinInput.trim().toUpperCase(), [vinInput]);

  const yearCodeToYears = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const y of YEAR_OPTIONS) {
      const code = yearToCode(y);
      const existing = map.get(code);
      if (existing) existing.push(y);
      else map.set(code, [y]);
    }
    return map;
  }, []);

  const validationDetails = useMemo(() => {
    if (normalizedVinInput.length !== 17) return null;

    const vin = normalizedVinInput;
    const wmiCode = vin.slice(0, 3);
    const wmiOpt = WMI_OPTIONS.find((o) => o.wmi === wmiCode);

    const yearCode = vin[9]!;
    const possibleYears = yearCodeToYears.get(yearCode) ?? [];

    let expectedCheckDigit: string | null = null;
    try {
      expectedCheckDigit = computeCheckDigit(vin);
    } catch {
      expectedCheckDigit = null;
    }

    return {
      vin,
      isValid: isValidVIN(vin),
      wmi: wmiCode,
      wmiLabel: wmiOpt ? `${wmiOpt.label} (${wmiOpt.country})` : 'Unknown (not in local list)',
      vds: vin.slice(3, 9),
      vis: vin.slice(9),
      checkDigit: vin[8]!,
      expectedCheckDigit,
      yearCode,
      possibleYears,
      plant: vin[10]!,
      serial: vin.slice(11),
    };
  }, [normalizedVinInput, yearCodeToYears]);

  function handleGenerateOne() {
    const vin = generateVIN({ wmi, year, plant });
    const row: VinRow = {
      vin,
      wmi: vin.slice(0, 3),
      year,
      plant: vin[10]!,
      serial: vin.slice(11),
      generatedAt: new Date().toLocaleString(),
    };
    setRows((prev) => [row, ...prev]);
  }

  function handleGenerateBatch() {
    const count = Math.max(1, Math.trunc(batchSize));
    const createdAt = new Date().toLocaleString();
    const batch: VinRow[] = [];
    for (let i = 0; i < count; i++) {
      const vin = generateVIN({ wmi, year, plant });
      batch.push({
        vin,
        wmi: vin.slice(0, 3),
        year,
        plant: vin[10]!,
        serial: vin.slice(11),
        generatedAt: createdAt,
      });
    }
    setRows((prev) => [...batch, ...prev]);
  }

  function handleValidate() {
    if (normalizedVinInput.length === 0) {
      setValidationMessage('Enter a VIN to validate.');
      return;
    }
    if (normalizedVinInput.length !== 17) {
      setValidationMessage('VIN must be exactly 17 characters.');
      return;
    }

    setValidationMessage(isValidVIN(normalizedVinInput) ? 'Valid VIN.' : 'Invalid VIN.');
  }

  async function handleCopy(vin: string) {
    await navigator.clipboard.writeText(vin);
  }

  function handleExportCsv() {
    if (!canExport) return;

    const header = ['vin', 'wmi', 'year', 'plant', 'serial', 'generatedAt'];
    const lines = [header.join(',')];
    for (const r of rows) {
      lines.push(
        [r.vin, r.wmi, String(r.year), r.plant, r.serial, r.generatedAt].map(toCsvValue).join(','),
      );
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vins-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Dummy VIN generator</h1>
        <p>Generate and validate ISO 3779 VINs (offline).</p>
      </header>

      <section className="card">
        <h2>Generator</h2>
        <div className="grid">
          <label>
            WMI (3)
            <select value={wmi} onChange={(e) => setWmi(e.target.value)}>
              {WMI_OPTIONS.map((o) => (
                <option key={o.wmi} value={o.wmi}>
                  {o.wmi} — {o.label} ({o.country})
                </option>
              ))}
            </select>
          </label>
          <label>
            Year (1980–2039)
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y} ({yearToCode(y)})
                </option>
              ))}
            </select>
          </label>
          <label>
            Plant (1)
            <select value={plant} onChange={(e) => setPlant(e.target.value)}>
              {PLANT_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label>
            Batch
            <select value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))}>
              {BATCH_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="actions">
          <button type="button" onClick={handleGenerateOne}>
            Generate 1
          </button>
          <button type="button" onClick={handleGenerateBatch}>
            Generate Batch
          </button>
          <button type="button" onClick={handleExportCsv} disabled={!canExport}>
            Export CSV
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Validator</h2>
        <div className="actions">
          <input
            className="vinInput"
            value={vinInput}
            onChange={(e) => setVinInput(e.target.value.toUpperCase())}
            placeholder="Enter VIN"
            maxLength={17}
          />
          <button type="button" onClick={handleValidate}>
            Validate VIN
          </button>
        </div>
        {validationMessage ? <p className="message">{validationMessage}</p> : null}

        {validationDetails ? (
          <div className="details">
            <div className="detailsGrid">
              <div>
                <div className="detailsLabel">VIN</div>
                <div className="mono">{validationDetails.vin}</div>
              </div>
              <div>
                <div className="detailsLabel">Status</div>
                <div>{validationDetails.isValid ? 'Valid' : 'Invalid'}</div>
              </div>
              <div>
                <div className="detailsLabel">WMI</div>
                <div className="mono">{validationDetails.wmi}</div>
                <div className="subtle">{validationDetails.wmiLabel}</div>
              </div>
              <div>
                <div className="detailsLabel">VDS (pos 4–9)</div>
                <div className="mono">{validationDetails.vds}</div>
              </div>
              <div>
                <div className="detailsLabel">VIS (pos 10–17)</div>
                <div className="mono">{validationDetails.vis}</div>
              </div>
              <div>
                <div className="detailsLabel">Check digit (pos 9)</div>
                <div className="mono">
                  {validationDetails.checkDigit}
                  {validationDetails.expectedCheckDigit
                    ? ` (expected ${validationDetails.expectedCheckDigit})`
                    : ' (cannot compute)'}
                </div>
              </div>
              <div>
                <div className="detailsLabel">Model year (pos 10)</div>
                <div className="mono">{validationDetails.yearCode}</div>
                <div className="subtle">
                  {validationDetails.possibleYears.length
                    ? `Possible years: ${validationDetails.possibleYears.join(', ')}`
                    : 'Not in 1980–2039 map'}
                </div>
              </div>
              <div>
                <div className="detailsLabel">Plant (pos 11)</div>
                <div className="mono">{validationDetails.plant}</div>
              </div>
              <div>
                <div className="detailsLabel">Serial (pos 12–17)</div>
                <div className="mono">{validationDetails.serial}</div>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="card">
        <h2>Generated VINs</h2>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>VIN</th>
                <th>WMI</th>
                <th>Year</th>
                <th>Plant</th>
                <th>Serial</th>
                <th>Generated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty">
                    No VINs generated yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.vin}>
                    <td className="mono">{r.vin}</td>
                    <td className="mono">{r.wmi}</td>
                    <td>{r.year}</td>
                    <td className="mono">{r.plant}</td>
                    <td className="mono">{r.serial}</td>
                    <td>{r.generatedAt}</td>
                    <td>
                      <button type="button" onClick={() => void handleCopy(r.vin)}>
                        Copy
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default App;
