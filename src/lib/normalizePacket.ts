import type { M3dPacket } from '../types/m3d';

/** Ensure packet shape is safe to decode (missing rtu/tcp won't crash the UI). */
export function normalizePacket(raw: unknown): M3dPacket {
  const p = (raw ?? {}) as Partial<M3dPacket>;
  return {
    rtu: {
      rhrs: Number(p.rtu?.rhrs) || 0,
      stop: Number(p.rtu?.stop) || 0,
      start: Number(p.rtu?.start) || 0,
      status: Number(p.rtu?.status) || 0,
      stcount: Number(p.rtu?.stcount) || 0,
    },
    tcp: typeof p.tcp === 'object' && p.tcp !== null ? p.tcp : {},
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
  return typeof packet.rtu[field] === 'number' && Number.isFinite(packet.rtu[field]);
}
