'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { IDKitWidget, VerificationLevel, type ISuccessResult } from '@worldcoin/idkit';
import { useAppKitAccount } from '@reown/appkit/react';
import { Card, CardContent } from '@/components/ui/card';
import poisData from '../../../../data/cannes-pois.json';
import type { POI } from '@/lib/geofence';

const pois = poisData as POI[];

const LocationPickerMap = dynamic(() => import('@/components/LocationPickerMap'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full rounded-2xl flex items-center justify-center"
      style={{ height: 180, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      <div className="w-5 h-5 border-2 border-purple-500/40 border-t-purple-500 rounded-full animate-spin" />
    </div>
  ),
});

/* ─── Types ─── */
type Step = 'verify' | 'form' | 'submitting' | 'success' | 'error';

interface ContributionForm {
  lat: string;
  lng: string;
  name: string;
  story: string;
  tip: string;
}

/* ─── Ambient background ─── */
function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0F] via-[#1a1a2e] to-[#0A0A0F]" />
      <div
        className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-10 blur-[100px]"
        style={{ background: '#a855f7', animation: 'pulse 5s ease-in-out infinite' }}
      />
      <div
        className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full opacity-10 blur-[100px]"
        style={{ background: '#3b82f6', animation: 'pulse 5s ease-in-out infinite', animationDelay: '2.5s' }}
      />
    </div>
  );
}

