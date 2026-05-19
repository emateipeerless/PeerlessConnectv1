import type { M3dPacket } from '../types/m3d';

/** Sample M3D packet from IoT device */
export const sampleM3dPacket: M3dPacket = {
  rtu: {
    rhrs: 10,
    stop: 222,
    start: 305,
    status: 49152,
    stcount: 5570560,
  },
  tcp: {
    '1001': 128,
    '1003': 0,
    '1800': 7,
    '2000': 140,
    '2001': 139,
    '2003': 0,
    '2004': 0,
    '2006': 699,
    '2011': 0,
    '2012': 0,
    '2013': 0,
    '2014': 3072,
  },
};
