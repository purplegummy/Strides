import { getRarity, RARITY_CONFIG } from '~/app/_components/pin/pin-rarity';
 
export type PinTheme = 'blue' | 'green';
 
export interface PinData {
  id: string;
  locationName: string;
  uploadedBy: string;
  uploadedAt: string; // MM/DD/YYYY
  description: string;
  score: number;
}
 
export interface PinViewProps {
  data: PinData;
  theme?: PinTheme;
  onClose?: () => void;
  onUpvote?: (id: string) => void;
  onDownvote?: (id: string) => void;
}
 
export interface PinCreateProps {
  theme?: PinTheme;
  onClose?: () => void;
  onSubmit?: (data: Omit<PinData, 'id' | 'score'>) => void;
  isSubmitting?: boolean;
}
 
/** Returns a border string using the rarity system colors */
export function getRarityBorder(score: number): string {
  const rarity = getRarity(score);
  const cfg = RARITY_CONFIG[rarity];
  return `2.5px solid ${cfg.color}`;
}
 
/** Returns the pointer/triangle color using the rarity system colors */
export function getRarityPointerColor(score: number): string {
  const rarity = getRarity(score);
  const cfg = RARITY_CONFIG[rarity];
  return cfg.color;
}