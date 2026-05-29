import { useMemo, useState } from 'react';
import { DEVICE_TABS } from './config/devices';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DeviceSidebar } from './components/DeviceSidebar';
import { FirePumpDashboard } from './components/FirePumpDashboard';
import { getSamplePacketForDevice } from './data/samples';
import { decodeDevicePacket } from './lib/decodeDevicePacket';
import { normalizePacket } from './lib/normalizePacket';
import { useDevicePacket } from './hooks/useDevicePacket';
import './App.css';

function App() {
  const [selectedDeviceId, setSelectedDeviceId] = useState(123);
  const selectedTab = DEVICE_TABS.find((t) => t.id === selectedDeviceId) ?? DEVICE_TABS[0];

  const {
    packet,
    fetchError,
    lastRefresh,
    isRefreshing,
    isLive,
    apiUrl,
    setManualPacket,
    refreshIntervalMs,
  } = useDevicePacket(selectedDeviceId);

  const [manualJsonByDevice, setManualJsonByDevice] = useState<Record<number, string>>(() => ({
    123: JSON.stringify(getSamplePacketForDevice(123), null, 2),
    124: JSON.stringify(getSamplePacketForDevice(124), null, 2),
  }));

  const manualJson = manualJsonByDevice[selectedDeviceId] ?? JSON.stringify(getSamplePacketForDevice(selectedDeviceId), null, 2);

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

  const snapshot = useMemo(() => decodeDevicePacket(activePacket), [activePacket]);

  const displayJson = isLive ? JSON.stringify(packet, null, 2) : manualJson;
  const displayError = fetchError ?? parseError;

  const handleManualChange = (json: string) => {
    setManualJsonByDevice((prev) => ({ ...prev, [selectedDeviceId]: json }));
    try {
      setManualPacket(json);
    } catch {
      /* parse error surfaced via useMemo */
    }
  };

  const handleDeviceChange = (deviceId: number) => {
    setSelectedDeviceId(deviceId);
  };

  const handleResetSample = () => {
    handleManualChange(JSON.stringify(getSamplePacketForDevice(selectedDeviceId), null, 2));
  };

  return (
    <div className="app">
      <DeviceSidebar selectedDeviceId={selectedDeviceId} onSelectDevice={handleDeviceChange} />

      <main className="app__main">
        <ErrorBoundary>
          <FirePumpDashboard
            snapshot={snapshot}
            lastRefresh={lastRefresh}
            isRefreshing={isRefreshing}
            refreshIntervalMs={refreshIntervalMs}
            isLive={isLive}
          />
        </ErrorBoundary>
      </main>

      <aside className="debug-panel">
        <h3>Live packet</h3>
        <p className="debug-panel__hint">
          {isLive ? (
            <>
              Device <strong>{selectedDeviceId}</strong> · {selectedTab.subtitle}
              <br />
              Auto-refreshing every {refreshIntervalMs / 1000}s from <code>{apiUrl}</code>
            </>
          ) : (
            <>
              Device <strong>{selectedDeviceId}</strong> · paste JSON or set{' '}
              <code>VITE_PACKET_API_URL</code> in <code>.env</code> (uses <code>deviceid</code> query param).
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
          <button type="button" className="debug-panel__reset" onClick={handleResetSample}>
            Reset to sample packet
          </button>
        )}
      </aside>
    </div>
  );
}

export default App;
