import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from './providers';
import "./globals.css";
import "./globals.css"
import { ThemeProvider } from "../components/theme/theme-provider";
import { AuthProvider } from "@/context/auth-provider";

export const metadata: Metadata = {
  title: "Hakone - Gestión de Taller de Bicicletas",
  description: "Aplicación para la gestión de un taller de bicicletas",
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
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Providers>
              {children}
            </Providers>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
