import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PageShell from "../../Components/PageShell";
import ProductImageViewer from "../../Components/ProductImageViewer";
import { signImageUrl } from "../../lib/storage";
import { prisma } from "../../lib/prisma";
import ProductInquiryForm from "./ProductInquiryForm";

export const revalidate = 86400;

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  let product = null;
  try {
    product = await prisma.product.findFirst({ where: { id, active: true } });
  } catch {
    product = null;
  }

  if (!product) {
    return (
      <Container maxWidth="sm" sx={{ mt: 12, mb: 8 }}>
        <Card
          sx={{
            boxShadow: 6,
            bgcolor: "background.paper",
            borderRadius: 4,
            p: 4,
          }}
        >
          <Typography color="error" variant="h5" mb={2}>
            Produktet ble ikke funnet
          </Typography>
          <Button href="/products" variant="contained" sx={{ mt: 2 }}>
            Tilbake til produkter
          </Button>
        </Card>
      </Container>
    );
  }

  // Signed URLs live longer than the page cache, avoiding signing per request.
  const imageUrl: string = await signImageUrl(product.imageUrl, "products");

  return (
    <PageShell maxWidth="md">
      <Box display="flex" justifyContent="center">
        <Card
          sx={{
            width: "100%",
            maxWidth: 720,
            bgcolor: "background.paper",
            borderRadius: 4,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 30px 70px -28px rgba(0,0,0,0.85)",
          }}
        >
          {imageUrl && (
            <ProductImageViewer
              src={imageUrl}
              alt={product.name}
              positionX={product.imagePositionX}
              positionY={product.imagePositionY}
              rotation={product.imageRotation}
              imageZoom={product.imageZoom}
              priority
            />
          )}
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            {product.category && (
              <Chip
                label={product.category}
                size="small"
                sx={{
                  mb: 2,
                  bgcolor: "rgba(217,160,102,0.15)",
                  color: "primary.light",
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  border: "1px solid rgba(217,160,102,0.3)",
                }}
              />
            )}
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, color: "text.primary", mb: 2 }}
            >
              {product.name}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "text.secondary",
                lineHeight: 1.7,
                whiteSpace: "pre-line",
              }}
            >
              {product.description}
            </Typography>
            <ProductInquiryForm
              productId={product.id}
              productName={product.name}
              inputMode={product.inquiryInputMode}
            />
            <Button
              href="/products"
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              sx={{
                mt: 4,
                px: 3,
                py: 1,
              }}
            >
              Tilbake til produkter
            </Button>
          </CardContent>
        </Card>
      </Box>
    </PageShell>
  );
}
