import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchJson = vi.fn();
vi.mock('@/lib/api-client', () => ({
  fetchJson: (...args: unknown[]) => fetchJson(...args),
}));

import {
  readStatsSummary,
  readVolumeSeries,
  readWeeklyVolume,
} from '@/lib/api/stats-api';

describe('stats-api query URLs', () => {
  beforeEach(() => {
    fetchJson.mockReset();
    fetchJson.mockResolvedValue({});
  });

  it('readWeeklyVolume adds timezone when not UTC', async () => {
    await readWeeklyVolume('2026-03-23', 'America/Los_Angeles');
    expect(fetchJson).toHaveBeenCalledWith(
      '/api/stats/weekly-volume?weekStart=2026-03-23&timezone=America%2FLos_Angeles',
    );
  });

  it('readVolumeSeries passes weeks and optional timezone', async () => {
    await readVolumeSeries(8, 'Europe/Berlin');
    expect(fetchJson).toHaveBeenCalledWith(
      '/api/stats/volume-series?weeks=8&timezone=Europe%2FBerlin',
    );
  });

  it('readVolumeSeries omits timezone for UTC and Etc/UTC', async () => {
    await readVolumeSeries(4, 'UTC');
    expect(fetchJson).toHaveBeenCalledWith('/api/stats/volume-series?weeks=4');
    fetchJson.mockClear();
    await readVolumeSeries(4, 'Etc/UTC');
    expect(fetchJson).toHaveBeenCalledWith('/api/stats/volume-series?weeks=4');
  });

  it('readStatsSummary adds timezone query when not UTC', async () => {
    await readStatsSummary('Pacific/Auckland');
    expect(fetchJson).toHaveBeenCalledWith(
      '/api/stats/summary?timezone=Pacific%2FAuckland',
    );
  });

  it('readStatsSummary uses bare path for UTC', async () => {
    await readStatsSummary('UTC');
    expect(fetchJson).toHaveBeenCalledWith('/api/stats/summary');
  });
});
