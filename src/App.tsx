import { useMemo, useState } from 'react';
import { PACKET_API_URL } from './config';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FirePumpDashboard } from './components/FirePumpDashboard';
import { sampleDevicePacket } from './data/samplePacket';
import { decodeM3dPacket } from './lib/decodeM3d';
import { normalizePacket } from './lib/normalizePacket';
import { useM3dPacket } from './hooks/useM3dPacket';
import './App.css';

function App() {
  const {
    packet,
    fetchError,
    lastRefresh,
    isRefreshing,
    isLive,
    setManualPacket,
    refreshIntervalMs,
  } = useM3dPacket();

  const [manualJson, setManualJson] = useState(() => JSON.stringify(sampleDevicePacket, null, 2));

  const { activePacket, parseError } = useMemo(() => {
    if (isLive) {
      return { activePacket: packet, parseError: null as string | null };
    }
    try {
      return {
        activePacket: normalizePacket(JSON.parse(manualJson)),
        parseError: null as string | null,
      };
    } catch (err) {
      return {
        activePacket: packet,
        parseError: err instanceof Error ? err.message : 'Invalid JSON',
      };
    }
  }, [isLive, packet, manualJson]);

  const snapshot = useMemo(() => decodeM3dPacket(activePacket), [activePacket]);

  const displayJson = isLive ? JSON.stringify(packet, null, 2) : manualJson;
  const displayError = fetchError ?? parseError;

  const handleManualChange = (json: string) => {
    setManualJson(json);
    try {
      setManualPacket(json);
    } catch {
      /* parse error surfaced via useMemo */
    }
  };

  return (
    <div className="app">
      <ErrorBoundary>
        <FirePumpDashboard
          snapshot={snapshot}
          lastRefresh={lastRefresh}
          isRefreshing={isRefreshing}
          refreshIntervalMs={refreshIntervalMs}
          isLive={isLive}
        />
      </ErrorBoundary>

      <aside className="debug-panel">
        <h3>Live packet (M3D)</h3>
        <p className="debug-panel__hint">
          {isLive ? (
            <>
              Auto-refreshing every {refreshIntervalMs / 1000}s from{' '}
              <code>{PACKET_API_URL}</code>
            </>
          ) : (
            <>
              Set <code>VITE_PACKET_API_URL</code> in <code>.env</code> for live polling every{' '}
              {refreshIntervalMs / 1000}s. Until then, paste JSON below.
            </>
          )}
        </p>
        {displayError && <p className="debug-panel__error">{displayError}</p>}
        <textarea
          className="debug-panel__input"
          value={displayJson}
          onChange={(e) => !isLive && handleManualChange(e.target.value)}
          readOnly={isLive}
          spellCheck={false}
        />
        {!isLive && (
          <button
            type="button"
            className="debug-panel__reset"
            onClick={() => handleManualChange(JSON.stringify(sampleDevicePacket, null, 2))}
          >
            Reset to sample packet
          </button>
        )}
      </aside>
    </div>
  );
}

export default App;
