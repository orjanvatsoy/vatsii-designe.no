"use client";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";

export default function About() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={4}
      minHeight="60vh"
      maxWidth={800}
      mx="auto"
    >
      <Typography variant="h3" gutterBottom>
        Om meg
      </Typography>

      <Typography variant="body1" maxWidth={700} textAlign="left" mb={4}>
        Jeg heter Ørjan Vatsøy og jobber som applikasjonsutvikler hos Framo med
        fokus på frontend-utvikling og UX-design. Til daglig brenner jeg for å
        lage brukervennlige løsninger som forenkler hverdagen for både kunder og
        kolleger. Som utvikler liker jeg å kombinere solid teknisk innsikt med
        kreativ problemløsning for å skape intuitive grensesnitt og gode
        brukeropplevelser.
        <br />
        <br />
        Jeg har en sterk skapertrang som strekker seg utover jobben. På fritiden
        driver jeg egne kreative prosjekter under navnet Vatsii_designs, hvor
        jeg utforsker både digitale og fysiske designprosesser. Du finner meg
        like gjerne i snekkerverkstedet med sagflis i håret som foran PC-en,
        hvor jeg tegner i Fusion 360 eller utvikler visuelle konsepter. Gjennom
        Vatsii_designs har jeg for eksempel bygget min egen trebåt kalt Klasken
        og designet unike møbler og skilt. Disse prosjektene gir meg muligheten
        til å uttrykke meg kreativt og lære noe nytt hele tiden.
        <br />
        <br />
        Målet mitt nå er å utvikle meg videre som designer. Jeg ønsker å bli en
        enda bedre UX-designer, og jeg tror kombinasjonen av erfaringene mine
        fra programvareutvikling, brukersentrert design og praktisk håndverk gir
        meg et unikt perspektiv. Med denne bakgrunnen håper jeg å skape
        helhetlige løsninger som forener det beste fra både digitale og fysiske
        verdener – alltid med brukeren i fokus.
      </Typography>

      {/* Bilde 1: Arbeidssituasjon */}
      <Card sx={{ maxWidth: 500, mb: 2 }}>
        <CardMedia
          component="img"
          height="300"
          image="/about/Working.jpg" // Bytt til riktig filnavn
          alt="Ørjan i arbeid hos Framo, der han utvikler brukervennlige applikasjoner."
        />
        <CardContent>
          <Typography variant="caption" color="text.secondary">
            Ørjan i arbeid hos Framo, der han utvikler brukervennlige
            applikasjoner.
          </Typography>
        </CardContent>
      </Card>

      {/* Bilde 2: Trebåten Klasken */}
      <Card sx={{ maxWidth: 500, mb: 2 }}>
        <CardMedia
          component="img"
          height="300"
          image="/about/klasken.jpg"
          alt="Trebåten «Klasken» – et håndlaget prosjekt Ørjan har bygget selv."
        />
        <CardContent>
          <Typography variant="caption" color="text.secondary">
            Trebåten «Klasken» – et håndlaget prosjekt Ørjan har bygget selv.
          </Typography>
        </CardContent>
      </Card>

      {/* Bilde 3: Møbel eller skilt */}
      <Card sx={{ maxWidth: 500, mb: 2 }}>
        <CardMedia
          component="img"
          height="300"
          image="/about/møbel.jpg" // Bytt til riktig filnavn
          alt="Unikt møbel designet og bygget av Ørjan gjennom Vatsii_designs."
        />
        <CardContent>
          <Typography variant="caption" color="text.secondary">
            Unikt møbel designet og bygget av Ørjan gjennom Vatsii_designs.
          </Typography>
        </CardContent>
      </Card>
      <Typography variant="inherit">
        Text created by AI, based on information on internet
      </Typography>
    </Box>
  );
}
