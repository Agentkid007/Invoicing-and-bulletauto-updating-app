/**
 * mobile/src/screens/SplashScreen.js
 * Startup splash animation for BulletAuto mobile (Expo / React Native).
 *
 * Animation sequence (total ≈ 3.5 s):
 *   Phase 0 – intro  (0–720 ms)  : Emblem rotates in with blue glow
 *   Phase 1 – reveal (720–1280 ms): Smile fades in, monitor slides up
 *   Phase 2 – text   (1280–2200 ms): KIDDY wipes in, PRODUCTIONS fades in
 *   Phase 3 – outro  (2200–3100 ms): Blue pulse ring radiates outward
 *   Exit              (3100–3550 ms): Overlay fades out → onComplete()
 *
 * Props
 *   onComplete  {function}  Called after animation finishes.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const LOGO = require('../../assets/kiddy-logo.png');

export default function SplashScreen({ onComplete }) {
  // ── Animated values ─────────────────────────────────────────────────────────
  // Emblem intro
  const emblemScale  = useRef(new Animated.Value(0.4)).current;
  const emblemRotate = useRef(new Animated.Value(-0.75)).current; // turns (-270°)
  const emblemOpacity= useRef(new Animated.Value(0)).current;

  // Glow (box-shadow simulation via opacity of a blur overlay)
  const glowOpacity  = useRef(new Animated.Value(0)).current;

  // Monitor frame (slides up)
  const monitorY     = useRef(new Animated.Value(30)).current;
  const monitorOpacity= useRef(new Animated.Value(0)).current;

  // Smile
  const smileOpacity = useRef(new Animated.Value(0)).current;

  // Text
  const kiddyScale   = useRef(new Animated.Value(0.7)).current;
  const kiddyOpacity = useRef(new Animated.Value(0)).current;
  const prodOpacity  = useRef(new Animated.Value(0)).current;
  const prodY        = useRef(new Animated.Value(8)).current;

  // Pulse ring
  const pulseScale   = useRef(new Animated.Value(0.8)).current;
  const pulseOpacity = useRef(new Animated.Value(0)).current;

  // Overlay exit
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  // Keep a stable ref to onComplete so the one-shot effect always calls the
  // latest version without adding it to the effect's dependency array.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    const easeOut  = Easing.out(Easing.cubic);
    const easeIn   = Easing.in(Easing.cubic);
    const spring   = Easing.out(Easing.back(1.4));

    // ── Phase 0: INTRO — rotate in (0 ms) ─────────────────────────────────
    Animated.parallel([
      Animated.timing(emblemOpacity, {
        toValue: 1, duration: 420, useNativeDriver: true,
      }),
      Animated.timing(emblemScale, {
        toValue: 1, duration: 720, easing: spring, useNativeDriver: true,
      }),
      Animated.timing(emblemRotate, {
        toValue: 0, duration: 720, easing: spring, useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 1, duration: 400, useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.7, duration: 320, useNativeDriver: true,
        }),
      ]),
    ]).start();

    // ── Phase 1: REVEAL — smile + monitor (720 ms) ────────────────────────
    const t1 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(smileOpacity, {
          toValue: 1, duration: 400, delay: 100, easing: easeOut, useNativeDriver: true,
        }),
        Animated.timing(monitorOpacity, {
          toValue: 1, duration: 450, easing: spring, useNativeDriver: true,
        }),
        Animated.timing(monitorY, {
          toValue: 0, duration: 450, easing: spring, useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(emblemScale, {
            toValue: 1.04, duration: 275, easing: easeOut, useNativeDriver: true,
          }),
          Animated.timing(emblemScale, {
            toValue: 1, duration: 275, easing: easeOut, useNativeDriver: true,
          }),
        ]),
      ]).start();
    }, 720);

    // ── Phase 2: TEXT — KIDDY + PRODUCTIONS (1280 ms) ─────────────────────
    const t2 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(kiddyOpacity, {
          toValue: 1, duration: 400, easing: easeOut, useNativeDriver: true,
        }),
        Animated.timing(kiddyScale, {
          toValue: 1, duration: 550, easing: spring, useNativeDriver: true,
        }),
        Animated.timing(prodOpacity, {
          toValue: 1, duration: 450, delay: 350, easing: easeOut, useNativeDriver: true,
        }),
        Animated.timing(prodY, {
          toValue: 0, duration: 450, delay: 350, easing: easeOut, useNativeDriver: true,
        }),
      ]).start();
    }, 1280);

    // ── Phase 3: OUTRO — pulse ring (2200 ms) ─────────────────────────────
    const t3 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(pulseOpacity, {
          toValue: 1, duration: 120, useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 2.2, duration: 850, easing: easeIn, useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0, duration: 850, delay: 120, easing: easeIn, useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(emblemScale, {
            toValue: 1.03, duration: 350, easing: easeOut, useNativeDriver: true,
          }),
          Animated.timing(emblemScale, {
            toValue: 1, duration: 350, easing: easeOut, useNativeDriver: true,
          }),
        ]),
        Animated.timing(glowOpacity, {
          toValue: 0.5, duration: 700, easing: easeIn, useNativeDriver: true,
        }),
      ]).start();
    }, 2200);

    // ── Exit — fade out overlay (3100 ms) ─────────────────────────────────
    const t4 = setTimeout(() => {
      Animated.timing(overlayOpacity, {
        toValue: 0, duration: 450, easing: easeIn, useNativeDriver: true,
      }).start();
    }, 3100);

    const t5 = setTimeout(() => onCompleteRef.current?.(), 3550);

    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, []); // intentionally empty — animation is a one-shot mount effect

  const rotateDeg = emblemRotate.interpolate({
    inputRange:  [-0.75, 0],
    outputRange: ['-270deg', '0deg'],
  });

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
      <View style={styles.container}>

        {/* ── Pulse ring ─────────────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.pulseRing,
            { opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
          ]}
        />

        {/* ── Emblem ─────────────────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.emblemWrapper,
            {
              opacity: emblemOpacity,
              transform: [{ scale: emblemScale }, { rotate: rotateDeg }],
            },
          ]}
        >
          {/* Blue glow layer behind the logo */}
          <Animated.View style={[styles.glowLayer, { opacity: glowOpacity }]} />

          {/* Monitor frame overlay (slides up) */}
          <Animated.View
            style={[
              styles.monitorFrame,
              { opacity: monitorOpacity, transform: [{ translateY: monitorY }] },
            ]}
          />

          {/* Logo image */}
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />

          {/* Smile overlay (fades in) */}
          <Animated.View style={[styles.smileOverlay, { opacity: smileOpacity }]} />
        </Animated.View>

        {/* ── Brand text ─────────────────────────────────────────────────── */}
        <View style={styles.textBlock}>
          <Animated.Text
            style={[
              styles.brandName,
              { opacity: kiddyOpacity, transform: [{ scaleX: kiddyScale }] },
            ]}
          >
            KIDDY
          </Animated.Text>
          <Animated.Text
            style={[
              styles.brandSub,
              { opacity: prodOpacity, transform: [{ translateY: prodY }] },
            ]}
          >
            PRODUCTIONS
          </Animated.Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position:        'absolute',
    top:             0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#0a0a0a',
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          9999,
  },
  container: {
    alignItems: 'center',
    position:   'relative',
  },
  emblemWrapper: {
    width:           200,
    height:          200,
    alignItems:      'center',
    justifyContent:  'center',
    position:        'relative',
  },
  glowLayer: {
    position:        'absolute',
    width:           180,
    height:          180,
    borderRadius:    90,
    backgroundColor: 'transparent',
    borderWidth:     18,
    borderColor:     'rgba(33, 150, 243, 0.35)',
    top:             10, left: 10,
  },
  monitorFrame: {
    position:        'absolute',
    width:           162,
    height:          150,
    borderRadius:    22,
    borderWidth:     2.8,
    borderColor:     '#1e5fc7',
    top:             18, left: 19,
  },
  logo: {
    width:  200,
    height: 200,
  },
  smileOverlay: {
    position:        'absolute',
    width:           60,
    height:          30,
    borderBottomLeftRadius:  30,
    borderBottomRightRadius: 30,
    borderWidth:     0,
    bottom:          55,
  },
  pulseRing: {
    position:        'absolute',
    width:           180,
    height:          180,
    borderRadius:    90,
    borderWidth:     2,
    borderColor:     '#2196f3',
    top:             10, left: 10,
    zIndex:          -1,
  },
  textBlock: {
    marginTop: 24,
    alignItems: 'center',
  },
  brandName: {
    fontFamily:    'System',
    fontSize:      38,
    fontWeight:    '900',
    letterSpacing: 6,
    color:         '#42a5f5',
    textTransform: 'uppercase',
  },
  brandSub: {
    fontFamily:    'System',
    fontSize:      13,
    fontWeight:    '400',
    letterSpacing: 5,
    color:         'rgba(180, 195, 220, 0.85)',
    textTransform: 'uppercase',
    marginTop:     6,
  },
});
