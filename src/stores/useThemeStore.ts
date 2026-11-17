import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: ThemeMode
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

const STORAGE_KEY = 'vetbol_theme'

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system'
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved
    }
  } catch (_) {}
  return 'system'
}

function resolveEffectiveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

function applyThemeClass(resolved: 'light' | 'dark') {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (resolved === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialTheme = getInitialTheme()
  const initialResolved = resolveEffectiveTheme(initialTheme)

  // Apply on startup
  applyThemeClass(initialResolved)

  // Setup system listener
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (get().theme === 'system') {
        const newResolved = e.matches ? 'dark' : 'light'
        applyThemeClass(newResolved)
        set({ resolvedTheme: newResolved })
      }
    }
    mediaQuery.addEventListener('change', handleMediaChange)
  }

  return {
    theme: initialTheme,
    resolvedTheme: initialResolved,
    setTheme: (newTheme: ThemeMode) => {
      try {
        localStorage.setItem(STORAGE_KEY, newTheme)
      } catch (_) {}

      const resolved = resolveEffectiveTheme(newTheme)
      applyThemeClass(resolved)
      set({ theme: newTheme, resolvedTheme: resolved })
    },
    toggleTheme: () => {
      const current = get().theme
      let nextTheme: ThemeMode
      if (current === 'light') {
        nextTheme = 'dark'
      } else if (current === 'dark') {
        nextTheme = 'system'
      } else {
        nextTheme = 'light'
      }
      get().setTheme(nextTheme)
    },
  }
})
