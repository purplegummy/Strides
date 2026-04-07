import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCircle2, MapPinned, Sparkles, Trophy, X } from "lucide-react";

type CelebrationType = "level" | "achievement" | "quest" | "nearby";

type CelebrationPopoutProps = {
  open: boolean;
  type?: CelebrationType;
  title: string;
  shortText: string;
  message: string;
  submessage?: string;
  onClose: () => void;
};

type ConfettiPiece = {
  id: number;
  x: number;
  y: number;
  rotate: number;
  duration: number;
  delay: number;
  size: number;
};

function playCelebrationChime() {
  if (typeof window === "undefined") return;

  const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99];

  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + index * 0.06);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1800, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02 + index * 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26 + index * 0.06);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + index * 0.06);
    osc.stop(now + 0.32 + index * 0.06);
  });

  window.setTimeout(() => {
    void ctx.close();
  }, 700);
}

function buildConfettiBurst(count = 22): ConfettiPiece[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + Date.now(),
    x: (Math.random() - 0.5) * 260,
    y: 90 + Math.random() * 120,
    rotate: (Math.random() - 0.5) * 720,
    duration: 0.9 + Math.random() * 0.7,
    delay: Math.random() * 0.08,
    size: 8 + Math.random() * 10,
  }));
}

function ConfettiBurst({ pieces }: { pieces: ConfettiPiece[] }) {
  const colors = [
    "bg-cyan-300",
    "bg-yellow-300",
    "bg-fuchsia-300",
    "bg-emerald-300",
    "bg-orange-300",
    "bg-white",
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {pieces.map((piece, index) => (
        <motion.span
          key={piece.id}
          initial={{ opacity: 0, x: 0, y: 0, rotate: 0, scale: 0.6 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: piece.x,
            y: piece.y,
            rotate: piece.rotate,
            scale: [0.6, 1, 1, 0.9],
          }}
          transition={{ duration: piece.duration, delay: piece.delay, ease: "easeOut" }}
          className={`absolute left-1/2 top-[72%] rounded-sm ${colors[index % colors.length]}`}
          style={{ width: piece.size, height: Math.max(6, piece.size * 0.56) }}
        />
      ))}
    </div>
  );
}

const typeStyles: Record<
  CelebrationType,
  {
    icon: typeof Trophy;
    chip: string;
    glow: string;
    accent: string;
    badge: string;
    label: string;
  }
> = {
  level: {
    icon: Sparkles,
    chip: "from-cyan-400 to-blue-500",
    glow: "shadow-[0_0_40px_rgba(34,211,238,0.28)]",
    accent: "text-cyan-300",
    badge: "LV 1",
    label: "Level Up",
  },
  achievement: {
    icon: Trophy,
    chip: "from-yellow-400 to-orange-500",
    glow: "shadow-[0_0_40px_rgba(250,204,21,0.26)]",
    accent: "text-yellow-300",
    badge: "A1",
    label: "Achievement",
  },
  quest: {
    icon: CheckCircle2,
    chip: "from-emerald-400 to-green-500",
    glow: "shadow-[0_0_40px_rgba(74,222,128,0.22)]",
    accent: "text-emerald-300",
    badge: "Q+",
    label: "Quest Complete",
  },
  nearby: {
    icon: MapPinned,
    chip: "from-fuchsia-400 to-purple-500",
    glow: "shadow-[0_0_40px_rgba(217,70,239,0.22)]",
    accent: "text-fuchsia-300",
    badge: "NEW",
    label: "Nearby",
  },
};

