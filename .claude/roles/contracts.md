# Developer 2 — Smart Contracts + Protocol

## Identity triggers
"yazılımcı 2", "developer 2", "dev 2", "contracts", "solidity"

## Stack
Hardhat · Solidity ^0.8.28 · OpenZeppelin · Ethereum Sepolia Testnet · World ID 4.0 · ENSv2

## Task List (in order)

### Phase 1 — Foundation
- [x] `contracts/` bağımlılıklarını kur (`npm install`)
- [x] `hardhat.config.ts`'e Sepolia RPC + private key bağla (`.env`)
- [x] `npx hardhat compile` — tüm kontratlar hatasız derlenmeli

### Phase 2 — Core Contracts
- [x] `ContributorRegistry.sol` — World ID `verifyProof` entegrasyonunu tamamla
- [x] `RoamEscrow.sol` — `lockPayment`, `release`, `refund` implement et
- [x] `CommissionSplitter.sol` — 80/20 split implement et
- [x] `UserPOIRegistry.sol` — `recordUnlock`, `getUnlockedCount` implement et
- [x] Sepolia'ya deploy: ContributorRegistry + RoamEscrow + CommissionSplitter + UserPOIRegistry

### Phase 3 — Points System
- [x] `RoamPoints.sol` — `claimDailyPoints()` implement et (UserPOIRegistry'den owned count çek)
- [x] `PointsRedeemer.sol` — `redeemForUnlock()` implement et (burn + recordUnlock)
- [x] RoamPoints ↔ PointsRedeemer yetkilendirmesini ayarla
- [x] Sepolia'ya deploy: RoamPoints + PointsRedeemer

### Phase 4 — Badges + City
- [x] `CityRegistry.sol` — Cannes seed'i doğrula (12 POI)
- [x] `CityBadgeNFT.sol` — `checkAndMint()` implement et (unlocked == totalPOIs kontrolü + bonus points mint)
- [x] `ENSSubnameRegistry.sol` — ENS registry çağrılarını implement et
- [x] Sepolia'ya deploy: CityRegistry + CityBadgeNFT + ENSSubnameRegistry
- [x] `scripts/deploy.ts` çalıştır — tüm adresleri `.env`'e yaz

### Phase 5 — Verify + Seed
- [x] `npx hardhat verify --network sepolia` — tüm kontratları Etherscan'da doğrula (`scripts/verify-all.ts`)
- [x] World ID IDKit: Sepolia staging verifier adresini `.env`'e yaz (`NEXT_PUBLIC_WORLDID_ADDRESS=0x469449f251692e0779667583026b5a1e99512157`)
- [ ] ENS subname'leri Sepolia'da kaydet: `lore.roamswarm.eth`, `scout.roamswarm.eth`, `guide.roamswarm.eth`, `orchestrator.roamswarm.eth` *(manuel — ENS App üzerinden)*
- [x] Demo cüzdanını pre-seed et: 612 ROAM pts, 7 POI unlocked (`scripts/seed-demo-wallet.ts`)
- [x] Tüm contract adreslerini `.env`'e yaz, Person 1 ile paylaş

## Notlar
- Tüm kontratlar `contracts/` altında stub olarak hazır — TODO'ları implement et
- Deploy sırası önemli: UserPOIRegistry → RoamPoints → PointsRedeemer → CityBadgeNFT
- Gas optimizasyonu: CityBadgeNFT.checkAndMint her unlock sonrası çağrılacak, ucuz tutulmalı
- Chain: Ethereum Sepolia (`eip155:11155111`), chainId `11155111`
