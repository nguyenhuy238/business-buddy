import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Định nghĩa các theme màu có sẵn
 */
export type ThemeColor = "green" | "blue" | "purple" | "orange" | "red" | "pink" | "indigo" | "cyan";

/**
 * Định nghĩa cấu trúc màu cho một theme
 */
interface ThemeColors {
  primary: string;
  primaryForeground: string;
  ring: string;
  sidebarBackground: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  chart1: string;
}

/**
 * Định nghĩa theme configuration
 */
interface ThemeConfig {
  name: string;
  displayName: string;
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
}

/**
 * Định nghĩa các theme màu
 */
const themes: Record<ThemeColor, ThemeConfig> = {
  green: {
    name: "green",
    displayName: "Xanh lá",
    colors: {
      light: {
        primary: "166 76% 32%",
        primaryForeground: "0 0% 100%",
        ring: "166 76% 32%",
        sidebarBackground: "166 76% 32%",
        sidebarForeground: "0 0% 100%",
        sidebarPrimary: "0 0% 100%",
        sidebarPrimaryForeground: "166 76% 32%",
        sidebarAccent: "166 70% 28%",
        sidebarAccentForeground: "0 0% 100%",
        sidebarBorder: "166 60% 38%",
        sidebarRing: "0 0% 100%",
        chart1: "166 76% 32%",
      },
      dark: {
        primary: "166 70% 45%",
        primaryForeground: "210 40% 8%",
        ring: "166 70% 45%",
        sidebarBackground: "210 40% 10%",
        sidebarForeground: "210 20% 98%",
        sidebarPrimary: "166 70% 45%",
        sidebarPrimaryForeground: "210 40% 8%",
        sidebarAccent: "210 35% 15%",
        sidebarAccentForeground: "210 20% 98%",
        sidebarBorder: "210 30% 18%",
        sidebarRing: "166 70% 45%",
        chart1: "166 70% 45%",
      },
    },
  },
  blue: {
    name: "blue",
    displayName: "Xanh dương",
    colors: {
      light: {
        primary: "217 91% 60%",
        primaryForeground: "0 0% 100%",
        ring: "217 91% 60%",
        sidebarBackground: "217 91% 60%",
        sidebarForeground: "0 0% 100%",
        sidebarPrimary: "0 0% 100%",
        sidebarPrimaryForeground: "217 91% 60%",
        sidebarAccent: "217 85% 50%",
        sidebarAccentForeground: "0 0% 100%",
        sidebarBorder: "217 80% 65%",
        sidebarRing: "0 0% 100%",
        chart1: "217 91% 60%",
      },
      dark: {
        primary: "217 91% 70%",
        primaryForeground: "210 40% 8%",
        ring: "217 91% 70%",
        sidebarBackground: "210 40% 10%",
        sidebarForeground: "210 20% 98%",
        sidebarPrimary: "217 91% 70%",
        sidebarPrimaryForeground: "210 40% 8%",
        sidebarAccent: "210 35% 15%",
        sidebarAccentForeground: "210 20% 98%",
        sidebarBorder: "210 30% 18%",
        sidebarRing: "217 91% 70%",
        chart1: "217 91% 70%",
      },
    },
  },
  purple: {
    name: "purple",
    displayName: "Tím",
    colors: {
      light: {
        primary: "262 83% 58%",
        primaryForeground: "0 0% 100%",
        ring: "262 83% 58%",
        sidebarBackground: "262 83% 58%",
        sidebarForeground: "0 0% 100%",
        sidebarPrimary: "0 0% 100%",
        sidebarPrimaryForeground: "262 83% 58%",
        sidebarAccent: "262 80% 50%",
        sidebarAccentForeground: "0 0% 100%",
        sidebarBorder: "262 75% 65%",
        sidebarRing: "0 0% 100%",
        chart1: "262 83% 58%",
      },
      dark: {
        primary: "262 83% 68%",
        primaryForeground: "210 40% 8%",
        ring: "262 83% 68%",
        sidebarBackground: "210 40% 10%",
        sidebarForeground: "210 20% 98%",
        sidebarPrimary: "262 83% 68%",
        sidebarPrimaryForeground: "210 40% 8%",
        sidebarAccent: "210 35% 15%",
        sidebarAccentForeground: "210 20% 98%",
        sidebarBorder: "210 30% 18%",
        sidebarRing: "262 83% 68%",
        chart1: "262 83% 68%",
      },
    },
  },
  orange: {
    name: "orange",
    displayName: "Cam",
    colors: {
      light: {
        primary: "25 95% 53%",
        primaryForeground: "0 0% 100%",
        ring: "25 95% 53%",
        sidebarBackground: "25 95% 53%",
        sidebarForeground: "0 0% 100%",
        sidebarPrimary: "0 0% 100%",
        sidebarPrimaryForeground: "25 95% 53%",
        sidebarAccent: "25 90% 45%",
        sidebarAccentForeground: "0 0% 100%",
        sidebarBorder: "25 85% 60%",
        sidebarRing: "0 0% 100%",
        chart1: "25 95% 53%",
      },
      dark: {
        primary: "25 95% 63%",
        primaryForeground: "210 40% 8%",
        ring: "25 95% 63%",
        sidebarBackground: "210 40% 10%",
        sidebarForeground: "210 20% 98%",
        sidebarPrimary: "25 95% 63%",
        sidebarPrimaryForeground: "210 40% 8%",
        sidebarAccent: "210 35% 15%",
        sidebarAccentForeground: "210 20% 98%",
        sidebarBorder: "210 30% 18%",
        sidebarRing: "25 95% 63%",
        chart1: "25 95% 63%",
      },
    },
  },
  red: {
    name: "red",
    displayName: "Đỏ",
    colors: {
      light: {
        primary: "0 72% 51%",
        primaryForeground: "0 0% 100%",
        ring: "0 72% 51%",
        sidebarBackground: "0 72% 51%",
        sidebarForeground: "0 0% 100%",
        sidebarPrimary: "0 0% 100%",
        sidebarPrimaryForeground: "0 72% 51%",
        sidebarAccent: "0 70% 43%",
        sidebarAccentForeground: "0 0% 100%",
        sidebarBorder: "0 65% 58%",
        sidebarRing: "0 0% 100%",
        chart1: "0 72% 51%",
      },
      dark: {
        primary: "0 72% 61%",
        primaryForeground: "210 40% 8%",
        ring: "0 72% 61%",
        sidebarBackground: "210 40% 10%",
        sidebarForeground: "210 20% 98%",
        sidebarPrimary: "0 72% 61%",
        sidebarPrimaryForeground: "210 40% 8%",
        sidebarAccent: "210 35% 15%",
        sidebarAccentForeground: "210 20% 98%",
        sidebarBorder: "210 30% 18%",
        sidebarRing: "0 72% 61%",
        chart1: "0 72% 61%",
      },
    },
  },
  pink: {
    name: "pink",
    displayName: "Hồng",
    colors: {
      light: {
        primary: "330 81% 60%",
        primaryForeground: "0 0% 100%",
        ring: "330 81% 60%",
        sidebarBackground: "330 81% 60%",
        sidebarForeground: "0 0% 100%",
        sidebarPrimary: "0 0% 100%",
        sidebarPrimaryForeground: "330 81% 60%",
        sidebarAccent: "330 78% 52%",
        sidebarAccentForeground: "0 0% 100%",
        sidebarBorder: "330 75% 67%",
        sidebarRing: "0 0% 100%",
        chart1: "330 81% 60%",
      },
      dark: {
        primary: "330 81% 70%",
        primaryForeground: "210 40% 8%",
        ring: "330 81% 70%",
        sidebarBackground: "210 40% 10%",
        sidebarForeground: "210 20% 98%",
        sidebarPrimary: "330 81% 70%",
        sidebarPrimaryForeground: "210 40% 8%",
        sidebarAccent: "210 35% 15%",
        sidebarAccentForeground: "210 20% 98%",
        sidebarBorder: "210 30% 18%",
        sidebarRing: "330 81% 70%",
        chart1: "330 81% 70%",
      },
    },
  },
  indigo: {
    name: "indigo",
    displayName: "Chàm",
    colors: {
      light: {
        primary: "239 84% 67%",
        primaryForeground: "0 0% 100%",
        ring: "239 84% 67%",
        sidebarBackground: "239 84% 67%",
        sidebarForeground: "0 0% 100%",
        sidebarPrimary: "0 0% 100%",
        sidebarPrimaryForeground: "239 84% 67%",
        sidebarAccent: "239 80% 59%",
        sidebarAccentForeground: "0 0% 100%",
        sidebarBorder: "239 75% 72%",
        sidebarRing: "0 0% 100%",
        chart1: "239 84% 67%",
      },
      dark: {
        primary: "239 84% 77%",
        primaryForeground: "210 40% 8%",
        ring: "239 84% 77%",
        sidebarBackground: "210 40% 10%",
        sidebarForeground: "210 20% 98%",
        sidebarPrimary: "239 84% 77%",
        sidebarPrimaryForeground: "210 40% 8%",
        sidebarAccent: "210 35% 15%",
        sidebarAccentForeground: "210 20% 98%",
        sidebarBorder: "210 30% 18%",
        sidebarRing: "239 84% 77%",
        chart1: "239 84% 77%",
      },
    },
  },
  cyan: {
    name: "cyan",
    displayName: "Xanh lơ",
    colors: {
      light: {
        primary: "188 94% 43%",
        primaryForeground: "0 0% 100%",
        ring: "188 94% 43%",
        sidebarBackground: "188 94% 43%",
        sidebarForeground: "0 0% 100%",
        sidebarPrimary: "0 0% 100%",
        sidebarPrimaryForeground: "188 94% 43%",
        sidebarAccent: "188 90% 35%",
        sidebarAccentForeground: "0 0% 100%",
        sidebarBorder: "188 85% 50%",
        sidebarRing: "0 0% 100%",
        chart1: "188 94% 43%",
      },
      dark: {
        primary: "188 94% 53%",
        primaryForeground: "210 40% 8%",
        ring: "188 94% 53%",
        sidebarBackground: "210 40% 10%",
        sidebarForeground: "210 20% 98%",
        sidebarPrimary: "188 94% 53%",
        sidebarPrimaryForeground: "210 40% 8%",
        sidebarAccent: "210 35% 15%",
        sidebarAccentForeground: "210 20% 98%",
        sidebarBorder: "210 30% 18%",
        sidebarRing: "188 94% 53%",
        chart1: "188 94% 53%",
      },
    },
  },
};

