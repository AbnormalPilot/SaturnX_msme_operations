import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { GlassColors, GlassRadius, GlassShadow } from '../../constants/glass-theme';

interface GlassAvatarProps {
  imageUrl?: string | null;
  name?: string;
  size?: number;
  isAI?: boolean;
}

export function GlassAvatar({ imageUrl, name, size = 32, isAI = false }: GlassAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Get initials from name
  const getInitials = (name?: string) => {
    if (!name) return 'AI';

    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(name);

  // AI Avatar
  if (isAI) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <LinearGradient
          colors={GlassColors.gradient.primary}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Sparkles size={size * 0.5} color="#fff" strokeWidth={2.5} />
      </View>
    );
  }

  // User Avatar with Image (if loaded successfully)
  if (imageUrl && !imageError) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, { width: size, height: size }]}
          onError={() => setImageError(true)}
        />
      </View>
    );
  }

  // User Avatar with Initials
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <LinearGradient
        colors={GlassColors.gradient.accent}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: GlassRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...GlassShadow.sm,
  },

  image: {
    borderRadius: GlassRadius.full,
  },

  initials: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
});
