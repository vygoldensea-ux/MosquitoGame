// app/config/admob.ts
import { Platform } from 'react-native';

// ═══════════════════════════════════════════════════════════
// ADMOB CONFIGURATION
// ═══════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────
// PRODUCTION AD UNIT IDs
// ─────────────────────────────────────────────────────────
export const AD_UNIT_IDS = {
    /**
     * Banner ID must be platform-specific.
     */
    banner: Platform.select({
        android: 'ca-app-pub-3600965442508079/6939557524',
        ios: 'ca-app-pub-3600965442508079/5950384849',
        default: '',
    })!,
    /**
     * Interstitial/Rewarded/AppOpen production unit IDs are not provided here.
     * Keep them empty to ensure there are NO Google test IDs in the project.
     * The app should guard against empty IDs before creating/showing these ad types.
     */
    interstitial: '',
    rewarded: '',
    appOpen: '',
} as const;

console.log('🎯 AdMob: PRODUCTION IDs configured');
