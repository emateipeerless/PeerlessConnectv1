import { useCallback, useEffect, useRef, useState } from 'react';
import { PACKET_API_URL, PACKET_REFRESH_MS } from '../config';
import { sampleM3dPacket } from '../data/samplePacket';
import { normalizePacket } from '../lib/normalizePacket';
import type { M3dPacket } from '../types/m3d';

export function useM3dPacket() {
  const [packet, setPacket] = useState<M3dPacket>(() => normalizePacket(sampleM3dPacket));
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const isLive = Boolean(PACKET_API_URL?.trim());

  const refresh = useCallback(async () => {
    if (!isLive) {
      setLastRefresh(new Date());
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsRefreshing(true);
    try {
      const response = await fetch(PACKET_API_URL!, {
        signal: controller.signal,
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const data: unknown = await response.json();
      setPacket(normalizePacket(data));
      setFetchError(null);
      setLastRefresh(new Date());
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setFetchError(err instanceof Error ? err.message : 'Failed to fetch packet');
    } finally {
      if (!controller.signal.aborted) {
        setIsRefreshing(false);
      }
    }
  }, [isLive]);

  useEffect(() => {
    refresh();
    const intervalId = setInterval(refresh, PACKET_REFRESH_MS);
    return () => {
      clearInterval(intervalId);
      abortRef.current?.abort();
    };
  }, [refresh]);

  const setManualPacket = useCallback((json: string) => {
    setPacket(normalizePacket(JSON.parse(json)));
    setFetchError(null);
    setLastRefresh(new Date());
  }, []);

  return {
    packet,
    fetchError,
    lastRefresh,
    isRefreshing,
    isLive,
    refresh,
    setManualPacket,
    refreshIntervalMs: PACKET_REFRESH_MS,
  };
}
