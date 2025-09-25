"use client";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function Contact() {
  return (
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
  );
}
