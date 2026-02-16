"use client";

import { useEffect, useRef, useState } from "react";
import { getRarity, RARITY_CONFIG } from "~/app/_components/pin-rarity";
import type { PinData } from "~/app/_components/PinMarker";

interface PinSheetProps {
  pin: PinData | null;
  currentUserId: string;
  onClose: () => void;
  onUpvote: (pinId: string) => void;
  onUndoUpvote: (pinId: string) => void;
  onEdit?: (pin: PinData) => void;
  onDelete?: (pinId: string) => void;
  isUpvoting?: boolean;
  isDeleting?: boolean;
}

export function PinSheet({
  pin,
  currentUserId,
  onClose,
  onUpvote,
  onUndoUpvote,
  onEdit,
  onDelete,
  isUpvoting,
  isDeleting,
}: PinSheetProps) {
  const [visible, setVisible] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Optimistic local state so upvote feels instant
  const [optimisticMyUpvotes, setOptimisticMyUpvotes] = useState(0);
  const [optimisticTotal, setOptimisticTotal] = useState(0);

  // Sync optimistic state whenever the server pin data changes
  useEffect(() => {
    if (pin) {
      setOptimisticMyUpvotes(pin.myUpvotes);
      setOptimisticTotal(pin.upvotes);
    }
  }, [pin?.id, pin?.myUpvotes, pin?.upvotes]);

  useEffect(() => {
    if (pin) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      setConfirmDelete(false);
    }
  }, [pin]);

  if (!pin) return null;

  const rarity = getRarity(optimisticTotal);
  const cfg = RARITY_CONFIG[rarity];
  const isOwner = pin.createdById === currentUserId;
  const canUpvote = optimisticMyUpvotes < 2;
  const hasUpvoted = optimisticMyUpvotes > 0;

  const handleUpvote = () => {
    if (!canUpvote) return;
    setOptimisticMyUpvotes((v) => v + 1);
    setOptimisticTotal((v) => v + 1);
    onUpvote(pin.id);
  };

  const handleUndo = () => {
    if (!hasUpvoted) return;
    setOptimisticMyUpvotes((v) => Math.max(0, v - 1));
    setOptimisticTotal((v) => Math.max(0, v - 1));
    onUndoUpvote(pin.id);
  };

  const handleDeleteClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      // Auto-cancel confirm after 3s
      setTimeout(() => setConfirmDelete(false), 3000);
    } else {
      onDelete?.(pin.id);
    }
  };

  return (
    <>
      <style>{sheetCss}</style>

      {/* Backdrop */}
      <div
        ref={overlayRef}
        className={`pin-sheet-backdrop ${visible ? "pin-sheet-backdrop--visible" : ""}`}
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div
        className={`pin-sheet ${visible ? "pin-sheet--visible" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={pin.title}
      >
        <div className="pin-sheet-handle" />

        {/* Rarity banner */}
        <div className="pin-sheet-rarity-bar" style={{ background: cfg.color + "22", borderColor: cfg.color + "44" }}>
          <span className="pin-sheet-rarity-dot" style={{ background: cfg.color, boxShadow: `0 0 8px ${cfg.glow}` }} />
          <span className="pin-sheet-rarity-label" style={{ color: cfg.color }}>{cfg.label}</span>
          <span className="pin-sheet-upvote-count">
            {optimisticTotal} {optimisticTotal === 1 ? "upvote" : "upvotes"}
          </span>
        </div>

        {/* Content */}
        <div className="pin-sheet-content">
          <h2 className="pin-sheet-title">{pin.title}</h2>
          {pin.description && (
            <p className="pin-sheet-description">{pin.description}</p>
          )}
          {pin.creatorName && (
            <p className="pin-sheet-creator">📍 Placed by {pin.creatorName}</p>
          )}
        </div>

        {/* Actions */}
        <div className="pin-sheet-actions">
          {/* Upvote */}
          <div className="pin-sheet-upvote-wrap">
            <button
              type="button"
              disabled={!canUpvote || isUpvoting}
              onClick={handleUpvote}
              className={`pin-sheet-upvote-btn ${hasUpvoted ? "pin-sheet-upvote-btn--active" : ""}`}
              style={hasUpvoted ? { borderColor: cfg.color + "88", color: cfg.color } : {}}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={hasUpvoted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
              {canUpvote ? "Upvote" : "Max votes"}
            </button>

            {/* 2-pip indicator */}
            <div className="pin-sheet-pips">
              {[0, 1].map((i) => (
                <span
                  key={i}
                  className="pin-sheet-pip"
                  style={{
                    background: i < optimisticMyUpvotes ? cfg.color : "rgba(255,255,255,0.12)",
                    boxShadow: i < optimisticMyUpvotes ? `0 0 6px ${cfg.glow}` : "none",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Undo */}
          {hasUpvoted && (
            <button
              type="button"
              onClick={handleUndo}
              disabled={isUpvoting}
              className="pin-sheet-undo-btn"
            >
              Undo
            </button>
          )}

          {/* Edit — owner only */}
          {isOwner && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(pin)}
              className="pin-sheet-edit-btn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
          )}

          {/* Delete — owner only */}
          {isOwner && onDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className={`pin-sheet-delete-btn ${confirmDelete ? "pin-sheet-delete-btn--confirm" : ""}`}
            >
              {isDeleting ? (
                <span className="pin-sheet-spinner" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              )}
              {confirmDelete ? "Confirm?" : "Delete"}
            </button>
          )}

          <button type="button" onClick={onClose} className="pin-sheet-close-btn">✕</button>
        </div>
      </div>
    </>
  );
}

const sheetCss = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;800&family=Space+Mono&display=swap');

  .pin-sheet-backdrop {
    position: fixed; inset: 0; z-index: 40;
    background: rgba(0,0,0,0);
    transition: background 0.25s;
    pointer-events: none;
  }
  .pin-sheet-backdrop--visible {
    background: rgba(0,0,0,0.4);
    pointer-events: auto;
  }

  .pin-sheet {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    z-index: 50;
    background: rgba(8,11,22,0.97);
    backdrop-filter: blur(20px);
    border-top: 1px solid rgba(255,255,255,0.08);
    border-radius: 24px 24px 0 0;
    padding: 12px 20px 100px;
    transform: translateY(100%);
    transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
    box-shadow: 0 -20px 60px rgba(0,0,0,0.6);
    font-family: 'Syne', sans-serif;
    color: #e8f0ff;
  }
  .pin-sheet--visible { transform: translateY(0); }

  .pin-sheet-handle {
    width: 40px; height: 4px;
    border-radius: 2px;
    background: rgba(255,255,255,0.15);
    margin: 0 auto 16px;
  }

  .pin-sheet-rarity-bar {
    display: flex; align-items: center; gap: 8px;
    border: 1px solid; border-radius: 12px;
    padding: 8px 12px; margin-bottom: 16px;
  }
  .pin-sheet-rarity-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .pin-sheet-rarity-label {
    font-family: 'Space Mono', monospace; font-size: 11px;
    font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  }
  .pin-sheet-upvote-count {
    font-family: 'Space Mono', monospace; font-size: 11px;
    color: rgba(255,255,255,0.4); margin-left: auto;
    transition: color 0.2s;
  }

  .pin-sheet-content { margin-bottom: 20px; }
  .pin-sheet-title { font-size: 22px; font-weight: 800; line-height: 1.2; margin-bottom: 8px; color: #f0f6ff; }
  .pin-sheet-description { font-size: 14px; line-height: 1.6; color: rgba(200,215,255,0.65); margin-bottom: 10px; }
  .pin-sheet-creator { font-family: 'Space Mono', monospace; font-size: 11px; color: rgba(180,200,255,0.4); }

  .pin-sheet-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

  .pin-sheet-upvote-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .pin-sheet-upvote-btn {
    display: flex; align-items: center; gap: 7px;
    padding: 10px 18px; border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    color: rgba(200,220,255,0.7);
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: all 0.15s; white-space: nowrap;
  }
  .pin-sheet-upvote-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); color: #fff; }
  .pin-sheet-upvote-btn--active { background: rgba(255,255,255,0.08); }
  .pin-sheet-upvote-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .pin-sheet-pips { display: flex; gap: 5px; }
  .pin-sheet-pip { display: block; width: 18px; height: 4px; border-radius: 2px; transition: background 0.2s, box-shadow 0.2s; }

  .pin-sheet-undo-btn {
    padding: 10px 14px; border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.08);
    background: transparent; color: rgba(200,220,255,0.4);
    font-family: 'Space Mono', monospace; font-size: 12px;
    cursor: pointer; transition: all 0.15s;
  }
  .pin-sheet-undo-btn:hover { color: rgba(200,220,255,0.7); border-color: rgba(255,255,255,0.15); }

  .pin-sheet-edit-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 14px; border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.08);
    background: transparent; color: rgba(200,220,255,0.5);
    font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.15s;
  }
  .pin-sheet-edit-btn:hover { color: #fff; border-color: rgba(255,255,255,0.2); }

  .pin-sheet-delete-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 14px; border-radius: 14px;
    border: 1px solid rgba(255,80,80,0.2);
    background: transparent; color: rgba(255,100,100,0.5);
    font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
  }
  .pin-sheet-delete-btn:hover:not(:disabled) { color: #ff6060; border-color: rgba(255,80,80,0.45); background: rgba(255,60,60,0.08); }
  .pin-sheet-delete-btn--confirm {
    background: rgba(255,60,60,0.15);
    border-color: rgba(255,80,80,0.6);
    color: #ff7070;
    animation: confirm-pulse 0.4s ease;
  }
  @keyframes confirm-pulse {
    0%,100% { transform: scale(1); }
    50%      { transform: scale(1.05); }
  }
  .pin-sheet-delete-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .pin-sheet-spinner {
    display: inline-block; width: 14px; height: 14px;
    border: 2px solid rgba(255,100,100,0.3);
    border-top-color: #ff6060; border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .pin-sheet-close-btn {
    margin-left: auto; width: 40px; height: 40px;
    border-radius: 50%; border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.05); color: rgba(200,220,255,0.4);
    font-size: 14px; cursor: pointer; display: grid; place-items: center;
    transition: all 0.15s;
  }
  .pin-sheet-close-btn:hover { color: #fff; background: rgba(255,255,255,0.1); }
`;