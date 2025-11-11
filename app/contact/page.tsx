"use client";
import { Breadcrumbs, Container, Link as MuiLink } from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "next/link";

export default function Contact() {
  return (
    <>
      <Breadcrumbs aria-label="breadcrumb" sx={{ ml: 4, mb: 2 }}>
        <MuiLink component={Link} href="/" color="inherit" underline="hover">
          Hjem
        </MuiLink>

        <Typography color="primary" fontWeight={600}>
          Kontakt
        </Typography>
      </Breadcrumbs>
      <Container maxWidth="lg" sx={{ mt: 8 }}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="60vh"
        >
          <Typography variant="h3" gutterBottom>
            Kontakt
          </Typography>
          <Typography variant="body1" maxWidth={500} textAlign="center">
            Ta gjerne kontakt for spørsmål, andre henvendelser!
          </Typography>
          <Typography variant="body2" mt={2} color="text.secondary">
            E-post: <a href="mailto:orjan@vatsii.no">orjanva@gmail.com</a>
          </Typography>
        </Box>
      </Container>
    </>
  );
}
