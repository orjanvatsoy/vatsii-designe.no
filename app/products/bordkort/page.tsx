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
      title="Bordkort"
      subtitle="Velg uttrykket du ønsker, legg inn ett navn per linje og send bestillingen direkte til oss."
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
