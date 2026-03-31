import React, { useState } from 'react';
import type { CSSProperties } from 'react';
import type { PinCreateProps } from './types';
import { themes } from './theme';
import { PinBubble } from './PinBubble';
 
export const PinCreate: React.FC<PinCreateProps & { isSubmitting?: boolean }> = ({
  theme = 'blue',
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const t = themes[theme];
 
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [uploadHovered, setUploadHovered] = useState(false);
 
  const handleSubmit = () => {
    if (!name.trim()) return;
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const yyyy = today.getFullYear();
    onSubmit?.({
      locationName: name.trim(),
      uploadedBy: 'Username',
      uploadedAt: `${mm}/${dd}/${yyyy}`,
      description: description.trim(),
    });
  };
 
  const inputBase: CSSProperties = {
    width: '100%',
    background: t.inputBg,
    border: `1.5px solid ${t.inputBorder}`,
    borderRadius: 10,
    padding: '8px 12px',
    fontSize: 15,
    fontWeight: 600,
    fontStyle: 'italic',
    fontFamily: "'Nunito', sans-serif",
    outline: 'none',
    color: t.titleColor,
    transition: 'border-color 0.15s, background 0.15s',
  };
 
  const nameInputStyle: CSSProperties = {
    ...inputBase,
    fontSize: 20,
    fontWeight: 800,
    background: nameFocused ? t.inputFocusBg : t.inputBg,
    border: `1.5px solid ${nameFocused ? t.inputFocusBorder : t.inputBorder}`,
  };
 
  const descInputStyle: CSSProperties = {
    ...inputBase,
    resize: 'none',
    lineHeight: 1.6,
    background: descFocused ? t.inputFocusBg : t.inputBg,
    border: `1.5px solid ${descFocused ? t.inputFocusBorder : t.inputBorder}`,
  };
 
  const uploadBtnStyle: CSSProperties = {
    width: '100%',
    padding: '14px',
    borderRadius: 99,
    fontSize: 18,
    fontWeight: 700,
    fontStyle: 'italic',
    fontFamily: "'Nunito', sans-serif",
    cursor: isSubmitting ? 'not-allowed' : 'pointer',
    marginTop: 18,
    background: uploadHovered && !isSubmitting ? t.uploadBtnHoverBg : t.uploadBtnBg,
    color: t.uploadBtnColor,
    border: 'none',
    opacity: isSubmitting ? 0.6 : 1,
    transition: 'background 0.15s, transform 0.1s',
    transform: uploadHovered && !isSubmitting ? 'scale(1.01)' : 'scale(1)',
    letterSpacing: '0.01em',
  };
 
  const placeholderClass = `pin-input-${theme}`;
 
  return (
    <>
      <style>{`
        .${placeholderClass}::placeholder {
          color: ${t.placeholderColor};
          font-style: italic;
        }
      `}</style>
      <PinBubble theme={theme} onClose={onClose}>
        <div style={{ marginBottom: 10, paddingRight: 36 }}>
          <input
            className={placeholderClass}
            style={nameInputStyle}
            placeholder="Enter a name for the pin..."
            value={name}
            onChange={e => setName(e.target.value)}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
          />
        </div>
        <div style={{ marginBottom: 0 }}>
          <textarea
            className={placeholderClass}
            style={descInputStyle}
            rows={7}
            placeholder="Enter a description..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            onFocus={() => setDescFocused(true)}
            onBlur={() => setDescFocused(false)}
          />
        </div>
        <button
          style={uploadBtnStyle}
          onClick={handleSubmit}
          disabled={isSubmitting}
          onMouseEnter={() => setUploadHovered(true)}
          onMouseLeave={() => setUploadHovered(false)}
          onMouseDown={e => { if (!isSubmitting) e.currentTarget.style.transform = 'scale(0.98)'; }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.01)'; }}
        >
          {isSubmitting ? 'Saving…' : 'Upload Pin'}
        </button>
      </PinBubble>
    </>
  );
};
 