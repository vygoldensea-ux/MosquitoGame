import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';

export default function App() {
  return (
    <View style={styles.outerContainer}>
      <StatusBar style="light" />
      
      {/* Khung điện thoại ảo */}
      <View style={styles.phoneFrame}>
        
        {/* Màn hình StartScreen */}
        <View style={styles.startScreen}>
          
          <Image 
            source={require('./assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />

          <View style={styles.buttonWrapper}>
            {/* Khung Bóng (Shadow View) */}
            <View style={styles.buttonShadow} />
            
            {/* Nút Chính */}
            <TouchableOpacity style={styles.buttonMain} activeOpacity={0.8}>
              <Text style={styles.buttonText}>PLAY</Text>
            </TouchableOpacity>
          </View>

        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneFrame: {
    width: '100%',
    maxWidth: 400,
    height: '100%',
    maxHeight: 850,
    backgroundColor: '#FFFFFF',
    position: 'relative',
    overflow: 'hidden',
  },
  startScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '80%',
    height: 300,
    marginBottom: 80,
  },
  buttonWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonShadow: {
    position: 'absolute',
    top: 6,
    left: 4,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 12,
  },
  buttonMain: {
    backgroundColor: '#F2B705',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#000',
    paddingVertical: 15,
    paddingHorizontal: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 32,
    letterSpacing: 2,
  },
});
