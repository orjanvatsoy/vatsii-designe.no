import type { Metadata } from "next";

export const baseMetadata: Metadata = {
  title: "Ørjan Vatsøy | Vatsii Designs Portfolio",
  description:
    "Portefølje for Ørjan Vatsøy – applikasjonsutvikler, UX-designer og kreativ skaper. Utforsk prosjekter, design og kontaktinformasjon.",
  keywords: [
    "Vatsii",
    "Ørjan Vatsøy",
    "design",
    "portfolio",
    "applikasjonsutvikler",
    "UX",
    "prosjekter",
    "bordkort",
    "kreativ",
    "webutvikling",
  ],
  openGraph: {
    title: "Ørjan Vatsøy | Vatsii Designs Portfolio",
    description:
      "Portefølje for Ørjan Vatsøy – applikasjonsutvikler, UX-designer og kreativ skaper. Utforsk prosjekter, design og kontaktinformasjon.",
    url: "https://www.vatsii-designe.no/",
    siteName: "Vatsii Designs",
    images: [
      {
        url: "https://www.vatsii-designe.no/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Vatsii Designs Portfolio",
      },
    ],
    locale: "no_NO",
    type: "website",
  },
};
