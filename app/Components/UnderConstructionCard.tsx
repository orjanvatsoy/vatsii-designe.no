"use client";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function UnderConstructionCard() {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="60vh"
    >
      <Card sx={{ minWidth: 300, maxWidth: 400 }}>
        <CardContent>
          <Typography variant="h5" component="div" gutterBottom>
            Portfolio
          </Typography>
          <Typography variant="body1" color="text.secondary">
            My portfolio is under construction.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
