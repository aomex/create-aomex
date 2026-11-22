/**
 * 与 aomex `packages/internal-tools/src/i18n.ts` 的 I18N_LANGUAGES 对齐。
 */
export const I18N_LANGUAGES = [
  'ar-EG',
  'az-AZ',
  'be-BY',
  'bg-BG',
  'bn-BD',
  'ca-ES',
  'cs-CZ',
  'da-DK',
  'de-DE',
  'el-GR',
  'en-GB',
  'en-US',
  'es-ES',
  'es-US',
  'et-EE',
  'eu-ES',
  'fa-IR',
  'fi-FI',
  'fr-BE',
  'fr-CA',
  'fr-FR',
  'ga-IE',
  'gl-ES',
  'he-IL',
  'hi-IN',
  'hr-HR',
  'hu-HU',
  'hy-AM',
  'id-ID',
  'is-IS',
  'it-IT',
  'ja-JP',
  'ka-GE',
  'kk-KZ',
  'km-KH',
  'kmr-IQ',
  'kn-IN',
  'ko-KR',
  'ku-IQ',
  'lt-LT',
  'lv-LV',
  'mk-MK',
  'ml-IN',
  'mn-MN',
  'mr-IN',
  'ms-MY',
  'my-MM',
  'nb-NO',
  'ne-NP',
  'nl-BE',
  'nl-NL',
  'pl-PL',
  'pt-BR',
  'pt-PT',
  'ro-RO',
  'ru-RU',
  'si-LK',
  'sk-SK',
  'sl-SI',
  'sr-RS',
  'sv-SE',
  'ta-IN',
  'th-TH',
  'tk-TM',
  'tr-TR',
  'uk-UA',
  'ur-PK',
  'uz-UZ',
  'vi-VN',
  'zh-CN',
  'zh-HK',
  'zh-TW',
] as const;

export type DefaultLanguage = (typeof I18N_LANGUAGES)[number];

const LANG_ONLY_FALLBACK: Record<string, DefaultLanguage> = {
  ar: 'ar-EG',
  az: 'az-AZ',
  be: 'be-BY',
  bg: 'bg-BG',
  bn: 'bn-BD',
  ca: 'ca-ES',
  cs: 'cs-CZ',
  da: 'da-DK',
  de: 'de-DE',
  el: 'el-GR',
  en: 'en-US',
  es: 'es-ES',
  et: 'et-EE',
  eu: 'eu-ES',
  fa: 'fa-IR',
  fi: 'fi-FI',
  fr: 'fr-FR',
  ga: 'ga-IE',
  gl: 'gl-ES',
  he: 'he-IL',
  hi: 'hi-IN',
  hr: 'hr-HR',
  hu: 'hu-HU',
  hy: 'hy-AM',
  id: 'id-ID',
  is: 'is-IS',
  it: 'it-IT',
  ja: 'ja-JP',
  ka: 'ka-GE',
  kk: 'kk-KZ',
  kn: 'kn-IN',
  ko: 'ko-KR',
  lt: 'lt-LT',
  lv: 'lv-LV',
  mk: 'mk-MK',
  ml: 'ml-IN',
  mn: 'mn-MN',
  mr: 'mr-IN',
  ms: 'ms-MY',
  my: 'my-MM',
  nb: 'nb-NO',
  ne: 'ne-NP',
  nl: 'nl-NL',
  pl: 'pl-PL',
  pt: 'pt-BR',
  ro: 'ro-RO',
  ru: 'ru-RU',
  si: 'si-LK',
  sk: 'sk-SK',
  sl: 'sl-SI',
  sr: 'sr-RS',
  sv: 'sv-SE',
  ta: 'ta-IN',
  th: 'th-TH',
  tk: 'tk-TM',
  tr: 'tr-TR',
  uk: 'uk-UA',
  ur: 'ur-PK',
  uz: 'uz-UZ',
  vi: 'vi-VN',
  zh: 'zh-CN',
};

/** 规范化系统 locale：`zh_CN.UTF-8` / `zh-CN` → `zh-CN` */
const normalizeLocaleTag = (raw: string): string => {
  const primary = raw.trim().split('.')[0]!.split('@')[0]!;
  return primary.replace(/_/g, '-');
};

const matchI18nLanguage = (tag: string): DefaultLanguage | undefined => {
  const normalized = normalizeLocaleTag(tag);
  if ((I18N_LANGUAGES as readonly string[]).includes(normalized)) {
    return normalized as DefaultLanguage;
  }
  const lower = normalized.toLowerCase();
  const exact = I18N_LANGUAGES.find((code) => code.toLowerCase() === lower);
  if (exact) return exact;
  const lang = normalized.split('-')[0]!.toLowerCase();
  return LANG_ONLY_FALLBACK[lang];
};

/**
 * 从本机 locale（env / Intl）推断默认语言，匹配不到时回退 `en-US`。
 */
export const detectLocalLanguage = (): DefaultLanguage => {
  const candidates: string[] = [];
  for (const key of ['LC_ALL', 'LC_MESSAGES', 'LANG'] as const) {
    const v = process.env[key];
    if (v) candidates.push(v);
  }
  try {
    const intlLocales = Intl.DateTimeFormat().resolvedOptions().locale;
    if (intlLocales) candidates.push(intlLocales);
  } catch {
    // ignore
  }
  try {
    candidates.push(
      ...Intl.getCanonicalLocales(
        Intl.DateTimeFormat().resolvedOptions().locale,
      ),
    );
  } catch {
    // ignore
  }

  for (const raw of candidates) {
    const matched = matchI18nLanguage(raw);
    if (matched) return matched;
  }
  return 'en-US';
};
