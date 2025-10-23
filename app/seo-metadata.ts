import type { Metadata } from "next";

export const baseMetadata: Metadata = {
  metadataBase: new URL("https://www.vatsii-designe.no"),
  title: "Ørjan Vatsøy | Vatsii Designs Portfolio",
  description:
    "Portefølje for Ørjan Vatsøy – applikasjonsutvikler, UX-designer og kreativ skaper. Utforsk prosjekter, design og kontaktinformasjon.",
  alternates: {
    canonical: "https://www.vatsii-designe.no",
  },
  openGraph: {
    title: "Ørjan Vatsøy | Vatsii Designs Portfolio",
    description:
      "Portefølje for Ørjan Vatsøy – applikasjonsutvikler, UX-designer og kreativ skaper. Utforsk prosjekter, design og kontaktinformasjon.",
    url: "https://www.vatsii-designe.no/",
    siteName: "Vatsii Designs",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Vatsii Designs Portfolio",
      },
    ],
    locale: "no_NO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ørjan Vatsøy | Vatsii Designs Portfolio",
    description:
      "Applikasjonsutvikler, UX-designer og kreativ skaper. Utforsk mine prosjekter og ta kontakt.",
    images: ["/og-image.jpg"],
    creator: "@vatsii",
  },
};
