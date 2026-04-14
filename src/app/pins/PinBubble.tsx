import React from 'react';
import type { CSSProperties } from 'react';
import type { PinTheme } from './types';
import { themes } from './theme';
 
interface PinBubbleProps {
  theme: PinTheme;
  onClose?: () => void;
  children: React.ReactNode;
  width?: number;
  border?: string;
  pointerColor?: string;
}
 
export const PinBubble: React.FC<PinBubbleProps> = ({
  theme,
  onClose,
  children,
  width = 380,
  border,
  pointerColor,
}) => {
  const t = themes[theme];
 
  // Fall back to a subtle default if no border/pointer provided
  const resolvedBorder = border ?? '2.5px solid rgba(255,255,255,0.15)';
  const resolvedPointer = pointerColor ?? '#1a5a8a';
 
  const wrapStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: width,
    filter: `drop-shadow(${t.shadow})`,
    fontFamily: "'Nunito', sans-serif",
  };
 
  const bubbleStyle: CSSProperties = {
    position: 'relative',
    borderRadius: 22,
    padding: '22px 22px 22px 22px',
    background: t.bubbleBackground,
    border: resolvedBorder,
    minHeight: 200,
  };
 
  const pointerStyle: CSSProperties = {
    width: 0,
    height: 0,
    margin: '0 auto',
    borderLeft: '28px solid transparent',
    borderRight: '28px solid transparent',
    borderTop: `32px solid ${resolvedPointer}`,
  };
 
  const closeBtnStyle: CSSProperties = {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: t.closeBg,
    color: t.closeColor,
    border: 'none',
    fontSize: 15,
    fontWeight: 900,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontFamily: "'Nunito', sans-serif",
    transition: 'transform 0.1s, opacity 0.1s',
    zIndex: 2,
  };
 
  return (
    <div style={wrapStyle}>
      <div style={bubbleStyle}>
        {onClose && (
          <button
            style={closeBtnStyle}
            onClick={onClose}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            aria-label="Close pin"
          >
            ✕
          </button>
        )}
        {children}
      </div>
      <div style={pointerStyle} />
    </div>
  );
};
 