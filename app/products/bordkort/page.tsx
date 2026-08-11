import { Alert } from "@mui/material";
import PageShell from "../../Components/PageShell";
import { prisma } from "../../lib/prisma";
import { signImageUrl } from "../../lib/storage";
import PlaceCardOrderForm from "./PlaceCardOrderForm";

export const revalidate = 86400;

export default async function PlaceCardsPage() {
  const products = await prisma.product.findMany({
    where: {
      active: true,
      category: { equals: "bordkort", mode: "insensitive" },
    },
    orderBy: { name: "asc" },
  });

  const variants = await Promise.all(
    products.map(async (product) => ({
      id: product.id.toString(),
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl
        ? await signImageUrl(product.imageUrl, "products")
        : "",
    })),
  );

  return (
    <PageShell
      eyebrow="PERSONLIG TIL BORDET"
      title="Forespørsel på bordkort"
      subtitle="Velg uttrykket du ønsker og legg inn ett navn per linje. Forespørselen er uforpliktende, og du får prisestimat og leveringstid før du bestemmer deg."
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
