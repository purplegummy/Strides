"use client";

import { useEffect, useRef, useState } from "react";
import type { PinData } from "./PinMarker";

interface CreatePinSheetProps {
  open: boolean;
  editingPin?: PinData | null;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string }) => void;
  isSubmitting?: boolean;
}

export function CreatePinSheet({
  open,
  editingPin,
  onClose,
  onSubmit,
  isSubmitting,
}: CreatePinSheetProps) {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  const isEditing = !!editingPin;

  useEffect(() => {
    if (editingPin) {
      setTitle(editingPin.title);
      setDescription(editingPin.description ?? "");
    } else if (!open) {
      setTitle("");
      setDescription("");
    }
  }, [editingPin, open]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        setVisible(true);
        setTimeout(() => titleRef.current?.focus(), 350);
      });
    } else {
      setVisible(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => {
    const t = title.trim();
    if (!t) return;
    onSubmit({ title: t, description: description.trim() });
  };

  return (
    <>
      <style>{css}</style>

      <div
        className={`cps-backdrop ${visible ? "cps-backdrop--visible" : ""}`}
        onClick={onClose}
        aria-hidden
      />

      <div
        className={`cps-sheet ${visible ? "cps-sheet--visible" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? "Edit pin" : "Drop a pin"}
      >
        <div className="cps-handle" />

        <div className="cps-header">
          <div className="cps-header-icon">{isEditing ? "✏️" : "📍"}</div>
          <div>
            <h2 className="cps-title">{isEditing ? "Edit Pin" : "Drop a Pin"}</h2>
            <p className="cps-subtitle">
              {isEditing ? "Update your pin details" : "Mark this spot on the map"}
            </p>
          </div>
        </div>

        <div className="cps-fields">
          <div className="cps-field">
            <label className="cps-label" htmlFor="pin-title">Title</label>
            <input
              ref={titleRef}
              id="pin-title"
              className="cps-input"
              type="text"
              placeholder="What's here?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <span className="cps-char-count">{title.length}/60</span>
          </div>

          <div className="cps-field">
            <label className="cps-label" htmlFor="pin-desc">Description <span className="cps-optional">(optional)</span></label>
            <textarea
              id="pin-desc"
              className="cps-textarea"
              placeholder="Tell explorers what to expect…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={280}
              rows={3}
            />
            <span className="cps-char-count">{description.length}/280</span>
          </div>
        </div>

        <div className="cps-actions">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim() || isSubmitting}
            className="cps-submit-btn"
          >
            {isSubmitting ? (
              <span className="cps-spinner" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            )}
            {isSubmitting ? "Saving…" : isEditing ? "Save Changes" : "Drop Pin Here"}
          </button>

          <button type="button" onClick={onClose} className="cps-cancel-btn">
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;800&family=Space+Mono&display=swap');

  .cps-backdrop {
    position: fixed; inset: 0; z-index: 40;
    background: rgba(0,0,0,0);
    transition: background 0.25s;
    pointer-events: none;
  }
  .cps-backdrop--visible {
    background: rgba(0,0,0,0.45);
    pointer-events: auto;
  }

  .cps-sheet {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    z-index: 50;
    background: rgba(8,11,22,0.98);
    backdrop-filter: blur(24px);
    border-top: 1px solid rgba(255,255,255,0.08);
    border-radius: 24px 24px 0 0;
    padding: 12px 20px 100px;
    transform: translateY(100%);
    transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
    box-shadow: 0 -20px 60px rgba(0,0,0,0.65);
    font-family: 'Syne', sans-serif;
    color: #e8f0ff;
  }
  .cps-sheet--visible { transform: translateY(0); }

  .cps-handle {
    width: 40px; height: 4px;
    border-radius: 2px;
    background: rgba(255,255,255,0.15);
    margin: 0 auto 20px;
  }

  .cps-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 24px;
  }
  .cps-header-icon {
    font-size: 28px;
    width: 52px; height: 52px;
    border-radius: 16px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .cps-title {
    font-size: 20px; font-weight: 800;
    color: #f0f6ff; margin-bottom: 2px;
  }
  .cps-subtitle {
    font-size: 13px;
    color: rgba(180,200,255,0.5);
    font-family: 'Space Mono', monospace;
  }

  .cps-fields { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }

  .cps-field { display: flex; flex-direction: column; gap: 6px; position: relative; }

  .cps-label {
    font-size: 12px; font-weight: 600;
    color: rgba(180,200,255,0.6);
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .cps-optional {
    font-weight: 400; color: rgba(180,200,255,0.35);
    text-transform: none; letter-spacing: 0;
  }

  .cps-input, .cps-textarea {
    width: 100%; box-sizing: border-box;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 14px;
    padding: 12px 16px;
    color: #f0f6ff;
    font-family: 'Syne', sans-serif;
    font-size: 15px;
    outline: none;
    transition: border-color 0.15s, background 0.15s;
    resize: none;
  }
  .cps-input::placeholder, .cps-textarea::placeholder { color: rgba(180,200,255,0.25); }
  .cps-input:focus, .cps-textarea:focus {
    border-color: rgba(56,189,248,0.5);
    background: rgba(56,189,248,0.06);
  }

  .cps-char-count {
    position: absolute; right: 12px; bottom: 10px;
    font-family: 'Space Mono', monospace;
    font-size: 10px; color: rgba(180,200,255,0.25);
  }

  .cps-actions { display: flex; gap: 10px; align-items: center; }

  .cps-submit-btn {
    flex: 1;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 14px 20px;
    border-radius: 16px;
    border: none;
    background: linear-gradient(135deg, #1d6fb0, #38bdf8);
    color: #fff;
    font-family: 'Syne', sans-serif;
    font-size: 15px; font-weight: 700;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.12s;
    box-shadow: 0 4px 20px rgba(56,189,248,0.3);
  }
  .cps-submit-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
  .cps-submit-btn:active:not(:disabled) { transform: translateY(0); }
  .cps-submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .cps-spinner {
    display: inline-block;
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .cps-cancel-btn {
    padding: 14px 18px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.08);
    background: transparent;
    color: rgba(200,220,255,0.45);
    font-family: 'Syne', sans-serif;
    font-size: 14px; font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }
  .cps-cancel-btn:hover { color: rgba(200,220,255,0.8); border-color: rgba(255,255,255,0.15); }
`;
