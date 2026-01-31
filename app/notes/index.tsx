import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    Check,
    Clock,
    Edit2,
    FileText,
    Mic,
    Pin,
    Search,
    Send,
    Share2,
    Trash2,
    X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    FadeInUp,
    SlideInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

import { BorderRadius, Colors, Spacing } from "../../constants/theme";
import { useNotesStore } from "../../store/useNotesStore";

const { width, height } = Dimensions.get("window");

const NoteCard = ({
  note,
  onDelete,
  onEdit,
  onTogglePin,
}: {
  note: any;
  onDelete: (id: string) => void;
  onEdit: (note: any) => void;
  onTogglePin: (id: string) => void;
}) => {
  const date = new Date(note.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `BusinessAI Note (${note.category}):\n${note.content}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.noteCard}>
      <View style={styles.noteHeader}>
        <View style={styles.timeWrapper}>
          <Clock size={12} color={Colors.textTertiary} />
          <Text style={styles.noteDate}>{date}</Text>
          {note.isPinned && (
            <Pin
              size={12}
              color={Colors.primary}
              fill={Colors.primary}
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => onTogglePin(note.id)}
            style={styles.iconBtn}
          >
            <Pin
              size={16}
              color={note.isPinned ? Colors.primary : Colors.textTertiary}
              fill={note.isPinned ? Colors.primary : "transparent"}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onEdit(note)} style={styles.iconBtn}>
            <Edit2 size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
            <Share2 size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(note.id)}
            style={styles.deleteBtn}
          >
            <Trash2 size={16} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.noteContent}>{note.content}</Text>
      <View style={styles.cardFooter}>
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: getCategoryColor(note.category) + "20" },
          ]}
        >
          <Text
            style={[
              styles.categoryText,
              { color: getCategoryColor(note.category) },
            ]}
          >
            {note.category}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "Payment":
      return "#4285F4";
    case "Stock":
      return "#EA4335";
    case "Reminder":
      return "#FBBC04";
    default:
      return "#5F6368";
  }
};

export default function NotesScreen() {
  const router = useRouter();
  const { notes, addNote, deleteNote, updateNote, togglePin } = useNotesStore();

  const [inputText, setInputText] = useState("");
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Advanced State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [editingNote, setEditingNote] = useState<any>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState<any>("General");

  // Filtering Logic
  const filteredNotes = notes
    .filter((n) => {
      const matchesSearch = n.content
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || n.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const categories = ["All", "General", "Payment", "Stock", "Reminder"];

  // Voice Wave Animation
  const wave1 = useSharedValue(20);
  const wave2 = useSharedValue(20);
  const wave3 = useSharedValue(20);

  useEffect(() => {
    if (isListening) {
      wave1.value = withRepeat(
        withSequence(
          withTiming(60, { duration: 300 }),
          withTiming(20, { duration: 300 }),
        ),
        -1,
        true,
      );
      wave2.value = withRepeat(
        withSequence(
          withTiming(80, { duration: 250 }),
          withTiming(25, { duration: 250 }),
        ),
        -1,
        true,
      );
      wave3.value = withRepeat(
        withSequence(
          withTiming(70, { duration: 350 }),
          withTiming(30, { duration: 350 }),
        ),
        -1,
        true,
      );
    } else {
      wave1.value = withTiming(20);
      wave2.value = withTiming(20);
      wave3.value = withTiming(20);
    }
  }, [isListening]);

  const waveStyle1 = useAnimatedStyle(() => ({ height: wave1.value }));
  const waveStyle2 = useAnimatedStyle(() => ({ height: wave2.value }));
  const waveStyle3 = useAnimatedStyle(() => ({ height: wave3.value }));

  const handleAddNote = () => {
    if (!inputText.trim()) return;
    const category =
      selectedCategory === "All" ? "General" : (selectedCategory as any);
    addNote(inputText.trim(), category);
    setInputText("");
    Keyboard.dismiss();
  };

  const toggleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode);
    if (!isVoiceMode) {
      startListening();
    } else {
      stopListening();
    }
  };

  const startListening = () => {
    setIsListening(true);
    // STIMULATED VOICE RECOGNITION (Mock for Expo/Web compatibility)
    // In a real app, this would use react-native-voice
    setTimeout(() => {
      if (isListening) {
        // Just for demo purposes, if it's still listening after 2 seconds
        // we'll "capture" some common business phrases
        const phrases = [
          "Remember to check stock",
          "Payment pending for Sharma ji",
          "Order 10kg sugar tomorrow",
        ];
        const randomPhrase =
          phrases[Math.floor(Math.random() * phrases.length)];
        setInputText((prev) =>
          prev ? prev + " " + randomPhrase : randomPhrase,
        );
        stopListening();
      }
    }, 3000);
  };

  const stopListening = () => {
    setIsListening(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Digital Notes</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat && styles.categoryChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            onDelete={deleteNote}
            onEdit={(note) => {
              setEditingNote(note);
              setEditContent(note.content);
              setEditCategory(note.category);
              setEditModalVisible(true);
            }}
            onTogglePin={togglePin}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <FileText size={48} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No notes yet</Text>
            <Text style={styles.emptySubtitle}>
              Keep track of business reminders or pending payments here.
            </Text>
          </View>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <View style={styles.bottomSection}>
          {isVoiceMode ? (
            <Animated.View entering={SlideInUp} style={styles.voiceOverlay}>
              <View style={styles.voiceHeader}>
                <Text style={styles.voiceStatus}>
                  {isListening ? "Listening..." : "Tap Mic to Start"}
                </Text>
                <TouchableOpacity onPress={() => setIsVoiceMode(false)}>
                  <X size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.waveContainer}>
                <Animated.View style={[styles.waveBar, waveStyle1]} />
                <Animated.View style={[styles.waveBar, waveStyle2]} />
                <Animated.View style={[styles.waveBar, waveStyle3]} />
              </View>

              <View style={styles.voiceActions}>
                <TouchableOpacity
                  style={[
                    styles.voiceMicBtn,
                    isListening && styles.listeningBtn,
                  ]}
                  onPress={isListening ? stopListening : startListening}
                >
                  <Mic size={32} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.voiceSendBtn}
                  onPress={() => {
                    handleAddNote();
                    setIsVoiceMode(false);
                  }}
                >
                  <Send size={24} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          ) : (
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { maxHeight: 100 }]}
                placeholder="Write a note..."
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
              <View style={styles.inputActions}>
                <TouchableOpacity
                  style={styles.micActionBtn}
                  onPress={() => setIsVoiceMode(true)}
                >
                  <Mic size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sendBtnMain,
                    !inputText.trim() && styles.sendBtnDisabled,
                  ]}
                  onPress={handleAddNote}
                  disabled={!inputText.trim()}
                >
                  <Send size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Note</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.editInput}
              multiline
              value={editContent}
              onChangeText={setEditContent}
              placeholder="Enter note content..."
            />

            <Text style={styles.modalSubtitle}>Select Category</Text>
            <View style={styles.modalCategories}>
              {["General", "Payment", "Stock", "Reminder"].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.modalCatChip,
                    editCategory === cat && styles.modalCatChipActive,
                  ]}
                  onPress={() => setEditCategory(cat as any)}
                >
                  <Text
                    style={[
                      styles.modalCatText,
                      editCategory === cat && styles.modalCatTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => {
                updateNote(editingNote.id, editContent, editCategory);
                setEditModalVisible(false);
              }}
            >
              <LinearGradient
                colors={[Colors.primary, "#4a90e2"]}
                style={styles.saveBtnGradient}
              >
                <Check size={20} color="white" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: Colors.text,
  },
  categoryContainer: {
    paddingVertical: Spacing.sm,
  },
  categoryScroll: {
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  categoryChipTextActive: {
    color: "white",
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  noteCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  timeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  noteDate: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBtn: {
    padding: 2,
  },
  deleteBtn: {
    padding: 2,
  },
  noteContent: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  cardFooter: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  bottomSection: {
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 8,
    paddingRight: 12,
  },
  inputActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  micActionBtn: {
    padding: 8,
  },
  sendBtnMain: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  voiceOverlay: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  voiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  voiceStatus: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  waveContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    height: 100,
  },
  waveBar: {
    width: 8,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  voiceActions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 40,
  },
  voiceMicBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.error,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  listeningBtn: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
  },
  voiceSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    minHeight: height * 0.6,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
  },
  editInput: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.text,
    minHeight: 150,
    textAlignVertical: "top",
    marginBottom: Spacing.lg,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  modalCategories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: Spacing.xl,
  },
  modalCatChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCatChipActive: {
    backgroundColor: Colors.primary + "15",
    borderColor: Colors.primary,
  },
  modalCatText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  modalCatTextActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  saveBtn: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  saveBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  saveBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
