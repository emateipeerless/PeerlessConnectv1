/** Raw IoT packet from M3D template */
export interface M3dPacket {
  rtu: {
    /** Jockey total run hours */
    rhrs?: number;
    stop?: number;
    /** Jockey start count */
    start?: number;
    /** Jockey status register (RTU reg 12) — switch position + status bits */
    status?: number;
    stcount?: number;
  };
  tcp: Record<string, number>;
}

export type SwitchMode = 'OFF' | 'AUTO' | 'MANUAL';

/** @deprecated Use SwitchMode */
export type MainSwitchMode = SwitchMode;

export interface AnalogValues {
  systemDischargePressure: number;
  battery1Volts: number;
  battery2Volts: number;
  battery1Amps: number;
  battery2Amps: number;
}

export interface AnalogReading {
  id: string;
  label: string;
  value: number;
  unit: string;
  decimals: number;
}

export interface StatusItem {
  id: string;
  label: string;
  active: boolean;
  okWhenActive: boolean;
}

/** @deprecated Use StatusItem */
export type AlarmItem = StatusItem;

export interface MainPumpState {
  switchMode: SwitchMode;
  analog: AnalogValues;
  analogs: AnalogReading[];
  alarms: StatusItem[];
}

export interface JockeyPumpState {
  switchMode: SwitchMode;
  runHours: number;
  startCount: number;
  stopCount: number;
  /** null until TCP register 18 is available in the packet */
  discharge: number | null;
  status: StatusItem[];
  /** RTU status word (register 12) present in packet */
  hasStatusRegister: boolean;
  /** TCP register 18 (jockey discharge) not yet pulled on all devices */
  hasDischargeRegister: boolean;
}

export interface FirePumpSnapshot {
  template: 'M3D';
  receivedAt: string;
  mainPump: MainPumpState;
  jockeyPump: JockeyPumpState;
}
