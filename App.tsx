import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  Image,
  Animated,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  SafeAreaView,
  Alert,
  AppState,
} from 'react-native';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

const { width, height } = Dimensions.get('window');

/**
 * Premium Biometric Authentication Screen
 * Built with zero external dependencies using standard React Native components.
 */
export default function App() {
  const [authState, setAuthState] = useState<'IDLE' | 'SCANNING' | 'SUCCESS'>('IDLE');
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const successScaleAnim = useRef(new Animated.Value(0.8)).current;

  // Pulse animation loop
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Auto-lock when app goes to background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState.match(/inactive|background/)) {
        resetAuth();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleAuthenticate = async () => {
    if (authState !== 'IDLE') return;

    try {
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();

      if (!available) {
        Alert.alert(
          'Biometrics Not Available',
          'Your device does not support biometric authentication or it is not enabled.'
        );
        return;
      }

      setAuthState('SCANNING');
      
      // Start scanning animation (visual only, synced with prompt)
      scanLineAnim.setValue(0);
      const scanAnim = Animated.timing(scanLineAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      });
      scanAnim.start();

      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: 'Confirm fingerprint to unlock',
      });

      if (success) {
        setAuthState('SUCCESS');
        // Trigger success animations
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.spring(successScaleAnim, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        setAuthState('IDLE');
        scanAnim.stop();
        scanLineAnim.setValue(0);
      }
    } catch (error) {
      setAuthState('IDLE');
      Alert.alert('Error', 'An error occurred during authentication.');
      console.error(error);
    }
  };

  const resetAuth = () => {
    setAuthState('IDLE');
    fadeAnim.setValue(0);
    successScaleAnim.setValue(0.8);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ImageBackground
        source={require('./assets/bg.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.overlay}>
          {authState !== 'SUCCESS' ? (
            <View style={styles.authContainer}>
              <Text style={styles.title}>Nexus Secure</Text>
              <Text style={styles.subtitle}>Touch the sensor to unlock</Text>

              <View style={styles.glassCard}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleAuthenticate}
                  style={styles.fingerprintContainer}
                >
                  <Animated.View style={[
                    styles.fingerprintWrapper,
                    { transform: [{ scale: pulseAnim }] }
                  ]}>
                    <Image
                      source={require('./assets/fingerprint.png')}
                      style={styles.fingerprintImage}
                    />
                    
                    {authState === 'SCANNING' && (
                      <Animated.View
                        style={[
                          styles.scanLine,
                          {
                            transform: [{
                              translateY: scanLineAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 140],
                              })
                            }]
                          }
                        ]}
                      />
                    )}
                  </Animated.View>
                </TouchableOpacity>

                <Text style={styles.statusText}>
                  {authState === 'IDLE' ? 'Ready to Scan' : 'Scanning...'}
                </Text>
              </View>
              
              <Text style={styles.footerText}>Secure biometric verification</Text>
            </View>
          ) : (
            <Animated.View style={[
              styles.successContainer,
              { opacity: fadeAnim, transform: [{ scale: successScaleAnim }] }
            ]}>
              <View style={styles.successIconWrapper}>
                <Text style={styles.successIcon}>✓</Text>
              </View>
              <Text style={styles.successTitle}>Unlocked</Text>
              <Text style={styles.successSubtitle}>Welcome back, Skjuve</Text>
              
              <TouchableOpacity
                onPress={resetAuth}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Lock App</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 40,
    fontWeight: '500',
  },
  glassCard: {
    width: width * 0.8,
    padding: 30,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  fingerprintContainer: {
    marginBottom: 20,
  },
  fingerprintWrapper: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  fingerprintImage: {
    width: 140,
    height: 140,
    tintColor: '#00d2ff',
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#00d2ff',
    shadowColor: '#00d2ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00d2ff',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  footerText: {
    marginTop: 40,
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  successContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    width: width * 0.85,
  },
  successIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 210, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#00d2ff',
  },
  successIcon: {
    color: '#00d2ff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 30,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  secondaryButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
});
 