import React from 'react';
import type { CSSProperties } from 'react';
import type { PinViewProps } from './types';
import { getRarityBorder, getRarityPointerColor } from './types';
import { themes } from './theme';
import { PinBubble } from './PinBubble';
import { UpvoteIcon, DownvoteIcon } from './icons';
 
export const PinView: React.FC<PinViewProps> = ({
  data,
  theme = 'blue',
  onClose,
  onUpvote,
  onDownvote,
}) => {
  const t = themes[theme];
  const border = getRarityBorder(data.score);
  const pointerColor = getRarityPointerColor(data.score);
 
  const titleStyle: CSSProperties = {
    fontSize: 22,
    fontWeight: 800,
    fontStyle: 'italic',
    color: t.titleColor,
    lineHeight: 1.2,
    marginBottom: 4,
    paddingRight: 36,
  };
 
  const subtitleStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    fontStyle: 'italic',
    color: t.subtitleColor,
    marginBottom: 14,
  };
 
  const bodyStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    fontStyle: 'italic',
    color: t.bodyColor,
    lineHeight: 1.75,
    whiteSpace: 'pre-line',
  };
 
  const voteRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  };
 
  const voteBtnStyle: CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    transition: 'transform 0.12s',
  };
 
  const scoreStyle: CSSProperties = {
    fontSize: 22,
    fontWeight: 800,
    fontStyle: 'italic',
    color: t.scoreColor,
    minWidth: 44,
    textAlign: 'center',
    fontFamily: "'Nunito', sans-serif",
  };
 
  return (
    <PinBubble theme={theme} onClose={onClose} border={border} pointerColor={pointerColor}>
      <div style={titleStyle}>{data.locationName}</div>
      <div style={subtitleStyle}>
        Uploaded by: {data.uploadedBy} at {data.uploadedAt}
      </div>
      <div style={bodyStyle}>{data.description}</div>
      <div style={voteRowStyle}>
        <button
          style={voteBtnStyle}
          onClick={() => onUpvote?.(data.id)}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.25)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          aria-label="Upvote"
        >
          <UpvoteIcon color={t.upvoteColor} />
        </button>
        <span style={scoreStyle}>{data.score}</span>
        <button
          style={voteBtnStyle}
          onClick={() => onDownvote?.(data.id)}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.25)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          aria-label="Downvote"
        >
          <DownvoteIcon color={t.downvoteColor} />
        </button>
      </div>
    </PinBubble>
  );
};
 