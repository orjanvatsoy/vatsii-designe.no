import { createClient } from "@supabase/supabase-js";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  Breadcrumbs,
  Link as MuiLink,
} from "@mui/material";
import Link from "next/link";
import Image from "next/image";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !product) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
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
          <Button
            component={Link}
            href="/products"
            variant="contained"
            sx={{ mt: 2 }}
          >
            Tilbake til produkter
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <>
      <Breadcrumbs aria-label="breadcrumb" sx={{ ml: 4, mb: 2 }}>
        <MuiLink component={Link} href="/" color="inherit" underline="hover">
          Hjem
        </MuiLink>
        <MuiLink
          component={Link}
          href="/products"
          color="inherit"
          underline="hover"
        >
          Produkter
        </MuiLink>
        <Typography color="primary" fontWeight={600}>
          {product.name}
        </Typography>
      </Breadcrumbs>
      <Container maxWidth="sm">
        <Card
          sx={{
            boxShadow: 12,
            bgcolor: "background.paper",
            borderRadius: 3,
            overflow: "hidden",
            p: 0,
            position: "relative",
            // Bruker kun theme-farger fra MUI
          }}
        >
          {product.image_url && (
            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                bgcolor: "background.default",
                py: 1,
                borderBottom: 1,
                borderColor: "divider",
                boxShadow: 2,
              }}
            >
              <Image
                src={product.image_url}
                alt={product.name}
                width={648}
                height={459}
                style={{
                  objectFit: "contain",
                  borderRadius: 6,
                  transition: "transform 0.3s",
                }}
                priority
              />
            </Box>
          )}
          <CardContent>
            <Typography variant="h5" color="primary" fontWeight={700} mb={2}>
              {product.name}
            </Typography>
            <Typography
              variant="body2"
              mb={1}
              sx={{
                fontSize: "0.95rem",
                color: "text.secondary",
                backgroundColor: "background.default",
                borderRadius: 2,
                px: 2,
                py: 1,
                boxShadow: 1,
              }}
            >
              {product.description}
            </Typography>
            <Button
              component={Link}
              href="/products"
              variant="contained"
              color="primary"
              sx={{ mt: 3, fontWeight: 600, borderRadius: 2, boxShadow: 3 }}
            >
              Tilbake til produkter
            </Button>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
