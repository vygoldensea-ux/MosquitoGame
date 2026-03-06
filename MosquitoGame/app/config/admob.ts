// app/config/admob.ts
import { Platform } from 'react-native';

// ═══════════════════════════════════════════════════════════
// ADMOB CONFIGURATION
// ═══════════════════════════════════════════════════════════

// Use test ads in development, real ads in production
const USE_TEST_ADS = __DEV__;

// ─────────────────────────────────────────────────────────
// TEST AD UNIT IDs (Google's official test IDs)
// THESE ARE SAFE TO USE - PROVIDED BY GOOGLE
// ─────────────────────────────────────────────────────────
const TEST_IDS = {
    banner: Platform.select({
        android: 'ca-app-pub-3940256099942544/6300978111',
        ios: 'ca-app-pub-3940256099942544/2934735716',
    })!,
    interstitial: Platform.select({
        android: 'ca-app-pub-3940256099942544/1033173712',
        ios: 'ca-app-pub-3940256099942544/4411468910',
    })!,
    rewarded: Platform.select({
        android: 'ca-app-pub-3940256099942544/5224354917',
        ios: 'ca-app-pub-3940256099942544/1712485313',
    })!,
    appOpen: Platform.select({
        android: 'ca-app-pub-3940256099942544/9257395921',
        ios: 'ca-app-pub-3940256099942544/5662855259',
    })!,
};

// ─────────────────────────────────────────────────────────
// PRODUCTION AD UNIT IDs
// USER WILL REPLACE THESE LATER WITH REAL IDs
// ─────────────────────────────────────────────────────────
const PRODUCTION_IDS = {
    banner: Platform.select({
        android: 'ca-app-pub-3940256099942544/6300978111',
        ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/BANNER_IOS',
    })!,
    interstitial: Platform.select({
        android: 'ca-app-pub-3940256099942544/1033173712',
        ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/INTERSTITIAL_IOS',
    })!,
    rewarded: Platform.select({
        android: 'ca-app-pub-3940256099942544/5224354917',
        ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/REWARDED_IOS',
    })!,
    appOpen: Platform.select({
        android: 'ca-app-pub-3940256099942544/9257395921',
        ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/APPOPEN_IOS',
    })!,
};

// Export the correct IDs based on environment
export const AD_UNIT_IDS = USE_TEST_ADS ? TEST_IDS : PRODUCTION_IDS;

// Log which ads we're using
console.log(`🎯 AdMob: ${USE_TEST_ADS ? 'TEST IDs' : 'PRODUCTION IDs'}`);
