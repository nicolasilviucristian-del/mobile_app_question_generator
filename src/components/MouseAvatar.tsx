import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

type MouseAvatarProps = {
  status: 'idle' | 'speaking' | 'listening' | 'reading';
  onPress?: () => void;
  speechBubbleText?: string;
};

export const MouseAvatar: React.FC<MouseAvatarProps> = ({
  status,
  onPress,
  speechBubbleText,
}) => {
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === 'speaking') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1.18,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0.95,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (status === 'listening' || status === 'reading') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: -1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      bounceAnim.setValue(1);
      rotateAnim.setValue(0);
    }
  }, [status]);

  const spin = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-6deg', '6deg'],
  });

  return (
    <View style={styles.container}>
      {speechBubbleText ? (
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{speechBubbleText}</Text>
          <View style={styles.bubbleTail} />
        </View>
      ) : null}

      <Pressable accessibilityRole="button" onPress={onPress}>
        <Animated.View
          style={[
            styles.avatarCircle,
            {
              transform: [{ scale: bounceAnim }, { rotate: spin }],
            },
            status === 'speaking' && styles.avatarSpeaking,
            status === 'listening' && styles.avatarListening,
          ]}
        >
          <Text style={styles.mouseEmoji}>🐭</Text>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeEmoji}>
              {status === 'speaking'
                ? '🔊'
                : status === 'listening'
                ? '🎧'
                : status === 'reading'
                ? '📖'
                : '✨'}
            </Text>
          </View>
        </Animated.View>
      </Pressable>
      <Text style={styles.mouseName}>Șoricelul Înțelept</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 6,
  },
  bubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F6D97A',
    marginBottom: 8,
    maxWidth: 220,
    elevation: 3,
    shadowColor: '#174D43',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  bubbleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#174D43',
    textAlign: 'center',
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    width: 10,
    height: 10,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F6D97A',
    transform: [{ rotate: '45deg' }],
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF8E1',
    borderWidth: 3,
    borderColor: '#F6D97A',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  avatarSpeaking: {
    borderColor: '#4ECA77',
    backgroundColor: '#EAF4EF',
  },
  avatarListening: {
    borderColor: '#D45F47',
    backgroundColor: '#FDF0ED',
  },
  mouseEmoji: {
    fontSize: 40,
  },
  badgeContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#174D43',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeEmoji: {
    fontSize: 11,
  },
  mouseName: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '800',
    color: '#174D43',
    letterSpacing: 0.5,
  },
});
