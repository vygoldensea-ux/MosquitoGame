// ═══════════════════════════════════════════════════════════════
// ADMOB CONFIGURATION - REAL AD UNIT IDs
// ═══════════════════════════════════════════════════════════════

import { Platform } from 'react-native';

// Mock for web, real for native
let AdMobModule: any;

if (Platform.OS === 'web') {
    // Mock exports for web
    AdMobModule = {
        TestIds: { BANNER: 'test-banner' },
    };
} else {
    // Real exports for native
    AdMobModule = require('react-native-google-mobile-ads');
}

/**
 * Development vs Production Mode
 * 
 * __DEV__ = true:  Uses Google's test ad IDs (no real impressions)
 * __DEV__ = false: Uses real ad IDs (production, generates revenue)
 * 
 * IMPORTANT: Never click your own real ads! Risk of account ban!
 */
const USE_TEST_ADS = __DEV__; // Automatically uses test ads in development

/**
 * Real AdMob Ad Unit IDs for Production
 * 
 * Android App ID: ca-app-pub-3600965442508079~6379631817
 * iOS App ID: ca-app-pub-3600965442508079~2352756891
 * 
 * These App IDs are configured in app.json
 */
const REAL_AD_UNITS = {
    android: {
        banner: 'ca-app-pub-3600965442508079/6939557524',
    },
    ios: {
        banner: 'ca-app-pub-3600965442508079/5950384849',
    },
};

/**
 * Get Banner Ad Unit ID
 * Returns test ID in development, real ID in production
 */
export const getBannerAdUnitId = (): string => {
    if (Platform.OS === 'web') return 'test-banner-id';

    if (USE_TEST_ADS) {
        return AdMobModule.TestIds.BANNER;
    }

    return Platform.select({
        android: REAL_AD_UNITS.android.banner,
        ios: REAL_AD_UNITS.ios.banner,
        default: AdMobModule.TestIds.BANNER, // Fallback for other platforms
    })!;
};

/**
 * Export for direct usage
 */
export const AdMobConfig = {
    bannerAdUnitId: getBannerAdUnitId(),
};
