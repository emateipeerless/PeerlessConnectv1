import type { AnalogReading, FirePumpSnapshot, StatusItem, SwitchMode } from '../types/m3d';
import { Lamp } from './StatusBadge';
import { SwitchPositionDisplay } from './SwitchPositionDisplay';

function SwitchPanel({
  mode,
  label,
  unavailable,
}: {
  mode: SwitchMode;
  label: string;
  unavailable?: boolean;
}) {
  return (
    <div className="panel panel--inline">
      <h3>Switch Position</h3>
      {unavailable ? (
        <p className="panel-unavailable">RTU status not in packet — will show OFF / AUTO / MANUAL when available.</p>
      ) : (
        <SwitchPositionDisplay mode={mode} label={label} />
      )}
    </div>
  );
}

function StatusLampPanel({
  title,
  items,
  troubleCount,
  unavailable,
}: {
  title: string;
  items: StatusItem[];
  troubleCount?: number;
  unavailable?: boolean;
}) {
  const troubles = troubleCount ?? items.filter((i) => i.active && !i.okWhenActive).length;

  return (
    <div className="panel">
      <div className="panel__title-row">
        <h3>{title}</h3>
        {!unavailable && (
          <span className={`alarm-summary ${troubles > 0 ? 'alarm-summary--warn' : ''}`}>
            {troubles} trouble
          </span>
        )}
      </div>
      {unavailable ? (
        <p className="panel-unavailable">RTU status (register 12) not in packet yet.</p>
      ) : (
        <div className="status-lamp-grid">
          {items.map((item) => (
            <Lamp
              key={item.id}
              label={item.label}
              active={item.active}
              variant={item.active ? (item.okWhenActive ? 'ok' : 'alarm') : 'default'}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type FirePumpDashboardProps = {
  snapshot: FirePumpSnapshot;
  lastRefresh?: Date | null;
  isRefreshing?: boolean;
  refreshIntervalMs?: number;
  isLive?: boolean;
};

export function FirePumpDashboard({
  snapshot,
  lastRefresh,
  isRefreshing = false,
  refreshIntervalMs = 7000,
  isLive = false,
}: FirePumpDashboardProps) {
  const { mainPump, jockeyPump } = snapshot;
  const mainTroubles = mainPump.alarms.filter((a) => a.active && !a.okWhenActive);
  const jockeyTroubles = jockeyPump.status.filter((a) => a.active && !a.okWhenActive);
  const discharge = mainPump.analog.systemDischargePressure;
  const dischargeLow = mainPump.alarms.find((a) => a.id === 'system-discharge-pressure-low')?.active;

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <p className="dashboard__eyebrow">IoT Fire Pump Monitor</p>
          <h1>M3D Controller</h1>
        </div>
        <div className="dashboard__meta">
          <span className="meta-pill">Template: {snapshot.template}</span>
          {isLive && (
            <span className={`meta-pill ${isRefreshing ? 'meta-pill--pulse' : 'meta-pill--live'}`}>
              {isRefreshing ? 'Refreshing…' : `Live · ${refreshIntervalMs / 1000}s`}
            </span>
          )}
          <span className="meta-pill meta-pill--muted">
            Updated {(lastRefresh ?? new Date(snapshot.receivedAt)).toLocaleString()}
          </span>
        </div>
      </header>

      <section className="pump-section pump-section--main">
        <h2 className="pump-section__title">Main Pump</h2>

        <div className={`discharge-hero ${dischargeLow ? 'discharge-hero--low' : ''}`}>
          <p className="discharge-hero__label">System Discharge Pressure</p>
          <p className="discharge-hero__value">
            {formatValue(discharge, 1)}
            <span className="discharge-hero__unit">PSI</span>
          </p>
          {dischargeLow && <p className="discharge-hero__alert">Low pressure alarm active</p>}
        </div>

        <SwitchPanel mode={mainPump.switchMode} label="Main pump switch position" />

        <div className="panel">
          <h3>Batteries</h3>
          <div className="metric-grid">
            {mainPump.analogs
              .filter((a) => a.id !== 'system-discharge-pressure')
              .map((reading) => (
                <Metric key={reading.id} reading={reading} />
              ))}
          </div>
        </div>

        <StatusLampPanel title="Alarms / Status" items={mainPump.alarms} troubleCount={mainTroubles.length} />
      </section>

      <section className="pump-section pump-section--jockey">
        <h2 className="pump-section__title">Jockey Pump</h2>

        {jockeyPump.hasDischargeRegister ? (
          <div className="discharge-hero discharge-hero--jockey">
            <p className="discharge-hero__label">Jockey Discharge</p>
            <p className="discharge-hero__value">
              {formatValue(jockeyPump.discharge ?? 0, 1)}
              <span className="discharge-hero__unit">PSI</span>
            </p>
          </div>
        ) : (
          <div className="panel panel--placeholder">
            <h3>Jockey Discharge</h3>
            <p className="panel-unavailable">Register 18 not in packet yet.</p>
          </div>
        )}

        <div className="pump-section__row">
          <SwitchPanel
            mode={jockeyPump.switchMode}
            label="Jockey pump switch position"
            unavailable={!jockeyPump.hasStatusRegister}
          />
          <div className="panel panel--inline">
            <h3>Operating Stats</h3>
            <div className="metric-grid metric-grid--compact">
              <Metric label="Run Hours" value={jockeyPump.runHours} />
              <Metric label="Starts" value={jockeyPump.startCount} />
              <Metric label="Stops" value={jockeyPump.stopCount} />
            </div>
          </div>
        </div>

        <StatusLampPanel
          title="Status"
          items={jockeyPump.status}
          troubleCount={jockeyTroubles.length}
          unavailable={!jockeyPump.hasStatusRegister}
        />
      </section>
    </div>
  );
}

function formatValue(value: number, decimals: number): string {
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function Metric({
  label,
  value,
  reading,
}: {
  label?: string;
  value?: number;
  reading?: AnalogReading;
}) {
  const displayLabel = reading?.label ?? label ?? '';
  const displayValue = reading?.value ?? value ?? 0;
  const decimals = reading?.decimals ?? 0;
  const unit = reading?.unit;

  return (
    <div className="metric">
      <span className="metric__label">{displayLabel}</span>
      <span className="metric__value">
        {formatValue(displayValue, decimals)}
        {unit && <span className="metric__unit">{unit}</span>}
      </span>
    </div>
  );
}
