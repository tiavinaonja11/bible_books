import { Colors, ColorScheme } from '../constants/Colors';
import { UI, UIStrings } from '../constants/i18n';
import { useApp } from './useAppStore';

export function useTheme(): { colors: ColorScheme; t: UIStrings; darkMode: boolean } {
  const { darkMode, lang } = useApp();
  return {
    colors: darkMode ? Colors.dark : Colors.light,
    t: UI[lang],
    darkMode,
  };
}