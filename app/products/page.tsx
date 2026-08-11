export const revalidate = 86400;

import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Skeleton,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import PageShell from "../Components/PageShell";
import { signImageUrl } from "../lib/storage";
import { prisma } from "../lib/prisma";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
  });

  // Signed URLs live longer than the page cache, avoiding signing per request.
  const productsWithSignedUrls = await Promise.all(
    products.map(async (product) => ({
      id: product.id.toString(),
      name: product.name,
      description: product.description,
      category: product.category,
      image_url: product.imageUrl
        ? await signImageUrl(product.imageUrl, "products")
        : product.imageUrl,
    })),
  );

  return (
    <PageShell
      eyebrow="VÅR KOLLEKSJON"
      title="Produkter"
      subtitle="Håndlagde trearbeider med karakter — hvert stykke unikt, formet for å vare."
    >
      <Grid container spacing={4}>
        {productsWithSignedUrls.map((product) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={product.id}>
            <Link
              href={`/products/${product.id}`}
              style={{ textDecoration: "none" }}
            >
              <Card
                sx={{
                  position: "relative",
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 4,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  height: 380,
                  width: "100%",
                  cursor: "pointer",
                  boxShadow: "0 14px 36px -18px rgba(0,0,0,0.7)",
                  transition:
                    "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: "0 26px 60px -22px rgba(0,0,0,0.85)",
                    borderColor: "primary.main",
                  },
                  "&:hover .product-img": {
                    transform: "scale(1.06)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    height: 230,
                    position: "relative",
                    bgcolor: "#16150F",
                    overflow: "hidden",
                  }}
                >
                  {product.image_url ? (
                    <Image
                      className="product-img"
                      src={product.image_url}
                      alt={product.name}
                      fill
                      style={{
                        objectFit: "cover",
                        transition: "transform 0.5s ease",
                      }}
                      loading="lazy"
                      sizes="(max-width: 600px) 100vw, 33vw"
                      placeholder="empty"
                    />
                  ) : (
                    <Skeleton variant="rectangular" width="100%" height={230} />
                  )}
                  <Box
                    aria-hidden
                    sx={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(42,42,38,0.95) 0%, rgba(42,42,38,0) 45%)",
                      pointerEvents: "none",
                    }}
                  />
                </Box>
                <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: "text.primary", mb: 0.5 }}
                  >
                    {product.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    <span
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                      }}
                    >
                      {product.description}
                    </span>
                  </Typography>
                  <Typography
                    sx={{
                      mt: 1.5,
                      fontSize: 13,
                      fontWeight: 600,
                      letterSpacing: 1,
                      color: "primary.light",
                    }}
                  >
                    Se detaljer →
                  </Typography>
                </CardContent>
              </Card>
            </Link>
          </Grid>
        ))}
      </Grid>

      {productsWithSignedUrls.length === 0 && (
        <Typography align="center" color="text.secondary" mt={6}>
          Ingen produkter tilgjengelig akkurat nå.
        </Typography>
      )}
    </PageShell>
  );
}
