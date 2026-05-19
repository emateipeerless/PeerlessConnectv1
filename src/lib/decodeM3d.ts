import type { FirePumpSnapshot, M3dPacket } from '../types/m3d';
import {
  ALARM_BITS,
  ANALOGS,
  JOCKEY_DISCHARGE_REG,
  JOCKEY_STATUS_BITS,
  MAIN_SWITCH,
  alarmId,
  decodeJockeySwitch,
  decodeRtuStatusBits,
  decodeTwoBitSwitch,
  isBitSet,
  scaleAnalog,
} from './m3dRegisters';
import { hasRtuField, hasTcpRegister } from './normalizePacket';

function tcpValue(packet: M3dPacket, reg: string): number {
  const raw = packet.tcp[reg];
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
}

function rtuStatusWord(packet: M3dPacket): number {
  const raw = packet.rtu.status;
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
}

function decodeTcpStatusBits(
  packet: M3dPacket,
  definitions: typeof ALARM_BITS,
): FirePumpSnapshot['mainPump']['alarms'] {
  const registerCache = new Map<string, number>();
  return definitions.map(({ label, reg, bit, okWhenActive }) => {
    if (!registerCache.has(reg)) {
      registerCache.set(reg, tcpValue(packet, reg));
    }
    return {
      id: alarmId(label),
      label,
      active: isBitSet(registerCache.get(reg) ?? 0, bit),
      okWhenActive: okWhenActive ?? false,
    };
  });
}

export function decodeM3dPacket(
  packet: M3dPacket,
  receivedAt: Date = new Date(),
): FirePumpSnapshot {
  const mainSwitchMode = decodeTwoBitSwitch(
    tcpValue(packet, MAIN_SWITCH.reg),
    MAIN_SWITCH.bitOffset,
  );

  const hasJockeyStatus = hasRtuField(packet, 'status');
  const hasJockeyDischarge = hasTcpRegister(packet, JOCKEY_DISCHARGE_REG);

  const jockeyStatusWord = rtuStatusWord(packet);
  const jockeySwitchMode = hasJockeyStatus
    ? decodeJockeySwitch(jockeyStatusWord)
    : 'OFF';
  const jockeyStatus = hasJockeyStatus
    ? decodeRtuStatusBits(jockeyStatusWord, JOCKEY_STATUS_BITS)
    : [];

  const analogs = ANALOGS.map(({ label, reg, unit, decimals }) => ({
    id: alarmId(label),
    label,
    value: scaleAnalog(tcpValue(packet, reg)),
    unit,
    decimals,
  }));

  const byId = Object.fromEntries(analogs.map((a) => [a.id, a.value]));
  const analog = {
    systemDischargePressure: byId['system-discharge-pressure'] ?? 0,
    battery1Volts: byId['battery-1-volts'] ?? 0,
    battery2Volts: byId['battery-2-volts'] ?? 0,
    battery1Amps: byId['battery-1-amps'] ?? 0,
    battery2Amps: byId['battery-2-amps'] ?? 0,
  };

  const jockeyDischarge = hasJockeyDischarge
    ? scaleAnalog(tcpValue(packet, JOCKEY_DISCHARGE_REG))
    : null;

  return {
    template: 'M3D',
    receivedAt: receivedAt.toISOString(),
    mainPump: {
      switchMode: mainSwitchMode,
      analog,
      analogs,
      alarms: decodeTcpStatusBits(packet, ALARM_BITS),
    },
    jockeyPump: {
      switchMode: jockeySwitchMode,
      runHours: packet.rtu.rhrs,
      startCount: packet.rtu.start,
      stopCount: packet.rtu.stop,
      discharge: jockeyDischarge,
      status: jockeyStatus,
      hasStatusRegister: hasJockeyStatus,
      hasDischargeRegister: hasJockeyDischarge,
    },
  };
}
