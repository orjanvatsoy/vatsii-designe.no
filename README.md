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

Åpne [http://localhost:3000](http://localhost:3000).

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
