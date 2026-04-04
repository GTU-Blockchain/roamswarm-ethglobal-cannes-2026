"use client";

import React, { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Menu, X, Zap, Shield, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@/components/ConnectButton";

function RoamSwarmLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [mobileMenuOpen]);

  const features = [
    {
      icon: Zap,
      title: "AI Agent Swarm",
      description: "Lore, Scout & Guide agents activate the moment you step within 50m of a landmark.",
    },
    {
      icon: Shield,
      title: "x402 Pay-Per-Use",
      description: "0.5 USDC per experience. No subscription, no lock-in. Pay only when you explore.",
    },
    {
      icon: Users,
      title: "ROAM Points",
      description: "Earn +10 points daily per owned POI. Reach 500 to unlock experiences for free.",
    },
    {
      icon: TrendingUp,
      title: "City Badges",
      description: "Collect all 12 Cannes POIs and mint your CityBadgeNFT on Ethereum Sepolia.",
    },
  ];

  const stats = [
    { value: "12", label: "Cannes POIs" },
    { value: "4", label: "AI Agents" },
    { value: "0.5", label: "USDC / unlock" },
    { value: "500", label: "ROAM = free" },
  ];

  return (
    <div
      className="min-h-screen w-full bg-[#0A0A0F] text-white font-sans antialiased overflow-x-hidden"
      style={{ minWidth: "375px" }}
    >
      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0F] via-[#1a1a2e] to-[#0A0A0F]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#F5A623] rounded-full opacity-10 blur-[120px] animate-pulse-glow" style={{ animationDelay: "0s" }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#F5A623] rounded-full opacity-10 blur-[120px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(245,166,35,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(245,166,35,0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 glass-morphism">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#F5A623] to-[#ffd700] flex items-center justify-center shadow-lg shadow-[#F5A623]/20">
                <Zap className="w-4 h-4 text-[#0A0A0F]" />
              </div>
              <span className="text-base font-bold tracking-tight">RoamSwarm</span>
            </div>

            <div className="hidden md:flex items-center gap-5">
              <Link href="/map" className="text-sm text-white/60 hover:text-white transition-colors">Map</Link>
              <Link href="/profile" className="text-sm text-white/60 hover:text-white transition-colors">Profile</Link>
              {<ConnectButton />}
            </div>

            <button
              className="md:hidden p-2 rounded-lg glass-morphism min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden glass-morphism border-t border-white/10"
          >
            <div className="px-4 py-5 space-y-3">
              <Link href="/map" className="block text-sm text-white/70 hover:text-white transition-colors py-2 min-h-[44px] flex items-center" onClick={() => setMobileMenuOpen(false)}>Map</Link>
              <Link href="/profile" className="block text-sm text-white/70 hover:text-white transition-colors py-2 min-h-[44px] flex items-center" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
              <div className="pt-1">{<ConnectButton />}</div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ── HERO ── */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative z-10 min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16"
      >
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 glass-morphism rounded-full px-3 py-1.5 mb-7">
              <div className="w-1.5 h-1.5 rounded-full bg-[#F5A623] animate-pulse" />
              <span className="text-xs uppercase tracking-wider text-white/70 font-semibold">ETHGlobal Cannes 2026</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-5 leading-[1.1]"
          >
            Cities alive through
            <br />
            <span className="text-gradient-gold">stories</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-base sm:text-lg text-white/60 mb-9 max-w-2xl mx-auto leading-relaxed"
          >
            Step within 50 metres of a Cannes landmark and an AI swarm springs to life —
            narrating history, recommending venues, streaming your personalised audio guide.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              href="/map"
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-[#F5A623] to-[#ffd700] text-[#0A0A0F] rounded-xl font-semibold text-sm shadow-lg shadow-[#F5A623]/30 hover:shadow-[#F5A623]/50 hover:scale-105 transform transition-all duration-300 min-h-[44px] flex items-center justify-center"
            >
              Explore Map
            </Link>
            <div className="w-full sm:w-auto flex justify-center">
              {<ConnectButton />}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ── STATS ── */}
      <section className="relative z-10 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass-morphism rounded-2xl p-6 sm:p-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl sm:text-4xl font-bold text-gradient-gold mb-1">{stat.value}</div>
                  <div className="text-xs text-white/50">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Built for <span className="text-gradient-gold">exploration</span>
            </h2>
            <p className="text-sm text-white/50 max-w-sm mx-auto">
              AI agents, crypto payments, and gamified discovery — all in your pocket.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-morphism rounded-2xl p-6 hover:bg-white/5 hover:border-white/20 hover:scale-[1.02] transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5A623]/20 to-[#F5A623]/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-[#F5A623]" />
                </div>
                <h3 className="text-base font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="glass-morphism rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#F5A623]/10 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to <span className="text-gradient-gold">roam</span>?
              </h2>
              <p className="text-sm text-white/60 mb-8 max-w-md mx-auto leading-relaxed">
                Connect your wallet and start exploring Cannes. Your first story is one step away.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/map"
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-[#F5A623] to-[#ffd700] text-[#0A0A0F] rounded-xl font-semibold text-sm shadow-lg shadow-[#F5A623]/30 hover:shadow-[#F5A623]/50 hover:scale-105 transform transition-all duration-300 min-h-[44px] flex items-center justify-center"
                >
                  Open Map
                </Link>
                {<ConnectButton />}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#F5A623] to-[#ffd700] flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#0A0A0F]" />
            </div>
            <span className="text-base font-bold">RoamSwarm</span>
          </div>
          <div className="text-xs text-white/30 text-center">
            World ID · 0G · Chainlink CRE · ENS · x402 · ETHGlobal Cannes 2026
          </div>
          <div className="text-xs text-white/30">© 2026 RoamSwarm</div>
        </div>
      </footer>
    </div>
  );
}

export default function RoamSwarmPage() {
  return <RoamSwarmLanding />;
}
