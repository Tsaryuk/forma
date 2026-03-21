import "./globals.css";

export const metadata = {
  title: "Forma",
  description: "Социальный трекер осознанной дисциплины",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Forma",
  },
  formatDetection: { telephone: false },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F3EF" },
    { media: "(prefers-color-scheme: dark)",  color: "#0C0C0B" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
