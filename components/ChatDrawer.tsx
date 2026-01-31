import { Plus, Send } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';



interface ChatDrawerProps {
    onSend: (message: string) => void;
    onVoicePress: () => void;
}

export default function ChatDrawer({
    onSend,
    onVoicePress,
}: ChatDrawerProps) {
    const [message, setMessage] = useState('');
    const [isVoiceActive, setIsVoiceActive] = useState(false);

    const handleSend = () => {
        if (message.trim()) {
            onSend(message);
            setMessage('');
        }
    };

    const handleVoicePress = () => {
        setIsVoiceActive(!isVoiceActive);
        onVoicePress();
    };



    return (
        <View style={styles.container}>
            {/* Main Input Row */}
            <View style={styles.inputRow}>
                {/* Voice Button */}
                <TouchableOpacity
                    style={styles.voiceButton}
                    onPress={handleVoicePress}
                    activeOpacity={0.8}
                >
                </TouchableOpacity>

                {/* Text Input */}
                <TextInput
                    style={styles.textInput}
                    placeholder="Type a message..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={message}
                    onChangeText={setMessage}
                    onSubmitEditing={handleSend}
                    returnKeyType="send"
                />

                {/* Send/Plus Button */}
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={message.trim() ? handleSend : undefined}
                    activeOpacity={0.8}
                >
                    {message.trim() ? (
                        <Send size={20} color="#FFF" />
                    ) : (
                        <Plus size={24} color="#FFF" />
                    )}
                </TouchableOpacity>
            </View>

            {/* Suggestion Chips */}


            {/* Home Indicator Line */}
            <View style={styles.homeIndicator} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 16,
        paddingBottom: 8,
        paddingHorizontal: 16,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    voiceButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        // Background handled by SiriOrb overlay
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    voiceIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        height: 28,
    },
    voiceBar: {
        width: 3,
        backgroundColor: '#000',
        borderRadius: 2,
    },
    textInput: {
        flex: 1,
        height: 48,
        color: '#FFF',
        fontSize: 16,
        paddingHorizontal: 4,
    },
    actionButton: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    suggestionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 16,
    },
    suggestionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 8,
    },
    suggestionText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    homeIndicator: {
        width: 134,
        height: 5,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 3,
        alignSelf: 'center',
        marginTop: 16,
    },
});
