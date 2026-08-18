export type GlobalTheme = 'theme-arcade' | 'theme-vaporwave' | 'theme-matrix' | 'theme-titanium' | 'theme-blood';

export interface ThemeOption {
  id: GlobalTheme;
  name: string;
  badge: string;
  primaryColor: string;
  secondaryColor: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'theme-arcade',
    name: 'Arcade 90s Neon',
    badge: '🕹️ Arcade',
    primaryColor: '#00f0ff',
    secondaryColor: '#ff007f',
  },
  {
    id: 'theme-vaporwave',
    name: 'Vaporwave Sunset',
    badge: '🌴 Sunset',
    primaryColor: '#38bdf8',
    secondaryColor: '#f472b6',
  },
  {
    id: 'theme-matrix',
    name: 'Cyber Matrix Green',
    badge: '⚡ Matrix',
    primaryColor: '#00ff66',
    secondaryColor: '#a3e635',
  },
  {
    id: 'theme-titanium',
    name: 'Stealth Titanium Gold',
    badge: '🥇 Titanium',
    primaryColor: '#fbbf24',
    secondaryColor: '#f97316',
  },
  {
    id: 'theme-blood',
    name: 'Cyber Crimson Red',
    badge: '🩸 Blood',
    primaryColor: '#ff0055',
    secondaryColor: '#ff4400',
  },
];

class ThemeManager {
  private currentTheme: GlobalTheme = 'theme-arcade';
  private listeners: Set<(theme: GlobalTheme) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('soundboard_global_theme') as GlobalTheme;
      if (saved && THEME_OPTIONS.some((t) => t.id === saved)) {
        this.currentTheme = saved;
      }
      this.applyTheme(this.currentTheme);
    }
  }

  public getTheme(): GlobalTheme {
    return this.currentTheme;
  }

  public setTheme(theme: GlobalTheme) {
    this.currentTheme = theme;
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundboard_global_theme', theme);
      this.applyTheme(theme);
    }
    this.listeners.forEach((cb) => cb(theme));
  }

  private applyTheme(theme: GlobalTheme) {
    if (typeof document === 'undefined') return;
    THEME_OPTIONS.forEach((t) => {
      document.body.classList.remove(t.id);
      document.documentElement.classList.remove(t.id);
    });
    document.body.classList.add(theme);
    document.documentElement.classList.add(theme);
  }

  public subscribe(cb: (theme: GlobalTheme) => void): () => void {
    this.listeners.add(cb);
    cb(this.currentTheme);
    return () => this.listeners.delete(cb);
  }
}

export const ThemeService = new ThemeManager();
