import type { M3dPacket } from '../types/m3d';
import { JOCKEY_RTU_STATUS_REG } from './m3dRegisters';

const RTU_COUNTER_KEYS = ['rhrs', 'stop', 'start', 'status', 'stcount'] as const;

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : undefined;
}

function pickRtuField(
  src: Record<string, unknown> | undefined,
  key: (typeof RTU_COUNTER_KEYS)[number],
): number | undefined {
  if (!src || !(key in src)) return undefined;
  const raw = src[key];
  if (raw === null || raw === undefined) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/** Modbus register keys are numeric strings (e.g. "2006"); skip metadata like deviceid/timestamp. */
function pickTcpRegisters(src: Record<string, unknown> | undefined): Record<string, number> {
  if (!src) return {};
  const tcp: Record<string, number> = {};
  for (const [key, value] of Object.entries(src)) {
    if (!/^\d+$/.test(key)) continue;
    const n = Number(value);
    if (Number.isFinite(n)) tcp[key] = n;
  }
  return tcp;
}

/**
 * Ensure packet shape is safe to decode.
 *
 * Production API envelope:
 * `{ status: "success", deviceid, rtu: { status, rhrs, stop, start, stcount, … }, tcp: { "1001": … } }`
 *
 * Also accepts legacy shapes where Modbus registers were duplicated under `rtu`.
 */
export function normalizePacket(raw: unknown): M3dPacket {
  const root = asRecord(raw) ?? {};
  const rtuSrc = asRecord(root.rtu);
  const tcpSrc = asRecord(root.tcp);
  // Registers live on `tcp`; legacy packets may still embed numeric keys on `rtu`.
  const tcp = { ...pickTcpRegisters(rtuSrc), ...pickTcpRegisters(tcpSrc) };

  return {
    rtu: {
      rhrs: pickRtuField(rtuSrc, 'rhrs'),
      stop: pickRtuField(rtuSrc, 'stop'),
      start: pickRtuField(rtuSrc, 'start'),
      // Jockey status word — RTU field `status` (register 12), not the API envelope `status`.
      status:
        pickRtuField(rtuSrc, 'status') ??
        (JOCKEY_RTU_STATUS_REG in tcp ? tcp[JOCKEY_RTU_STATUS_REG] : undefined),
      stcount: pickRtuField(rtuSrc, 'stcount'),
    },
    tcp,
  };
}

export function hasTcpRegister(packet: M3dPacket, reg: string): boolean {
  return Object.prototype.hasOwnProperty.call(packet.tcp, reg);
}

/** True when the normalized packet includes an RTU field (e.g. status = register 12). */
export function hasRtuField(
  packet: M3dPacket,
  field: keyof M3dPacket['rtu'],
): boolean {
  return packet.rtu[field] !== undefined;
}
