const {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useContext,
  createContext,
  useCallback,
} = React;

const SEED = JSON.parse(document.getElementById("seed").textContent);

/* ---------- GSAP SETUP ---------- */
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function animateCounters(card) {
  if (prefersReducedMotion()) return;
  const targets = card.querySelectorAll(".ministat .big, .stat-bubble .big");
  targets.forEach((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const original = node.textContent;
      const m = original.match(/([+-]?)(\d+(?:\.\d+)?)(.*)$/);
      if (m && /\d/.test(m[2])) {
        const sign = m[1];
        const target = parseFloat(m[2]);
        const suffix = m[3];
        const isInt = !m[2].includes(".");
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.4,
          ease: "power3.out",
          onUpdate: () => {
            const cur = isInt ? Math.round(obj.v) : obj.v.toFixed(1);
            node.textContent = sign + cur + suffix;
          },
        });
        return;
      }
    }
  });
}

/* ---------- ICONS ---------- */
const Icon = {
  grid: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  chart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 3 3 5-6" />
    </svg>
  ),
  doc: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6" />
    </svg>
  ),
  bell: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  ),
  mail: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  ),
  search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  ),
  filter: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  ),
  cal: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  ),
  plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  arrow: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M7 17L17 7" />
      <path d="M9 7h8v8" />
    </svg>
  ),
  arrowDown: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M12 5v14" />
      <path d="M5 12l7 7 7-7" />
    </svg>
  ),
  more: () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="6" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="18" cy="12" r="1.5" />
    </svg>
  ),
  chevron: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  download: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M12 4v12" />
      <path d="M6 10l6 6 6-6" />
      <path d="M4 20h16" />
    </svg>
  ),
  music: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  weather: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="10" r="4" />
      <path d="M12 2v2M12 18v2M4 10H2M22 10h-2M5 5l1.5 1.5M17.5 5L19 3.5M5 15l1.5-1.5M17.5 15L19 16.5" />
    </svg>
  ),
  settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  flag: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 21V5a1 1 0 0 1 1.4-.9l13.6 6a1 1 0 0 1 0 1.8L5.4 17.9A1 1 0 0 1 4 17" />
    </svg>
  ),
  close: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  spark: () => (
    <svg viewBox="0 0 70 28">
      <polyline
        points="0,22 10,18 20,20 30,12 40,15 50,8 60,10 70,3"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

/* ---------- MOBILE NAV (hamburger + drawer) ---------- */
function MobileNav({ section, setSection }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  useEffect(() => {
    const h = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  const items = [
    { id: "grid", icon: Icon.grid, label: "Vue d'ensemble" },
    { id: "chart", icon: Icon.chart, label: "Analyses" },
    { id: "doc", icon: Icon.doc, label: "Livre blanc" },
    { id: "music", icon: Icon.music, label: "Empreinte audio" },
    { id: "weather", icon: Icon.weather, label: "Météo" },
  ];
  return (
    <React.Fragment>
      <button
        type="button"
        className="hamburger"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={open}
        aria-controls="mobile-drawer"
        onClick={() => setOpen((o) => !o)}
      >
        <span className={`hbx ${open ? "x" : ""}`} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>
      <div
        id="mobile-drawer"
        className={`drawer-back ${open ? "open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      >
        <nav
          className="drawer"
          onClick={(e) => e.stopPropagation()}
          aria-label="Navigation principale"
        >
          <div className="logo-row">
            <div className="logo" style={{ margin: 0 }}>
              B<span style={{ color: "#fff" }}>·</span>D
            </div>
            <div>
              <div className="nm">Baromètre Data</div>
              <div className="sub">M2 Data Marketing IA</div>
            </div>
          </div>
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              className={`drawer-item ${section === it.id ? "active" : ""}`}
              onClick={() => {
                setSection(it.id);
                setOpen(false);
              }}
            >
              <it.icon aria-hidden="true" />
              {it.label}
            </button>
          ))}
        </nav>
      </div>
    </React.Fragment>
  );
}

/* ---------- MINI BAR (for table rows) ---------- */
function MiniBar({ progress, color = "var(--neon)", label }) {
  const v = Math.max(0, Math.min(100, progress));
  return (
    <span
      className="mini-bar"
      role="img"
      aria-label={label ?? `${v}%`}
      title={`${v}%`}
    >
      <span className="track">
        <span className="fill" style={{ width: `${v}%`, background: color }} />
      </span>
      <span className="v">{v}</span>
    </span>
  );
}

/* ---------- APP CONTEXT (toast / modal / search) ---------- */
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ---------- TOAST STACK ---------- */
function ToastStack({ toasts, remove }) {
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.leaving ? "leaving" : ""}`}>
          <div className="dot" />
          <div className="body">
            <div className="title">{t.title}</div>
            {t.desc && <div className="desc">{t.desc}</div>}
          </div>
          <button className="close" onClick={() => remove(t.id)}>
            <Icon.close />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------- MODAL (framework detail) ---------- */
function FrameworkModal({ step, idx, onClose }) {
  const backRef = useRef(null);
  const panelRef = useRef(null);
  const closingRef = useRef(false);

  useLayoutEffect(() => {
    if (!backRef.current || !panelRef.current) return;
    if (prefersReducedMotion()) return;
    backRef.current.style.animation = "none";
    panelRef.current.style.animation = "none";
    const ctx = gsap.context(() => {
      gsap.fromTo(
        backRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.2, ease: "power1.out" },
      );
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, scale: 0.94 },
        { opacity: 1, scale: 1, duration: 0.28, ease: "power2.out" },
      );
    });
    return () => ctx.revert();
  }, []);

  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    if (prefersReducedMotion() || !backRef.current || !panelRef.current) {
      onClose();
      return;
    }
    gsap.to(panelRef.current, {
      opacity: 0,
      scale: 0.94,
      duration: 0.18,
      ease: "power2.in",
    });
    gsap.to(backRef.current, {
      opacity: 0,
      duration: 0.18,
      ease: "power1.in",
      onComplete: onClose,
    });
  }, [onClose]);

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [handleClose]);

  if (!step) return null;
  const details = [
    {
      kpis: [
        ["Sources", "4 APIs"],
        ["Fréquence", "15 min"],
        ["Variables", "12"],
        ["Pays", "22"],
      ],
      tools: ["Open-Meteo", "Meteoblue", "INSEE"],
    },
    {
      kpis: [
        ["Streams", "2.4 M"],
        ["Tracks", "186K"],
        ["Sessions", "512K"],
        ["Régions", "22"],
      ],
      tools: ["Spotify Web API", "Shopify", "GA4"],
    },
    {
      kpis: [
        ["r moyen", "0.82"],
        ["p-value", "< 0.001"],
        ["Lag", "12 j"],
        ["Modèles", "6"],
      ],
      tools: ["Pandas", "scikit-learn", "PyMC"],
    },
    {
      kpis: [
        ["Lift", "+23%"],
        ["CTR", "+18%"],
        ["Conversion", "+12%"],
        ["Segments", "14"],
      ],
      tools: ["Segment.io", "mParticle", "Braze"],
    },
    {
      kpis: [
        ["Latence", "< 200ms"],
        ["Auto", "92%"],
        ["Coverage", "24/7"],
        ["LLM", "Claude"],
      ],
      tools: ["Anthropic", "LangChain", "Temporal"],
    },
  ];
  const d = details[idx];
  return (
    <div className="modal-back" ref={backRef} onClick={handleClose}>
      <div
        className="modal"
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <div className="num-pill">
              Étape {String(idx + 1).padStart(2, "0")} / 05
            </div>
            <h2>{step.name}</h2>
          </div>
          <button
            className="close-btn"
            onClick={handleClose}
            aria-label="Fermer"
          >
            <Icon.close />
          </button>
        </div>
        <p className="desc">{step.desc}</p>
        <div className="kv-grid">
          {d.kpis.map(([k, v]) => (
            <div className="kv" key={k}>
              <div className="k">{k}</div>
              <div className="v">{v}</div>
            </div>
          ))}
        </div>
        <div
          className="k"
          style={{
            fontSize: 10,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          Stack technique
        </div>
        <div className="tools">
          {d.tools.map((t, i) => (
            <span key={t} className={`chip ${i === 0 ? "neon" : ""}`}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- SEARCH OVERLAY ---------- */
const SEARCH_ITEMS = [
  {
    id: "valence",
    nm: "Valence Spotify",
    ctx: "Métrique audio · 0.32 → 0.77",
    kind: "Métrique",
    view: "dashboard",
  },
  {
    id: "energy",
    nm: "Energy",
    ctx: "Métrique audio · +69% été",
    kind: "Métrique",
    view: "dashboard",
  },
  {
    id: "bpm",
    nm: "BPM moyen",
    ctx: "Tempo · 104 → 118",
    kind: "Métrique",
    view: "dashboard",
  },
  {
    id: "radar",
    nm: "Empreinte audio saisonnière",
    ctx: "Radar Hiver vs Été",
    kind: "Card",
    view: "dashboard",
  },
  {
    id: "framework",
    nm: "Framework Baromètre Data",
    ctx: "5 étapes · captation → IA",
    kind: "Section",
    view: "report",
  },
  {
    id: "signal",
    nm: "Signal météo en direct",
    ctx: "Paris · maintenant",
    kind: "Card",
    view: "dashboard",
  },
  {
    id: "dataset",
    nm: "Dataset brut",
    ctx: "12 lignes · CSV exportable",
    kind: "Vue",
    view: "dataset",
  },
  {
    id: "cta",
    nm: "Télécharger le PDF",
    ctx: "62 pages · 4.2 Mo",
    kind: "Action",
    view: "report",
  },
  {
    id: "corr",
    nm: "Corrélation température × valence",
    ctx: "r = 0.82 · lag 12 j",
    kind: "Chart",
    view: "dashboard",
  },
];

function SearchOverlay({ onClose, setView }) {
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(0);
  const inputRef = useRef(null);
  const { toast } = useApp();
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const results = useMemo(() => {
    if (!q.trim()) return SEARCH_ITEMS;
    const lo = q.toLowerCase();
    return SEARCH_ITEMS.filter(
      (i) =>
        i.nm.toLowerCase().includes(lo) ||
        i.ctx.toLowerCase().includes(lo) ||
        i.kind.toLowerCase().includes(lo),
    );
  }, [q]);

  const go = (it) => {
    setView(it.view);
    onClose();
    toast({
      title: `Navigation : ${it.nm}`,
      desc: `Vue « ${it.view} » ouverte.`,
    });
  };

  return (
    <div className="search-back" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="row">
          <Icon.search />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setFocus(0);
            }}
            placeholder="Chercher une métrique, une card, un dataset…"
          />
          <span className="kbd">ESC</span>
        </div>
        <div className="results">
          {results.length === 0 && (
            <div className="empty">Aucun résultat pour « {q} »</div>
          )}
          {results.map((r, i) => (
            <div
              key={r.id}
              className={`res ${i === focus ? "focus" : ""}`}
              onMouseEnter={() => setFocus(i)}
              onClick={() => go(r)}
            >
              <div className="ic">
                <Icon.chart />
              </div>
              <div>
                <div className="nm">{r.nm}</div>
                <div className="ctx">{r.ctx}</div>
              </div>
              <div className="badge">{r.kind}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- SIDEBAR ---------- */
function Sidebar({ section, setSection }) {
  const { toast } = useApp();
  const items = [
    { id: "grid", icon: Icon.grid, label: "Vue d'ensemble" },
    { id: "chart", icon: Icon.chart, label: "Analyses" },
    { id: "doc", icon: Icon.doc, label: "Livre blanc" },
    { id: "music", icon: Icon.music, label: "Empreinte audio" },
    { id: "weather", icon: Icon.weather, label: "Météo" },
  ];
  return (
    <aside className="sidebar">
      <div className="logo">
        B<span style={{ color: "#fff" }}>·</span>D
      </div>
      {items.map((it) => (
        <button
          key={it.id}
          className={`nav-icon ${section === it.id ? "active" : ""}`}
          onClick={() => {
            setSection(it.id);
            toast({
              title: `Section : ${it.label}`,
              desc: "Bento filtré sur ce thème.",
            });
          }}
          title={it.label}
        >
          <it.icon />
        </button>
      ))}
      <div className="nav-spacer" />
      <button
        className="nav-icon"
        title="Réglages"
        onClick={() =>
          toast({ title: "Réglages", desc: "Module à venir dans la v1.3." })
        }
      >
        <Icon.settings />
      </button>
    </aside>
  );
}

/* ---------- TOPBAR ---------- */
function Topbar({ view, setView, openSearch, section, setSection }) {
  const { toast } = useApp();
  return (
    <div className="topbar">
      <MobileNav section={section} setSection={setSection} />
      <div className="top-tabs">
        <button
          className={`top-tab ${view === "dashboard" ? "active" : ""}`}
          onClick={() => setView("dashboard")}
        >
          <Icon.grid /> Dashboard
        </button>
        <button
          className={`top-tab ${view === "dataset" ? "active" : ""}`}
          onClick={() => setView("dataset")}
        >
          <Icon.chart /> Dataset
        </button>
        <button
          className={`top-tab ${view === "report" ? "active" : ""}`}
          onClick={() => setView("report")}
        >
          <Icon.flag /> Rapport
        </button>
      </div>

      <div className="team-cluster">
        <div className="avatars">
          <div className="av a1">AM</div>
          <div className="av a2">JC</div>
          <div className="av a3">LP</div>
          <div className="av count">+3</div>
        </div>
        <button
          className="pill-btn"
          onClick={() =>
            toast({
              title: "Invitation envoyée",
              desc: "Le co-auteur recevra un lien d'accès en lecture.",
            })
          }
        >
          <Icon.plus /> Inviter
        </button>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="icon-btn"
          aria-label="Notifications"
          onClick={() =>
            toast({
              title: "3 nouvelles notifications",
              desc: "Nouvelle donnée météo ingérée.",
            })
          }
        >
          <Icon.bell />
          <span className="dot" aria-hidden="true" />
        </button>
        <button
          className="icon-btn"
          aria-label="Messages"
          onClick={() =>
            toast({ title: "Boîte mail", desc: "2 messages non lus." })
          }
        >
          <Icon.mail />
        </button>
        <button
          className="icon-btn"
          aria-label="Recherche"
          onClick={openSearch}
          title="Recherche (⌘K)"
        >
          <Icon.search />
        </button>
        <div
          className="av a1"
          style={{ width: 40, height: 40, marginLeft: 4, borderWidth: 0 }}
        >
          SD
        </div>
      </div>
    </div>
  );
}

/* ---------- PAGE HEAD ---------- */
function PageHead({ view, openSearch }) {
  const { toast } = useApp();
  const titles = {
    dashboard: {
      eyebrow: "Vue interactive",
      title: "Baromètre Data",
      sub: "/ 2026",
    },
    dataset: {
      eyebrow: "Données brutes",
      title: "Dataset",
      sub: "/ 2,4 M streams",
    },
    report: {
      eyebrow: "Livre blanc",
      title: "Rapport complet",
      sub: "/ 62 pages",
    },
  }[view];
  return (
    <div className="page-head">
      <div>
        <div className="breadcrumb">
          <span className="crumb">
            <Icon.doc /> Livres blancs
          </span>
          <Icon.chevron />
          <span className="crumb">
            <Icon.flag /> M2 Data Marketing IA
          </span>
          <Icon.chevron />
          <span className="crumb current">{titles.eyebrow}</span>
        </div>
        <h1 className="title">
          {titles.title} <em>{titles.sub}</em>
        </h1>
      </div>
      <div className="head-actions">
        <button
          className="icon-btn"
          aria-label="Rechercher"
          onClick={openSearch}
          title="Rechercher"
        >
          <Icon.search />
        </button>
        <button
          className="icon-btn"
          aria-label="Filtres"
          onClick={() =>
            toast({
              title: "Filtres appliqués",
              desc: "Période 2025 · 22 régions · 4 métriques.",
            })
          }
        >
          <Icon.filter />
        </button>
        <button
          className="pill-btn"
          onClick={() =>
            toast({
              title: "Sélecteur de période",
              desc: "Période 01 Jan — 31 Déc 2025 conservée.",
            })
          }
        >
          <Icon.cal /> 01 Jan — 31 Déc 2025 <Icon.chevron />
        </button>
        <button
          className="pill-btn"
          onClick={() =>
            toast({
              title: "Widget ajouté",
              desc: "Une nouvelle card vide est ajoutée au bento.",
            })
          }
        >
          <Icon.plus /> Ajouter widget
        </button>
        <button
          className="pill-btn dark"
          onClick={() =>
            toast({
              title: "Export en cours…",
              desc: "Le PDF de la vue sera prêt dans quelques secondes.",
            })
          }
        >
          Exporter le rapport
        </button>
      </div>
    </div>
  );
}

/* ---------- HERO ---------- */
function HeroCard({ span = 8, idx = 0 }) {
  const { toast } = useApp();
  const sunRef = useRef(null);
  const moonRef = useRef(null);
  const ringRefs = useRef([]);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const sun = sunRef.current,
      moon = moonRef.current;
    if (sun) sun.style.animation = "none";
    if (moon) moon.style.animation = "none";
    const ctx = gsap.context(() => {
      if (sun) {
        gsap.set(sun, { transformOrigin: "center center" });
        gsap.to(sun, {
          y: -12,
          x: 6,
          duration: 4,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
        gsap.to(sun, { rotation: 360, duration: 60, ease: "none", repeat: -1 });
      }
      if (moon) {
        gsap.set(moon, { transformOrigin: "center center" });
        gsap.to(moon, {
          y: 10,
          x: -8,
          duration: 4.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: 2.25,
        });
      }
      ringRefs.current.forEach((r, i) => {
        if (!r) return;
        gsap.set(r, {
          xPercent: -50,
          yPercent: -50,
          transformOrigin: "center center",
        });
        gsap.to(r, {
          rotation: i === 0 ? 360 : -360,
          duration: i === 0 ? 30 : 20,
          ease: "none",
          repeat: -1,
        });
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section
      className={`card hero col-${span}`}
      data-anim
      data-anim-index={idx}
      style={{ "--stagger-idx": idx }}
    >
      <div className="left">
        <div>
          <span className="badge">
            <span className="ping"></span>Livre blanc · Édition 2026
          </span>
          <h2>
            L'humeur d'achat
            <br />a une <span className="accent">température.</span>
          </h2>
          <p className="lede">
            Baromètre Data croise 18 mois de données météo Open-Meteo et 2,4 M
            d'écoutes Spotify pour démontrer que la valence émotionnelle des
            playlists prédit l'intention d'achat avec 12 jours d'avance.
          </p>
        </div>
        <div className="meta-row">
          <div className="item">
            Auteurs<b>S. Dubois · J. Carré · L. Pham</b>
          </div>
          <div className="item">
            Pages<b>62</b>
          </div>
          <div className="item">
            Lecture<b>~ 28 min</b>
          </div>
          <button
            className="pdf-mini"
            onClick={() =>
              toast({
                title: "Téléchargement lancé",
                desc: "Baromètre-Data-2026.pdf · 4.2 Mo",
              })
            }
          >
            <Icon.download /> PDF
          </button>
        </div>
      </div>
      <div className="right">
        <div className="hero-art">
          <div
            ref={(el) => (ringRefs.current[0] = el)}
            className="ring"
            style={{ width: 380, height: 380, top: "50%", left: "50%" }}
          ></div>
          <div
            ref={(el) => (ringRefs.current[1] = el)}
            className="ring"
            style={{ width: 280, height: 280, top: "50%", left: "50%" }}
          ></div>
          <div ref={sunRef} className="sun" />
          <div ref={moonRef} className="moon" />
          <div className="equalizer">
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className="bar"
                style={{ animationDelay: `${(i % 8) * 0.12}s` }}
              />
            ))}
          </div>
        </div>
        <div className="stat-bubble">
          <div className="lab">Valence été vs hiver</div>
          <div className="big">+45%</div>
        </div>
      </div>
    </section>
  );
}

/* ---------- SIGNAL CARD ---------- */
function SignalCard({ span = 4, idx = 0 }) {
  const { toast } = useApp();
  return (
    <section
      className={`card signal col-${span}`}
      data-anim
      data-anim-index={idx}
      style={{ "--stagger-idx": idx }}
    >
      <div className="top">
        <div>
          <h3>Signal en direct</h3>
          <div className="sub">Paris · maintenant</div>
        </div>
        <button
          className="pill-mini"
          style={{ border: "none", cursor: "pointer" }}
          onClick={() =>
            toast({
              title: "Valence en hausse",
              desc: "Le pic de +45% est mesuré sur les 7 derniers jours.",
            })
          }
        >
          +45% Valence
        </button>
      </div>
      <div className="body">
        <div className="tile">
          <div
            className="ico"
            style={{ background: "rgba(242,210,122,0.15)", color: "#F2D27A" }}
          >
            <Icon.weather />
          </div>
          <div className="nm">Température</div>
          <div className="vl">
            24.6°
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
              C
            </span>
          </div>
          <div className="dl">↑ +3.2° vs moy.</div>
        </div>
        <div className="tile">
          <div
            className="ico"
            style={{ background: "rgba(74,144,217,0.18)", color: "#7BB1E8" }}
          >
            <Icon.music />
          </div>
          <div className="nm">Valence (0–1)</div>
          <div className="vl">0.71</div>
          <div className="dl">↑ +0.22 / 7j</div>
        </div>
        <div className="tile">
          <div
            className="ico"
            style={{
              background: "rgba(212,242,75,0.15)",
              color: "var(--neon)",
            }}
          >
            <Icon.chart />
          </div>
          <div className="nm">BPM moyen</div>
          <div className="vl">118</div>
          <div className="dl">↑ +14 vs hiver</div>
        </div>
        <div className="tile">
          <div
            className="ico"
            style={{ background: "rgba(168,213,194,0.2)", color: "#A8D5C2" }}
          >
            <Icon.flag />
          </div>
          <div className="nm">Intention achat</div>
          <div className="vl">
            82
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
              /100
            </span>
          </div>
          <div className="dl">↑ Forte</div>
        </div>
      </div>
    </section>
  );
}

/* ---------- RADAR CHART ---------- */
function RadarCard({ span = 5, idx = 0 }) {
  const { toast } = useApp();
  const [visible, setVisible] = useState({ winter: true, summer: true });
  const toggle = (k) => setVisible((v) => ({ ...v, [k]: !v[k] }));
  const axes = [
    { key: "Valence", winter: 0.32, summer: 0.77 },
    { key: "Energy", winter: 0.48, summer: 0.81 },
    { key: "Danceability", winter: 0.52, summer: 0.73 },
    { key: "Acousticness", winter: 0.61, summer: 0.24 },
    { key: "BPM (norm)", winter: 0.4, summer: 0.66 },
    { key: "Tempo", winter: 0.36, summer: 0.69 },
  ];
  const cx = 160,
    cy = 160,
    R = 110;
  const N = axes.length;
  const pt = (i, v) => {
    const a = (Math.PI * 2 * i) / N - Math.PI / 2;
    return [cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v];
  };
  const poly = (key) => axes.map((d, i) => pt(i, d[key]).join(",")).join(" ");
  const labelPt = (i) => {
    const a = (Math.PI * 2 * i) / N - Math.PI / 2;
    return [cx + Math.cos(a) * (R + 22), cy + Math.sin(a) * (R + 22)];
  };
  return (
    <section
      className={`card col-${span}`}
      data-anim
      data-anim-index={idx}
      style={{ "--stagger-idx": idx }}
    >
      <div className="head">
        <div>
          <h3>Empreinte audio saisonnière</h3>
          <div className="sub">Spotify API · 2,4 M streams · N = 18 mois</div>
        </div>
        <div className="actions">
          <button
            className="ico"
            aria-label="Filtrer"
            onClick={() =>
              toast({
                title: "Filtre radar",
                desc: "Toggle des saisons appliqué.",
              })
            }
          >
            <Icon.filter />
          </button>
          <button
            className="ico"
            aria-label="Plus d'options"
            onClick={() =>
              toast({
                title: "Options du chart",
                desc: "Téléchargement SVG disponible.",
              })
            }
          >
            <Icon.more />
          </button>
        </div>
      </div>
      <div className="radar-wrap">
        <svg className="radar" viewBox="0 0 320 320">
          {[0.25, 0.5, 0.75, 1].map((r, i) => (
            <polygon
              key={i}
              points={axes
                .map((_, j) => {
                  const a = (Math.PI * 2 * j) / N - Math.PI / 2;
                  return `${cx + Math.cos(a) * R * r},${cy + Math.sin(a) * R * r}`;
                })
                .join(" ")}
              fill="none"
              stroke="#E6E9EE"
              strokeWidth="1"
            />
          ))}
          {axes.map((_, i) => {
            const [x, y] = pt(i, 1);
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke="#EFF1F5"
                strokeWidth="1"
              />
            );
          })}
          {visible.winter && (
            <polygon
              points={poly("winter")}
              fill="rgba(74,144,217,0.20)"
              stroke="#4A90D9"
              strokeWidth="2"
              style={{ transition: "opacity .25s" }}
            />
          )}
          {visible.summer && (
            <polygon
              points={poly("summer")}
              fill="rgba(212,242,75,0.35)"
              stroke="#B5DA2E"
              strokeWidth="2"
              style={{ transition: "opacity .25s" }}
            />
          )}
          {axes.map((d, i) => {
            const [wx, wy] = pt(i, d.winter);
            const [sx, sy] = pt(i, d.summer);
            return (
              <g key={i}>
                {visible.winter && (
                  <circle cx={wx} cy={wy} r="3.5" fill="#4A90D9" />
                )}
                {visible.summer && (
                  <circle cx={sx} cy={sy} r="3.5" fill="#B5DA2E" />
                )}
              </g>
            );
          })}
          {axes.map((d, i) => {
            const a = (Math.PI * 2 * i) / N - Math.PI / 2;
            const [lx, ly] = labelPt(i);
            const cos = Math.cos(a),
              sin = Math.sin(a),
              EPS = 0.3;
            const anchor = cos > EPS ? "start" : cos < -EPS ? "end" : "middle";
            const baseline =
              sin > EPS ? "hanging" : sin < -EPS ? "auto" : "middle";
            return (
              <text
                key={i}
                x={lx}
                y={ly}
                fontSize="11"
                fill="#0E1116"
                fontWeight="600"
                textAnchor={anchor}
                dominantBaseline={baseline}
              >
                {d.key}
              </text>
            );
          })}
        </svg>
        <div className="legend" role="group" aria-label="Filtrer les séries">
          <button
            type="button"
            className={`legend-chip ${visible.winter ? "" : "off"}`}
            aria-pressed={visible.winter}
            onClick={() => toggle("winter")}
            style={{ color: "#4A90D9" }}
          >
            <span className="sw" aria-hidden="true" />
            <span style={{ color: "var(--ink)" }}>Hiver</span>
            <span className="val">0.45</span>
          </button>
          <button
            type="button"
            className={`legend-chip ${visible.summer ? "" : "off"}`}
            aria-pressed={visible.summer}
            onClick={() => toggle("summer")}
            style={{ color: "#B5DA2E" }}
          >
            <span className="sw" aria-hidden="true" />
            <span style={{ color: "var(--ink)" }}>Été</span>
            <span className="val">0.65</span>
          </button>
          <div
            style={{
              borderTop: "1px solid var(--line)",
              margin: "6px 0 0",
              paddingTop: 10,
              fontSize: 11,
              color: "var(--muted)",
              lineHeight: 1.5,
            }}
          >
            Aire couverte +44% en été. Acousticness chute (−61%), tout le reste
            monte.
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- BAR COMPARE ---------- */
function MetricsCard({ span = 7, idx = 0 }) {
  const { toast } = useApp();
  const [ref, inView] = useInView(0.25);
  return (
    <section
      ref={ref}
      className={`card col-${span}`}
      data-anim
      data-anim-index={idx}
      style={{ "--stagger-idx": idx }}
    >
      <div className="head">
        <div>
          <h3>4 métriques Spotify · Hiver vs Été</h3>
          <div className="sub">Pic d'écoute : Juin–Août vs Déc–Fév</div>
        </div>
        <div className="actions">
          <button
            className="ico"
            aria-label="Trier les métriques"
            onClick={() =>
              toast({
                title: "Tri appliqué",
                desc: "Métriques triées par delta décroissant.",
              })
            }
          >
            <Icon.filter />
          </button>
          <button
            className="ico"
            aria-label="Ouvrir l'analyse détaillée"
            onClick={() =>
              toast({
                title: "Ouvrir l'analyse détaillée",
                desc: "Vue plein écran à venir.",
              })
            }
          >
            <Icon.arrow />
          </button>
        </div>
      </div>
      <div className="bar-row">
        {SEED.metrics.map((m, i) => {
          const delta = (((m.summer - m.winter) / m.winter) * 100).toFixed(0);
          const down = m.summer < m.winter;
          const wpct = inView ? (m.winter * 100).toFixed(0) : 0;
          const spct = inView ? (m.summer * 100).toFixed(0) : 0;
          return (
            <div className="bar-item" key={m.name}>
              <div className="lab-row">
                <div className="name">{m.name}</div>
                <div className={`delta ${down ? "down" : ""}`}>
                  {down ? "" : "+"}
                  {delta}%
                </div>
              </div>
              <div className="track">
                <div className="seg winter" style={{ width: `${wpct / 2}%` }}>
                  {inView && <span>H · {m.winter.toFixed(2)}</span>}
                </div>
                <div className="seg summer" style={{ width: `${spct / 2}%` }}>
                  {inView && <span>É · {m.summer.toFixed(2)}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          gap: 14,
          marginTop: 18,
          fontSize: 11,
          color: "var(--muted)",
          fontWeight: 500,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              background: "var(--blue-soft)",
            }}
          />{" "}
          Hiver (Déc–Fév)
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              background: "var(--neon)",
            }}
          />{" "}
          Été (Juin–Août)
        </div>
        <div
          style={{
            marginLeft: "auto",
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          n = 2 412 086 streams
        </div>
      </div>
    </section>
  );
}

/* ---------- EMOTIONS ---------- */
function EmotionsCard({ span = 7, idx = 0 }) {
  const { toast } = useApp();
  const [ref, inView] = useInView(0.2);
  const max = 100;
  return (
    <section
      ref={ref}
      className={`card col-${span}`}
      data-anim
      data-anim-index={idx}
      style={{ "--stagger-idx": idx }}
    >
      <div className="head">
        <div>
          <h3>Segmentation émotionnelle</h3>
          <div className="sub">
            % d'auditeurs primaires par cluster mood × saison
          </div>
        </div>
        <div className="actions">
          <button
            className="ico"
            aria-label="Options du graphique"
            onClick={() =>
              toast({
                title: "Options du graphique",
                desc: "Export CSV disponible.",
              })
            }
          >
            <Icon.more />
          </button>
        </div>
      </div>
      <div className="segchart">
        {SEED.emotions.map((e) => (
          <div className="group" key={e.name}>
            <div className="stack">
              <div
                className="col winter"
                title={`Hiver ${e.winter}%`}
                style={{ height: inView ? `${(e.winter / max) * 100}%` : 0 }}
              />
              <div
                className="col spring"
                title={`Printemps ${e.spring}%`}
                style={{ height: inView ? `${(e.spring / max) * 100}%` : 0 }}
              />
              <div
                className="col summer"
                title={`Été ${e.summer}%`}
                style={{ height: inView ? `${(e.summer / max) * 100}%` : 0 }}
              />
              <div
                className="col autumn"
                title={`Automne ${e.autumn}%`}
                style={{ height: inView ? `${(e.autumn / max) * 100}%` : 0 }}
              />
            </div>
            <div>
              <div className="lbl">{e.name}</div>
              <div className="sub">
                ↑ {Math.max(e.winter, e.spring, e.summer, e.autumn)}%
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="seg-legend">
        <div className="item">
          <div className="sw" style={{ background: "var(--blue)" }} /> Hiver
        </div>
        <div className="item">
          <div className="sw" style={{ background: "var(--mint)" }} /> Printemps
        </div>
        <div className="item">
          <div className="sw" style={{ background: "var(--neon)" }} /> Été
        </div>
        <div className="item">
          <div className="sw" style={{ background: "var(--warm)" }} /> Automne
        </div>
        <div
          className="item"
          style={{
            marginLeft: "auto",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 10,
          }}
        >
          Source · Million Song Dataset + Spotify Web API
        </div>
      </div>
    </section>
  );
}

/* ---------- STATS ---------- */
function StatsCard({ span = 5, idx = 0 }) {
  return (
    <section
      className={`card col-${span}`}
      data-anim
      data-anim-index={idx}
      style={{ "--stagger-idx": idx }}
    >
      <div className="head">
        <div>
          <h3>Chiffres clés</h3>
          <div className="sub">Synthèse Baromètre Data 2026</div>
        </div>
      </div>
      <div className="ministats">
        <div className="ministat neon">
          <div className="lab">Corrélation</div>
          <div className="big">70%</div>
          <div className="ctx">météo ↔ humeur d'achat</div>
          <div className="spark">
            <Icon.spark />
          </div>
        </div>
        <div className="ministat">
          <div className="lab">Panier moyen</div>
          <div className="big">
            +12<span style={{ fontSize: 18 }}>%</span>
          </div>
          <div className="ctx">les jours ensoleillés</div>
          <div className="spark">
            <Icon.spark />
          </div>
        </div>
        <div className="ministat dark">
          <div className="lab">Streams analysés</div>
          <div className="big">
            765<span style={{ fontSize: 18 }}>M</span>
          </div>
          <div className="ctx">tracks Spotify · 22 pays</div>
          <div className="spark" style={{ color: "var(--neon)" }}>
            <Icon.spark />
          </div>
        </div>
        <div className="ministat mint">
          <div className="lab">Lift campagne</div>
          <div className="big">
            +23<span style={{ fontSize: 18 }}>%</span>
          </div>
          <div className="ctx">vs ciblage classique</div>
          <div className="spark">
            <Icon.spark />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- FRAMEWORK ---------- */
function FrameworkCard({ setModal, span = 5, idx = 0 }) {
  const [active, setActive] = useState(2);
  const listRef = useRef(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion() || !listRef.current) return;
    const rows = listRef.current.querySelectorAll(".frw-row");
    const cleanups = [];
    const ctx = gsap.context(() => {
      rows.forEach((row) => {
        const onEnter = () =>
          gsap.to(row, {
            x: 6,
            duration: 0.2,
            ease: "power2.out",
            overwrite: "auto",
          });
        const onLeave = () =>
          gsap.to(row, {
            x: 0,
            duration: 0.2,
            ease: "power2.out",
            overwrite: "auto",
          });
        row.addEventListener("mouseenter", onEnter);
        row.addEventListener("mouseleave", onLeave);
        cleanups.push(() => {
          row.removeEventListener("mouseenter", onEnter);
          row.removeEventListener("mouseleave", onLeave);
        });
      });
    }, listRef);
    return () => {
      cleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, []);

  return (
    <section
      className={`card col-${span}`}
      data-anim
      data-anim-index={idx}
      style={{ "--stagger-idx": idx }}
    >
      <div className="head">
        <div>
          <h3>Le framework Baromètre Data</h3>
          <div className="sub">5 étapes · de la captation à l'activation</div>
        </div>
        <div className="actions">
          <button
            className="ico"
            aria-label="Détail du framework"
            onClick={() =>
              setModal({ idx: active, step: SEED.framework[active] })
            }
            title="Détail"
          >
            <Icon.arrow />
          </button>
        </div>
      </div>
      <div className="framework-list" ref={listRef}>
        {SEED.framework.map((f, i) => (
          <div
            key={i}
            className={`frw-row ${active === i ? "active" : ""}`}
            onClick={() => setActive(i)}
          >
            <div className="num">{String(i + 1).padStart(2, "0")}</div>
            <div>
              <div className="nm">{f.name}</div>
              <div className="dsc">{f.desc}</div>
            </div>
            <button
              className="ico arrow"
              aria-label={`Ouvrir l'étape ${i + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                setModal({ idx: i, step: f });
              }}
              style={{ background: "transparent", color: "inherit" }}
            >
              <Icon.chevron />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- TIMELINE ---------- */
function TimelineCard({ span = 8, idx = 0 }) {
  const months = [
    "Jan",
    "Fév",
    "Mar",
    "Avr",
    "Mai",
    "Jui",
    "Jul",
    "Aoû",
    "Sep",
    "Oct",
    "Nov",
    "Déc",
  ];
  const temp = [4, 5, 9, 13, 17, 21, 24, 24, 19, 14, 8, 5];
  const valence = [
    0.3, 0.32, 0.4, 0.52, 0.62, 0.72, 0.78, 0.77, 0.62, 0.5, 0.38, 0.31,
  ];

  const W = 600,
    H = 300,
    padL = 40,
    padR = 24,
    padT = 40,
    padB = 20;
  // Resserrement des axes pour amplifier les variations
  const tempMin = 0,
    tempMax = 30;
  const valMin = 0.25,
    valMax = 0.85;

  const x = (i) => padL + i * ((W - padL - padR) / (months.length - 1));
  const yT = (v) =>
    padT + (1 - (v - tempMin) / (tempMax - tempMin)) * (H - padT - padB);
  const yV = (v) =>
    padT + (1 - (v - valMin) / (valMax - valMin)) * (H - padT - padB);

  const tempPath = temp
    .map((t, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${yT(t)}`)
    .join(" ");
  const valPath = valence
    .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${yV(v)}`)
    .join(" ");
  const valArea = `${valPath} L ${x(11)} ${H - padB} L ${x(0)} ${H - padB} Z`;

  const [hover, setHover] = useState(null);
  const wrapRef = useRef(null);

  // Pic = index 6 (juillet). Si dans le quart supérieur, badge en dessous.
  const peakIdx = 6;
  const peakX = x(peakIdx);
  const peakY = yV(valence[peakIdx]);
  const badgeBelow = peakY < H / 4;
  const badgeY = badgeBelow ? peakY + 18 : peakY - 38;
  const connectorY1 = badgeBelow ? peakY + 6 : peakY - 6;
  const connectorY2 = badgeBelow ? badgeY : badgeY + 26;

  return (
    <section
      className={`card col-${span}`}
      data-anim
      data-anim-index={idx}
      style={{ "--stagger-idx": idx }}
    >
      <div className="head">
        <div>
          <h3>Corrélation Température × Valence · 2025</h3>
          <div className="sub">
            r = 0.82 · p &lt; 0.001 · décalage moyen 12 jours
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 14,
            fontSize: 11,
            color: "var(--muted)",
            fontWeight: 500,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 14,
                height: 3,
                background: "var(--warm)",
                borderRadius: 2,
              }}
            />{" "}
            Température °C
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 14,
                height: 3,
                background: "var(--ink)",
                borderRadius: 2,
              }}
            />{" "}
            Valence Spotify
          </div>
        </div>
      </div>
      <div className="timeline" ref={wrapRef} style={{ position: "relative" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "100%", display: "block" }}
        >
          <defs>
            <linearGradient id="grad-val" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4F24B" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#D4F24B" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grille horizontale */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
            <line
              key={i}
              x1={padL}
              x2={W - padR}
              y1={padT + p * (H - padT - padB)}
              y2={padT + p * (H - padT - padB)}
              stroke="#EFF1F5"
              strokeWidth="1"
              strokeDasharray={p === 0 || p === 1 ? "0" : "2 3"}
            />
          ))}

          {/* Labels Y (valence) */}
          {[valMax, (valMax + valMin) / 2, valMin].map((v, i) => (
            <text
              key={i}
              x={padL - 8}
              y={yV(v) + 3}
              fontSize="9"
              fill="#8A93A0"
              textAnchor="end"
              fontFamily="JetBrains Mono, monospace"
            >
              {v.toFixed(2)}
            </text>
          ))}

          {/* Aire valence */}
          <path d={valArea} fill="url(#grad-val)" />

          {/* Courbes */}
          <path
            d={valPath}
            stroke="#0E1116"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={tempPath}
            stroke="#F2D27A"
            strokeWidth="2.5"
            fill="none"
            strokeDasharray="5 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points + hit zones */}
          {valence.map((v, i) => {
            const cxp = x(i),
              cyp = yV(v);
            const isHover = hover === i;
            return (
              <g key={i}>
                <circle
                  cx={cxp}
                  cy={cyp}
                  r="3.5"
                  fill="#0E1116"
                  pointerEvents="none"
                />
                {isHover && (
                  <circle
                    cx={cxp}
                    cy={cyp}
                    r="6"
                    fill="#D4F24B"
                    stroke="#0E1116"
                    strokeWidth="2"
                    pointerEvents="none"
                    style={{ transition: "r .15s ease" }}
                  />
                )}
                <circle
                  cx={cxp}
                  cy={cyp}
                  r="10"
                  fill="transparent"
                  className="tl-dot"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                />
              </g>
            );
          })}

          {/* Badge PIC avec connecteur */}
          <g pointerEvents="none">
            <line
              x1={peakX}
              y1={connectorY1}
              x2={peakX}
              y2={connectorY2}
              stroke="#0E1116"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
            <circle
              cx={peakX}
              cy={peakY}
              r="9"
              fill="none"
              stroke="#D4F24B"
              strokeWidth="2"
            />
            <circle cx={peakX} cy={peakY} r="4" fill="#D4F24B" />
            <rect
              x={peakX - 36}
              y={badgeY}
              width="72"
              height="26"
              rx="8"
              fill="#0E1116"
            />
            <text
              x={peakX}
              y={badgeY + 17}
              fontSize="12"
              fill="#D4F24B"
              textAnchor="middle"
              fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
            >
              PIC · 0.78
            </text>
          </g>
        </svg>

        {hover !== null && (
          <div
            className="tl-tip"
            style={{
              left: `${(x(hover) / W) * 100}%`,
              top: `${(yV(valence[hover]) / H) * 100}%`,
            }}
          >
            <div className="m">{months[hover]} 2025</div>
            <div className="v">
              <span>Valence</span>
              <b>{valence[hover].toFixed(2)}</b>
            </div>
            <div className="v">
              <span>Température</span>
              <b>{temp[hover]}°C</b>
            </div>
          </div>
        )}
        <div className="month-labels">
          {months.map((m) => (
            <div key={m}>{m}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- HEATMAP ---------- */
function HeatmapCard({ span = 4, idx = 0 }) {
  const { toast } = useApp();
  const [selected, setSelected] = useState(null);
  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const cells = useMemo(() => {
    const out = [];
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 12; h++) {
        const intensity = Math.max(
          0,
          Math.sin((h / 11) * Math.PI) * (0.6 + ((d * 7 + h * 3) % 11) / 24),
        );
        out.push({ d, h, v: Math.min(1, intensity) });
      }
    }
    return out;
  }, []);
  const color = (v) => {
    if (v < 0.15) return "#EFF1F5";
    if (v < 0.35) return "#EAF3CC";
    if (v < 0.55) return "#DCEC8A";
    if (v < 0.75) return "#C9E257";
    return "#B5DA2E";
  };
  const sel = selected !== null ? cells[selected] : null;
  return (
    <section
      className={`card col-${span}`}
      data-anim
      data-anim-index={idx}
      style={{ "--stagger-idx": idx }}
    >
      <div className="head">
        <div>
          <h3>Densité d'écoute · S26</h3>
          <div className="sub">7j · 12h–24h · n = 86 412</div>
        </div>
        <div className="actions">
          <button
            className="ico"
            aria-label="Exporter la heatmap"
            onClick={() =>
              toast({
                title: "Heatmap exportée",
                desc: "PNG sauvegardé dans /exports.",
              })
            }
          >
            <Icon.more />
          </button>
        </div>
      </div>
      <div
        className="map-wrap"
        style={{ gridTemplateColumns: `repeat(12, 1fr)` }}
      >
        {cells.map((c, i) => (
          <button
            key={i}
            className={`heat ${selected === i ? "selected" : ""}`}
            style={{ background: color(c.v), border: "none", padding: 0 }}
            onClick={() => setSelected(i)}
            aria-label={`${days[c.d]} ${12 + c.h}h · ${(c.v * 100).toFixed(0)}%`}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 12,
          fontSize: 10,
          color: "var(--muted)",
          fontFamily: "JetBrains Mono, monospace",
        }}
      >
        {days.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      {sel && (
        <div className="heat-detail">
          <div>
            <div className="lab">
              {days[sel.d]} · {String(12 + sel.h).padStart(2, "0")}:00
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
              Cellule sélectionnée
            </div>
          </div>
          <div>
            <div className="lab" style={{ textAlign: "right" }}>
              Intensité
            </div>
            <div className="val" style={{ color: "var(--neon)", fontSize: 18 }}>
              {(sel.v * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 12,
          fontSize: 10,
          color: "var(--muted)",
        }}
      >
        Faible
        <div style={{ display: "flex", gap: 2 }}>
          {["#EFF1F5", "#EAF3CC", "#DCEC8A", "#C9E257", "#B5DA2E"].map((c) => (
            <div
              key={c}
              style={{ width: 14, height: 8, borderRadius: 2, background: c }}
            />
          ))}
        </div>
        Intense
      </div>
    </section>
  );
}

/* ---------- CTA ---------- */
function CTACard({ span = 12, idx = 0 }) {
  const { toast } = useApp();
  return (
    <section
      className={`card cta col-${span}`}
      data-anim
      data-anim-index={idx}
      style={{ "--stagger-idx": idx }}
    >
      <div>
        <h3>Téléchargez le livre blanc complet</h3>
        <p>
          62 pages · méthodologie, datasets, code Python d'extraction Spotify,
          et 9 cas d'usage activables en marketing prédictif.
        </p>
      </div>
      <button
        className="btn"
        onClick={() =>
          toast({
            title: "Téléchargement lancé",
            desc: "Baromètre-Data-2026.pdf · 4.2 Mo",
          })
        }
      >
        Télécharger le PDF (4.2 Mo){" "}
        <span className="arrow">
          <Icon.arrowDown />
        </span>
      </button>
    </section>
  );
}

/* ---------- METHODOLOGY ---------- */
function MethodologyCard({ span = 7, idx = 0 }) {
  const { toast } = useApp();
  const sources = [
    {
      nm: "Open-Meteo",
      kind: "Météo",
      vol: "156 · villes",
      accent: "var(--warm)",
    },
    {
      nm: "Spotify Web API",
      kind: "Audio features",
      vol: "2,4 M · streams",
      accent: "var(--neon)",
    },
    {
      nm: "INSEE",
      kind: "Démographie",
      vol: "22 · régions",
      accent: "var(--blue)",
    },
    {
      nm: "Shopify panel",
      kind: "Transactions",
      vol: "512 K · sessions",
      accent: "var(--mint)",
    },
  ];
  const methods = [
    ["Corrélation", "Pearson r, lag 0–30 j"],
    ["Modélisation", "Régression multivariée + ARIMA"],
    ["Clustering", "k-means · k = 4 (clusters mood)"],
    ["Validation", "5-fold CV · p < 0.001"],
  ];
  return (
    <section
      className={`card col-${span}`}
      data-anim
      data-anim-index={idx}
      style={{ "--stagger-idx": idx }}
    >
      <div className="head">
        <div>
          <h3>Méthodologie & sources</h3>
          <div className="sub">18 mois de captation · 4 datasets croisés</div>
        </div>
        <div className="actions">
          <button
            className="ico"
            aria-label="Voir la documentation"
            onClick={() =>
              toast({
                title: "Documentation technique",
                desc: "Notebook Jupyter exporté vers /docs.",
              })
            }
          >
            <Icon.doc />
          </button>
          <button
            className="ico"
            aria-label="Détail des sources"
            onClick={() =>
              toast({
                title: "Liens des sources",
                desc: "Toutes les APIs sont publiques ou licenciées.",
              })
            }
          >
            <Icon.arrow />
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginTop: 6,
        }}
      >
        {sources.map((s) => (
          <button
            key={s.nm}
            onClick={() => toast({ title: s.nm, desc: `${s.kind} · ${s.vol}` })}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              background: "var(--line-2)",
              border: "none",
              borderRadius: 14,
              textAlign: "left",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "background .15s",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: s.accent,
                flex: "0 0 auto",
              }}
            />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--ink)",
                  lineHeight: 1.1,
                }}
              >
                {s.nm}
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: 10,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight: 600,
                  marginTop: 3,
                }}
              >
                {s.kind}
              </span>
            </span>
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 11,
                fontWeight: 700,
                color: "var(--ink)",
              }}
            >
              {s.vol}
            </span>
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginTop: 14,
          paddingTop: 14,
          borderTop: "1px solid var(--line)",
        }}
      >
        {methods.map(([k, v]) => (
          <div key={k}>
            <div
              style={{
                fontSize: 10,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 700,
                marginBottom: 3,
              }}
            >
              {k}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--ink)",
                lineHeight: 1.3,
              }}
            >
              {v}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- DATASET VIEW ---------- */
function DatasetView() {
  const { toast } = useApp();
  const rows = [
    {
      date: "2025-01-15",
      city: "Paris",
      t: 3.4,
      sun: 1.2,
      val: 0.31,
      en: 0.46,
      bpm: 102,
      mood: "Mélancolie",
    },
    {
      date: "2025-02-12",
      city: "Lyon",
      t: 5.1,
      sun: 2.0,
      val: 0.34,
      en: 0.5,
      bpm: 106,
      mood: "Mélancolie",
    },
    {
      date: "2025-03-20",
      city: "Paris",
      t: 9.8,
      sun: 4.6,
      val: 0.44,
      en: 0.58,
      bpm: 110,
      mood: "Zen",
    },
    {
      date: "2025-04-08",
      city: "Marseille",
      t: 15.2,
      sun: 7.1,
      val: 0.58,
      en: 0.66,
      bpm: 114,
      mood: "Zen",
    },
    {
      date: "2025-05-22",
      city: "Bordeaux",
      t: 19.4,
      sun: 8.8,
      val: 0.66,
      en: 0.72,
      bpm: 116,
      mood: "Euphorie",
    },
    {
      date: "2025-06-18",
      city: "Paris",
      t: 23.1,
      sun: 9.5,
      val: 0.74,
      en: 0.79,
      bpm: 118,
      mood: "Euphorie",
    },
    {
      date: "2025-07-09",
      city: "Nice",
      t: 27.8,
      sun: 11.2,
      val: 0.81,
      en: 0.84,
      bpm: 122,
      mood: "Euphorie",
    },
    {
      date: "2025-08-14",
      city: "Lyon",
      t: 26.5,
      sun: 10.4,
      val: 0.78,
      en: 0.82,
      bpm: 120,
      mood: "Euphorie",
    },
    {
      date: "2025-09-25",
      city: "Paris",
      t: 18.7,
      sun: 6.5,
      val: 0.63,
      en: 0.68,
      bpm: 115,
      mood: "Zen",
    },
    {
      date: "2025-10-12",
      city: "Lille",
      t: 13.2,
      sun: 3.8,
      val: 0.49,
      en: 0.61,
      bpm: 110,
      mood: "Zen",
    },
    {
      date: "2025-11-05",
      city: "Paris",
      t: 8.4,
      sun: 2.1,
      val: 0.39,
      en: 0.54,
      bpm: 106,
      mood: "Mélancolie",
    },
    {
      date: "2025-12-20",
      city: "Strasbourg",
      t: 2.1,
      sun: 0.9,
      val: 0.3,
      en: 0.45,
      bpm: 100,
      mood: "Mélancolie",
    },
  ];
  return (
    <div className="bento">
      <section
        className="card data-card col-12"
        data-anim
        data-anim-index={0}
        style={{ "--stagger-idx": 0 }}
      >
        <div className="hd">
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>
              Dataset agrégé · 2025
            </h3>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
              12 mois · 22 villes · 4 métriques Spotify · 8 variables météo
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="pill-btn"
              onClick={() =>
                toast({ title: "Filtre dataset", desc: "Mois × ville activé." })
              }
            >
              <Icon.filter /> Filtrer
            </button>
            <button
              className="pill-btn dark"
              onClick={() =>
                toast({
                  title: "Export CSV lancé",
                  desc: "barometre-data-2025.csv · ~1.8 Mo",
                })
              }
            >
              <Icon.download /> Exporter CSV
            </button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Ville</th>
              <th>T°C</th>
              <th>Soleil h</th>
              <th>Valence</th>
              <th>Energy</th>
              <th>BPM</th>
              <th>Cluster mood</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.date + r.city}>
                <td>{r.date}</td>
                <td>{r.city}</td>
                <td>{r.t.toFixed(1)}</td>
                <td>{r.sun.toFixed(1)}</td>
                <td>
                  <MiniBar
                    progress={Math.round(r.val * 100)}
                    color="var(--neon)"
                    label={`Valence ${r.val}`}
                  />
                </td>
                <td>
                  <MiniBar
                    progress={Math.round(r.en * 100)}
                    color="var(--blue)"
                    label={`Energy ${r.en}`}
                  />
                </td>
                <td>{r.bpm}</td>
                <td>
                  <span
                    className={`badge ${r.mood === "Mélancolie" || r.mood === "Zen" ? "cool" : ""}`}
                  >
                    {r.mood}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

/* ---------- REPORT VIEW ---------- */
function ReportView({ setModal }) {
  const { toast } = useApp();
  return (
    <div className="bento">
      <HeroCard span={8} idx={0} />
      <section
        className="card col-4"
        data-anim
        data-anim-index={1}
        style={{ "--stagger-idx": 1 }}
      >
        <div className="head">
          <div>
            <h3>Sommaire</h3>
            <div className="sub">62 pages · 7 chapitres</div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginTop: 6,
          }}
        >
          {[
            ["01", "Introduction & hypothèse"],
            ["02", "Méthodologie"],
            ["03", "Datasets sources"],
            ["04", "Corrélations & résultats"],
            ["05", "Framework Baromètre Data"],
            ["06", "Cas d'usage marketing"],
            ["07", "Vers l'agent IA contextuel"],
          ].map(([n, t]) => (
            <button
              key={n}
              onClick={() => toast({ title: `Chapitre ${n}`, desc: t })}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                background: "var(--line-2)",
                border: "none",
                borderRadius: 14,
                textAlign: "left",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              <span
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 11,
                  color: "var(--muted)",
                  fontWeight: 700,
                }}
              >
                {n}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>
                {t}
              </span>
              <Icon.chevron />
            </button>
          ))}
        </div>
      </section>
      <FrameworkCard setModal={setModal} span={7} idx={2} />
      <StatsCard span={5} idx={3} />
      <MethodologyCard span={12} idx={4} />
      <CTACard span={12} idx={5} />
    </div>
  );
}

/* ---------- DASHBOARD VIEW (filtered by section) ---------- */
function DashboardView({ section, setModal }) {
  const make = (key, span, idx) => {
    switch (key) {
      case "hero":
        return <HeroCard key="hero" span={span} idx={idx} />;
      case "signal":
        return <SignalCard key="signal" span={span} idx={idx} />;
      case "radar":
        return <RadarCard key="radar" span={span} idx={idx} />;
      case "metrics":
        return <MetricsCard key="metrics" span={span} idx={idx} />;
      case "emotions":
        return <EmotionsCard key="emotions" span={span} idx={idx} />;
      case "stats":
        return <StatsCard key="stats" span={span} idx={idx} />;
      case "framework":
        return (
          <FrameworkCard
            key="framework"
            span={span}
            idx={idx}
            setModal={setModal}
          />
        );
      case "methodology":
        return <MethodologyCard key="methodology" span={span} idx={idx} />;
      case "timeline":
        return <TimelineCard key="timeline" span={span} idx={idx} />;
      case "heatmap":
        return <HeatmapCard key="heatmap" span={span} idx={idx} />;
      case "cta":
        return <CTACard key="cta" span={span} idx={idx} />;
      default:
        return null;
    }
  };
  // Chaque layout : tableau de [name, span]. Sommes par ligne = 12.
  const layouts = {
    grid: [
      ["hero", 8],
      ["signal", 4],
      ["radar", 5],
      ["metrics", 7],
      ["emotions", 7],
      ["stats", 5],
      ["framework", 5],
      ["methodology", 7],
      ["timeline", 8],
      ["heatmap", 4],
      ["cta", 12],
    ],
    chart: [
      ["radar", 5],
      ["metrics", 7],
      ["emotions", 7],
      ["stats", 5],
      ["timeline", 8],
      ["heatmap", 4],
    ],
    doc: [
      ["hero", 8],
      ["heatmap", 4],
      ["methodology", 7],
      ["framework", 5],
      ["stats", 12],
      ["cta", 12],
    ],
    music: [
      ["radar", 5],
      ["metrics", 7],
      ["emotions", 7],
      ["stats", 5],
      ["heatmap", 12],
    ],
    weather: [
      ["signal", 4],
      ["timeline", 8],
      ["heatmap", 5],
      ["stats", 7],
      ["methodology", 12],
    ],
  };
  const order = layouts[section] || layouts.grid;
  return (
    <div className="bento">{order.map(([k, sp], i) => make(k, sp, i))}</div>
  );
}

/* ---------- ANIMATED VIEW (transitions + stagger + counters + hover) ---------- */
function AnimatedView({ animKey, children }) {
  const wrapRef = useRef(null);
  const [state, setState] = useState({ k: animKey, c: children });
  const firstRef = useRef(true);

  // Outgoing transition + content swap
  useLayoutEffect(() => {
    if (firstRef.current) {
      setState({ k: animKey, c: children });
      return;
    }
    if (animKey === state.k) {
      setState({ k: animKey, c: children });
      return;
    }
    if (prefersReducedMotion() || !wrapRef.current) {
      setState({ k: animKey, c: children });
      return;
    }
    const tween = gsap.to(wrapRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.18,
      ease: "power2.in",
      onComplete: () => setState({ k: animKey, c: children }),
    });
    return () => tween.kill();
  }, [animKey, children]);

  // Incoming transition + stagger entry + counters + card hover
  useLayoutEffect(() => {
    if (!wrapRef.current) return;
    const wasFirst = firstRef.current;
    firstRef.current = false;
    const reduce = prefersReducedMotion();

    const root = wrapRef.current;
    const cards = root.querySelectorAll("[data-anim]");
    const cleanups = [];

    const ctx = gsap.context(() => {
      if (reduce) {
        gsap.set(root, { opacity: 1, y: 0, clearProps: "transform,opacity" });
        gsap.set(cards, {
          opacity: 1,
          y: 0,
          scale: 1,
          clearProps: "transform,opacity",
        });
        return;
      }

      if (wasFirst) {
        gsap.set(root, { opacity: 1, y: 0 });
      } else {
        gsap.fromTo(
          root,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.28, delay: 0.06, ease: "power2.out" },
        );
      }

      gsap.set(cards, { opacity: 0, y: 40, scale: 0.97 });
      ScrollTrigger.batch(cards, {
        start: "top 92%",
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            ease: "power2.out",
            stagger: 0.07,
            onStart: () => batch.forEach(animateCounters),
          });
        },
      });
      ScrollTrigger.refresh();

      cards.forEach((card) => {
        const onEnter = () =>
          gsap.to(card, {
            y: -4,
            boxShadow: "0 18px 50px rgba(14,17,22,0.13)",
            duration: 0.25,
            ease: "power2.out",
            overwrite: "auto",
          });
        const onLeave = () =>
          gsap.to(card, {
            y: 0,
            boxShadow: "0 6px 28px rgba(14,17,22,0.06)",
            duration: 0.4,
            ease: "power2.out",
            overwrite: "auto",
          });
        card.addEventListener("mouseenter", onEnter);
        card.addEventListener("mouseleave", onLeave);
        cleanups.push(() => {
          card.removeEventListener("mouseenter", onEnter);
          card.removeEventListener("mouseleave", onLeave);
        });
      });
    }, wrapRef);

    return () => {
      cleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, [state.k]);

  return <div ref={wrapRef}>{state.c}</div>;
}

/* ---------- APP ---------- */
function App() {
  const [view, setView] = useState("dashboard");
  const [section, setSection] = useState("grid");
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const toast = useCallback(({ title, desc }) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, title, desc }]);
    setTimeout(
      () =>
        setToasts((t) =>
          t.map((x) => (x.id === id ? { ...x, leaving: true } : x)),
        ),
      3000,
    );
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  // scroll progress
  useEffect(() => {
    const sp = document.getElementById("sp");
    const onScroll = () => {
      const h = document.documentElement;
      const p =
        (h.scrollTop || document.body.scrollTop) /
        (h.scrollHeight - h.clientHeight);
      sp.style.width = `${Math.min(100, Math.max(0, p * 100))}%`;
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // keyboard: cmd+k for search (modal/search overlays own their own ESC)
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <AppCtx.Provider value={{ toast }}>
      <div className="app">
        <Sidebar section={section} setSection={setSection} />
        <main className="main">
          <Topbar
            view={view}
            setView={setView}
            openSearch={() => setSearchOpen(true)}
            section={section}
            setSection={setSection}
          />
          <PageHead view={view} openSearch={() => setSearchOpen(true)} />

          <AnimatedView
            animKey={view === "dashboard" ? `dash-${section}` : view}
          >
            {view === "dashboard" && (
              <DashboardView section={section} setModal={setModal} />
            )}
            {view === "dataset" && <DatasetView />}
            {view === "report" && <ReportView setModal={setModal} />}
          </AnimatedView>

          <div className="foot">
            <span>BAROMÈTRE DATA · M2 DATA MARKETING IA · 2026</span>
            <span>
              <span className="dot">●</span> Source : Spotify Web API ·
              Open-Meteo · INSEE
            </span>
            <span>v1.2.0 · build #5274</span>
          </div>
        </main>
      </div>

      <ToastStack toasts={toasts} remove={removeToast} />
      {modal && (
        <FrameworkModal
          step={modal.step}
          idx={modal.idx}
          onClose={() => setModal(null)}
        />
      )}
      {searchOpen && (
        <SearchOverlay onClose={() => setSearchOpen(false)} setView={setView} />
      )}
    </AppCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