export function CelebrationPopout({
  open,
  type = "achievement",
  title,
  shortText,
  message,
  submessage,
  onClose,
}: CelebrationPopoutProps) {
  const [expanded, setExpanded] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const hasPlayedOpenSound = useRef(false);
  const config = typeStyles[type];
  const Icon = config.icon;
  const burstSeed = useMemo(() => buildConfettiBurst(), [title, shortText, type]);

  useEffect(() => {
    if (!open) {
      setExpanded(false);
      setConfettiPieces([]);
      hasPlayedOpenSound.current = false;
      return;
    }

    if (!hasPlayedOpenSound.current) {
      hasPlayedOpenSound.current = true;
      playCelebrationChime();
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -18, scale: 0.96 }}
          transition={{ duration: 0.28 }}
          className="fixed left-1/2 top-5 z-50 -translate-x-1/2"
        >
          <motion.div
            layout
            onClick={() => setExpanded(true)}
            className={[
              "relative w-[360px] cursor-pointer overflow-hidden rounded-[28px] border border-white/15",
              "bg-slate-950/85 text-white backdrop-blur-xl",
              config.glow,
            ].join(" ")}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_45%)]" />
            <AnimatePresence>
              {confettiPieces.length > 0 ? <ConfettiBurst pieces={confettiPieces} /> : null}
            </AnimatePresence>
            <div className="relative">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${config.chip}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-[0.25em] text-white/50">
                    Congratulations
                  </p>
                  <p className="truncate text-sm font-semibold">{shortText}</p>
                </div>

                <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
                  Tap
                </div>
              </div>

              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    key="expanded"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28 }}
                    className="overflow-hidden border-t border-white/10"
                  >
                    <div className="grid gap-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${config.accent}`}>
                            {config.label}
                          </p>
                          <h2 className="mt-1 text-2xl font-bold leading-tight">{title}</h2>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfettiPieces(burstSeed);
                            playCelebrationChime();
                            window.setTimeout(() => {
                              onClose();
                              setConfettiPieces([]);
                            }, 820);
                          }}
                          className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-[88px_1fr] gap-4">
                        <div className="relative flex h-[88px] w-[88px] items-center justify-center rounded-[24px] border border-white/10 bg-white/5">
                          <div className={`absolute inset-3 rounded-[18px] bg-gradient-to-br ${config.chip} opacity-90`} />
                          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.22),transparent_58%)]" />
                          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/25 bg-slate-950/50 text-sm font-black tracking-widest text-white">
                            {config.badge}
                          </div>
                        </div>

                        <div className="flex flex-col justify-center">
                          <p className="text-sm leading-6 text-white/88">{message}</p>
                          {submessage ? (
                            <p className="mt-2 text-xs leading-5 text-white/55">{submessage}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                          }}
                          className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:scale-[1.02]"
                        >
                          Nice
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpanded(false);
                          }}
                          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10"
                        >
                          Collapse
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DemoButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={() => {
        playCelebrationChime();
        onClick();
      }}
      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
    >
      {label}
    </button>
  );
}

export default function CelebrationPopoutDemo() {
  const [active, setActive] = useState<null | {
    type: CelebrationType;
    title: string;
    shortText: string;
    message: string;
    submessage?: string;
  }>(null);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#0f172a_0%,#020617_58%,#000_100%)] p-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">Strides UI Demo</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Celebration Popout Preview</h1>
          <p className="mt-3 max-w-2xl text-base text-white/65">
            This shows the exact vibe you described: a small congratulatory banner at the top that expands into a richer reward card when tapped.
          </p>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md">
          <div className="mb-4 flex items-center gap-3 text-white/75">
            <Bell className="h-5 w-5" />
            <p className="text-sm">Trigger a sample celebration popout</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <DemoButton
              label="Level Up"
              onClick={() =>
                setActive({
                  type: "level",
                  title: "Level 1 Reached",
                  shortText: "You reached Level 1",
                  message:
                    "Thanks for exploring the map. More rewards and milestones unlock as you discover new areas.",
                })
              }
            />
            <DemoButton
              label="Achievement"
              onClick={() =>
                setActive({
                  type: "achievement",
                  title: "First Steps",
                  shortText: "Achievement Unlocked",
                  message:
                    "You explored your first section of the map. Keep moving to uncover hidden rewards and rare pins.",
                })
              }
            />
            <DemoButton
              label="Quest Complete"
              onClick={() =>
                setActive({
                  type: "quest",
                  title: "Quest Completed",
                  shortText: "Downtown Sweep finished",
                  message:
                    "You cleared the nearby challenge and earned progress toward your next exploration streak reward.",
                })
              }
            />
            <DemoButton
              label="Nearby Discovery"
              onClick={() =>
                setActive({
                  type: "nearby",
                  title: "New Quest Nearby",
                  shortText: "Something new is close",
                  message:
                    "A fresh challenge appeared within range. Head toward the marker to reveal more details.",
                })
              }
            />
          </div>
        </div>
      </div>

      <CelebrationPopout
        open={!!active}
        type={active?.type}
        title={active?.title ?? ""}
        shortText={active?.shortText ?? ""}
        message={active?.message ?? ""}
        submessage={active?.submessage}
        onClose={() => setActive(null)}
      />
    </div>
  );
}
