# CertifyROI Site

A Next.js frontend for displaying CertifyROI market intelligence data.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase keys
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key

## Deployment

### Vercel

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

### Manual

```bash
npm run build
npm start
```

## Data Source

This site reads salary data from a Supabase database that's populated by a Python scraper running locally.