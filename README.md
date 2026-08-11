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

I produksjon kjøres ventende migreringer med:

```bash
npm run db:deploy
```

### Baseline av eksisterende database

Den initiale migreringen beskriver tabellene som allerede finnes i Supabase.
Kontroller først at kolonner og typer samsvarer med `prisma/schema.prisma`, og
merk deretter migreringen som allerede utført uten å kjøre SQL-en:

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
