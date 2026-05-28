import type {
  DataTimestamps,
  FirePumpSnapshot,
  HistoricalEvent,
  HistoricalMetric,
} from '../types/m3d';
import type { ControllerBlocks, NormalizedDeviceData } from '../types/devicePacket';
import {
  ALARM_BITS,
  HISTORICAL_ANALOGS,
  HISTORICAL_EVENTS,
  HISTORICAL_METRICS,
  JOCKEY_DISCHARGE_REG,
  JOCKEY_RTU_STATUS_REG,
  JOCKEY_STATUS_BITS,
  TRENDING_ANALOGS,
  alarmId,
  decodeEventTimestamp,
  decodeJockeySwitch,
  decodeMainSwitch,
  decodeRtuStatusBits,
  isBitSet,
  scaleAnalog,
} from './m3dRegisters';
import { getJockeyRtuField, getMergedRegister, hasJockeyStatus, hasMergedRegister } from './normalizePacket';

function regValue(blocks: ControllerBlocks, reg: string): number {
  return getMergedRegister(blocks, reg) ?? 0;
}

function getReg(blocks: ControllerBlocks) {
  return (reg: string) => regValue(blocks, reg);
}

function decodeStatusBits(
  blocks: ControllerBlocks,
  definitions: typeof ALARM_BITS,
): FirePumpSnapshot['mainPump']['alarms'] {
  const get = getReg(blocks);
  const registerCache = new Map<string, number>();
  return definitions.map(({ label, reg, bit, okWhenActive }) => {
    if (!registerCache.has(reg)) {
      registerCache.set(reg, get(reg));
    }
    return {
      id: alarmId(label),
      label,
      active: isBitSet(registerCache.get(reg) ?? 0, bit),
      okWhenActive: okWhenActive ?? false,
    };
  });
}

function decodeAnalogs(blocks: ControllerBlocks) {
  const get = getReg(blocks);
  const all = [...TRENDING_ANALOGS, ...HISTORICAL_ANALOGS];
  const seen = new Set<string>();

  return all
    .filter(({ reg }) => {
      if (seen.has(reg)) return false;
      seen.add(reg);
      return hasMergedRegister(blocks, reg);
    })
    .map(({ label, reg, unit, decimals }) => ({
      id: alarmId(label),
      label,
      value: scaleAnalog(get(reg)),
      unit,
      decimals,
    }));
}

function decodeHistoricalMetrics(blocks: ControllerBlocks): HistoricalMetric[] {
  const get = getReg(blocks);
  const metrics: HistoricalMetric[] = HISTORICAL_METRICS.filter(({ reg }) =>
    hasMergedRegister(blocks, reg),
  ).map(({ label, reg, unit, decimals, scale }) => ({
    id: alarmId(`${label}-${reg}`),
    label,
    value: scaleAnalog(get(reg), scale ?? 1),
    unit,
    decimals,
  }));

  const lastHours = getMergedRegister(blocks, '1804');
  const lastSeconds = getMergedRegister(blocks, '1805');
  if (lastHours !== undefined || lastSeconds !== undefined) {
    metrics.push({
      id: 'last-engine-run-duration',
      label: 'Last Engine Run Duration',
      value: lastHours ?? 0,
      unit: lastSeconds !== undefined ? `h ${lastSeconds}s` : 'h',
      decimals: 0,
    });
  }

  const totalHours = getMergedRegister(blocks, '1806');
  const totalMinutes = getMergedRegister(blocks, '1807');
  if (totalHours !== undefined || totalMinutes !== undefined) {
    metrics.push({
      id: 'engine-total-run-time',
      label: 'Engine Total Run Time',
      value: totalHours ?? 0,
      unit: totalMinutes !== undefined ? `h ${totalMinutes}m` : 'h',
      decimals: 0,
    });
  }

  return metrics;
}

function decodeHistoricalEvents(blocks: ControllerBlocks): HistoricalEvent[] {
  const get = (reg: string) => getMergedRegister(blocks, reg);
  return HISTORICAL_EVENTS.map((mapping) => ({
    id: alarmId(mapping.label),
    label: mapping.label,
    at: decodeEventTimestamp(get, mapping),
  }));
}

function blockTimestamps(blocks: ControllerBlocks): DataTimestamps {
  return {
    trending: blocks.trending.timestamp,
    historical: blocks.historical.timestamp,
  };
}

export function decodeM3dPacket(
  data: NormalizedDeviceData,
  receivedAt: Date = new Date(),
): FirePumpSnapshot {
  const { main, jockey } = data;
  const mainGet = getReg(main);
  const mainSwitchMode = decodeMainSwitch(mainGet);

  const hasJockeyStatusReg = hasJockeyStatus(jockey);
  const jockeyStatusWord = regValue(jockey, JOCKEY_RTU_STATUS_REG);
  const hasJockeyDischarge = hasMergedRegister(jockey, JOCKEY_DISCHARGE_REG);

  const jockeyStatus = hasJockeyStatusReg
    ? decodeRtuStatusBits(jockeyStatusWord, JOCKEY_STATUS_BITS)
    : [];
  const jockeySwitchMode = hasJockeyStatusReg ? decodeJockeySwitch(jockeyStatusWord) : 'OFF';

  const analogs = decodeAnalogs(main);
  const byId = Object.fromEntries(analogs.map((a) => [a.id, a.value]));
  const analog = {
    systemDischargePressure: byId['system-discharge-pressure'] ?? scaleAnalog(mainGet('2006')),
    battery1Volts: byId['battery-1-volts'] ?? 0,
    battery2Volts: byId['battery-2-volts'] ?? 0,
    battery1Amps: byId['battery-1-amps'] ?? 0,
    battery2Amps: byId['battery-2-amps'] ?? 0,
  };

  // Jockey controller sends discharge already in PSI (no x10 scaling).
  const jockeyDischarge = hasJockeyDischarge ? regValue(jockey, JOCKEY_DISCHARGE_REG) : null;

  return {
    template: 'M3D',
    receivedAt: receivedAt.toISOString(),
    deviceId: data.deviceId,
    mainTimestamps: blockTimestamps(main),
    jockeyTimestamps: blockTimestamps(jockey),
    mainPump: {
      switchMode: mainSwitchMode,
      analog,
      analogs,
      alarms: decodeStatusBits(main, ALARM_BITS),
      historicalMetrics: decodeHistoricalMetrics(main),
      historicalEvents: decodeHistoricalEvents(main),
    },
    jockeyPump: {
      switchMode: jockeySwitchMode,
      runHours: getJockeyRtuField(jockey, 'rhrs') ?? 0,
      startCount: getJockeyRtuField(jockey, 'start') ?? 0,
      stopCount: getJockeyRtuField(jockey, 'stop') ?? 0,
      discharge: jockeyDischarge,
      status: jockeyStatus,
      hasStatusRegister: hasJockeyStatusReg,
      hasDischargeRegister: hasJockeyDischarge,
    },
  };
}
