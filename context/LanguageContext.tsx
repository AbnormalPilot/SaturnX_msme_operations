
import React, { createContext, ReactNode, useContext, useState } from 'react';

type Language = 'English' | 'Hindi' | 'Hinglish';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations = {
    English: {
        greeting: 'Good Morning',
        askAI: 'Ask AI',
        searchPlaceholder: 'Search for products...',
    },
    Hindi: {
        greeting: 'नमस्ते',
        askAI: 'AI से पूछें',
        searchPlaceholder: 'उत्पाद खोजें...',
    },
    Hinglish: {
        greeting: 'Good Morning',
        askAI: 'AI se poochhein',
        searchPlaceholder: 'Products search karein...',
    }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('English');

    const t = (key: string) => {
        // @ts-ignore
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
