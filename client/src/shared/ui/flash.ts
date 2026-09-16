import { css, keyframes } from 'styled-components';

export const FLASH_DURATION_MS = 1_500;

/**
 * Holds the tint before fading: a plain fade spends most of its time nearly
 * transparent, which is easy to miss when a value changes every few seconds.
 */
const fade = keyframes`
  0% { background-color: var(--flash-color); }
  35% { background-color: var(--flash-color); }
  100% { background-color: transparent; }
`;

export const flash = css<{ $flash?: boolean }>`
  ${({ $flash, theme }) =>
    $flash &&
    css`
      --flash-color: ${theme.color.highlight};
      animation: ${fade} ${FLASH_DURATION_MS}ms ease-out;
    `}
`;
