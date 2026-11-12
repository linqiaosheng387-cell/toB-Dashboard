import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { ConfigProvider } from 'antd'
import enUS from 'antd/locale/en_US'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { en } from './en'
import { zh } from './zh'

export type Language = 'en' | 'zh'

/** Independent of login state: the preference survives logout/login because it is a global key. */
const STORAGE_KEY = 'app-language'
const DEFAULT_LANGUAGE: Language = 'en'

/** Recursively widen every leaf to `string`, so the Chinese dictionary only needs to match the English structure, not its literal values. */
type DeepString<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepString<T[K]>
}

const dictionaries: Record<Language, DeepString<typeof en>> = { en, zh }
const antdLocales: Record<Language, typeof enUS> = { en: enUS, zh: zhCN }

type TranslateParams = Record<string, string | number>

function readStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'zh' || stored === 'en' ? stored : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

/** Walk a dotted key path through the nested dictionary; return the key when missing. */
function resolvePath(dictionary: unknown, path: string): string {
  let current: unknown = dictionary
  for (const segment of path.split('.')) {
    if (current === null || typeof current !== 'object') return path
    current = (current as Record<string, unknown>)[segment]
  }
  return typeof current === 'string' ? current : path
}

/** Replace {placeholders} with provided values. */
function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match)
}

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  toggleLanguage: () => void
  t: (key: string, params?: TranslateParams) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage)

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* storage unavailable */ }
    dayjs.locale(next === 'zh' ? 'zh-cn' : 'en')
  }, [])

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'zh' : 'en')
  }, [language, setLanguage])

  const t = useCallback((key: string, params?: TranslateParams) => (
    interpolate(resolvePath(dictionaries[language], key), params)
  ), [language])

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t }),
    [language, setLanguage, toggleLanguage, t],
  )

  return (
    <LanguageContext.Provider value={value}>
      <ConfigProvider locale={antdLocales[language]}>
        {children}
      </ConfigProvider>
    </LanguageContext.Provider>
  )
}

export function useI18n(): LanguageContextValue {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useI18n must be used within a LanguageProvider')
  return context
}
