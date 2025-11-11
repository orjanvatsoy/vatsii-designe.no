export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Breadcrumbs,
  Container,
  Link as MuiLink,
  Skeleton,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function ProductsPage() {
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .abortSignal(AbortSignal.timeout(5000));

  if (error) {
    return (
      <Box mt={8}>
        <Typography color="error">Kunne ikke hente produkter</Typography>
      </Box>
    );
  }

  return (
    <>
      <Breadcrumbs aria-label="breadcrumb" sx={{ ml: 4, mb: 2 }}>
        <MuiLink component={Link} href="/" color="inherit" underline="hover">
          Hjem
        </MuiLink>

        <Typography color="primary" fontWeight={600}>
          Produkter
        </Typography>
      </Breadcrumbs>
      <Container maxWidth="lg" sx={{ mt: 8 }}>
        <Typography variant="h3" mb={4} align="center">
          Produkter
        </Typography>
        <Grid container spacing={4}>
          {products?.map((product) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={product.id}>
              <Link
                href={`/products/${product.id}`}
                style={{ textDecoration: "none" }}
              >
                <Card
                  sx={{
                    boxShadow: 6,
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "background.paper",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    minHeight: 320,
                    maxHeight: 330,
                    height: { xs: 370, sm: 370, md: 370 },
                    width: "100%",
                    cursor: "pointer",
                    transition: "box-shadow 0.2s",
                    "&:hover": { boxShadow: 12 },
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      height: 220,
                      position: "relative",
                      bgcolor: "background.default",
                    }}
                  >
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        style={{ objectFit: "contain", borderRadius: 6 }}
                        loading="lazy"
                        sizes="(max-width: 600px) 100vw, 33vw"
                        placeholder="empty"
                      />
                    ) : (
                      <Skeleton
                        variant="rectangular"
                        width="100%"
                        height={220}
                      />
                    )}
                  </Box>
                  <CardContent>
                    <Typography variant="h6" color="primary.main">
                      {product.name}
                    </Typography>
                    <Typography variant="body2" mb={1}>
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
                  </CardContent>
                </Card>
              </Link>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
}
