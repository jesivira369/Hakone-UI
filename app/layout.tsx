import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Sidebar } from '../components/ui/Sidebar';
import { Header } from "../components/ui/Header"
import { Providers } from './providers';
import "./globals.css";
import "./globals.css"
import { ThemeProvider } from "../components/theme/theme-provider";

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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>
            <div className="flex h-screen bg-background">
              <Sidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6">{children}</main>
              </div>
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
