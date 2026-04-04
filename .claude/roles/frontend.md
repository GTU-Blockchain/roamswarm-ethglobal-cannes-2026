# Developer 1 — Frontend + UX

## Identity triggers
"yazılımcı 1", "developer 1", "dev 1", "frontend", "frontcu"

## Stack
Next.js 14 (App Router) · Tailwind CSS · TypeScript · Reown AppKit · Leaflet.js · 21st.dev Magic MCP

## Task List (in order)

### Phase 1 — Foundation
- [x] `apps/web/` bağımlılıklarını kur (`npm install`)
- [x] `apps/web/app/layout.tsx` — WalletProvider'ı sar, Inter font, dark background
- [x] `apps/web/app/globals.css` — Tailwind direktifleri + glassmorphism CSS değişkenleri
- [x] Reown AppKit'i `.env`'deki `NEXT_PUBLIC_REOWN_PROJECT_ID` ile bağla
- [x] `apps/web/app/page.tsx` — Landing: hero, connect butonu, feature kartları

### Phase 2 — Map + Geofence
- [x] `components/MapView.tsx` — Leaflet dark tile, Cannes merkezi, POI marker'ları (3 state)
- [x] `components/GeofenceWatcher.tsx` — watchPosition + haversine, 50m tetik
- [x] `apps/web/app/map/page.tsx` — MapView'i dynamic import (no SSR) ile sar
- [x] `components/UnlockModal.tsx` — Pay USDC / Redeem Points seçimi, glassmorphism

### Phase 3 — Payment + Experience
- [x] `components/PaymentGate.tsx` — x402 header inşası, tx status gösterimi
- [x] `apps/web/app/experience/[id]/page.tsx` — `/api/experience/[id]` fetch, loading state
- [x] `components/AudioPlayer.tsx` — 0G Storage stream, play/pause, waveform

### Phase 4 — Points + Gamification
- [x] `components/PointsBalance.tsx` — bakiye, günlük kazanım, "Free Unlock Available" state
- [x] `apps/web/app/profile/page.tsx` — cüzdan, points widget, owned POI listesi, badge galerisi
- [x] `components/CityProgress.tsx` — SVG progress ring, animasyonlu dolum
- [x] `components/BadgeCard.tsx` — holografik shimmer, city artwork, completion date

### Phase 5 — City + Polish
- [x] `apps/web/app/city/[id]/page.tsx` — progress ring, POI listesi, badge CTA
- [x] `apps/web/app/contribute/page.tsx` — World ID IDKit widget, form, submit
- [x] Tüm sayfalarda mobile (375px) test — overflow yok, tap target min 44px
- [x] `apps/web/public/manifest.json` — PWA manifest, ikonlar
- [ ] Vercel deploy + prod URL

### Phase 6 — Contribution Flow (eklendi)
- [x] Map popup'a "Suggest edit / contribute" butonu — POI lat/lng/name ile contribute sayfasına yönlendir
- [x] `contribute/page.tsx` — URL query params ile form pre-fill (lat, lng, name)
- [x] `components/LocationPickerMap.tsx` — Leaflet mini harita, draggable pin, tüm POI'lar görünür, POI'a tıklayınca place name otomatik dolar

## Notlar
- Tüm componentler **21st.dev Magic MCP** ile üretilmeli — `/ui` komutuyla
- `lib/` dosyaları (geofence, x402, points, badges, agents, ens) zaten stub olarak hazır — implement etme, kullan
- Responsive zorunlu: her component 375px'te çalışmalı
- Contract adresleri `.env`'den gelecek — Person 2 deploy edince doldurulacak
