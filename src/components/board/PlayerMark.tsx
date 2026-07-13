'use client';

import { motion } from 'framer-motion';
import type { Player } from '@/types';

interface Props {
  player: Player;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
}

const sizeMap = {
  sm: 'text-lg font-black leading-none',
  md: 'text-2xl font-black leading-none',
  lg: 'text-5xl font-black leading-none',
  xl: 'text-8xl font-black leading-none',
};

export function PlayerMark({ player, size = 'md', animate = true }: Props) {
  const className = `${sizeMap[size]} ${player === 'X' ? 'mark-x' : 'mark-o'} select-none`;

  if (!animate) {
    return <span className={className}>{player}</span>;
  }

  return (
    <motion.span
      className={className}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20, duration: 0.15 }}
    >
      {player}
    </motion.span>
  );
}
