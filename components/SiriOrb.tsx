import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

// Apple Intelligence / Siri-style liquid colors
const COLORS = [
    '#4285F4', // Google Blue
    '#34A853', // Google Green
    '#EA4335', // Google Red
    '#FBBC05', // Google Yellow
    '#A142F4', // Purple
    '#00C9FF', // Cyan
];

interface SiriOrbProps {
    isActive: boolean;
    minimizedScale?: number;
}

export default function SiriOrb({ isActive, minimizedScale = 0.3 }: SiriOrbProps) {
    // Animation values for liquid blob effect
    const rotate1 = useSharedValue(0);
    const rotate2 = useSharedValue(0);
    const rotate3 = useSharedValue(0);
    const scale = useSharedValue(minimizedScale);

    // Warp/Morph values
    const warp1 = useSharedValue(1);
    const warp2 = useSharedValue(1);
    const warp3 = useSharedValue(1);

    useEffect(() => {
        // Constant organic rotation in background
        rotate1.value = withRepeat(withTiming(360, { duration: 8000, easing: Easing.linear }), -1, false);
        rotate2.value = withRepeat(withTiming(-360, { duration: 12000, easing: Easing.linear }), -1, false);
        rotate3.value = withRepeat(withTiming(360, { duration: 6000, easing: Easing.linear }), -1, false);

        // Warp animations for liquid feel
        warp1.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) })
            ), -1, true
        );
        warp2.value = withRepeat(
            withSequence(
                withTiming(0.9, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
                withTiming(1.1, { duration: 2500, easing: Easing.inOut(Easing.ease) })
            ), -1, true
        );
    }, []);

    // Handle Active/Inactive State Scale
    useEffect(() => {
        if (isActive) {
            scale.value = withSpring(1, { damping: 15, stiffness: 90 });
        } else {
            scale.value = withSpring(minimizedScale, { damping: 15, stiffness: 90 });
        }
    }, [isActive]);

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const blob1Style = useAnimatedStyle(() => ({
        transform: [
            { rotate: `${rotate1.value}deg` },
            { scaleX: warp1.value },
            { scaleY: warp2.value }
        ],
    }));

    const blob2Style = useAnimatedStyle(() => ({
        transform: [
            { rotate: `${rotate2.value}deg` },
            { scaleX: warp2.value },
            { scaleY: warp1.value }
        ],
    }));

    const blob3Style = useAnimatedStyle(() => ({
        transform: [
            { rotate: `${rotate3.value}deg` },
            { scale: warp1.value } // Breathing effect
        ],
    }));

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            {/* Outer Glow */}
            <View style={styles.glow} />

            {/* Liquid Layers */}
            <Animated.View style={[styles.blob, styles.blob1, blob1Style]} />
            <Animated.View style={[styles.blob, styles.blob2, blob2Style]} />
            <Animated.View style={[styles.blob, styles.blob3, blob3Style]} />

            {/* Inner Core */}
            <View style={styles.core} />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    glow: {
        position: 'absolute',
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: 'rgba(66, 133, 244, 0.2)',
        opacity: 0.6,
    },
    blob: {
        position: 'absolute',
        borderRadius: 999,
        opacity: 0.8,
    },
    blob1: {
        width: 180,
        height: 160,
        backgroundColor: 'rgba(66, 133, 244, 0.9)', // Blue
        top: 10,
        left: 10,
    },
    blob2: {
        width: 170,
        height: 180,
        backgroundColor: 'rgba(234, 67, 53, 0.8)', // Red
        bottom: 10,
        right: 15,
    },
    blob3: {
        width: 150,
        height: 150,
        backgroundColor: 'rgba(52, 168, 83, 0.7)', // Green
        top: 20,
        right: 20,
    },
    core: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 10,
    },
});
