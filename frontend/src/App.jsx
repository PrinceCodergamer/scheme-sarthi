import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { ArrowLeft, ArrowRight, Bell, Check, ChevronRight, ClipboardCheck, Search, ShieldCheck, Sparkles, Home } from "lucide-react";
import { useApp } from './store/appStore';
import AICopilot from './components/AICopilot';

const labels = {
  en: { home: "Home", schemes: "Schemes", applications: "Applications", reminders: "Reminders", getStarted: "Get started", demo: "Try demo profile", privacy: "Your data stays with you" },
  hi: { home: "होम", schemes: "योजनाएं", applications: "आवेदन", reminders: "रिमाइंडर", getStarted: "शुरू करें", demo: "डेमो प्रोफ़ाइल", privacy: "आपका डेटा आपके पास रहता है" },
};

function normalizeScheme(item) {
  const statusMap = { lapsed: "Lapsed", at_risk: "At risk", eligible_unclaimed: "Eligible", not_eligible: "Not eligible" };
  return {
    id: item.scheme_id || item.id,
    name: item.name_en || item.name,
    status: statusMap[item.status] || item.status || "Unknown",
    value: item.benefit_amount || item.value || "",
    category: item.category || "Scheme",
    context: item.reason_en || item.context || "",
    detail: item.consequence_en || item.reason_en || item.detail || "",
    recovery: item.recovery,
    matched_rules: item.matched_rules,
    confidence: item.confidence_score,
  };
}

function flattenResults(scanResults) {
  if (!scanResults?.results) return [];
  const flat = [];
  for (const cat of ["lapsed", "at_risk", "eligible_unclaimed"]) {
    for (const item of (scanResults.results[cat] || [])) {
      flat.push(normalizeScheme({ ...item, status: cat }));
    }
  }
  return flat;
}

export default function App() {
  const store = useApp();
  const [page, setPage] = useState("welcome");
  const [lang, setLang] = useState("en");
  const [localProfile, setLocalProfile] = useState({ name: "Mohan", age: 62, occupation: "farmer", state: "Uttar Pradesh", district: "Varanasi" });
  const [flipped, setFlipped] = useState("");
  const [step, setStep] = useState(0);
  const [explain, setExplain] = useState(false);
  const [notice, setNotice] = useState("");
  const [scanningDone, setScanningDone] = useState(false);
  const reduced = useReducedMotion();
  const t = labels[lang];

  const go = (next) => { setPage(next); window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }); };
  const toast = (text) => { setNotice(text); setTimeout(() => setNotice(""), 2500); };

  const handleDemo = async () => {
    try {
      await store.loadDemoProfile();
      go("scanning");
    } catch (e) {
      toast("Demo profile failed, trying offline mode");
      go("scanning");
    }
  };

  const schemes = flattenResults(store.scanResults);
  const totalBenefit = store.scanResults?.total_benefit || 11000;
  const estimatedTime = store.scanResults?.estimated_time_minutes || 15;
  const lapsedCount = store.scanResults?.results?.lapsed?.length || 0;
  const atRiskCount = store.scanResults?.results?.at_risk?.length || 0;
  const eligibleCount = store.scanResults?.results?.eligible_unclaimed?.length || 0;
  const totalSchemes = lapsedCount + atRiskCount + eligibleCount;

  return (
    <main className="min-h-screen bg-[#e9efeb] font-['Hind'] text-[#17372a]">
      <div className="mx-auto min-h-screen max-w-[480px] overflow-hidden bg-[#f8faf8] shadow-[0_0_70px_rgba(22,67,46,.15)]">
        <Header page={page} lang={lang} setLang={setLang} go={go} />
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: reduced ? 0 : 0.25 }}
          >
            {page === "welcome" && <Welcome go={go} t={t} onDemo={handleDemo} />}
            {page === "aadhaar" && <Aadhaar go={go} />}
            {page === "aadhaar_followup" && <Followup go={go} />}
            {page === "profiler" && <Profiler go={go} step={step} setStep={setStep} profile={localProfile} setProfile={setLocalProfile} />}
            {page === "scanning" && <Scanning go={go} reduced={!!reduced} store={store} onDone={() => setScanningDone(true)} />}
            {(page === "results" || page === "schemes") && (
              <Results
                schemes={schemes}
                totalBenefit={totalBenefit}
                totalSchemes={totalSchemes}
                urgentCount={lapsedCount + atRiskCount}
                estimatedTime={estimatedTime}
                flipped={flipped}
                setFlipped={setFlipped}
                explain={explain}
                setExplain={setExplain}
                go={go}
                reduced={!!reduced}
              />
            )}
            {page === "revival" && <Revival go={go} toast={toast} />}
            {page === "applications" && <ApplicationsPage store={store} toast={toast} />}
            {page === "reminders" && <RemindersPage store={store} toast={toast} />}
            {page === "admin" && <Admin />}
          </motion.div>
        </AnimatePresence>
        {!["welcome", "aadhaar", "aadhaar_followup", "profiler", "scanning", "admin"].includes(page) && <BottomNav page={page} go={go} t={t} />}
        <AICopilot />
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-42px)] max-w-[438px] -translate-x-1/2 rounded-2xl bg-[#174f3b] px-4 py-3 text-center text-sm font-bold text-white shadow-xl"
          >
            {notice}
          </motion.div>
        )}
      </div>
    </main>
  );
}

