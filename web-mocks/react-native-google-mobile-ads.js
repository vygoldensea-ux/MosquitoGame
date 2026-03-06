// Mock for react-native-google-mobile-ads on web
// Metro config redirects all imports of this package here on web platform

const React = require('react');
const { View, Text } = require('react-native');

// BannerAd: renders a visible placeholder banner for web testing
const BannerAd = ({ size }) => {
    const height = size === 'LARGE_BANNER' ? 60 : 50;
    return React.createElement(View, {
        style: {
            width: '100%',
            height: height,
            backgroundColor: '#e8e8e8',
            justifyContent: 'center',
            alignItems: 'center',
            borderTopWidth: 1,
            borderTopColor: '#ccc',
        }
    }, React.createElement(Text, {
        style: { fontSize: 11, color: '#999', fontStyle: 'italic' }
    }, '📢 Advertisement (Web Preview Mock)'));
};

const noop = () => null;
const noopObj = { show: noop, addAdEventListener: () => ({ remove: noop }), load: noop };

module.exports = {
    // Components
    BannerAd,

    // Ad sizes
    BannerAdSize: {
        BANNER: 'BANNER',
        LARGE_BANNER: 'LARGE_BANNER',
        MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
        FULL_BANNER: 'FULL_BANNER',
        LEADERBOARD: 'LEADERBOARD',
        ADAPTIVE_BANNER: 'ADAPTIVE_BANNER',
        ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
        INLINE_ADAPTIVE_BANNER: 'INLINE_ADAPTIVE_BANNER',
        FLUID: 'FLUID',
        WIDE_SKYSCRAPER: 'WIDE_SKYSCRAPER',
    },

    // IDs (kept for API compatibility on web)
    TestIds: {
        BANNER: 'ca-app-pub-3600965442508079/6939557524',
        INTERSTITIAL: '',
        REWARDED: '',
        REWARDED_INTERSTITIAL: '',
        APP_OPEN: '',
    },

    // Ad event types
    AdEventType: {
        LOADED: 'loaded',
        ERROR: 'error',
        OPENED: 'opened',
        CLICKED: 'clicked',
        CLOSED: 'closed',
    },

    RewardedAdEventType: {
        LOADED: 'loaded',
        EARNED_REWARD: 'earned_reward',
    },

    // Ad classes
    InterstitialAd: {
        createForAdRequest: () => ({
            ...noopObj,
            load: noop,
        }),
    },

    RewardedAd: {
        createForAdRequest: () => ({
            ...noopObj,
            load: noop,
        }),
    },

    RewardedInterstitialAd: {
        createForAdRequest: () => ({
            ...noopObj,
            load: noop,
        }),
    },

    AppOpenAd: {
        createForAdRequest: () => ({
            ...noopObj,
            load: noop,
        }),
    },

    // Initialize function
    default: { initialize: () => Promise.resolve([]) },
};
