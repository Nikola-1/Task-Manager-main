import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [
     // eslint-disable-next-line @typescript-eslint/no-require-imports
     require('tailwind-scrollbar-hide')
  ],
} satisfies Config;
