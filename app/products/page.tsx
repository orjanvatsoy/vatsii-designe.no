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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function ProductsPage() {
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, description, category, price, image_url")
    .eq("active", true);

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
                  {product.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
