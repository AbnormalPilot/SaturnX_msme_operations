/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ColorKeys = keyof typeof Colors;

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ColorKeys
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    // Return the color directly from Colors since we use a single theme
    return Colors[colorName];
  }
}
