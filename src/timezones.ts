export const isValidTimezone = (tz: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

/** 电脑当前时区（失败时回退 UTC） */
export const getSystemTimezone = (): string => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz && isValidTimezone(tz) ? tz : 'UTC';
  } catch {
    return 'UTC';
  }
};

/** 根据出口 IP 推断时区；失败返回 null */
export const fetchIpTimezone = async (): Promise<string | null> => {
  const controllers = [
    async () => {
      const res = await fetch('https://ipapi.co/timezone/', {
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return null;
      return (await res.text()).trim();
    },
    async () => {
      const res = await fetch(
        'http://ip-api.com/json/?fields=status,timezone',
        {
          signal: AbortSignal.timeout(4000),
        },
      );
      if (!res.ok) return null;
      const data = (await res.json()) as {
        status?: string;
        timezone?: string;
      };
      if (data.status !== 'success' || !data.timezone) return null;
      return data.timezone;
    },
  ];

  for (const run of controllers) {
    try {
      const tz = await run();
      if (tz && isValidTimezone(tz)) return tz;
    } catch {
      // try next
    }
  }
  return null;
};

export type TimezoneChoice = { name: string; value: string };

/**
 * 交互选项：IP 所在地区 / 电脑时区 / UTC
 * （IP 探测失败时省略第一项）
 */
export const buildTimezoneChoices = async (): Promise<{
  choices: TimezoneChoice[];
  defaultValue: string;
}> => {
  const systemTz = getSystemTimezone();
  const ipTz = await fetchIpTimezone();

  const choices: TimezoneChoice[] = [];
  if (ipTz) {
    choices.push({
      name: `${ipTz}（IP所在地区）`,
      value: ipTz,
    });
  }
  choices.push(
    {
      name: `${systemTz}（本机时区）`,
      value: systemTz,
    },
    {
      name: 'UTC',
      value: 'UTC',
    },
  );

  return {
    choices,
    defaultValue: systemTz,
  };
};
