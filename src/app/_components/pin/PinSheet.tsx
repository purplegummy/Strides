"use client";
 
import { useEffect, useRef, useState } from "react";
import { getRarity, RARITY_CONFIG } from "./pin-rarity";
import type { PinData } from "./PinMarker";
import { PinView } from "~/app/pins/PinView";
import type { PinData as PinViewData } from "~/app/pins/types";
import { usePinTheme } from "~/app/map/usePinTheme";
 
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
 
  const [optimisticMyUpvotes, setOptimisticMyUpvotes] = useState(0);
  const [optimisticTotal, setOptimisticTotal] = useState(0);
 
  const theme = usePinTheme();
 
  useEffect(() => {
    if (pin) {
      setOptimisticMyUpvotes(pin.myUpvotes);
      setOptimisticTotal(pin.upvotes);
    }
  }, [pin, pin?.id, pin?.myUpvotes, pin?.upvotes]);
 
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
    if (!canUpvote || isUpvoting) return;
    setOptimisticMyUpvotes((v) => v + 1);
    setOptimisticTotal((v) => v + 1);
    onUpvote(pin.id);
  };
 
  const handleDownvote = () => {
    if (!hasUpvoted || isUpvoting) return;
    setOptimisticMyUpvotes((v) => Math.max(0, v - 1));
    setOptimisticTotal((v) => Math.max(0, v - 1));
    onUndoUpvote(pin.id);
  };
 
  const handleDeleteClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    } else {
      onDelete?.(pin.id);
    }
  };
 
  const viewData: PinViewData = {
    id: pin.id,
    locationName: pin.title,
    uploadedBy: pin.creatorName ?? "Unknown",
    uploadedAt: "",
    description: pin.description ?? "",
    score: optimisticTotal,
  };
 
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600;1,700;1,800&display=swap');
 
        .pin-sheet-overlay {
          position: fixed; inset: 0; z-index: 40;
          background: rgba(0,0,0,0);
          transition: background 0.25s;
          pointer-events: none;
        }
        .pin-sheet-overlay--visible {
          background: rgba(0,0,0,0.4);
          pointer-events: auto;
        }
        .pin-sheet-float {
          position: fixed;
          bottom: 120px;
          left: 50%;
          transform: translateX(-50%) translateY(30px);
          z-index: 50;
          opacity: 0;
          transition: opacity 0.3s, transform 0.3s cubic-bezier(0.32,0.72,0,1);
          pointer-events: none;
          width: 360px;
          max-width: calc(100vw - 32px);
        }
        .pin-sheet-float--visible {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
          pointer-events: auto;
        }
        .pin-sheet-owner-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          margin-top: 8px;
          padding: 0 4px;
        }
        .pin-sheet-action-btn {
          font-family: 'Nunito', sans-serif;
          font-size: 12px; font-weight: 700;
          padding: 6px 14px; border-radius: 99px;
          border: 1.5px solid rgba(255,255,255,0.2);
          background: rgba(0,0,0,0.5);
          color: rgba(255,255,255,0.7);
          cursor: pointer; transition: all 0.15s;
          backdrop-filter: blur(8px);
        }
        .pin-sheet-action-btn:hover { background: rgba(0,0,0,0.7); color: #fff; }
        .pin-sheet-action-btn--delete {
          border-color: rgba(255,80,80,0.3);
          color: rgba(255,100,100,0.7);
        }
        .pin-sheet-action-btn--delete:hover {
          background: rgba(255,60,60,0.15);
          color: #ff7070;
          border-color: rgba(255,80,80,0.6);
        }
        .pin-sheet-action-btn--confirm {
          background: rgba(255,60,60,0.2);
          border-color: rgba(255,80,80,0.7);
          color: #ff7070;
        }
        .pin-sheet-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
 
        .pin-sheet-rarity-tag {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: 'Nunito', sans-serif;
          font-size: 11px; font-weight: 700;
          padding: 3px 10px; border-radius: 99px;
          margin-bottom: 6px;
          letter-spacing: 0.04em;
        }
        .pin-sheet-rarity-dot-sm {
          width: 7px; height: 7px; border-radius: 50%;
        }
      `}</style>
 
      <div
        ref={overlayRef}
        className={`pin-sheet-overlay ${visible ? "pin-sheet-overlay--visible" : ""}`}
        onClick={onClose}
        aria-hidden
      />
 
      <div className={`pin-sheet-float ${visible ? "pin-sheet-float--visible" : ""}`}>
        {/* Rarity tag above bubble */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
          <span
            className="pin-sheet-rarity-tag"
            style={{
              background: cfg.color + "22",
              border: `1px solid ${cfg.color}44`,
              color: cfg.color,
            }}
          >
            <span
              className="pin-sheet-rarity-dot-sm"
              style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.glow}` }}
            />
            {cfg.label} · {optimisticTotal} {optimisticTotal === 1 ? "upvote" : "upvotes"}
          </span>
        </div>
 
        <PinView
          data={viewData}
          theme={theme}
          onClose={onClose}
          onUpvote={handleUpvote}
          onDownvote={handleDownvote}
        />
 
        {/* Owner actions below bubble */}
        {isOwner && (
          <div className="pin-sheet-owner-actions">
            {onEdit && (
              <button
                type="button"
                className="pin-sheet-action-btn"
                onClick={() => onEdit(pin)}
              >
                ✏️ Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className={`pin-sheet-action-btn pin-sheet-action-btn--delete ${confirmDelete ? "pin-sheet-action-btn--confirm" : ""}`}
                onClick={handleDeleteClick}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting…" : confirmDelete ? "Confirm delete?" : "🗑 Delete"}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}