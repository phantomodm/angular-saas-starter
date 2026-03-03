import { SeriesPoint } from '../../core/models/types';

export function aggregateDailyStrictET(
  series: { timestamp: number; value: number }[],
  days: number,
) {
  const byDay = new Map<string, { timestamp: number; value: number }>();

  for (const p of series) {
    const d = new Date(p.timestamp);

    // Convert to New York time
    const ny = new Date(
      d.toLocaleString('en-US', { timeZone: 'America/New_York' }),
    );

    // Trading-day key
    const key = `${ny.getFullYear()}-${ny.getMonth()}-${ny.getDate()}`;

    // Keep the latest candle of the day
    const existing = byDay.get(key);
    if (!existing || p.timestamp > existing.timestamp) {
      byDay.set(key, p);
    }
  }

  const daily = Array.from(byDay.values()).sort(
    (a, b) => a.timestamp - b.timestamp,
  );

  return daily.slice(-days);
}

export const filterByTimeframe = (
  series: SeriesPoint[],
  timeframe: string,
): SeriesPoint[] => {
  const now = Date.now();
  const windowMs = timeframeToMs(timeframe);
  return series.filter((p) => +p.timestamp >= now - windowMs);
};

const timeframeToMs = (timeframe: string): number => {
  switch (timeframe) {
    // Minutes
    case '5m':
      return 5 * 60 * 1000;
    case '15m':
      return 15 * 60 * 1000;
    case '30m':
      return 30 * 60 * 1000;

    // Hours
    case '1h':
      return 60 * 60 * 1000;
    case '4h':
      return 4 * 60 * 60 * 1000;
    case '12h':
      return 12 * 60 * 60 * 1000;

    // Days
    case '24h': // same as 1d
    case '1d':
      return 24 * 60 * 60 * 1000;
    case '7d': // same as 1w
    case '1w':
      return 7 * 24 * 60 * 60 * 1000;
    case '30d': // same as 1mo
    case '1mo':
      return 30 * 24 * 60 * 60 * 1000;
    case '90d':
      return 90 * 24 * 60 * 60 * 1000;
    case '180d': // same as 6mo
    case '6mo':
      return 180 * 24 * 60 * 60 * 1000;

    // Years
    case '1y':
      return 365 * 24 * 60 * 60 * 1000;
    case '5y':
      return 5 * 365 * 24 * 60 * 60 * 1000;

    default:
      return 0;
  }
};

/**
 * Downsamples a dataset to a specified maximum number of points using a simple sampling method.
 * It ensures the first and last points are always included.
 * @param data The array of data points to downsample.
 * @param maxPoints The maximum number of points to return.
 * @returns The downsampled array of data points.
 */
export function downsample<T>(data: T[], maxPoints: number): T[] {
  console.log(data);
  if (!data || data.length <= maxPoints) {
    return data;
  }

  const result: T[] = [data[0]]; // Always include the first point
  const step = (data.length - 1) / (maxPoints - 1);

  for (let i = 1; i < maxPoints - 1; i++) {
    const index = Math.round(i * step);
    // Ensure we don't push duplicates if indices are rounded to the same value
    if (result.length < i + 1) {
      result.push(data[index]);
    }
  }

  result.push(data[data.length - 1]); // Always include the last point
  return result;
}
