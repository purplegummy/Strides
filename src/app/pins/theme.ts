import type { PinTheme } from './types';
 
export interface ThemeTokens {
  bubbleBackground: string;
  bubbleBorder: string;
  pointerColor: string;
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
 
export const themes: Record<PinTheme, ThemeTokens> = {
  blue: {
    bubbleBackground: 'linear-gradient(160deg, #2a7db5 0%, #1a5a8a 55%, #163f6a 100%)',
    bubbleBorder: '2.5px solid #5dde6e',
    pointerColor: '#1a5a8a',
    titleColor: '#ffffff',
    subtitleColor: 'rgba(255,255,255,0.85)',
    bodyColor: 'rgba(255,255,255,0.8)',
    placeholderColor: 'rgba(255,255,255,0.4)',
    closeBg: '#555555',
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
    shadow: '0 8px 32px rgba(0,0,0,0.28)',
  },
  green: {
    bubbleBackground: 'linear-gradient(160deg, #d4ef7a 0%, #7dd9a4 60%, #4bbfa8 100%)',
    bubbleBorder: '2px solid #4bbfa8',
    pointerColor: '#5cc9a8',
    titleColor: '#1a2a1a',
    subtitleColor: 'rgba(20,40,20,0.75)',
    bodyColor: 'rgba(20,40,20,0.7)',
    placeholderColor: 'rgba(20,40,20,0.45)',
    closeBg: 'rgba(0,0,0,0.12)',
    closeColor: '#1a2a1a',
    uploadBtnBg: 'rgba(255,255,255,0.35)',
    uploadBtnColor: '#1a2a1a',
    uploadBtnHoverBg: 'rgba(255,255,255,0.55)',
    inputBg: 'rgba(255,255,255,0.25)',
    inputBorder: 'rgba(0,0,0,0.1)',
    inputFocusBg: 'rgba(255,255,255,0.45)',
    inputFocusBorder: 'rgba(0,0,0,0.2)',
    scoreColor: '#1a9c6a',
    upvoteColor: '#1a9c6a',
    downvoteColor: '#e63c3c',
    shadow: '0 8px 32px rgba(0,0,0,0.16)',
  },
};
 