# Roam-Swarm — Developer Setup Guide

Bu rehber projeyi sıfırdan kurmak isteyen her geliştirici için yazılmıştır.  
**Dev 1 (Frontend), Dev 2 (Contracts) ve Dev 3 (Agents)** hepsinin yapması gereken ortak adımlar burada.

---

## Ön Koşullar

Bilgisayarında şunların kurulu olması gerekiyor:

| Araç | Minimum Versiyon | Kontrol |
|---|---|---|
| Node.js | v20+ | `node --version` |
| npm | v9+ | `npm --version` |
| Git | herhangi | `git --version` |
| MetaMask | tarayıcı eklentisi | — |

---

## 1. Repo'yu Klonla

```bash
git clone https://github.com/TAKIM_ADI/roamswarm-ethglobal-cannes-2026.git
cd roamswarm-ethglobal-cannes-2026
```

---

## 2. .env Dosyasını Oluştur

```bash
cp .env.example .env
```

`.env` dosyasını aç ve aşağıdaki bölümlere göre doldur.

---

## 3. API Key'leri Al

### A. MetaMask Private Key (ZORUNLU — herkes)

MetaMask'ı aç → hesap ikonuna tıkla → **Account Details** → **Show private key** → kopyala.

```env
PRIVATE_KEY=0xsenin_private_key_buraya
```

> ⚠️ Private key'ini asla kimseyle paylaşma. `.env` dosyası gitignore'dadır, GitHub'a gitmez.

---

### B. 0G Testnet Kurulumu (ZORUNLU — Agents)

0G, blockchain tabanlı AI compute ve storage altyapısı. Wallet üzerinden çalışıyor.

**Adım 1:** MetaMask'a 0G testnet ekle:
| Alan | Değer |
|---|---|
| Network Name | 0G-Galileo-Testnet |
| RPC URL | `https://evmrpc-testnet.0g.ai` |
| Chain ID | `16602` |
| Symbol | `0G` |

