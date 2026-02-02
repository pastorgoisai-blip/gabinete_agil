/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Enable class-based dark mode
    theme: {
        extend: {
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                    // Legacy Palette Support
                    50: '#F1F7F6',      // Anti-Flash White
                    100: '#E0F2EC',
                    200: '#AACBC4',     // Pistachio
                    300: '#707D7D',     // Stone
                    400: '#2CC295',     // Mountain Meadow
                    500: '#00DF81',     // Caribbean Green
                    600: '#2FA98C',     // Mint
                    700: '#17876D',     // Frog
                    800: '#03624C',     // Bangladesh Green
                    900: '#032221',     // Dark Green
                    950: '#050f10',     // Rich Black -> Deep Green Black
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                    900: '#06302B', // Pine
                    800: '#0B453A', // Basil
                    700: '#095544', // Forest
                    600: '#17876D', // Frog (mapped for consistency)
                    500: '#2FA98C', // Mint (mapped for consistency)
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
            },
            fontFamily: {
                sans: ['Axiforma', 'Outfit', 'sans-serif'],
            },
            backgroundImage: {
                'sidebar-gradient': 'linear-gradient(to bottom, #a8bbb7 0%, #63857c 100%)',
                'login-gradient': 'linear-gradient(135deg, #dbf0dd 0%, #5c8574 100%)',
                'dark-body': 'linear-gradient(to bottom right, #050f10 0%, #050f10 100%)',
            }
        },
    },
    plugins: [],
}
