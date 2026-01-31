import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Mic } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSpring,
    withTiming
} from 'react-native-reanimated';

export const VoiceFloatingButton = () => {
    const scale = useSharedValue(1);
    const rippleScale = useSharedValue(1);
    const rippleOpacity = useSharedValue(0.5);

    React.useEffect(() => {
        rippleScale.value = withRepeat(
            withTiming(1.5, { duration: 2000 }),
            -1,
            false
        );
        rippleOpacity.value = withRepeat(
            withTiming(0, { duration: 2000 }),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const rippleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: rippleScale.value }],
        opacity: rippleOpacity.value,
    }));

    return (
        <Link href="/voice-modal" asChild>
            <Pressable
                style={styles.container}
                onPressIn={() => scale.value = withSpring(0.9)}
                onPressOut={() => scale.value = withSpring(1)}
            >
                <Animated.View style={[styles.ripple, rippleStyle]} />
                <Animated.View style={[styles.button, animatedStyle]}>
                    <LinearGradient
                        colors={['#4285F4', '#34A853', '#FBBC04', '#EA4335']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradient}
                    >
                        <Mic color="#FFF" size={32} />
                    </LinearGradient>
                </Animated.View>
            </Pressable>
        </Link>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 24,
        alignSelf: 'center',
        zIndex: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        width: 72,
        height: 72,
        borderRadius: 36,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    gradient: {
        flex: 1,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ripple: {
        position: 'absolute',
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#4285F4',
        zIndex: -1,
    },
});