**Adım 2:** Faucet'ten token al:
- [https://faucet.0g.ai](https://faucet.0g.ai) → MetaMask adresini gir → token iste
- Google Cloud faucet (daha fazla token): [https://cloud.google.com/application/web3/faucet/0g/galileo](https://cloud.google.com/application/web3/faucet/0g/galileo)

**Adım 3:** 0G Compute CLI kur (PowerShell'de):
```powershell
# pnpm PATH ayarı
pnpm config set global-bin-dir "C:\Users\KULLANICI_ADIN\AppData\Local\pnpm"
$env:PATH += ";C:\Users\KULLANICI_ADIN\AppData\Local\pnpm"

# SDK kur
pnpm add @0glabs/0g-serving-broker -g
```

**Adım 4:** Network kur ve giriş yap:
```powershell
0g-compute-cli setup-network   # testnet seç
0g-compute-cli login           # private key gir
0g-compute-cli deposit --amount 5
0g-compute-cli inference list-providers   # provider address kopyala
0g-compute-cli transfer-fund --provider PROVIDER_ADDRESS --amount 1
0g-compute-cli inference get-secret --provider PROVIDER_ADDRESS
# → app-sk-XXXX çıktısını kopyala
```

**Adım 5:** `.env`'e ekle:
```env
OG_COMPUTE_API_KEY=app-sk-aldığın_token
OG_PROVIDER_ADDRESS=0x_provider_address
OG_RPC_URL=https://evmrpc-testnet.0g.ai
OG_STORAGE_INDEXER=https://indexer-storage-testnet-turbo.0g.ai
```

---

### C. ElevenLabs API Key (ZORUNLU — Guide Agent)

1. [https://elevenlabs.io](https://elevenlabs.io) → Sign Up (ücretsiz)
2. Giriş yap → sol alt profil ikonu → **API Keys**
3. **Create API Key** → tüm izinler açık olsun → kopyala

```env
ELEVENLABS_API_KEY=sk_aldığın_key
```

---

### D. Reown AppKit Project ID (ZORUNLU — Frontend)

1. [https://cloud.reown.com](https://cloud.reown.com) → Sign Up
2. **Create Project** → Web → isim ver
3. Project ID'yi kopyala

```env
NEXT_PUBLIC_REOWN_PROJECT_ID=aldığın_project_id
```

---

### E. Google Places API Key (OPSİYONEL — Scout gerçek veri için)

Key olmadan Scout fallback modda çalışır (`isOpen: null`). Demo için zorunlu değil.

1. [https://console.cloud.google.com](https://console.cloud.google.com) → yeni proje oluştur
2. **APIs & Services → Library** → **Places API (New)** → Enable
3. **APIs & Services → Credentials** → Create Credentials → API Key

```env
GOOGLE_PLACES_KEY=AIza_aldığın_key
```

---

### F. Chainlink CRE (OPSİYONEL — CRE Simulate için)

```powershell
# CLI kur (PowerShell)
irm https://cre.chain.link/install.ps1 | iex
# Yeni PowerShell aç, PATH'e ekle:
$env:PATH += ";C:\Users\KULLANICI_ADIN\AppData\Local\Programs\cre"
cre login   # tarayıcı açılır, hesap oluştur
```

---

## 4. Bağımlılıkları Kur

### Agent'lar

```bash
cd agents/orchestrator && npm install && cd ../..
cd agents/lore && npm install && cd ../..
cd agents/scout && npm install && cd ../..
cd agents/guide && npm install && cd ../..
```

### Frontend

```bash
cd apps/web && npm install
```

### Contracts

```bash
cd contracts && npm install
```

### Chainlink CRE

```bash
cd integrations/chainlink-cre && npm install
```

---

## 5. Servisleri Başlat

### Agent'lar (4 ayrı terminal — Dev 3 sorumlu)

```powershell
# Terminal 1
cd agents\lore && npm run dev
# → Lore Agent (lore.roam.eth) running on :3002

# Terminal 2
cd agents\scout && npm run dev
# → Scout Agent (scout.roam.eth) running on :3003

# Terminal 3
cd agents\guide && npm run dev
# → Guide Agent (guide.roam.eth) running on :3004

# Terminal 4
cd agents\orchestrator && npm run dev
# → Orchestrator (orchestrator.roam.eth) running on :3001
```

### Frontend (Dev 1 sorumlu)

```bash
cd apps/web && npm run dev
# → http://localhost:3000
```

### Contracts Deploy (Dev 2 sorumlu)

```bash
cd contracts
npm run compile
npm run deploy:sepolia
# Çıkan adresleri .env'e ekle
```

---

## 6. Doğrulama Testleri

### Health Check
```powershell
curl http://localhost:3001/health   # Orchestrator
curl http://localhost:3002/health   # Lore
curl http://localhost:3003/health   # Scout
curl http://localhost:3004/health   # Guide
```
Hepsi `{"status":"ok","agent":"xxx.roam.eth"}` dönmeli.

### Lore Agent (~25-45 sn)
```powershell
curl -X POST http://localhost:3002/generate -H "Content-Type: application/json" -d '{"poiId":"cannes-01","lang":"en"}'
```

### Scout Agent
```powershell
curl -X POST http://localhost:3003/recommend -H "Content-Type: application/json" -d '{"poiId":"cannes-01"}'
```

### Guide Agent
```powershell
curl -X POST http://localhost:3004/synthesize -H "Content-Type: application/json" -d '{"story":"Test.","lang":"en","poiId":"cannes-01"}'
```

### Full Pipeline — SSE Streaming
```powershell
curl -N "http://localhost:3001/orchestrate/stream?poiId=cannes-01&lang=en"
```

---

## 7. Proje Yapısı

```
roamswarm-ethglobal-cannes-2026/
├── apps/web/                   ← Next.js 14 frontend (Dev 1)
├── agents/
│   ├── orchestrator/           ← Port 3001
│   ├── lore/                   ← Port 3002 — 0G Compute LLM
│   ├── scout/                  ← Port 3003 — Chainlink CRE
│   ├── guide/                  ← Port 3004 — ElevenLabs + 0G Storage
│   ├── AGENTS.md               ← API endpoint dokümantasyonu
│   └── SETUP.md                ← Bu dosya
├── contracts/                  ← Solidity kontratlar (Dev 2)
├── integrations/chainlink-cre/ ← CRE Workflow
├── data/cannes-pois.json       ← 12 Cannes POI
└── .env.example                ← Tüm env variable'lar
```

---

## 8. Yaygın Hatalar

| Hata | Çözüm |
|---|---|
| `PRIVATE_KEY not set` | `.env`'e `PRIVATE_KEY=0x...` ekle |
| `OG_PROVIDER_ADDRESS not set` | `list-providers` ile adres al, `.env`'e ekle |
| `ElevenLabs error: 402` | API key oluştururken tüm izinleri aç |
| `insufficient funds` | Faucet'ten daha fazla 0G token al |
| `0G Compute error: 400` | `OG_PROVIDER_ADDRESS` doğru mu kontrol et |
| Port meşgul | `netstat -ano \| findstr :3001` ile hangi process olduğunu bul |

---

## 9. Önemli Linkler

| Kaynak | URL |
|---|---|
| 0G Faucet | https://faucet.0g.ai |
| 0G Compute Marketplace | https://compute-marketplace.0g.ai/inference |
| ElevenLabs | https://elevenlabs.io |
| Reown Cloud | https://cloud.reown.com |
| Chainlink CRE | https://cre.chain.link |
| World ID Developer | https://developer.worldcoin.org |
| Sepolia Faucet | https://faucets.chain.link/sepolia |
| Sepolia Explorer | https://sepolia.etherscan.io |
| Agent API Docs | `agents/AGENTS.md` |
