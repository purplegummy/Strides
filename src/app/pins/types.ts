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
}
 