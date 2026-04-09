import { useContext } from 'react';
import { PwaContext } from './PwaContext';

export function usePwa() {
  const context = useContext(PwaContext);

  if (!context) {
    throw new Error('usePwa must be used inside PwaProvider.');
  }

  return context;
}
