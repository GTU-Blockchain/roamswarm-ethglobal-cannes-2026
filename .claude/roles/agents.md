# Developer 3 — Agent Swarm + Backend

## Identity triggers
"yazılımcı 3", "developer 3", "dev 3", "agents", "backend"

## Stack
OpenClaw · 0G Compute · 0G Storage · ElevenLabs TTS · Chainlink CRE · Express.js · TypeScript

## Task List (in order)

### Phase 1 — Foundation
- [ ] 0G testnet hesabı aç, `OG_COMPUTE_API_KEY` + `OG_STORAGE_API_KEY` al
- [ ] `agents/orchestrator/` bağımlılıklarını kur, `npm run dev` ile ayağa kaldır
- [ ] OpenClaw framework kurulumunu doğrula

### Phase 2 — Lore Agent
- [ ] `agents/lore/src/index.ts` — 0G Compute API çağrısını implement et
- [ ] POI ID'ye göre prompt oluştur: "Tell the history of [POI name] in [lang]..."
- [ ] `data/cannes-pois.json`'dan POI bilgilerini yükle
- [ ] ERC-8004 identity kaydı: `lore.roam.eth`
- [ ] Test: `POST /generate { poiId: "cannes-01", lang: "en" }` → story string dönmeli

### Phase 3 — Scout Agent + CRE Workflow
- [ ] `integrations/chainlink-cre/workflow.ts` — CRE Workflow'u deploy et
- [ ] Google Places confidential HTTP adımını yapılandır (`GOOGLE_PLACES_KEY` CRE secret olarak)
- [ ] On-chain write: `SCOUT_CONTRACT.updateVenueStatus`
- [ ] `agents/scout/src/index.ts` — CRE sonucunu oku, venue response'u dön
- [ ] `cre simulate` çıktısını kaydet (Chainlink prize için gerekli)
- [ ] ERC-8004 identity kaydı: `scout.roam.eth`
- [ ] Test: `POST /recommend { poiId: "cannes-01" }` → `{ name, isOpen, note }` dönmeli

### Phase 4 — Guide Agent
- [ ] `agents/guide/src/index.ts` — ElevenLabs TTS API çağrısını implement et
- [ ] Üretilen audio buffer'ı 0G Storage'a yükle
- [ ] Stream URL'i dön
- [ ] ERC-8004 identity kaydı: `guide.roam.eth`
- [ ] Test: `POST /synthesize { story: "...", lang: "en" }` → `{ audioUrl }` dönmeli

### Phase 5 — Orchestrator + API
- [ ] `agents/orchestrator/src/index.ts` — lore, scout, guide'ı paralel çağır
- [ ] Sonucu 0G Storage'a yaz: `sessions/{userId}/{poiId}`
- [ ] ERC-8004 identity kaydı: `orchestrator.roam.eth`
- [ ] `apps/web/app/api/experience/[id]/route.ts` — orchestrator'ı çağır, response dön
- [ ] End-to-end test: frontend → API → orchestrator → 3 agent → audio stream

### Phase 6 — Polish
- [ ] 12 Cannes POI'si için story + venue verisi hazırla (en azından POI #1 için tam veri)
- [ ] 0G latency ölç — 5 saniye üzerindeyse loading state ekle
- [ ] Tüm agent endpoint'lerini dökümante et (Person 1 için)

## Notlar
- Chainlink CRE Workflow `integrations/chainlink-cre/` altında, `agents/` altında değil
- `cre simulate` logu submission için şart — kaydet
- ElevenLabs ücretsiz tier yeterli (demo için)
- 0G latency yüksekse OpenClaw local mode kullan, Storage entegrasyonunu koru
