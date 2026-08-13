# Vatsii Designe

Next.js-applikasjon med Prisma som Code First ORM mot PostgreSQL i Supabase.
Supabase brukes fortsatt til autentisering og Storage.

## Kom i gang

Kopier verdiene fra `.env.example` til `.env.local`. `DATABASE_URL` finner du
under databaseinnstillingene i Supabase.

```bash
npm install
npm run dev
```

Åpne [http://localhost:3500](http://localhost:3500).

### Lokal visuell testing uten database

For å vise bordkortskjemaet med testprodukter uten databasepassord, legg dette
i `.env.local` og start utviklingsserveren på nytt:

```env
USE_MOCK_DATA="true"
NEXT_PUBLIC_USE_MOCK_DATA="true"
```

Mockdata er deaktivert i produksjon selv om variabelen skulle bli satt der.
`USE_MOCK_DATA` viser testprodukter i bordkortskjemaet, mens
`NEXT_PUBLIC_USE_MOCK_DATA` viser testforespørsler på `/bestillinger` uten
innlogging. Skjema og responsivt design kan testes lokalt, men lagring og
innsending krever fortsatt en konfigurert database og Supabase.

## E-postvarsler

Forespørsler bruker [Resend](https://resend.com) til å varsle eier og sende
prisestimat til kunden. Legg disse variablene i `.env.local` og i Vercel:

```env
RESEND_API_KEY=re_...
ORDER_NOTIFICATION_EMAIL=din-epost@eksempel.no
ORDER_EMAIL_FROM=Vatsii Designe <foresporsel@ditt-verifiserte-domene.no>
```

`ORDER_EMAIL_FROM` må bruke et domene som er verifisert i Resend. En
forespørsel lagres selv om e-posttjenesten midlertidig er utilgjengelig.

## Passordfri innlogging

Kunder kan sende forespørsel uten konto. Supabase sender deretter en sekssifret
kode som kunden bruker til å bekrefte e-postadressen på `/bestillinger`. Legg
inn produksjonsadressen under **Supabase → Authentication → URL Configuration
→ Redirect URLs**, for eksempel:

```text
https://vatsii-designe.no/bestillinger
http://localhost:3500/bestillinger
```

Aktiver deretter **Supabase → Authentication → Email → Custom SMTP** med
Resend-kontoen:

```text
Host: smtp.resend.com
Port: 587
Username: resend
Password: RESEND_API_KEY
Sender email: foresporsel@vatsii-designe.no
Sender name: Vatsii Designe
```

SMTP-passordet er den samme hemmelige Resend API-nøkkelen som brukes i Vercel.
Avsenderdomenet må være verifisert i Resend med SPF og DKIM. Bruk samme
Vatsii-avsender konsekvent for å gjøre e-postene gjenkjennelige.

### E-postmaler i Supabase

Hosted Supabase leser ikke malene fra repoet automatisk. Åpne **Supabase →
Authentication → Email Templates** og lim inn følgende:

| Supabase-mal         | Emne                                           | HTML-fil                                   |
| -------------------- | ---------------------------------------------- | ------------------------------------------ |
| Confirm sign up      | `Din bekreftelseskode fra Vatsii Designe`      | `supabase/templates/confirmation.html`     |
| Invite user          | `Du er invitert til Vatsii Designe`            | `supabase/templates/invite.html`           |
| Magic link or OTP    | `Din innloggingskode fra Vatsii Designe`       | `supabase/templates/magic-link.html`       |
| Change email address | `Bekreft ny e-postadresse hos Vatsii Designe`  | `supabase/templates/change-email.html`     |
| Reset password       | `Din kode for nytt passord fra Vatsii Designe` | `supabase/templates/recovery.html`         |
| Reauthentication     | `Din sikkerhetskode fra Vatsii Designe`        | `supabase/templates/reauthentication.html` |

Confirm sign up, Magic link or OTP, Reset password og Reauthentication bruker
`{{ .Token }}`. Invite user og Change email address bruker
`{{ .ConfirmationURL }}`, siden appen ikke har egne kodefelt for disse to
sjeldne flytene.

## Database og migreringer

`prisma/schema.prisma` er kilden til databasestrukturen. Etter en schemaendring
opprettes og kjøres en lokal migrering med:

```bash
npm run db:migrate -- --name beskriv_endringen
```

Vercel kjører automatisk en sikker baseline og ventende migreringer før
`next build`. Manuelt kan den samme flyten kjøres med:

```bash
npm run db:deploy
```

### Baseline av eksisterende database

Deploy-scriptet registrerer automatisk initialmigreringen når alle de fire
eksisterende tabellene finnes og Prisma-historikken mangler. En tom database
opprettes normalt, mens en delvis initialisert database stopper deployen.
Kontroller at legacy-tabellene samsvarer med `prisma/schema.prisma`.

Alternativt kan migreringen merkes manuelt som allerede utført:

```bash
npx prisma migrate resolve --applied 20260811000000_init
```

Dette gjøres én gang per eksisterende database. For en tom database brukes
`npm run db:deploy`, som oppretter tabellene fra migreringen.

Nyttige kommandoer:

```bash
npm run db:generate
npm run db:studio
```
