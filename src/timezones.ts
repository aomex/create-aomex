/** 交互列表顶部优先展示的常用时区 */
export const COMMON_TIMEZONES = [
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Taipei',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Seoul',
  'Asia/Bangkok',
  'Asia/Kolkata',
  'Asia/Dubai',
  'UTC',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Australia/Sydney',
  'Pacific/Auckland',
] as const;

export const DEFAULT_TIMEZONE = 'Asia/Shanghai';

/** Node / IANA 全量时区（常用项置顶） */
export const listTimezones = (): string[] => {
  const all =
    typeof Intl.supportedValuesOf === 'function'
      ? Intl.supportedValuesOf('timeZone')
      : [...COMMON_TIMEZONES];
  const preferred = COMMON_TIMEZONES.filter((tz) => all.includes(tz));
  const rest = all.filter(
    (tz) => !preferred.includes(tz as (typeof COMMON_TIMEZONES)[number]),
  );
  return [...preferred, ...rest];
};

export const isValidTimezone = (tz: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};
