import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';

const LANG_KEY = 'app_language';

const translations = {
  tr: {
    profile: 'Profil',
    user: 'Kullanıcı',
    email: 'E-posta',
    language: 'Dil',
    notifications: 'Bildirimler',
    receive_notifications: 'Bildirim almak istiyorum',
    theme: 'Tema',
    go_to_canvas: 'Kanvasa Dön',
    logout: 'Çıkış',
    shortcuts: 'Kısayollar',
    my_graphs: 'Graphlarım',
    create_graph: 'Graph Oluştur',
    tree_algorithms: 'Ağaç Algoritmaları',
    array_algorithms: 'Dizi Algoritmaları',
  },
  en: {
    profile: 'Profile',
    user: 'User',
    email: 'Email',
    language: 'Language',
    notifications: 'Notifications',
    receive_notifications: 'I want to receive notifications',
    theme: 'Theme',
    go_to_canvas: 'Back to Canvas',
    logout: 'Logout',
    shortcuts: 'Shortcuts',
    my_graphs: 'My Graphs',
    create_graph: 'Create Graph',
    tree_algorithms: 'Tree Algorithms',
    array_algorithms: 'Array Algorithms',
  },
};

const I18nContext = createContext({
  language: 'tr',
  setLanguage: () => {},
  t: (k) => k,
});

export const I18nProvider = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem(LANG_KEY) || 'tr');

  useEffect(() => {
    localStorage.setItem(LANG_KEY, language);
  }, [language]);

  const t = useCallback((key) => translations[language]?.[key] ?? key, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
