import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { useTap } from './useTap';
import './Button.css';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /**
   * Suppress the tap sound. For presses that already make a noise of their
   * own: checking an answer, or finishing a session. Two cues on one press
   * reads as a glitch rather than as feedback.
   */
  quiet?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  quiet = false,
  children,
  className,
  onClick,
  ...rest
}: ButtonProps) {
  const tap = useTap();
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!quiet) tap();
    onClick?.(event);
  };

  return (
    <button
      className={['btn', `btn--${variant}`, className].filter(Boolean).join(' ')}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </button>
  );
}
