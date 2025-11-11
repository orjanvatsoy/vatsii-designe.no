"use client";

import {
  Breadcrumbs,
  Typography,
  Container,
  Box,
  Card,
  CardMedia,
  CardContent,
  Link as MuiLink,
} from "@mui/material";
import Link from "next/link";

export default function About() {
  return (
    <>
      <Breadcrumbs aria-label="breadcrumb" sx={{ ml: 4, mb: 2 }}>
        <MuiLink component={Link} href="/" color="inherit" underline="hover">
          Hjem
        </MuiLink>

        <Typography color="primary" fontWeight={600}>
          Om meg
        </Typography>
      </Breadcrumbs>
      <Container maxWidth="lg" sx={{ mt: 8 }}>
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
            Jeg heter Ørjan Vatsøy og jobber som applikasjonsutvikler hos Framo
            med fokus på frontend-utvikling og UX-design. Til daglig brenner jeg
            for å lage brukervennlige løsninger som forenkler hverdagen for både
            kunder og kolleger. Som utvikler liker jeg å kombinere solid teknisk
            innsikt med kreativ problemløsning for å skape intuitive grensesnitt
            og gode brukeropplevelser.
            <br />
            <br />
            Jeg har en sterk skapertrang som strekker seg utover jobben. På
            fritiden driver jeg egne kreative prosjekter under navnet
            <a
              href="https://www.instagram.com/vatsii_designs/?igsh=NWw2OXl0cHZsenBq&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "underline" }}
            >
              Vatsii_designs
            </a>
            , hvor jeg utforsker både digitale og fysiske designprosesser. Du
            finner meg like gjerne i snekkerverkstedet med sagflis i håret som
            foran PC-en, hvor jeg tegner i Fusion 360 eller utvikler visuelle
            konsepter. Under navnet Vatsii_designs deler jeg glimt fra
            prosjekter jeg har jobbet med – blant annet restaureringen av
            trebåten Klasken og ulike møbel- og skiltprosjekter. Det er
            prosjekter som gir meg muligheten til å utforske kreativitet og
            stadig lære noe nytt.
            <br />
            <br />
            Målet mitt nå er å utvikle meg videre som designer. Jeg ønsker å bli
            en enda bedre UX-designer, og jeg tror kombinasjonen av erfaringene
            mine fra programvareutvikling, brukersentrert design og praktisk
            håndverk gir meg et unikt perspektiv. Med denne bakgrunnen håper jeg
            å skape helhetlige løsninger som forener det beste fra både digitale
            og fysiske verdener – alltid med brukeren i fokus.
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
                Trebåten «Klasken» – et håndlaget prosjekt Ørjan har bygget
                selv.
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
      </Container>
    </>
  );
}
