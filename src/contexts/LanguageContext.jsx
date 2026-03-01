import React, { createContext, useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const LanguageProvider = ({ children }) => {
    const { t, i18n } = useTranslation();

    // Get initial language from localStorage or i18next or default to 'bn'
    const [language, setLanguage] = useState(() => {
        const savedLanguage = localStorage.getItem('appLanguage');
        return savedLanguage || i18n.language || 'bn';
    });

    // Sync localStorage and i18next whenever state changes
    useEffect(() => {
        localStorage.setItem('appLanguage', language);
        if (i18n.language !== language) {
            i18n.changeLanguage(language);
        }
    }, [language, i18n]);

    const toggleLanguage = () => {
        setLanguage((prev) => (prev === 'bn' ? 'en' : 'bn'));
    };

    const value = {
        language,
        setLanguage,
        toggleLanguage,
        t, // Use i18next's t function
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};
