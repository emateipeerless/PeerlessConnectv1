import { useMemo, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FirePumpDashboard } from './components/FirePumpDashboard';
import { sampleM3dPacket } from './data/samplePacket';
import { decodeM3dPacket } from './lib/decodeM3d';
import { normalizePacket } from './lib/normalizePacket';
import './App.css';

function App() {
  const [packetJson, setPacketJson] = useState(() => JSON.stringify(sampleM3dPacket, null, 2));

  const { snapshot, parseError } = useMemo(() => {
    try {
      const packet = normalizePacket(JSON.parse(packetJson));
      return { snapshot: decodeM3dPacket(packet), parseError: null as string | null };
    } catch (err) {
      return {
        snapshot: decodeM3dPacket(normalizePacket(sampleM3dPacket)),
        parseError: err instanceof Error ? err.message : 'Invalid JSON',
      };
    }
  }, [packetJson]);

  return (
    <div className="app">
      <ErrorBoundary>
        <FirePumpDashboard snapshot={snapshot} />
      </ErrorBoundary>

      <aside className="debug-panel">
        <h3>Live packet (M3D)</h3>
        <p className="debug-panel__hint">
          Paste incoming IoT JSON to preview decoded values. Jockey status comes from{' '}
          <code>rtu.status</code> (RTU register 12). Jockey discharge (TCP 18) is optional until polled.
        </p>
        {parseError && <p className="debug-panel__error">{parseError}</p>}
        <textarea
          className="debug-panel__input"
          value={packetJson}
          onChange={(e) => setPacketJson(e.target.value)}
          spellCheck={false}
        />
        <button
          type="button"
          className="debug-panel__reset"
          onClick={() => setPacketJson(JSON.stringify(sampleM3dPacket, null, 2))}
        >
          Reset to sample packet
        </button>
      </aside>
    </div>
  );
}

export default App;
