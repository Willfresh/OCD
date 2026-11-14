import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OCD Live & Shop — L'Opportunité C'est Dehors",
  description:
    "OCD : la plateforme commerciale africaine — découvrez les vendeurs en direct (OCD Live) et les boutiques (OCD Shop) du Bénin, du Togo, du Cameroun, de Côte d'Ivoire et de toute l'Afrique.",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23FA4900'/%3E%3Ctext x='32' y='46' font-family='Arial' font-size='36' font-weight='900' text-anchor='middle' fill='%230A0908'%3EO%3C/text%3E%3C/svg%3E",
  },
  openGraph: {
    title: "OCD Live & Shop — L'Afrique qui vend, en direct",
    description:
      "Soumettez votre live, faites-le valider par la régie OCD et gagnez en visibilité. Créez votre boutique et vendez vos produits.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ocd-theme');document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light');}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
