import { FileText, Sparkles } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, Spacing } from '../constants/theme';

interface DocumentCardProps {
    documentData: any;
    onGenerate: () => void;
}

export const DocumentCard = ({ documentData, onGenerate }: DocumentCardProps) => {
    const isInvoice = documentData.docType === 'invoice';
    const isMarkdown = documentData.docType === 'markdown';

    let title = 'Document';
    if (isInvoice) {
        title = `Invoice #${documentData.invoice?.invoice_number || 'Draft'}`;
    } else if (isMarkdown) {
        title = documentData.title || 'Custom Document';
    } else {
        title = `${documentData.reportType?.toUpperCase() || 'Business'} Report`;
    }

    const subtitle = isInvoice
        ? (documentData.customer?.name || 'Cash Customer')
        : (isMarkdown ? 'AI-Generated Professional Document' : `Generated on ${new Date().toLocaleDateString()}`);

    return (
        <View style={styles.documentCard}>
            <View style={styles.documentCardHeader}>
                <View style={styles.documentIconContainer}>
                    <FileText size={24} color={Colors.primary} />
                </View>
                <View style={styles.documentInfo}>
                    <Text style={styles.documentCardTitle}>{title}</Text>
                    <Text style={styles.documentCardSubtitle}>{subtitle}</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.documentCardAction}
                onPress={onGenerate}
                activeOpacity={0.8}
            >
                <Sparkles size={18} color="#FFFFFF" />
                <Text style={styles.documentCardActionText}>
                    {documentData.pdf_base64 ? 'View & Share PDF' : (isMarkdown ? 'Generate & Share PDF' : 'Generate PDF anyhow')}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    documentCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginTop: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    documentCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    documentIconContainer: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.scanBlue,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    documentInfo: {
        flex: 1,
    },
    documentCardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    documentCardSubtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    documentCardAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    documentCardActionText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
});
