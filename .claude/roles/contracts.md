# Developer 2 — Smart Contracts + Protocol

## Identity triggers
"yazılımcı 2", "developer 2", "dev 2", "contracts", "solidity"

## Stack
Hardhat · Solidity ^0.8.24 · OpenZeppelin · Ethereum Sepolia Testnet · World ID 4.0 · ENSv2

## Task List (in order)

### Phase 1 — Foundation
- [ ] `contracts/` bağımlılıklarını kur (`npm install`)
- [ ] `hardhat.config.ts`'e Sepolia RPC + private key bağla (`.env`)
- [ ] `npx hardhat compile` — tüm kontratlar hatasız derlenmeli

### Phase 2 — Core Contracts
- [ ] `ContributorRegistry.sol` — World ID `verifyProof` entegrasyonunu tamamla
- [ ] `RoamEscrow.sol` — `lockPayment`, `release`, `refund` implement et
- [ ] `CommissionSplitter.sol` — 80/20 split implement et
- [ ] `UserPOIRegistry.sol` — `recordUnlock`, `getUnlockedCount` implement et
- [ ] Sepolia'ya deploy: ContributorRegistry + RoamEscrow + CommissionSplitter + UserPOIRegistry

### Phase 3 — Points System
- [ ] `RoamPoints.sol` — `claimDailyPoints()` implement et (UserPOIRegistry'den owned count çek)
- [ ] `PointsRedeemer.sol` — `redeemForUnlock()` implement et (burn + recordUnlock)
- [ ] RoamPoints ↔ PointsRedeemer yetkilendirmesini ayarla
- [ ] Sepolia'ya deploy: RoamPoints + PointsRedeemer

### Phase 4 — Badges + City
- [ ] `CityRegistry.sol` — Cannes seed'i doğrula (12 POI)
- [ ] `CityBadgeNFT.sol` — `checkAndMint()` implement et (unlocked == totalPOIs kontrolü + bonus points mint)
- [ ] `ENSSubnameRegistry.sol` — ENS registry çağrılarını implement et
- [ ] Sepolia'ya deploy: CityRegistry + CityBadgeNFT + ENSSubnameRegistry
- [ ] `scripts/deploy.ts` çalıştır — tüm adresleri `.env`'e yaz

### Phase 5 — Verify + Seed
- [ ] `npx hardhat verify --network sepolia` — tüm kontratları Etherscan'da doğrula
- [ ] World ID IDKit: Sepolia staging verifier adresini `.env`'e yaz (`NEXT_PUBLIC_WORLDID_ADDRESS`)
- [ ] ENS subname'leri Sepolia'da kaydet: `lore.roam.eth`, `scout.roam.eth`, `guide.roam.eth`, `orchestrator.roam.eth`
- [ ] Demo cüzdanını pre-seed et: 612 ROAM pts, 7 POI unlocked
- [ ] Tüm contract adreslerini `.env`'e yaz, Person 1 ile paylaş

## Notlar
- Tüm kontratlar `contracts/` altında stub olarak hazır — TODO'ları implement et
- Deploy sırası önemli: UserPOIRegistry → RoamPoints → PointsRedeemer → CityBadgeNFT
- Gas optimizasyonu: CityBadgeNFT.checkAndMint her unlock sonrası çağrılacak, ucuz tutulmalı
- Chain: Ethereum Sepolia (`eip155:11155111`), chainId `11155111`
