import type { SwitchMode } from '../types/m3d';

export type BitMapping = {
  label: string;
  reg: string;
  bit: number;
  okWhenActive?: boolean;
};

export type RtuBitMapping = {
  label: string;
  bit: number;
  okWhenActive?: boolean;
};

export type AnalogMapping = {
  label: string;
  reg: string;
  unit: string;
  decimals: number;
};

/** Raw Modbus values are scaled ×10 (e.g. 140 → 14.0 V) */
export const ANALOG_SCALE = 10;

export const ALARM_BITS: BitMapping[] = [
  { label: 'AC Power On', reg: '1800', bit: 0, okWhenActive: true },
  { label: 'Common Trouble Alarm', reg: '2013', bit: 2 },
  { label: 'System Discharge Pressure Low', reg: '2012', bit: 0 },
  { label: 'Engine Running', reg: '2011', bit: 4, okWhenActive: true },
  { label: 'Engine Failed to Start', reg: '2011', bit: 11 },
  { label: 'Engine Coolant Temp High', reg: '1800', bit: 6 },
  { label: 'Engine Oil Pressure Low', reg: '2013', bit: 14 },
  { label: 'Engine Overspeed', reg: '2011', bit: 9 },
  { label: 'Engine Alternate ECM', reg: '2013', bit: 7 },
  { label: 'Engine Fuel Injector Malfunction', reg: '2013', bit: 8 },
  { label: 'ECM warning', reg: '2013', bit: 9 },
  { label: 'ECM Failure', reg: '2013', bit: 10 },
  { label: 'High Raw Water Temp', reg: '2013', bit: 11 },
  { label: 'Low Raw Water Flow', reg: '2013', bit: 12 },
  { label: 'Low Engine Temp', reg: '2013', bit: 13 },
  { label: 'Fuel Tank Level Low', reg: '1003', bit: 6 },
  { label: 'Auto Shutdown is Disabled', reg: '1800', bit: 2, okWhenActive: true },
  { label: 'Charger #1 Malfunction', reg: '2014', bit: 12 },
  { label: 'Charger #2 Malfunction', reg: '2014', bit: 13 },
  { label: 'Battery #1 Trouble', reg: '2013', bit: 0 },
  { label: 'Battery #2 Trouble', reg: '2013', bit: 1 },
  { label: 'Low Pump Room Temp', reg: '1001', bit: 12 },
  { label: 'High Reservoir Level', reg: '1003', bit: 3 },
  { label: 'Low Reservoir Level', reg: '1003', bit: 1 },
  { label: 'Fuel Tank Spill/Leak Sensor', reg: '1003', bit: 5 },
];

export const ANALOGS: AnalogMapping[] = [
  { label: 'System Discharge Pressure', reg: '2006', unit: 'PSI', decimals: 1 },
  { label: 'Battery #1 Volts', reg: '2000', unit: 'V', decimals: 1 },
  { label: 'Battery #2 Volts', reg: '2001', unit: 'V', decimals: 1 },
  { label: 'Battery #1 Amps', reg: '2003', unit: 'A', decimals: 1 },
  { label: 'Battery #2 Amps', reg: '2004', unit: 'A', decimals: 1 },
];

/** Jockey discharge — TCP register 18 (not yet polled on all devices) */
export const JOCKEY_DISCHARGE_REG = '18';

/** Main pump switch — TCP registers (see M3D mapping sheet) */
export const MAIN_SWITCH_BITS = {
  auto: { reg: '2012', bit: 10 },
  manual: { reg: '2012', bit: 11 },
  off: { reg: '1800', bit: 1 },
} as const;

/**
 * Jockey pump status word — RTU register 12 (`rtu.status` or tcp key `"12"`).
 * Switch uses the same word as JOCKEY_STATUS_BITS: bit2=AUTO, bit3=MANUAL, both clear=OFF.
 */
export const JOCKEY_RTU_STATUS_REG = '12';
export const JOCKEY_RTU_STATUS_FIELD = 'status' as const;
export const JOCKEY_SWITCH_BITS = { auto: 2, manual: 3 } as const;

export const JOCKEY_STATUS_BITS: RtuBitMapping[] = [
  { label: 'Discharge Transducer Fault', bit: 0 },
  { label: 'Suction Transducer Fault', bit: 1 },
  { label: 'Jockey Pump Running', bit: 5, okWhenActive: true },
  { label: 'Jockey Over Pressure', bit: 7 },
  { label: 'Jockey Failed to Start', bit: 8 },
  { label: 'Jockey Excessive Starts', bit: 9 },
  { label: 'Jockey Common Trouble', bit: 10 },
  { label: 'Low Suction Pressure', bit: 11 },
  { label: 'Low Fuel', bit: 12 },
  { label: 'Fuel Transducer Fault', bit: 13 },
  { label: 'Jockey Power Available', bit: 15, okWhenActive: true },
];

export function alarmId(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function scaleAnalog(raw: number): number {
  return raw / ANALOG_SCALE;
}

export function isBitSet(value: number, bit: number): boolean {
  return ((value >> bit) & 1) === 1;
}

/** Main switch from TCP 2012 (auto/manual) and TCP 1800 (off). Manual wins over auto. */
export function decodeMainSwitch(getReg: (reg: string) => number): SwitchMode {
  const modeReg = getReg(MAIN_SWITCH_BITS.auto.reg);
  const offReg = getReg(MAIN_SWITCH_BITS.off.reg);
  if (isBitSet(modeReg, MAIN_SWITCH_BITS.manual.bit)) return 'MANUAL';
  if (isBitSet(modeReg, MAIN_SWITCH_BITS.auto.bit)) return 'AUTO';
  if (isBitSet(offReg, MAIN_SWITCH_BITS.off.bit)) return 'OFF';
  return 'OFF';
}

/** Jockey switch from RTU status register 12 — same word as status lamps. */
export function decodeJockeySwitch(value: number): SwitchMode {
  const auto = isBitSet(value, JOCKEY_SWITCH_BITS.auto);
  const manual = isBitSet(value, JOCKEY_SWITCH_BITS.manual);
  if (manual) return 'MANUAL';
  if (auto) return 'AUTO';
  return 'OFF';
}

export function decodeRtuStatusBits(
  statusWord: number,
  definitions: RtuBitMapping[],
): { id: string; label: string; active: boolean; okWhenActive: boolean }[] {
  return definitions.map(({ label, bit, okWhenActive }) => ({
    id: alarmId(label),
    label,
    active: isBitSet(statusWord, bit),
    okWhenActive: okWhenActive ?? false,
  }));
}
