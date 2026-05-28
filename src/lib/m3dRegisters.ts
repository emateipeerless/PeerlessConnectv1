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

/** Alarm / status bits — sourced from trending registers (M3D mapping sheet). */
export const ALARM_BITS: BitMapping[] = [
  { label: 'AC Power On', reg: '1800', bit: 0, okWhenActive: true },
  { label: 'Main Switch in OFF', reg: '1800', bit: 1 },
  { label: 'Auto Shutdown Disabled', reg: '1800', bit: 2, okWhenActive: true },
  { label: 'Manual Start', reg: '1800', bit: 3 },
  { label: 'Engine Coolant Temp High', reg: '1800', bit: 6 },
  { label: 'Engine Running', reg: '2011', bit: 4, okWhenActive: true },
  { label: 'Low Suction Pressure', reg: '2011', bit: 8 },
  { label: 'Engine Overspeed', reg: '2011', bit: 9 },
  { label: 'Engine Failed to Start', reg: '2011', bit: 11 },
  { label: 'System Discharge Pressure Low', reg: '2012', bit: 0 },
  { label: 'Battery #1 Trouble', reg: '2013', bit: 0 },
  { label: 'Battery #2 Trouble', reg: '2013', bit: 1 },
  { label: 'Common Trouble Alarm', reg: '2013', bit: 2 },
  { label: 'Engine at ECM', reg: '2013', bit: 7 },
  { label: 'Fuel Injector Malfunction', reg: '2013', bit: 8 },
  { label: 'ECM Warning', reg: '2013', bit: 9 },
  { label: 'ECM Failure', reg: '2013', bit: 10 },
  { label: 'High Raw Water Flow', reg: '2013', bit: 11 },
  { label: 'Low Raw Water Flow', reg: '2013', bit: 12 },
  { label: 'Low Oil Pressure', reg: '2013', bit: 14 },
  { label: 'Charger #1 Failure', reg: '2014', bit: 12 },
  { label: 'Charger #2 Failure', reg: '2014', bit: 13 },
  { label: 'Water Reservoir Low', reg: '1003', bit: 1 },
  { label: 'Fuel Leak Sensor', reg: '1003', bit: 5 },
  { label: 'Low Fuel Level', reg: '1003', bit: 6 },
  { label: 'High Fuel Level', reg: '1003', bit: 7 },
  { label: 'Pump Room Trouble', reg: '1000', bit: 7 },
  { label: 'Engine Trouble', reg: '1000', bit: 8 },
  { label: 'Pump Room Temp Low', reg: '1001', bit: 12 },
];

/** Fast-updating analogs (trending stream). */
export const TRENDING_ANALOGS: AnalogMapping[] = [
  { label: 'System Discharge Pressure', reg: '2006', unit: 'PSI', decimals: 1 },
];

/** Slower analogs — often on historical; batteries may only appear there. */
export const HISTORICAL_ANALOGS: AnalogMapping[] = [
  { label: 'Battery #1 Volts', reg: '2000', unit: 'V', decimals: 1 },
  { label: 'Battery #2 Volts', reg: '2001', unit: 'V', decimals: 1 },
  { label: 'Battery #1 Amps', reg: '2003', unit: 'A', decimals: 1 },
  { label: 'Battery #2 Amps', reg: '2004', unit: 'A', decimals: 1 },
];

/** @deprecated Use TRENDING_ANALOGS + HISTORICAL_ANALOGS */
export const ANALOGS: AnalogMapping[] = [...TRENDING_ANALOGS, ...HISTORICAL_ANALOGS];

export type ScalarMetricMapping = {
  label: string;
  reg: string;
  unit: string;
  decimals: number;
  /** Divide raw value by this (default 1). Use ANALOG_SCALE for ×10 registers. */
  scale?: number;
};

/** Historical-only scalar registers (M3D mapping sheet). */
export const HISTORICAL_METRICS: ScalarMetricMapping[] = [
  { label: 'Start Pressure Setting', reg: '3028', unit: 'PSI', decimals: 0 },
  { label: 'Stop Pressure Setting', reg: '3029', unit: 'PSI', decimals: 0 },
  { label: 'Calls to Start', reg: '1803', unit: '', decimals: 0 },
  { label: 'Number of Starts', reg: '2015', unit: '', decimals: 0 },
  { label: 'Seq Start Delay Setting', reg: '1802', unit: 's', decimals: 0 },
  { label: 'Min Run Time Setting', reg: '1808', unit: 's', decimals: 0 },
];

export type EventTimestampMapping = {
  label: string;
  hour: string;
  minute: string;
  second: string;
  month: string;
  day: string;
  year: string;
};

export const HISTORICAL_EVENTS: EventTimestampMapping[] = [
  {
    label: 'Last Engine Start',
    hour: '1856',
    minute: '1857',
    second: '1858',
    month: '1859',
    day: '1860',
    year: '1861',
  },
  {
    label: 'Last Engine High Temp',
    hour: '1834',
    minute: '1835',
    second: '1836',
    month: '1837',
    day: '1838',
    year: '1839',
  },
  {
    label: 'Last Charger Failure',
    hour: '1816',
    minute: '1817',
    second: '1818',
    month: '1819',
    day: '1820',
    year: '1821',
  },
  {
    label: 'Last Engine Low Oil Pressure',
    hour: '1840',
    minute: '1841',
    second: '1842',
    month: '1843',
    day: '1844',
    year: '1845',
  },
  {
    label: 'Last Low Fuel Level',
    hour: '1828',
    minute: '1829',
    second: '1830',
    month: '1831',
    day: '1832',
    year: '1833',
  },
  {
    label: 'Last Battery Trouble',
    hour: '1822',
    minute: '1823',
    second: '1824',
    month: '1825',
    day: '1826',
    year: '1827',
  },
  {
    label: 'Last Engine Overspeed',
    hour: '1810',
    minute: '1811',
    second: '1812',
    month: '1813',
    day: '1814',
    year: '1815',
  },
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

export function scaleAnalog(raw: number, scale: number = ANALOG_SCALE): number {
  return raw / scale;
}

export function decodeEventTimestamp(
  getReg: (reg: string) => number | undefined,
  mapping: EventTimestampMapping,
): string | null {
  const hour = getReg(mapping.hour);
  const minute = getReg(mapping.minute);
  const second = getReg(mapping.second);
  const month = getReg(mapping.month);
  const day = getReg(mapping.day);
  const year = getReg(mapping.year);

  if (
    hour === undefined ||
    minute === undefined ||
    second === undefined ||
    month === undefined ||
    day === undefined ||
    year === undefined
  ) {
    return null;
  }

  const date = new Date(year, month - 1, day, hour, minute, second);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
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
