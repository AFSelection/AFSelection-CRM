# AF Select CRM

Private back-office for [AF Select](https://fidalgoselect.com), a marketplace of high-end cars and properties. The client publishes, edits and prices every listing from here, and the public site ([AFSelection](https://github.com/AFSelection/AFSelection)) reads the same Supabase data.

## What it does

- **Listings manager.** Create, edit and remove listings with photo upload, ordering and deletion.
- **Sections with their own fields.** Each catalog section (cars, properties, investments…) chooses which fields its listings have, from a catalog of typed fields: text, number or select, such as brand, year, mileage, fuel, transmission or operation type. Each field can be marked as required. A new kind of listing needs no code change.
- **Hero manager.** Controls the public site's main banner.
- **Leads inbox.** Enquiries, sell requests and contact messages from the site, in one place.
- **Dashboard.** Catalog counts and total valuation split by currency (USD and ARS), formatted for es-AR.

## Photo uploads that stay small

`src/utils/compressor.js` resizes and compresses every photo in the browser before upload, to a maximum of 1600 px and 400 KB. It never assumes the output format: some browsers can't encode WebP from a canvas and silently return a full-size PNG instead. The compressor checks the blob it gets back and retries as JPEG when that happens. This replaced an earlier version that had filled storage with multi-megabyte PNGs named `.webp`.

## Stack

React 18, JavaScript, Vite, Tailwind CSS v4, Supabase (Postgres, Auth, Storage), Cloudinary, Leaflet.

## Running it

```bash
npm install
npm run dev      # http://localhost:3001
npm run build
```

Supabase and Cloudinary access is configured in `src/services/`.

## Project structure

```
src/
  components/   DashboardView, ListingsManagerView, SectionsManagerView, SectionFieldsModal,
                HeroManagerView, LeadsManagerView, Login, Sidebar
  services/     Supabase, Storage and Cloudinary clients
  utils/        Image compression, field specs, CDN warm-up
```

---

Designed and built by [Giuliana Di Rocco](https://dev.giulianadirocco.com).
