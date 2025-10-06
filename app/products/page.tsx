"use server";

import { createClient } from "@supabase/supabase-js";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
} from "@mui/material";

export const dynamic = "force-dynamic";

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
    <Box maxWidth={1200} mx="auto" mt={8}>
      <Typography variant="h3" mb={4} align="center">
        Produkter
      </Typography>
      <Grid container spacing={4}>
        {products?.map((product) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={product.id}>
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
              }}
            >
              {product.image_url && (
                <CardMedia
                  component="img"
                  image={product.image_url}
                  alt={product.name}
                  sx={{
                    height: 220,
                    objectFit: "contain",
                    bgcolor: "background.default",
                  }}
                />
              )}
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
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
