import { REVALIDATE } from '@/lib/constants';
import { cachedRead } from './read';
import type { Position } from './types';

export function getActivity(limit = 20) {
  return cachedRead<Position[]>(
    'get_recent_bets',
    { limit },
    { revalidate: REVALIDATE.activity, tags: ['activity'] },
  );
}
