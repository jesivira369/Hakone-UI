import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from './providers';
import "./globals.css";
import { ThemeProvider } from "../components/theme/theme-provider";
import { AuthProvider } from "@/context/auth-provider";
import { Toaster } from "@/components/ui/Toaster";

const appName = "Hakone - Gestión de Taller de Bicicletas";
const appDescription = "Aplicación para la gestión de un taller de bicicletas";
const ogImage = "/HakoneIsotipo.png";

export const metadata: Metadata = {
  title: appName,
  description: appDescription,
  icons: {
    icon: ogImage,
    apple: ogImage,
  },
  openGraph: {
    type: "website",
    locale: "es",
    title: appName,
    description: appDescription,
    images: [{ url: ogImage, width: 512, height: 512, alt: "Hakone" }],
    siteName: "Hakone",
  },
  twitter: {
    card: "summary_large_image",
    title: appName,
    description: appDescription,
    images: [ogImage],
  },
}

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="light">
            <Providers>
              {children}
              <Toaster />
            </Providers>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
