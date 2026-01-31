import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useUserStore } from '@/store/useUserStore';

export default function OnboardingScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { name: storedName, completeOnboarding } = useUserStore();
    const [name, setName] = useState(storedName || '');

    // Sync name from store (e.g., after Google OAuth syncs user data)
    useEffect(() => {
        if (storedName && !name) {
            setName(storedName);
        }
    }, [storedName]);

    const handleContinue = () => {
        if (name.trim()) {
            completeOnboarding(name.trim());
            router.replace('/(tabs)');
        }
    };

    const isValid = name.trim().length >= 2;

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

                <LinearGradient
                    colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
                    style={StyleSheet.absoluteFill}
                />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={[styles.content, { paddingTop: insets.top + Spacing.xxl }]}>
                        {/* Logo */}
                        <Animated.View
                            entering={FadeIn.duration(600)}
                            style={styles.logoSection}
                        >
                            <Text style={styles.logo}>BusinessAI</Text>
                        </Animated.View>

                        {/* Welcome Text */}
                        <Animated.View
                            entering={FadeInDown.delay(200).duration(500)}
                            style={styles.welcomeSection}
                        >
                            <Text style={styles.welcome}>Welcome!</Text>
                            <Text style={styles.subtitle}>What should we call you?</Text>
                        </Animated.View>

                        {/* Input */}
                        <Animated.View
                            entering={FadeInDown.delay(400).duration(500)}
                            style={styles.inputSection}
                        >
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your name"
                                placeholderTextColor={Colors.textTertiary}
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                autoFocus
                                returnKeyType="done"
                                onSubmitEditing={handleContinue}
                            />
                        </Animated.View>

                        {/* Spacer */}
                        <View style={styles.spacer} />

                        {/* Continue Button */}
                        <Animated.View
                            entering={FadeInDown.delay(600).duration(500)}
                            style={[styles.buttonSection, { paddingBottom: insets.bottom + Spacing.xl }]}
                        >
                            <TouchableOpacity
                                style={[styles.button, !isValid && styles.buttonDisabled]}
                                onPress={handleContinue}
                                activeOpacity={0.8}
                                disabled={!isValid}
                            >
                                <Text style={styles.buttonText}>Continue</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
    },
    logoSection: {
        alignItems: 'center',
        marginTop: Spacing.xxl,
    },
    logo: {
        fontSize: 48,
        fontWeight: '700',
        color: Colors.text,
        letterSpacing: -1,
    },
    welcomeSection: {
        alignItems: 'center',
        marginTop: Spacing.xxl,
    },
    welcome: {
        fontSize: 28,
        fontWeight: '600',
        color: Colors.text,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginTop: Spacing.sm,
    },
    inputSection: {
        marginTop: Spacing.xl,
    },
    input: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        fontSize: 18,
        color: Colors.text,
        borderWidth: 1,
        borderColor: Colors.border,
        textAlign: 'center',
    },
    spacer: {
        flex: 1,
    },
    buttonSection: {
        alignItems: 'center',
    },
    button: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.full,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xxl,
        width: '100%',
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: Colors.border,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
});
