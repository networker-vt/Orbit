/** ISO 639-1 codes for messenger translation (common / widely supported). */
export type TranslateLang = { code: string; label: string; native: string }

export const TRANSLATE_LANGUAGES: TranslateLang[] = [
  { code: 'af', label: 'Afrikaans', native: 'Afrikaans' },
  { code: 'sq', label: 'Albanian', native: 'Shqip' },
  { code: 'am', label: 'Amharic', native: 'አማርኛ' },
  { code: 'ar', label: 'Arabic', native: 'العربية' },
  { code: 'hy', label: 'Armenian', native: 'Հայերեն' },
  { code: 'az', label: 'Azerbaijani', native: 'Azərbaycan' },
  { code: 'eu', label: 'Basque', native: 'Euskara' },
  { code: 'be', label: 'Belarusian', native: 'Беларуская' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'bs', label: 'Bosnian', native: 'Bosanski' },
  { code: 'bg', label: 'Bulgarian', native: 'Български' },
  { code: 'ca', label: 'Catalan', native: 'Català' },
  { code: 'zh', label: 'Chinese', native: '中文' },
  { code: 'hr', label: 'Croatian', native: 'Hrvatski' },
  { code: 'cs', label: 'Czech', native: 'Čeština' },
  { code: 'da', label: 'Danish', native: 'Dansk' },
  { code: 'nl', label: 'Dutch', native: 'Nederlands' },
  { code: 'en', label: 'English', native: 'English' },
  { code: 'et', label: 'Estonian', native: 'Eesti' },
  { code: 'fi', label: 'Finnish', native: 'Suomi' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'gl', label: 'Galician', native: 'Galego' },
  { code: 'ka', label: 'Georgian', native: 'ქართული' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'el', label: 'Greek', native: 'Ελληνικά' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'he', label: 'Hebrew', native: 'עברית' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'hu', label: 'Hungarian', native: 'Magyar' },
  { code: 'is', label: 'Icelandic', native: 'Íslenska' },
  { code: 'id', label: 'Indonesian', native: 'Bahasa Indonesia' },
  { code: 'ga', label: 'Irish', native: 'Gaeilge' },
  { code: 'it', label: 'Italian', native: 'Italiano' },
  { code: 'ja', label: 'Japanese', native: '日本語' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'kk', label: 'Kazakh', native: 'Қазақ' },
  { code: 'km', label: 'Khmer', native: 'ខ្មែរ' },
  { code: 'ko', label: 'Korean', native: '한국어' },
  { code: 'lv', label: 'Latvian', native: 'Latviešu' },
  { code: 'lt', label: 'Lithuanian', native: 'Lietuvių' },
  { code: 'mk', label: 'Macedonian', native: 'Македонски' },
  { code: 'ms', label: 'Malay', native: 'Bahasa Melayu' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'mt', label: 'Maltese', native: 'Malti' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'mn', label: 'Mongolian', native: 'Монгол' },
  { code: 'ne', label: 'Nepali', native: 'नेपाली' },
  { code: 'no', label: 'Norwegian', native: 'Norsk' },
  { code: 'fa', label: 'Persian', native: 'فارسی' },
  { code: 'pl', label: 'Polish', native: 'Polski' },
  { code: 'pt', label: 'Portuguese', native: 'Português' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'ro', label: 'Romanian', native: 'Română' },
  { code: 'ru', label: 'Russian', native: 'Русский' },
  { code: 'sr', label: 'Serbian', native: 'Српски' },
  { code: 'si', label: 'Sinhala', native: 'සිංහල' },
  { code: 'sk', label: 'Slovak', native: 'Slovenčina' },
  { code: 'sl', label: 'Slovenian', native: 'Slovenščina' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'sw', label: 'Swahili', native: 'Kiswahili' },
  { code: 'sv', label: 'Swedish', native: 'Svenska' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'th', label: 'Thai', native: 'ไทย' },
  { code: 'tr', label: 'Turkish', native: 'Türkçe' },
  { code: 'uk', label: 'Ukrainian', native: 'Українська' },
  { code: 'ur', label: 'Urdu', native: 'اردو' },
  { code: 'uz', label: 'Uzbek', native: 'Oʻzbek' },
  { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'cy', label: 'Welsh', native: 'Cymraeg' },
]

const CODE_SET = new Set(TRANSLATE_LANGUAGES.map((l) => l.code))

export function isTranslateLang(code: string): boolean {
  return CODE_SET.has(code)
}

export function defaultMyLangFromUiLocale(locale: string): string {
  const base = locale.split('-')[0]?.toLowerCase()
  if (base && isTranslateLang(base)) return base
  return 'de'
}

/** BCP-47 hint for Web Speech API. */
export function speechLangForIso(iso: string): string {
  const map: Record<string, string> = {
    de: 'de-DE',
    en: 'en-US',
    pl: 'pl-PL',
    fr: 'fr-FR',
    es: 'es-ES',
    it: 'it-IT',
    pt: 'pt-PT',
    nl: 'nl-NL',
    ru: 'ru-RU',
    ja: 'ja-JP',
    ko: 'ko-KR',
    zh: 'zh-CN',
    ar: 'ar-SA',
    tr: 'tr-TR',
    uk: 'uk-UA',
  }
  return map[iso] || `${iso}-${iso.toUpperCase()}`
}

export function translateLangLabel(code: string, uiLocale: 'de' | 'en'): string {
  const row = TRANSLATE_LANGUAGES.find((l) => l.code === code)
  if (!row) return code
  return uiLocale === 'de' ? `${row.native} (${row.label})` : `${row.native} (${row.label})`
}