/* ─── Step indicator ─── */
function StepDots({ step }: { step: Step }) {
  const steps: Step[] = ['verify', 'form', 'submitting'];
  const activeIdx = steps.indexOf(step === 'success' || step === 'error' ? 'submitting' : step);

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{
              background: i <= activeIdx ? '#a855f7' : 'rgba(255,255,255,0.15)',
              transform: i === activeIdx ? 'scale(1.4)' : 'scale(1)',
            }}
          />
          {i < steps.length - 1 && (
            <div
              className="h-px w-8 transition-all duration-500"
              style={{ background: i < activeIdx ? '#a855f7' : 'rgba(255,255,255,0.1)' }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Form field ─── */
function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  multiline = false,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  multiline?: boolean;
  required?: boolean;
}) {
  const sharedClass =
    'w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/60 focus:bg-white/8 transition-all duration-200';

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-400 flex items-center gap-1">
        {label}
        {required && <span className="text-purple-400">*</span>}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className={`${sharedClass} resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={sharedClass}
        />
      )}
    </div>
  );
}

/* ─── Main page ─── */
function ContributeContent() {
  const router = useRouter();
  const { address } = useAppKitAccount();

  const [step, setStep] = useState<Step>('verify');
  const [worldIdProof, setWorldIdProof] = useState<ISuccessResult | null>(null);
  const [ensName, setEnsName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const searchParams = useSearchParams();

  const [form, setForm] = useState<ContributionForm>({
    lat: searchParams.get('lat') ?? '',
    lng: searchParams.get('lng') ?? '',
    name: searchParams.get('name') ?? '',
    story: '',
    tip: '',
  });

  // If query params arrive after hydration, sync once
  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const name = searchParams.get('name');
    if (lat || lng || name) {
      setForm(f => ({
        ...f,
        lat: lat ?? f.lat,
        lng: lng ?? f.lng,
        name: name ?? f.name,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (key: keyof ContributionForm) => (value: string) =>
    setForm(f => ({ ...f, [key]: value }));

  /* ── World ID verified ── */
  const onWorldIdSuccess = (result: ISuccessResult) => {
    setWorldIdProof(result);
    setStep('form');
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.lat || !form.lng || !form.story) return;

    setStep('submitting');
    setErrorMsg(null);

    try {
      // TODO: call ContributorRegistry.register() with form + worldIdProof on Ethereum Mainnet
      // Stub: simulate a 1.5s tx
      await new Promise(r => setTimeout(r, 1500));

      // Mock ENS subname assignment
      const stub = form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setEnsName(`${stub}.contributors.roam.eth`);
      setStep('success');
    } catch {
      setErrorMsg('Transaction failed. Please try again.');
      setStep('error');
    }
  };

  const appId = (process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID ?? 'app_staging_placeholder') as `app_${string}`;

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AmbientBackground />

      <div className="relative z-10 w-full max-w-md mx-auto px-4 pt-6 pb-10">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors mb-5 active:scale-95"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-black text-white tracking-tight">Contribute a POI</h1>
          <p className="text-sm text-gray-400 mt-1">
            Share a hidden gem with the Roam community.
          </p>
        </motion.div>

        <StepDots step={step} />

        {/* ── STEP 1: World ID Verification ── */}
        <AnimatePresence mode="wait">
          {step === 'verify' && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
            >
              <Card
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
              >
                <CardContent className="p-6 space-y-5">
                  {/* World ID badge */}
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl"
                      style={{ background: 'linear-gradient(135deg, #1a1a2e, #0d0d1a)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      🌍
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">Verify with World ID</h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        One unique human, one contribution. Orb-level verification required.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs text-gray-500">
                    {[
                      'Proof of unique humanity via World ID 4.0',
                      'Your wallet address stays private',
                      'Verification is stored on-chain via Semaphore',
                    ].map(item => (
                      <div key={item} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <IDKitWidget
                    app_id={appId}
                    action="contribute-poi"
                    signal={address ?? 'anonymous'}
                    verification_level={VerificationLevel.Orb}
                    onSuccess={onWorldIdSuccess}
                  >
                    {({ open }: { open: () => void }) => (
                      <button
                        onClick={open}
                        className="w-full min-h-[52px] rounded-2xl font-bold text-sm transition-all duration-200 hover:brightness-110 active:scale-95 flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)', color: '#fff' }}
                      >
                        <span className="text-lg">🌐</span>
                        Verify with World ID
                      </button>
                    )}
                  </IDKitWidget>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── STEP 2: Contribution Form ── */}
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
            >
              <Card
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
              >
                <CardContent className="p-6">
                  {/* Verified badge */}
                  <div
                    className="flex items-center gap-2 text-xs text-green-400 mb-5 px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}
                  >
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>Identity verified via World ID</span>
                    {worldIdProof && (
                      <span className="ml-auto text-gray-600 font-mono text-[10px] truncate max-w-[80px]">
                        {worldIdProof.nullifier_hash.slice(0, 10)}…
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <LocationPickerMap
                      lat={form.lat}
                      lng={form.lng}
                      onChange={(lat, lng) => setForm(f => ({ ...f, lat, lng }))}
                      onPoiSelect={(lat, lng, name) => setForm(f => ({ ...f, lat, lng, name }))}
                      pois={pois}
                    />

                    <Field
                      label="Place Name"
                      value={form.name}
                      onChange={setField('name')}
                      placeholder="e.g. Secret rooftop bar"
                      required
                    />

                    <Field
                      label="Story"
                      value={form.story}
                      onChange={setField('story')}
                      placeholder="Tell explorers what makes this place special…"
                      multiline
                      required
                    />

                    <Field
                      label="Insider Tip (optional)"
                      value={form.tip}
                      onChange={setField('tip')}
                      placeholder="Best time to visit, what to order, etc."
                    />

                    <button
                      type="submit"
                      disabled={!form.name || !form.lat || !form.lng || !form.story}
                      className="w-full min-h-[52px] rounded-2xl font-bold text-sm transition-all duration-200 hover:brightness-110 active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2 mt-2"
                      style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)', color: '#fff' }}
                    >
                      <Send className="w-4 h-4" />
                      Submit Contribution
                    </button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── STEP 3: Submitting ── */}
          {step === 'submitting' && (
            <motion.div
              key="submitting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center py-16 gap-6"
            >
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl"
                style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(124,58,237,0.2))', border: '1px solid rgba(168,85,247,0.3)' }}
              >
                <span className="animate-spin inline-block w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-white">Submitting on-chain…</h2>
                <p className="text-sm text-gray-400 mt-1">Registering your contribution to ContributorRegistry</p>
              </div>
            </motion.div>
          )}

          {/* ── SUCCESS ── */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, type: 'spring', damping: 18 }}
            >
              <Card
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
              >
                <CardContent className="p-6 text-center space-y-5">
                  <div
                    className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-4xl"
                    style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(59,130,246,0.3))', border: '1px solid rgba(168,85,247,0.4)' }}
                  >
                    🎉
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-white">Contribution Submitted!</h2>
                    <p className="text-sm text-gray-400 mt-2">
                      Your POI has been registered on Ethereum Mainnet and will be reviewed by the Roam Swarm.
                    </p>
                  </div>

                  {ensName && (
                    <div
                      className="rounded-2xl p-4 text-left"
                      style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)' }}
                    >
                      <p className="text-xs text-gray-400 mb-1">Your contributor ENS subname</p>
                      <p className="text-sm font-mono text-purple-300 break-all">{ensName}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      onClick={() => router.push('/map')}
                      className="w-full min-h-[48px] rounded-2xl font-bold text-sm transition-all duration-200 hover:brightness-110 active:scale-95 flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)', color: '#fff' }}
                    >
                      <MapPin className="w-4 h-4" />
                      Explore the Map
                    </button>
                    <button
                      onClick={() => {
                        setStep('verify');
                        setForm({ lat: '', lng: '', name: '', story: '', tip: '' });
                        setWorldIdProof(null);
                        setEnsName(null);
                      }}
                      className="w-full min-h-[48px] rounded-2xl font-medium text-sm text-gray-400 hover:text-white transition-colors"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      Submit another POI
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── ERROR ── */}
          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
            >
              <Card
                className="bg-black/40 backdrop-blur-xl border border-red-500/20 rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
              >
                <CardContent className="p-6 text-center space-y-4">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
                  <div>
                    <h2 className="text-base font-bold text-white">Something went wrong</h2>
                    {errorMsg && <p className="text-sm text-red-400 mt-1">{errorMsg}</p>}
                  </div>
                  <button
                    onClick={() => setStep('form')}
                    className="w-full min-h-[48px] rounded-2xl font-bold text-sm text-white transition-all active:scale-95"
                    style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)' }}
                  >
                    Try Again
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function ContributePage() {
  return (
    <Suspense>
      <ContributeContent />
    </Suspense>
  );
}