/**
 * Định nghĩa context interface
 */
interface ThemeContextType {
  theme: ThemeColor;
  setTheme: (theme: ThemeColor) => void;
  themes: Record<ThemeColor, ThemeConfig>;
  isDark: boolean;
  setIsDark: (isDark: boolean) => void;
  customColor: string | null;
  setCustomColor: (colorCode: string | null) => void;
  resetToDefaultTheme: () => void;
}

/**
 * Tạo theme context
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Key để lưu theme trong localStorage
 */
const THEME_STORAGE_KEY = "business-buddy-theme";
const DARK_MODE_STORAGE_KEY = "business-buddy-dark-mode";
const CUSTOM_COLOR_STORAGE_KEY = "business-buddy-custom-color";

/**
 * Chuyển đổi mã màu hex sang HSL
 * @param hex - Mã màu hex (ví dụ: #FF5733 hoặc FF5733)
 * @returns Chuỗi HSL theo format của CSS variables (ví dụ: "10 80% 60%")
 */
function hexToHsl(hex: string): string {
  // Loại bỏ # nếu có
  const cleanHex = hex.replace("#", "");

  // Kiểm tra định dạng (hỗ trợ cả 3 và 6 ký tự)
  if (!/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    throw new Error("Mã màu hex không hợp lệ. Vui lòng nhập mã màu 3 hoặc 6 ký tự (ví dụ: #FF5733 hoặc #F73)");
  }

  // Xử lý mã 3 ký tự (mở rộng thành 6 ký tự)
  let fullHex = cleanHex;
  if (cleanHex.length === 3) {
    fullHex = cleanHex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  // Chuyển đổi hex sang RGB
  const r = parseInt(fullHex.substring(0, 2), 16) / 255;
  const g = parseInt(fullHex.substring(2, 4), 16) / 255;
  const b = parseInt(fullHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  // Chuyển đổi sang phần trăm và độ
  const hDeg = Math.round(h * 360);
  const sPercent = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${hDeg} ${sPercent}% ${lPercent}%`;
}

/**
 * Chuyển đổi RGB sang HSL
 * @param rgb - Chuỗi RGB (ví dụ: "rgb(255, 87, 51)" hoặc "255, 87, 51")
 * @returns Chuỗi HSL (ví dụ: "10 80% 60%")
 */
function rgbToHsl(rgb: string): string {
  // Trích xuất các giá trị RGB
  const match = rgb.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!match) {
    throw new Error("Định dạng RGB không hợp lệ. Vui lòng nhập theo định dạng: rgb(255, 87, 51) hoặc 255, 87, 51");
  }

  const r = parseInt(match[1], 10) / 255;
  const g = parseInt(match[2], 10) / 255;
  const b = parseInt(match[3], 10) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  const hDeg = Math.round(h * 360);
  const sPercent = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${hDeg} ${sPercent}% ${lPercent}%`;
}

/**
 * Chuyển đổi mã màu (hex hoặc rgb) sang HSL
 * @param colorCode - Mã màu (hex: #FF5733 hoặc rgb: rgb(255, 87, 51))
 * @returns Chuỗi HSL theo format của CSS variables (ví dụ: "10 80% 60%")
 */
export function parseColorCode(colorCode: string): string {
  const trimmed = colorCode.trim();

  // Kiểm tra hex (hỗ trợ cả 3 và 6 ký tự)
  if (trimmed.startsWith("#") || /^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return hexToHsl(trimmed);
  }

  // Kiểm tra RGB
  if (trimmed.toLowerCase().startsWith("rgb") || /^\d+\s*,\s*\d+\s*,\s*\d+/.test(trimmed)) {
    return rgbToHsl(trimmed);
  }

  // Kiểm tra HSL (nếu đã là HSL thì trả về, nhưng cần đảm bảo format đúng)
  if (/^\d+\s+\d+%\s+\d+%/.test(trimmed)) {
    return trimmed;
  }

  // Kiểm tra HSL không có % (format: "10 80 60")
  if (/^\d+\s+\d+\s+\d+$/.test(trimmed)) {
    const parts = trimmed.split(/\s+/);
    return `${parts[0]} ${parts[1]}% ${parts[2]}%`;
  }

  throw new Error("Định dạng màu không hợp lệ. Vui lòng nhập mã hex (#FF5733 hoặc #F73), RGB (rgb(255, 87, 51)) hoặc HSL (10 80% 60%)");
}

/**
 * Tạo theme colors từ một màu primary tùy chỉnh
 */
function generateThemeFromColor(primaryHsl: string, darkMode: boolean): ThemeColors {
  // Parse HSL values
  const hslMatch = primaryHsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!hslMatch) {
    throw new Error("Định dạng HSL không hợp lệ");
  }

  const h = parseInt(hslMatch[1], 10);
  const s = parseInt(hslMatch[2], 10);
  const l = parseInt(hslMatch[3], 10);

  if (darkMode) {
    // Dark mode: màu sáng hơn
    const lightL = Math.min(95, l + 15);
    return {
      primary: `${h} ${s}% ${Math.min(70, l + 10)}%`,
      primaryForeground: "210 40% 8%",
      ring: `${h} ${s}% ${Math.min(70, l + 10)}%`,
      sidebarBackground: "210 40% 10%",
      sidebarForeground: "210 20% 98%",
      sidebarPrimary: `${h} ${s}% ${Math.min(70, l + 10)}%`,
      sidebarPrimaryForeground: "210 40% 8%",
      sidebarAccent: "210 35% 15%",
      sidebarAccentForeground: "210 20% 98%",
      sidebarBorder: "210 30% 18%",
      sidebarRing: `${h} ${s}% ${Math.min(70, l + 10)}%`,
      chart1: `${h} ${s}% ${Math.min(70, l + 10)}%`,
    };
  } else {
    // Light mode: màu tối hơn một chút
    const darkL = Math.max(25, l - 5);
    const darkerL = Math.max(20, l - 10);
    return {
      primary: `${h} ${s}% ${l}%`,
      primaryForeground: "0 0% 100%",
      ring: `${h} ${s}% ${l}%`,
      sidebarBackground: `${h} ${s}% ${l}%`,
      sidebarForeground: "0 0% 100%",
      sidebarPrimary: "0 0% 100%",
      sidebarPrimaryForeground: `${h} ${s}% ${l}%`,
      sidebarAccent: `${h} ${Math.max(70, s - 5)}% ${darkerL}%`,
      sidebarAccentForeground: "0 0% 100%",
      sidebarBorder: `${h} ${Math.max(60, s - 10)}% ${Math.min(65, l + 5)}%`,
      sidebarRing: "0 0% 100%",
      chart1: `${h} ${s}% ${l}%`,
    };
  }
}

/**
 * Theme Provider Component
 */
interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeColor>(() => {
    // Load theme từ localStorage hoặc dùng mặc định
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeColor;
    return savedTheme && savedTheme in themes ? savedTheme : "green";
  });

  const [isDark, setIsDarkState] = useState<boolean>(() => {
    // Load dark mode từ localStorage hoặc dùng mặc định
    const savedDarkMode = localStorage.getItem(DARK_MODE_STORAGE_KEY);
    if (savedDarkMode !== null) {
      return savedDarkMode === "true";
    }
    // Kiểm tra system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [customColor, setCustomColorState] = useState<string | null>(() => {
    // Load custom color từ localStorage
    return localStorage.getItem(CUSTOM_COLOR_STORAGE_KEY);
  });

  /**
   * Áp dụng theme vào CSS variables
   */
  const applyTheme = (themeColor: ThemeColor, darkMode: boolean, customColorValue: string | null = null) => {
    const root = document.documentElement;
    let colors: ThemeColors;

    // Nếu có custom color, sử dụng nó
    if (customColorValue) {
      try {
        const primaryHsl = parseColorCode(customColorValue);
        colors = generateThemeFromColor(primaryHsl, darkMode);
      } catch (error) {
        // Nếu có lỗi, fallback về theme mặc định
        console.error("Lỗi khi parse custom color:", error);
        const themeConfig = themes[themeColor];
        colors = darkMode ? themeConfig.colors.dark : themeConfig.colors.light;
      }
    } else {
      // Sử dụng theme mặc định
      const themeConfig = themes[themeColor];
      colors = darkMode ? themeConfig.colors.dark : themeConfig.colors.light;
    }

    // Áp dụng màu primary
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--primary-foreground", colors.primaryForeground);
    root.style.setProperty("--ring", colors.ring);

    // Áp dụng màu sidebar
    root.style.setProperty("--sidebar-background", colors.sidebarBackground);
    root.style.setProperty("--sidebar-foreground", colors.sidebarForeground);
    root.style.setProperty("--sidebar-primary", colors.sidebarPrimary);
    root.style.setProperty("--sidebar-primary-foreground", colors.sidebarPrimaryForeground);
    root.style.setProperty("--sidebar-accent", colors.sidebarAccent);
    root.style.setProperty("--sidebar-accent-foreground", colors.sidebarAccentForeground);
    root.style.setProperty("--sidebar-border", colors.sidebarBorder);
    root.style.setProperty("--sidebar-ring", colors.sidebarRing);

    // Áp dụng màu chart
    root.style.setProperty("--chart-1", colors.chart1);

    // Áp dụng dark mode class
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  /**
   * Set theme và lưu vào localStorage
   */
  const setTheme = (newTheme: ThemeColor) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    // Xóa custom color khi chọn theme mặc định
    if (customColor) {
      setCustomColorState(null);
      localStorage.removeItem(CUSTOM_COLOR_STORAGE_KEY);
    }
    applyTheme(newTheme, isDark, null);
  };

  /**
   * Set dark mode và lưu vào localStorage
   */
  const setIsDark = (dark: boolean) => {
    setIsDarkState(dark);
    localStorage.setItem(DARK_MODE_STORAGE_KEY, dark.toString());
    applyTheme(theme, dark, customColor);
  };

  /**
   * Set custom color và lưu vào localStorage
   */
  const setCustomColor = (colorCode: string | null) => {
    if (colorCode === null || colorCode.trim() === "") {
      setCustomColorState(null);
      localStorage.removeItem(CUSTOM_COLOR_STORAGE_KEY);
      applyTheme(theme, isDark, null);
      return;
    }

    try {
      // Validate và parse color code
      const hsl = parseColorCode(colorCode);
      setCustomColorState(colorCode);
      localStorage.setItem(CUSTOM_COLOR_STORAGE_KEY, colorCode);
      applyTheme(theme, isDark, colorCode);
    } catch (error) {
      // Lỗi sẽ được throw để component có thể xử lý
      throw error;
    }
  };

  /**
   * Reset về theme mặc định
   */
  const resetToDefaultTheme = () => {
    setThemeState("green");
    setCustomColorState(null);
    localStorage.setItem(THEME_STORAGE_KEY, "green");
    localStorage.removeItem(CUSTOM_COLOR_STORAGE_KEY);
    applyTheme("green", isDark, null);
  };

  /**
   * Áp dụng theme khi component mount hoặc theme thay đổi
   */
  useEffect(() => {
    applyTheme(theme, isDark, customColor);
  }, [theme, isDark, customColor]);

  /**
   * Lắng nghe thay đổi system preference cho dark mode
   */
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      // Chỉ áp dụng nếu chưa có preference được lưu
      if (localStorage.getItem(DARK_MODE_STORAGE_KEY) === null) {
        setIsDarkState(e.matches);
        applyTheme(theme, e.matches, customColor);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        themes,
        isDark,
        setIsDark,
        customColor,
        setCustomColor,
        resetToDefaultTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook để sử dụng theme context
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

