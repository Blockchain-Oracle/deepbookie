/** Web-side spot constants (named, one source). Pool IDs/scaling live in @deepbookie/core; this is the
 *  UI's default-pool fallback for write cards when the agent omits a poolKey. */

/** Fallback pool for spot write cards when the agent proposes no poolKey (a whitelisted, DEEP-free pool). */
export const DEFAULT_SPOT_POOL = 'SUI_DBUSDC';
