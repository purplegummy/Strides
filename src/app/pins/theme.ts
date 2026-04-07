import type { PinTheme } from './types';
 
export interface ThemeTokens {
  bubbleBackground: string;
  titleColor: string;
  subtitleColor: string;
  bodyColor: string;
  placeholderColor: string;
  closeBg: string;
  closeColor: string;
  uploadBtnBg: string;
  uploadBtnColor: string;
  uploadBtnHoverBg: string;
  inputBg: string;
  inputBorder: string;
  inputFocusBg: string;
  inputFocusBorder: string;
  scoreColor: string;
  upvoteColor: string;
  downvoteColor: string;
  shadow: string;
}
 
// Both themes now use the dark blue design from Image 1.
// Border color is driven by score (getRarityBorder in types.ts),
// not by theme — so theme only controls background + text colors.
export const themes: Record<PinTheme, ThemeTokens> = {
  blue: {
    bubbleBackground: 'linear-gradient(160deg, #2a7db5 0%, #1a5a8a 55%, #163f6a 100%)',
    titleColor: '#ffffff',
    subtitleColor: 'rgba(255,255,255,0.85)',
    bodyColor: 'rgba(255,255,255,0.8)',
    placeholderColor: 'rgba(255,255,255,0.4)',
    closeBg: '#4a5568',
    closeColor: '#ffffff',
    uploadBtnBg: 'rgba(255,255,255,0.18)',
    uploadBtnColor: '#ffffff',
    uploadBtnHoverBg: 'rgba(255,255,255,0.28)',
    inputBg: 'rgba(255,255,255,0.12)',
    inputBorder: 'rgba(255,255,255,0.2)',
    inputFocusBg: 'rgba(255,255,255,0.2)',
    inputFocusBorder: 'rgba(255,255,255,0.5)',
    scoreColor: '#5dde6e',
    upvoteColor: '#5dde6e',
    downvoteColor: '#e63c3c',
    shadow: '0 8px 32px rgba(0,0,0,0.35)',
  },
  green: {
    // Same dark blue design — light/dark mode both look like Image 1
    bubbleBackground: 'linear-gradient(160deg, #2a7db5 0%, #1a5a8a 55%, #163f6a 100%)',
    titleColor: '#ffffff',
    subtitleColor: 'rgba(255,255,255,0.85)',
    bodyColor: 'rgba(255,255,255,0.8)',
    placeholderColor: 'rgba(255,255,255,0.4)',
    closeBg: '#4a5568',
    closeColor: '#ffffff',
    uploadBtnBg: 'rgba(255,255,255,0.18)',
    uploadBtnColor: '#ffffff',
    uploadBtnHoverBg: 'rgba(255,255,255,0.28)',
    inputBg: 'rgba(255,255,255,0.12)',
    inputBorder: 'rgba(255,255,255,0.2)',
    inputFocusBg: 'rgba(255,255,255,0.2)',
    inputFocusBorder: 'rgba(255,255,255,0.5)',
    scoreColor: '#5dde6e',
    upvoteColor: '#5dde6e',
    downvoteColor: '#e63c3c',
    shadow: '0 8px 32px rgba(0,0,0,0.35)',
  },
};