function Header({ page, lang, setLang, go }) {
  return (
    <header className="relative isolate overflow-hidden bg-[#174f3b] px-5 pb-5 pt-4 text-white">
      <motion.div
        animate={{ x: [0, 24, 0], y: [0, -14, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-12 -top-20 -z-10 size-52 rounded-full bg-[#e7bd58]/25 blur-3xl"
      />
      <div className="flex items-center justify-between">
        <button onClick={() => go("welcome")} className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl border border-white/30 bg-white/10 font-['Source_Serif_4'] text-xl font-bold">स</span>
          <b className="font-['Source_Serif_4'] text-lg">Scheme Sarthi</b>
        </button>
        <div className="flex gap-2">
          <button onClick={() => setLang(lang === "en" ? "hi" : "en")} className="rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs">
            {lang === "en" ? "हिं" : "EN"}
          </button>
          <button className="grid size-8 place-items-center rounded-lg border border-white/20 bg-white/10">
            <Bell size={16} />
          </button>
        </div>
      </div>
      {page !== "welcome" && <p className="mt-5 text-xs text-[#cde0d4]">Secure citizen support platform</p>}
    </header>
  );
}

function Welcome({ go, t, onDemo }) {
  const [phone, setPhone] = useState("");
  const { setWhatsappPhone } = useApp();
  const handlePhone = (v) => {
    const digits = v.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
    if (digits.length === 10) setWhatsappPhone(`+91${digits}`);
  };
  return (
    <section className="px-5 pb-10 pt-10">
      <span className="inline-flex items-center gap-2 rounded-full bg-[#e4f1e8] px-3 py-1.5 font-['DM_Mono'] text-[10px] uppercase tracking-wide text-[#287149]">
        <ShieldCheck size={13} /> Privacy First
      </span>
      <h1 className="mt-6 font-['Source_Serif_4'] text-5xl font-semibold leading-[.96]">
        Support that <em className="font-normal">finds you.</em>
      </h1>
      <p className="mt-5 text-base leading-7 text-[#61766a]">
        Find benefits you may have missed, repair lapsed support, and follow every next step with confidence.
      </p>
      <div className="mt-8 space-y-3">
        <button onClick={() => go("aadhaar")} className="w-full rounded-2xl bg-[#174f3b] py-4 font-bold text-white">
          {t.getStarted} <ArrowRight className="ml-2 inline" size={17} />
        </button>
        <button onClick={onDemo} className="w-full rounded-2xl border border-[#c9d8cd] bg-white py-4 font-bold text-[#174f3b]">
          {t.demo} <Sparkles className="ml-2 inline text-[#bb8321]" size={16} />
        </button>
      </div>
      <div className="mt-6 rounded-2xl border border-[#d6e4da] bg-[#ebf5ee] p-4">
        <label className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#174f3b] text-[#e7bd58]"><Bell size={18} /></span>
          <div className="flex-1">
            <p className="text-xs font-bold text-[#174f3b]">WhatsApp updates</p>
            <p className="mt-0.5 text-[11px] text-[#648074]">Get notified when a scheme is at risk</p>
          </div>
        </label>
        <div className="mt-3 flex gap-2">
          <span className="flex items-center rounded-xl border border-[#c9d8cd] bg-white px-3 text-sm font-bold text-[#648074]">+91</span>
          <input value={phone} onChange={(e) => handlePhone(e.target.value)} placeholder="9876543210" maxLength={10}
            className="min-w-0 flex-1 rounded-xl border border-[#c9d8cd] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#174f3b]" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs">
        <Stat value="427" label="schemes" />
        <Stat value="29" label="states" />
        <Stat value="0" label="data sold" />
      </div>
      <p className="mt-5 text-center text-xs text-[#6a8073]">{t.privacy} · DPDP-aware by design</p>
    </section>
  );
}

function Aadhaar({ go }) {
  const [value, setValue] = useState("");
  const formatted = (v) => v.replace(/\D/g, "").slice(0, 12).replace(/(.{4})/g, "$1-").replace(/-$/, "");
  return (
    <section className="px-5 py-8">
      <Back go={go} />
      <p className="mt-8 font-['DM_Mono'] text-[10px] uppercase tracking-wide text-[#688074]">Optional faster setup</p>
      <h1 className="mt-2 font-['Source_Serif_4'] text-4xl font-semibold">Verify your Aadhaar</h1>
      <p className="mt-3 leading-6 text-[#65786d]">
        Use the demo number <b>1234-5678-9012</b>, or continue without it.
      </p>
      <input
        value={value}
        onChange={(e) => setValue(formatted(e.target.value))}
        placeholder="XXXX-XXXX-XXXX"
        className="mt-8 w-full rounded-2xl border border-[#cbd9cf] bg-white px-4 py-4 font-['DM_Mono'] text-lg outline-none focus:border-[#174f3b]"
      />
      <button onClick={() => go(value.length === 14 ? "aadhaar_followup" : "profiler")} className="mt-4 w-full rounded-2xl bg-[#174f3b] py-4 font-bold text-white">
        Verify & continue
      </button>
      <button onClick={() => go("profiler")} className="mt-4 w-full text-sm font-bold text-[#347052]">
        Fill profile manually
      </button>
    </section>
  );
}

function Followup({ go }) {
  return (
    <section className="px-5 py-8">
      <Back go={go} />
      <h1 className="mt-8 font-['Source_Serif_4'] text-4xl font-semibold">A few more details</h1>
      <p className="mt-2 text-[#64786c]">Help us find the right renewal and payment checks.</p>
      <div className="mt-7 space-y-3">
        <Field label="Date of birth" placeholder="08 / 03 / 1964" />
        <Field label="Last PM-KISAN payment" placeholder="January 2025" />
        <Field label="Your enrolled schemes" placeholder="Select one or more" />
      </div>
      <button onClick={() => go("scanning")} className="mt-7 w-full rounded-2xl bg-[#174f3b] py-4 font-bold text-white">
        Create profile
      </button>
    </section>
  );
}

function Profiler({ go, step, setStep, profile, setProfile }) {
  const questions = [
    "What is your date of birth?", "What is your gender?", "Which state do you live in?",
    "Your district?", "Your primary occupation?", "Do you own agricultural land?",
    "How many acres do you own?", "Your annual household income?",
    "Has your bank account changed?", "Which schemes are you enrolled in?",
    "Do you have a daughter under 18?"
  ];
  const last = step === questions.length - 1;
  return (
    <section className="px-5 py-7">
      <Back go={go} />
      <div className="mt-7 flex gap-1">
        {questions.map((_, i) => (
          <span key={i} className={`h-1 flex-1 rounded ${i <= step ? "bg-[#e7bd58]" : "bg-[#dce7df]"}`} />
        ))}
      </div>
      <p className="mt-6 font-['DM_Mono'] text-[10px] uppercase tracking-wide text-[#6e8377]">Step {step + 1} of 11</p>
      <h1 className="mt-2 font-['Source_Serif_4'] text-3xl font-semibold">{questions[step]}</h1>
      <input
        value={step === 4 ? profile.occupation : ""}
        onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
        placeholder={step === 4 ? "farmer" : step === 2 ? "Uttar Pradesh" : "Enter your answer"}
        className="mt-8 w-full rounded-2xl border border-[#cad8cf] bg-white px-4 py-4 outline-none"
      />
      <button onClick={() => (last ? go("scanning") : setStep(step + 1))} className="mt-5 w-full rounded-2xl bg-[#174f3b] py-4 font-bold text-white">
        {last ? "Find my support" : "Continue"}
      </button>
    </section>
  );
}

function Scanning({ go, reduced, store, onDone }) {
  const [stage, setStage] = useState(0);
  const [scanStarted, setScanStarted] = useState(false);

  useEffect(() => {
    if (!scanStarted && store.profileId) {
      setScanStarted(true);
      store.runScan().then(() => {
        go("results");
      }).catch(() => {
        go("results");
      });
    }
  }, [store.profileId]);

  useEffect(() => {
    if (reduced) return;
    const timers = [1, 2, 3, 4, 5].map((x) => setTimeout(() => setStage(x), x * 450));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <section className="px-5 py-14 text-center">
      <motion.div
        animate={reduced ? {} : { rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="mx-auto grid size-20 place-items-center rounded-[28px] bg-[#174f3b] text-[#e7bd58]"
      >
        <Search size={32} />
      </motion.div>
      <h1 className="mt-7 font-['Source_Serif_4'] text-4xl font-semibold">Finding your support</h1>
      <p className="mt-3 text-sm text-[#697e72]">Checking verified rules and renewal signals.</p>
      <div className="mt-10 space-y-3 text-left">
        {["Reading your profile", "Checking active enrolments", "Matching scheme rules", "Finding renewal risks", "Building your action plan"].map((x, i) => (
          <div key={x} className="flex items-center gap-3">
            <span className={`grid size-6 place-items-center rounded-full ${i < stage ? "bg-[#dff3e5] text-[#207348]" : "bg-[#e4ebe6] text-[#8ca095]"}`}>
              {i < stage ? <Check size={14} /> : i + 1}
            </span>
            <span className={i < stage ? "text-[#1d573d]" : "text-[#83958b]"}>{x}</span>
          </div>
        ))}
      </div>
      <button onClick={() => go("results")} className="mt-10 text-sm font-bold text-[#236448]">Skip animation</button>
    </section>
  );
}

function Results({ schemes, totalBenefit, totalSchemes, urgentCount, estimatedTime, flipped, setFlipped, explain, setExplain, go, reduced }) {
  return (
    <section className="px-5 pb-24 pt-6">
      <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[.14em] text-[#618071]">Your scan is ready</p>
      <h1 className="mt-2 font-['Source_Serif_4'] text-3xl font-semibold">₹{totalBenefit?.toLocaleString?.('en-IN') || totalBenefit} in support to protect</h1>
      <div className="mt-5 rounded-2xl border border-[#d6e4da] bg-[#ebf5ee] p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#174f3b] text-white"><ShieldCheck size={19} /></span>
          <p className="text-sm leading-5">We found <b>{schemes.length} high-priority actions</b> across your active and eligible schemes.</p>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-['Source_Serif_4'] text-2xl font-semibold">Your scheme check</h2>
        <button onClick={() => setExplain(!explain)} className="rounded-full border border-[#d2dfd6] bg-white px-3 py-1.5 text-xs font-bold text-[#285d45]">
          {explain ? "Hide rules" : "Explain decisions"}
        </button>
      </div>
      <div className="mt-4 space-y-4">
        {schemes.length > 0 ? schemes.map((scheme, index) => (
          <SchemeCard key={scheme.id} scheme={scheme} index={index} flipped={flipped === scheme.id} toggle={() => setFlipped(flipped === scheme.id ? "" : scheme.id)} explain={explain} reduced={reduced} />
        )) : (
          <div className="rounded-2xl border border-[#d6e4da] bg-white p-6 text-center text-sm text-[#6b8375]">
            No schemes found for your profile. Try the demo profile from the home page.
          </div>
        )}
      </div>
      <button onClick={() => go("revival")} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#174f3b] py-4 font-bold text-white">
        Start my action plan <ArrowRight size={17} />
      </button>
      <div className="mt-6 flex items-center gap-2 justify-center text-xs text-[#668074]">
        <ShieldCheck size={14} /> Decisions use verified public scheme rules
      </div>
    </section>
  );
}

function SchemeCard({ scheme, index, flipped, toggle, explain, reduced }) {
  const tone = scheme.status === "Lapsed" ? "bg-[#fde4df] text-[#b3422f]" : scheme.status === "At risk" ? "bg-[#fff0cf] text-[#a35b0c]" : "bg-[#dff3e5] text-[#207348]";
  const timeVal = scheme.recovery?.estimated_minutes ? `${scheme.recovery.estimated_minutes} min` : "8 min";
  const diffVal = scheme.recovery?.difficulty_en || "Medium";
  const confVal = scheme.confidence ? `${Math.round(scheme.confidence * 100)}%` : "High";
  return (
    <motion.div
      initial={{ opacity: 0, scale: reduced ? 1 : 1.05 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: reduced ? 0 : 0.3, delay: index * 0.08 }}
      className="relative"
    >
      <motion.div
        initial={{ opacity: reduced ? 0 : 0.4 }}
        whileInView={{ opacity: 0 }}
        viewport={{ once: true }}
        transition={{ duration: reduced ? 0 : 0.3, delay: index * 0.08 }}
        className="pointer-events-none absolute inset-0 z-10 rounded-[24px] bg-white"
      />
      <button onClick={toggle} className="flip-stage block w-full text-left">
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: reduced ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flip-card relative h-[202px]"
        >
          <div className="card-face rounded-[24px] border border-white bg-white p-5 shadow-[0_10px_24px_rgba(24,72,48,.09)]">
            <div className="flex justify-between">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${tone}`}>{scheme.status}</span>
              <ChevronRight className="text-[#4c755f]" size={20} />
            </div>
            <p className="mt-4 text-xs text-[#74877d]">{scheme.category}</p>
            <h3 className="mt-1 font-['Source_Serif_4'] text-2xl font-semibold">{scheme.name}</h3>
            <div className="mt-3">
              <b className="font-['Source_Serif_4'] text-3xl">{scheme.value}</b>
              <p className="mt-1 text-xs text-[#718279]">{scheme.context}</p>
            </div>
            {explain && scheme.matched_rules?.length > 0 && (
              <p className="mt-3 border-t border-[#e5ece7] pt-2 text-[11px] text-[#3e7656]">
                ✓ {scheme.matched_rules.length} rules matched · Confidence {confVal}
              </p>
            )}
          </div>
          <div className="card-face rounded-[24px] bg-[#174f3b] p-5 text-white shadow-xl [transform:rotateY(180deg)]">
            <ArrowLeft className="absolute right-5 top-5 text-[#d6e7dc]" size={17} />
            <p className="pr-8 text-sm leading-5 text-[#dcebe2]">{scheme.detail}</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <MiniStat label="Time" value={timeVal} />
              <MiniStat label="Difficulty" value={diffVal} />
              <MiniStat label="Confidence" value={confVal} />
            </div>
            <span className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#e7bd58] px-3 py-2.5 text-sm font-bold text-[#1a4937]">
              Fix this <ArrowRight size={15} />
            </span>
          </div>
        </motion.div>
      </button>
    </motion.div>
  );
}

function Revival({ go, toast }) {
  const [tab, setTab] = useState(0);
  const tabs = ["Fix with rules", "Form auto-filled", "Docs required"];
  return (
    <section className="px-5 pb-24 pt-6">
      <Back go={go} />
      <p className="mt-7 font-['DM_Mono'] text-[10px] uppercase tracking-wide text-[#b3422f]">Repair benefit</p>
      <h1 className="mt-2 font-['Source_Serif_4'] text-3xl font-semibold">Restore PM-KISAN</h1>
      <div className="mt-5 flex gap-1 rounded-xl bg-[#eaf0ec] p-1">
        {tabs.map((x, i) => (
          <button key={x} onClick={() => setTab(i)} className={`flex-1 rounded-lg px-1 py-2 text-[10px] font-bold ${tab === i ? "bg-white text-[#174f3b] shadow-sm" : "text-[#708178]"}`}>
            {x}
          </button>
        ))}
      </div>
      <div className="mt-5 rounded-2xl border border-[#d6e1d9] bg-white p-5">
        <h2 className="font-['Source_Serif_4'] text-xl font-semibold">{tabs[tab]}</h2>
        <p className="mt-3 text-sm leading-6 text-[#60766a]">
          {tab === 0
            ? "Your bank details changed. The rule check found that a verified account is required before the next instalment."
            : tab === 1
            ? "Your name, land details and district have been pre-filled. Review before submitting."
            : "Keep Aadhaar, updated passbook and land record ready."}
        </p>
        {tab === 2 && (
          <div className="mt-4 space-y-2 text-sm">
            <CheckLine text="Aadhaar card" />
            <CheckLine text="Updated bank passbook" />
            <CheckLine text="Land ownership record" />
          </div>
        )}
      </div>
      <button onClick={() => { toast("Application submitted successfully"); go("applications"); }} className="mt-6 w-full rounded-2xl bg-[#174f3b] py-4 font-bold text-white">
        Submit restoration request
      </button>
    </section>
  );
}

function ApplicationsPage({ store, toast }) {
  const [stage, setStage] = useState(1);
  const [apps, setApps] = useState([]);
  const labels = ["Submitted", "Verified", "Block Office", "Sanctioned", "Restored"];

  useEffect(() => {
    if (store.profileId) {
      store.fetchApplications().then((data) => {
        if (data) setApps(data);
      }).catch(() => {});
    }
  }, [store.profileId]);

  return (
    <section className="px-5 pb-24 pt-6">
      <h1 className="font-['Source_Serif_4'] text-3xl font-semibold">Applications</h1>
      <p className="mt-2 text-sm text-[#6b8074]">Track every restoration request.</p>
      {apps.length > 0 ? apps.map((app, i) => (
        <div key={app.id || i} className="mt-4 rounded-2xl border border-[#d5e0d8] bg-white p-5">
          <p className="text-sm font-bold text-[#174f3b]">{app.name_en || app.scheme_id}</p>
          {labels.map((x, j) => (
            <div key={x} className="flex gap-3 pb-4 last:pb-0 pt-4">
              <span className={`grid size-7 place-items-center rounded-full text-xs ${j <= (app.stage || stage) ? "bg-[#174f3b] text-white" : "bg-[#e7eee9] text-[#82968a]"}`}>
                {j < (app.stage || stage) ? <Check size={14} /> : j + 1}
              </span>
              <div>
                <b className="text-sm">{x}</b>
                <p className="text-xs text-[#73857b]">{j === (app.stage || stage) ? "Current stage" : "Completed"}</p>
              </div>
            </div>
          ))}
        </div>
      )) : (
        <div className="mt-8 rounded-2xl border border-[#d5e0d8] bg-white p-5">
          {labels.map((x, i) => (
            <div key={x} className="flex gap-3 pb-5 last:pb-0">
              <span className={`grid size-7 place-items-center rounded-full text-xs ${i <= stage ? "bg-[#174f3b] text-white" : "bg-[#e7eee9] text-[#82968a]"}`}>
                {i < stage ? <Check size={14} /> : i + 1}
              </span>
              <div>
                <b className="text-sm">{x}</b>
                <p className="text-xs text-[#73857b]">{i === stage ? "Current stage" : "Completed"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <button onClick={() => { if (stage < 4) setStage(stage + 1); else toast("Benefit restored — congratulations!"); }} className="mt-6 w-full rounded-2xl bg-[#e7bd58] py-4 font-bold text-[#174f3b]">
        {stage < 4 ? "Advance demo stage" : "Celebrate restored benefit"}
      </button>
    </section>
  );
}

function RemindersPage({ store, toast }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (store.profileId) {
      store.fetchReminders().then((data) => {
        if (data) setItems(data);
      }).catch(() => {});
    }
  }, [store.profileId]);

  return (
    <section className="px-5 pb-24 pt-6">
      <h1 className="font-['Source_Serif_4'] text-3xl font-semibold">Reminders</h1>
      <p className="mt-2 text-sm text-[#6c8175]">Don&apos;t let support lapse again.</p>
      <div className="mt-6 space-y-3">
        {items.length > 0 ? items.map((r, i) => (
          <ReminderCard key={r.id || i} days={r.due_days || 30} title={r.name_en || r.title_en || "Reminder"} urgent={(r.due_days || 30) <= 30} />
        )) : (
          <>
            <ReminderCard days={18} title="PM Fasal Bima renewal" urgent />
            <ReminderCard days={42} title="Ayushman card update" />
          </>
        )}
      </div>
      <button onClick={() => toast("A demo reminder notification was sent")} className="mt-6 w-full rounded-2xl border border-[#bfd3c5] bg-white py-4 font-bold text-[#236449]">
        Simulate notification
      </button>
    </section>
  );
}

function Admin() {
  const data = [{ name: "Mon", value: 14 }, { name: "Tue", value: 31 }, { name: "Wed", value: 20 }, { name: "Thu", value: 46 }, { name: "Fri", value: 37 }];
  return (
    <section className="px-5 pb-10 pt-6">
      <p className="font-['DM_Mono'] text-[10px] uppercase tracking-wide text-[#6c8275]">Demo admin</p>
      <h1 className="mt-1 font-['Source_Serif_4'] text-3xl font-semibold">Recovery dashboard</h1>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Stat value="1,248" label="profiles scanned" />
        <Stat value="₹18.4L" label="benefits recovered" />
        <Stat value="74%" label="recovery rate" />
        <Stat value="86" label="applications" />
      </div>
      <div className="mt-5 h-56 rounded-2xl border border-[#d6e1d9] bg-white p-4">
        <p className="text-sm font-bold">Applications generated</p>
        <ResponsiveContainer width="100%" height="88%">
          <BarChart data={data}>
            <XAxis dataKey="name" fontSize={10} />
            <Tooltip />
            <Bar dataKey="value" fill="#174f3b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function BottomNav({ page, go, t }) {
  const items = [
    ["results", t.home, Home],
    ["schemes", t.schemes, Search],
    ["applications", t.applications, ClipboardCheck],
    ["reminders", t.reminders, Bell],
  ];
  return (
    <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-[480px] -translate-x-1/2 justify-around border-t border-[#d8e3dc] bg-white/90 px-3 py-2 backdrop-blur-xl">
      {items.map(([key, label, Icon]) => (
        <button key={key} onClick={() => go(key)} className={`grid justify-items-center gap-1 rounded-xl px-3 py-1 text-[10px] font-bold ${page === key ? "text-[#174f3b]" : "text-[#819287]"}`}>
          <Icon size={18} />
          {label}
        </button>
      ))}
    </nav>
  );
}

function Back({ go }) {
  return (
    <button onClick={() => go("welcome")} className="inline-flex items-center gap-1 text-sm font-bold text-[#286449]">
      <ArrowLeft size={17} /> Back
    </button>
  );
}

function Field({ label, placeholder }) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <input placeholder={placeholder} className="mt-2 w-full rounded-xl border border-[#d0ddd4] bg-white px-3 py-3 text-sm font-normal outline-none" />
    </label>
  );
}

function Stat({ value, label }) {
  return (
    <div className="rounded-2xl border border-[#d5e1d8] bg-white p-3">
      <b className="block font-['Source_Serif_4'] text-2xl text-[#174f3b]">{value}</b>
      <span className="mt-1 block text-[11px] text-[#718478]">{label}</span>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg bg-white/10 p-2">
      <span className="block text-[9px] uppercase text-[#b6d0c1]">{label}</span>
      <b className="mt-1 block text-[10px]">{value}</b>
    </div>
  );
}

function CheckLine({ text }) {
  return (
    <p className="flex gap-2">
      <span className="grid size-4 place-items-center rounded-full bg-[#dff3e5] text-[#207348]"><Check size={11} /></span>
      {text}
    </p>
  );
}

function ReminderCard({ days, title, urgent = false }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#d7e3db] bg-white p-4">
      <span className={`grid size-12 place-items-center rounded-xl text-sm font-bold ${urgent ? "bg-[#fde4df] text-[#b3422f]" : "bg-[#e4f1e8] text-[#207348]"}`}>
        {days}d
      </span>
      <div>
        <b className="text-sm">{title}</b>
        <p className="mt-1 text-xs text-[#71847a]">{urgent ? "Urgent — act soon" : "Keep this on your radar"}</p>
      </div>
    </div>
  );
}