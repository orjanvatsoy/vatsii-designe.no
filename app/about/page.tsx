import { Box, Button, Container, Stack, Typography } from "@mui/material";
import InstagramIcon from "@mui/icons-material/Instagram";
import Image from "next/image";

const GRADIENT =
  "radial-gradient(110% 60% at 50% 0%, rgba(139,94,60,0.22) 0%, rgba(28,28,26,0) 55%), linear-gradient(180deg, #1C1C1A 0%, #211F1B 100%)";

const STORY = [
  {
    image: "/about/klasken.jpg",
    title: "Trebåten «Klasken»",
    text: "Et håndlaget restaureringsprosjekt jeg har bygget og pusset opp selv. Her får tradisjonelt trehåndverk møte tålmodighet — planke for planke, lag for lag.",
  },
  {
    image: "/about/møbel.jpg",
    title: "Møbler & skilt",
    text: "Unike møbel- og skiltprosjekter designet i Fusion 360 og bygget for hånd i verkstedet. Funksjon og form i materialer som varer.",
  },
];

export default function About() {
  return (
    <Box sx={{ background: GRADIENT, minHeight: "100vh" }}>
      {/* Full-bleed hero */}
      <Box
        className="full-bleed"
        sx={{
          position: "relative",
          width: "100%",
          height: { xs: "70vh", md: "82vh" },
          minHeight: 460,
          overflow: "hidden",
        }}
      >
        <Image
          src="/about/Working.jpg"
          alt="Ørjan Vatsøy i arbeid"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "center 30%" }}
        />
        {/* Cinematic scrim */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(15,14,10,0.95) 0%, rgba(15,14,10,0.45) 45%, rgba(15,14,10,0.25) 70%, rgba(15,14,10,0.55) 100%)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            textAlign: "center",
            px: { xs: 3, md: 6 },
            pb: { xs: 6, md: 9 },
          }}
        >
          <Typography
            variant="overline"
            sx={{
              letterSpacing: 6,
              color: "primary.light",
              fontWeight: 600,
              textShadow: "0 2px 12px rgba(0,0,0,0.6)",
            }}
          >
            HISTORIEN
          </Typography>
          <Typography
            component="h1"
            sx={{
              fontWeight: 800,
              lineHeight: 1.0,
              fontSize: { xs: "2.6rem", sm: "3.6rem", md: "5rem" },
              letterSpacing: { xs: 0, md: 2 },
              color: "#fff",
              textShadow: "0 6px 40px rgba(0,0,0,0.7)",
            }}
          >
            Ørjan Vatsøy
          </Typography>
          <Typography
            sx={{
              mt: 2,
              maxWidth: 620,
              fontSize: { xs: "1rem", md: "1.2rem" },
              color: "rgba(234,230,225,0.92)",
              textShadow: "0 2px 16px rgba(0,0,0,0.7)",
            }}
          >
            Utvikler på dagtid, håndverker på fritiden — med kjærlighet for godt
            design.
          </Typography>
        </Box>
      </Box>

      {/* Lead intro */}
      <Container
        maxWidth="md"
        sx={{ pt: { xs: 6, md: 9 }, pb: { xs: 6, md: 8 } }}
      >
        <Box
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 24px 60px -30px rgba(0,0,0,0.8)",
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 4,
              borderRadius: 2,
              mb: 3,
              background: "linear-gradient(90deg, #D9A066 0%, #8B5E3C 100%)",
            }}
          />
          <Typography
            sx={{
              fontSize: { xs: "1.05rem", md: "1.2rem" },
              lineHeight: 1.8,
              color: "text.primary",
            }}
          >
            Jeg heter Ørjan Vatsøy og jobber som applikasjonsutvikler hos Framo
            med fokus på frontend-utvikling og UX-design. Til daglig brenner jeg
            for å lage brukervennlige løsninger som forenkler hverdagen for både
            kunder og kolleger — jeg liker å kombinere solid teknisk innsikt med
            kreativ problemløsning for å skape intuitive grensesnitt og gode
            brukeropplevelser.
          </Typography>
          <Typography
            sx={{
              mt: 3,
              fontSize: { xs: "1.05rem", md: "1.2rem" },
              lineHeight: 1.8,
              color: "text.secondary",
            }}
          >
            Skapertrangen strekker seg utover jobben. På fritiden driver jeg
            egne kreative prosjekter under navnet Vatsii_designs, hvor jeg
            utforsker både digitale og fysiske designprosesser. Du finner meg
            like gjerne i snekkerverkstedet med sagflis i håret som foran PC-en
            — der jeg tegner i Fusion 360 eller utvikler visuelle konsepter.
          </Typography>
        </Box>
      </Container>

      {/* Alternating story sections */}
      <Container maxWidth="lg" sx={{ pb: { xs: 4, md: 8 } }}>
        <Stack spacing={{ xs: 6, md: 10 }}>
          {STORY.map((item, i) => (
            <Box
              key={item.title}
              sx={{
                display: "flex",
                flexDirection: {
                  xs: "column",
                  md: i % 2 === 0 ? "row" : "row-reverse",
                },
                alignItems: "center",
                gap: { xs: 3, md: 6 },
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: { xs: "100%", md: "55%" },
                  aspectRatio: "4 / 3",
                  borderRadius: 4,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "0 30px 70px -34px rgba(0,0,0,0.85)",
                }}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 900px) 100vw, 55vw"
                  style={{ objectFit: "cover" }}
                />
              </Box>
              <Box sx={{ width: { xs: "100%", md: "45%" } }}>
                <Box
                  sx={{
                    width: 48,
                    height: 4,
                    borderRadius: 2,
                    mb: 2,
                    background:
                      "linear-gradient(90deg, #D9A066 0%, #8B5E3C 100%)",
                  }}
                />
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 800, mb: 1.5, color: "text.primary" }}
                >
                  {item.title}
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: "1rem", md: "1.1rem" },
                    lineHeight: 1.8,
                    color: "text.secondary",
                  }}
                >
                  {item.text}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </Container>

      {/* Closing CTA */}
      <Container maxWidth="md" sx={{ pb: { xs: 8, md: 12 } }}>
        <Box
          sx={{
            textAlign: "center",
            p: { xs: 4, md: 6 },
            borderRadius: 5,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 24px 60px -30px rgba(0,0,0,0.8)",
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 800, mb: 1.5, color: "text.primary" }}
          >
            Følg reisen
          </Typography>
          <Typography
            sx={{ color: "text.secondary", mb: 3, maxWidth: 520, mx: "auto" }}
          >
            Jeg deler glimt fra prosjekter jeg jobber med på Instagram — fra
            trebåten Klasken til møbler og skilt.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<InstagramIcon />}
            href="https://www.instagram.com/vatsii_designs/?igsh=NWw2OXl0cHZsenBq&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              px: 4.5,
              py: 1.4,
              borderRadius: 999,
              fontWeight: 700,
              textTransform: "none",
              boxShadow: "0 14px 40px rgba(139,94,60,0.55)",
            }}
          >
            Vatsii_designs
          </Button>
          <Typography
            variant="caption"
            sx={{ display: "block", mt: 4, color: "text.disabled" }}
          >
            Tekst delvis generert med AI, basert på informasjon på nett.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
