import { useRouter } from 'expo-router';
import { Languages, Mic, Send, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, { FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

const { height } = Dimensions.get('window');
const BLUE = '#4285F4';

export default function VoiceModal() {
    const router = useRouter();
    const [isListening, setIsListening] = useState(true);
    const [messages, setMessages] = useState<{ id: string; text: string; isUser: boolean }[]>([]);
    const [inputText, setInputText] = useState('');
    const [language, setLanguage] = useState<'en' | 'hi'>('en');

    const wave1 = useSharedValue(20);
    const wave2 = useSharedValue(30);
    const wave3 = useSharedValue(40);
    const wave4 = useSharedValue(25);
    const wave5 = useSharedValue(35);

    useEffect(() => {
        if (isListening) {
            wave1.value = withRepeat(withSequence(withTiming(50, { duration: 300 }), withTiming(20, { duration: 300 })), -1, true);
            wave2.value = withRepeat(withSequence(withTiming(60, { duration: 250 }), withTiming(25, { duration: 250 })), -1, true);
            wave3.value = withRepeat(withSequence(withTiming(70, { duration: 200 }), withTiming(30, { duration: 200 })), -1, true);
            wave4.value = withRepeat(withSequence(withTiming(55, { duration: 280 }), withTiming(20, { duration: 280 })), -1, true);
            wave5.value = withRepeat(withSequence(withTiming(45, { duration: 320 }), withTiming(25, { duration: 320 })), -1, true);
        }
    }, [isListening]);

    const waveStyle1 = useAnimatedStyle(() => ({ height: wave1.value }));
    const waveStyle2 = useAnimatedStyle(() => ({ height: wave2.value }));
    const waveStyle3 = useAnimatedStyle(() => ({ height: wave3.value }));
    const waveStyle4 = useAnimatedStyle(() => ({ height: wave4.value }));
    const waveStyle5 = useAnimatedStyle(() => ({ height: wave5.value }));

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isListening) {
                setIsListening(false);
                setMessages([{ id: '1', text: language === 'en' ? 'Show me today\'s top products' : 'आज के टॉप प्रोडक्ट्स दिखाओ', isUser: true }]);
                setTimeout(() => {
                    setMessages(prev => [...prev, { id: '2', text: language === 'en' ? 'Your top products today:\n\n1. Basmati Rice - ₹2,400\n2. Sunflower Oil - ₹1,800\n3. Atta - ₹1,200' : 'आज के टॉप प्रोडक्ट्स:\n\n1. बासमती चावल - ₹2,400\n2. सूरजमुखी तेल - ₹1,800\n3. आटा - ₹1,200', isUser: false }]);
                }, 1500);
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.overlay} onPress={() => router.back()} activeOpacity={1} />
            <Animated.View entering={FadeInUp.duration(400)} style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.aiIcon}><Text style={styles.aiIconText}>🤖</Text></View>
                        <View><Text style={styles.headerTitle}>BusinessAI</Text><Text style={styles.headerSubtitle}>{isListening ? 'Listening...' : 'Ready'}</Text></View>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.langToggle} onPress={() => setLanguage(l => l === 'en' ? 'hi' : 'en')}>
                            <Languages size={16} color="#000" /><Text style={styles.langText}>{language === 'en' ? 'हि' : 'EN'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}><X size={20} color="#666" /></TouchableOpacity>
                    </View>
                </View>

                {isListening && (
                    <View style={styles.waveContainer}>
                        <Animated.View style={[styles.waveBar, waveStyle1]} />
                        <Animated.View style={[styles.waveBar, waveStyle2]} />
                        <Animated.View style={[styles.waveBar, waveStyle3]} />
                        <Animated.View style={[styles.waveBar, waveStyle4]} />
                        <Animated.View style={[styles.waveBar, waveStyle5]} />
                    </View>
                )}

                <ScrollView style={styles.chatArea} contentContainerStyle={styles.chatContent}>
                    {messages.map((msg, i) => (
                        <Animated.View key={msg.id} entering={FadeIn.delay(i * 100).duration(300)} style={[styles.messageBubble, msg.isUser ? styles.userBubble : styles.aiBubble]}>
                            <Text style={[styles.messageText, msg.isUser ? styles.userText : styles.aiText]}>{msg.text}</Text>
                        </Animated.View>
                    ))}
                </ScrollView>

                <View style={styles.inputArea}>
                    <View style={styles.inputContainer}>
                        <TextInput style={styles.textInput} placeholder="Type a message..." placeholderTextColor="#999" value={inputText} onChangeText={setInputText} />
                        <TouchableOpacity style={styles.sendBtn}><Send size={20} color="#FFF" /></TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.micBtn} onPress={() => setIsListening(!isListening)}><Mic size={28} color="#FFF" /></TouchableOpacity>
                    <Text style={styles.hintText}>{isListening ? 'Tap to stop' : 'Tap to speak'}</Text>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'flex-end' },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    content: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, minHeight: height * 0.75, paddingTop: 8 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    aiIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F0F7FF', justifyContent: 'center', alignItems: 'center' },
    aiIconText: { fontSize: 20 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
    headerSubtitle: { fontSize: 13, color: '#666' },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    langToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F5F5F5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
    langText: { fontSize: 13, fontWeight: '600', color: '#000' },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
    waveContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 40 },
    waveBar: { width: 8, borderRadius: 4, backgroundColor: BLUE },
    chatArea: { flex: 1, paddingHorizontal: 20 },
    chatContent: { paddingVertical: 16 },
    messageBubble: { maxWidth: '85%', padding: 16, borderRadius: 20, marginBottom: 12 },
    userBubble: { alignSelf: 'flex-end', backgroundColor: '#000', borderBottomRightRadius: 4 },
    aiBubble: { alignSelf: 'flex-start', backgroundColor: '#F5F5F5', borderBottomLeftRadius: 4 },
    messageText: { fontSize: 15, lineHeight: 22 },
    userText: { color: '#FFF' },
    aiText: { color: '#000' },
    inputArea: { padding: 20, paddingBottom: 40, alignItems: 'center' },
    inputContainer: { flexDirection: 'row', width: '100%', backgroundColor: '#F5F5F5', borderRadius: 24, paddingLeft: 20, paddingRight: 4, paddingVertical: 4, marginBottom: 20 },
    textInput: { flex: 1, fontSize: 16, color: '#000', paddingVertical: 12 },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: BLUE, justifyContent: 'center', alignItems: 'center' },
    micBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: BLUE, justifyContent: 'center', alignItems: 'center' },
    hintText: { marginTop: 12, fontSize: 13, color: '#999' },
});
