"use client";
 
import { useEffect, useState } from "react";
import type { PinData } from "./PinMarker";
import { PinCreate } from "~/app/pins/PinCreate";
import type { PinData as PinViewData } from "~/app/pins/types";
import { usePinTheme } from "~/app/map/usePinTheme";
 
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
  const theme = usePinTheme();
 
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);
 
  if (!open) return null;
 
  const handleSubmit = (data: Omit<PinViewData, "id" | "score">) => {
    onSubmit({
      title: data.locationName,
      description: data.description,
    });
  };
 
  return (
    <>
      <style>{`
        .create-pin-overlay {
          position: fixed; inset: 0; z-index: 40;
          background: rgba(0,0,0,0);
          transition: background 0.25s;
          pointer-events: none;
        }
        .create-pin-overlay--visible {
          background: rgba(0,0,0,0.4);
          pointer-events: auto;
        }
        .create-pin-float {
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
        .create-pin-float--visible {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
          pointer-events: auto;
        }
      `}</style>
 
      <div
        className={`create-pin-overlay ${visible ? "create-pin-overlay--visible" : ""}`}
        onClick={onClose}
        aria-hidden
      />
 
      <div className={`create-pin-float ${visible ? "create-pin-float--visible" : ""}`}>
        <PinCreate
          theme={theme}
          onClose={onClose}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </>
  );
}