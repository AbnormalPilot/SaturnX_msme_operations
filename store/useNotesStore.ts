import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  category: "General" | "Payment" | "Stock" | "Reminder";
  isPinned: boolean;
}

interface NotesState {
  notes: Note[];
  addNote: (content: string, category?: Note["category"]) => void;
  deleteNote: (id: string) => void;
  updateNote: (
    id: string,
    content: string,
    category?: Note["category"],
  ) => void;
  togglePin: (id: string) => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: [],

      addNote: (content, category) => {
        const newNote: Note = {
          id: Math.random().toString(36).substr(2, 9),
          content,
          createdAt: new Date().toISOString(),
          category: category || "General",
          isPinned: false,
        };
        set((state) => ({ notes: [newNote, ...state.notes] }));
      },

      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
        }));
      },

      updateNote: (id, content, category) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id
              ? {
                  ...n,
                  content,
                  category: category || n.category,
                  updatedAt: new Date().toISOString(),
                }
              : n,
          ),
        }));
      },

      togglePin: (id) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, isPinned: !n.isPinned } : n,
          ),
        }));
      },
    }),
    {
      name: "notes-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
