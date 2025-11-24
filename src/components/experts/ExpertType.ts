export interface ExpertImageProps {
  alt: string;
  isAi?: boolean;
  name: string;
  caption: string;
  image: string;
  onClick?: () => void;
}

export interface ExpertBadgeProps {
  isAi?: boolean;
}
