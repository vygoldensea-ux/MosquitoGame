const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Completely exclude react-native-google-mobile-ads from web builds
// by replacing it with an empty mock module
const originalResolver = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
    // On web, mock out react-native-google-mobile-ads entirely
    if (
        platform === 'web' &&
        (moduleName === 'react-native-google-mobile-ads' ||
            moduleName.startsWith('react-native-google-mobile-ads/'))
    ) {
        return {
            type: 'sourceFile',
            filePath: require.resolve('./web-mocks/react-native-google-mobile-ads.js'),
        };
    }

    // Use default resolver for everything else
    if (originalResolver) {
        return originalResolver(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
