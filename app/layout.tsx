import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Providers } from './providers';
import "./globals.css";
import { ThemeProvider } from "../components/theme/theme-provider";
import { AuthProvider } from "@/context/auth-provider";
import { Toaster } from "@/components/ui/Toaster";

const siteUrl = "https://hakoneservice.com";
const appName = "Hakone - Gestión de Taller de Bicicletas";
const appDescription = "Aplicación para la gestión de un taller de bicicletas";
const ogImage = "/HakoneIsotipo.png";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: appName,
  description: appDescription,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: ogImage,
    apple: ogImage,
  },
  openGraph: {
    type: "website",
    locale: "es",
    url: siteUrl,
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Hakone",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: appDescription,
  url: siteUrl,
  inLanguage: "es",
  provider: {
    "@type": "Organization",
    name: "Hakone",
    url: siteUrl,
  },
};

const inter = Inter({ subsets: ['latin'] });

const gaId = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
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
