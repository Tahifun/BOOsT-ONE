import { useThemeContext, Theme, ThemePreferences } from '../contexts/ThemeContext';

export interface UseThemeReturn {
  theme: Theme;
  isEpic: boolean;
  isClassic: boolean;
  themeClass: string;
  preferences: ThemePreferences;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isTransitioning: boolean;
  updatePreferences: (updates: Partial<ThemePreferences>) => void;
  resetPreferences: () => void;
  // Convenience methods
  getThemeValue: <T>(classicValue: T, epicValue: T) => T;
  getAnimationDuration: (type?: 'fast' | 'normal' | 'slow') => number;
  getCSSThemeClass: (baseClass: string) => string;
  isReducedMotion: () => boolean;
  getGlassOpacity: () => number;
  getParticleCount: (baseCount: number) => number;
}

/**
 * Custom hook for theme management with convenience methods
 * Must be used within ThemeProvider
 */
export const useTheme = (): UseThemeReturn => {
  const context = useThemeContext();
  
  const isEpic = context.theme === 'epic';
  const isClassic = context.theme === 'classic';
  const themeClass = `theme-${context.theme}`;

  /**
   * Get different values based on current theme
   */
  const getThemeValue = <T>(classicValue: T, epicValue: T): T => {
    return isEpic ? epicValue : classicValue;
  };

  /**
   * Get animation duration considering user preferences
   */
  const getAnimationDuration = (type: 'fast' | 'normal' | 'slow' = 'normal'): number => {
    if (context.preferences.reducedMotion) return 0;
    
    const baseDurations = {
      fast: 0.2,
      normal: 0.4,
      slow: 0.6,
    };
    
    return baseDurations[type] / context.preferences.animationSpeed;
  };

  /**
   * Get CSS class name with theme prefix
   */
  const getCSSThemeClass = (baseClass: string): string => {
    return `${baseClass} ${themeClass}`;
  };

  /**
   * Check if reduced motion is enabled
   */
  const isReducedMotion = (): boolean => {
    return context.preferences.reducedMotion || 
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  /**
   * Get glass effect opacity based on user preference
   */
  const getGlassOpacity = (): number => {
    return isEpic ? context.preferences.glassIntensity / 100 : 0;
  };

  /**
   * Calculate particle count based on user preference
   */
  const getParticleCount = (baseCount: number): number => {
    if (!isEpic) return 0;
    return Math.floor((baseCount * context.preferences.particleIntensity) / 100);
  };

  return {
    theme: context.theme,
    isEpic,
    isClassic,
    themeClass,
    preferences: context.preferences,
    setTheme: context.setTheme,
    toggleTheme: context.toggleTheme,
    isTransitioning: context.isTransitioning,
    updatePreferences: context.updatePreferences,
    resetPreferences: context.resetPreferences,
    getThemeValue,
    getAnimationDuration,
    getCSSThemeClass,
    isReducedMotion,
    getGlassOpacity,
    getParticleCount,
  };
};

// Convenience hooks for specific theme checks
export const useIsEpic = (): boolean => {
  const { isEpic } = useTheme();
  return isEpic;
};

export const useIsClassic = (): boolean => {
  const { isClassic } = useTheme();
  return isClassic;
};

// Hook for theme-aware CSS classes
export const useThemeClass = (baseClass: string): string => {
  const { getCSSThemeClass } = useTheme();
  return getCSSThemeClass(baseClass);
};

// Hook for theme-aware values
export const useThemeValue = <T>(classicValue: T, epicValue: T): T => {
  const { getThemeValue } = useTheme();
  return getThemeValue(classicValue, epicValue);
};
