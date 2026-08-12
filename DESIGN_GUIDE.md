# Vatsii Designe – designguide

Denne guiden er fasiten for nye og endrede grensesnitt. Målet er et varmt,
presist og profesjonelt uttrykk som bygger på tre, håndverk og tydelig dialog.

## Visuell retning

- Mørk, rolig grunnflate med varme tretoner og jordgrønne aksenter.
- Innhold skal oppleves som arbeidsflater, ikke som en samling dekorative kort.
- Bruk luft og typografisk hierarki fremfor sterke farger og store skygger.
- Maksimal `border-radius` er 8 px. Unngå pilleform på annet enn statusmerker.
- Ingen gradientbobler, glass-effekter eller sterke standardfarger fra MUI.

## Farger

Bruk alltid theme-tokens fremfor nye heksadesimale farger:

| Formål              | Theme-token                          |
| ------------------- | ------------------------------------ |
| Sidebakgrunn        | `background.default`                 |
| Arbeidsflate        | `background.paper`                   |
| Primær handling     | `primary.main`                       |
| Varm fremheving     | `primary.light`                      |
| Kundens innhold     | `primary.dark` med lav transparens   |
| Vatsii sitt innhold | `secondary.dark` med lav transparens |
| Primær tekst        | `text.primary`                       |
| Sekundær tekst      | `text.secondary`                     |
| Linjer og skiller   | `divider`                            |

`success`, `warning`, `info` og `error` skal bare brukes for korte systemmeldinger
som krever oppmerksomhet. De skal ikke brukes som permanente innholdsflater.

## Typografi

- Sidetittel: tydelig, men aldri større enn innholdet trenger.
- Seksjonstittel: `h5` eller `h6`, vekt 700.
- Metadata og tidspunkt: `body2`, `text.secondary`.
- Etiketter: korte, konkrete og uten unødvendig versalisering.
- Håndskriftfont brukes kun i produktforhåndsvisning av navn.

## Flater og komponenter

- Én ytre arbeidsflate per forespørsel. Ikke legg kort inni kort.
- Bruk `border: 1px solid` med `divider`; skygger skal være svake.
- Handlingsknapper står nær innholdet de påvirker.
- Knapper har 8 px radius, minst 44 px høyde, vekt 700 og ingen skygge.
- `contained` brukes for primær handling, `outlined` for sekundær handling og
	`text` for lavprioriterte lenkehandlinger. Ikke overstyr knappfarger lokalt.
- Bruk ikon + tekst for viktige kommandoer. Rene ikoner skal ha tooltip.
- Standard `Alert` er reservert for feil, lagret-status og kortvarige meldinger.
- Informasjon som pris, levering og passordvalg skal ha egne theme-baserte paneler.

## Forespørselsdialog

Forespørselen vises som en samtale:

- Kunden står til venstre med produkt, antall og navneliste.
- Vatsii står til høyre med pris, leveringstid og neste handling.
- På mobil bruker begge full bredde, men beholder venstre/høyre visuell retning.
- Avsender vises eksplisitt som `Du` og `Vatsii Designe`.
- Pris og leveringstid skal kunne skannes uten å lese et tekstavsnitt.

Statusløpet er:

1. `Forespørsel` – kunden kan endre navnelisten.
2. `Tilbud` – Vatsii har sendt pris og leveringstid; kunden kan godkjenne.
3. `Godkjent tilbud` – avtalen er inngått og innholdet er låst.
4. `Levert` – Vatsii har ferdigstilt og levert ordren.

En forespørsel er uforpliktende frem til kunden aktivt velger
`Godkjenn tilbud`.

## Konto og innlogging

- Engangslenke er standard ved første forespørsel.
- Passord tilbys som et valgfritt bekvemmelighetsvalg i riktig kontekst.
- Passordpanelet skal forklare fordelen kort og lenke til kontosiden.
- Innlogging tilbyr e-post/passord, engangslenke og Google i den rekkefølgen.

## Språk

- Bruk `forespørsel` før kunden har godkjent tilbudet.
- Bruk `tilbud` om Vatsii sitt svar med pris og leveringstid.
- Bruk `ordre` først etter at kunden har godkjent tilbudet.
- Unngå tekniske ord som token, OTP og autentisering i kundetekst.
