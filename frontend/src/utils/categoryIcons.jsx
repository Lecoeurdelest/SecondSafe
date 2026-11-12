import React from 'react';
import { BookOpen, DeviceMobile, House, PawPrint, PuzzlePiece, Sparkle, SoccerBall, Tag, TShirt } from '@phosphor-icons/react';

const ICONS = {
  books: BookOpen,
  fashion: TShirt,
  electronics: DeviceMobile,
  home: House,
  beauty: Sparkle,
  sports: SoccerBall,
  toys: PuzzlePiece,
  pets: PawPrint
};

export default function CategoryIcon({ slug, ...props }) {
  const Icon = ICONS[slug] || Tag;
  return <Icon aria-hidden="true" {...props} />;
}
