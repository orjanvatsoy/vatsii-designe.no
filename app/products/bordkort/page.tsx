import { Alert } from "@mui/material";
import PageShell from "../../Components/PageShell";
import PlaceCardOrderForm from "./PlaceCardOrderForm";

export const revalidate = 86400;

const mockVariants = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Valnøtt",
    description: "Et varmt og klassisk bordkort i mørkt tre.",
    inquiryInputMode: "name_list",
    imageUrl: "/CarouselPic/IMG_5203.JPEG",
    imagePositionX: 50,
    imagePositionY: 50,
    imageRotation: 0,
    imageZoom: 100,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Lys eik",
    description: "Et lyst og naturlig uttrykk til borddekkingen.",
    inquiryInputMode: "name_list",
    imageUrl: "/CarouselPic/IMG_5829.JPEG",
    imagePositionX: 50,
    imagePositionY: 50,
    imageRotation: 0,
    imageZoom: 100,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Skoggrønn",
    description: "Et dempet grønt bordkort med et moderne preg.",
    inquiryInputMode: "name_list",
    imageUrl: "/CarouselPic/IMG_5683.JPEG",
    imagePositionX: 50,
    imagePositionY: 50,
    imageRotation: 0,
    imageZoom: 100,
  },
];

async function getVariants() {
  const useMockData =
    process.env.NODE_ENV !== "production" &&
    process.env.USE_MOCK_DATA === "true";

  if (useMockData) return mockVariants;

  const [{ prisma }, { signImageUrl }] = await Promise.all([
    import("../../lib/prisma"),
    import("../../lib/storage"),
  ]);
  const products = await prisma.product.findMany({
    where: {
      active: true,
      category: { equals: "bordkort", mode: "insensitive" },
    },
    orderBy: { name: "asc" },
  });

  return Promise.all(
    products.map(async (product) => ({
      id: product.id.toString(),
      name: product.name,
      description: product.description,
      inquiryInputMode: product.inquiryInputMode,
      imagePositionX: product.imagePositionX,
      imagePositionY: product.imagePositionY,
      imageRotation: product.imageRotation,
      imageZoom: product.imageZoom,
      imageUrl: product.imageUrl
        ? await signImageUrl(product.imageUrl, "products")
        : "",
    })),
  );
}

export default async function PlaceCardsPage() {
  const variants = await getVariants();

  return (
    <PageShell
      eyebrow="PERSONLIG TIL BORDET"
      title="Forespørsel på bordkort"
      subtitle="Velg uttrykket du ønsker og fyll ut forespørselen. Du får prisestimat og leveringstid før du bestemmer deg."
      maxWidth="lg"
    >
      {variants.length > 0 ? (
        <PlaceCardOrderForm variants={variants} />
      ) : (
        <Alert severity="info">
          Ingen bordkort er tilgjengelige akkurat nå.
        </Alert>
      )}
    </PageShell>
  );
}
