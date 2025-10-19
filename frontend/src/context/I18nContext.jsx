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

    // Login/Register shared
    password: 'Şifre',
    confirm_password: 'Şifre Tekrar',
    full_name: 'Ad Soyad',
    required_fields_error: 'Lütfen tüm alanları doldurun.',
    invalid_email_error: 'Geçerli bir e-posta adresi girin.',
    server_unreachable: 'Sunucuya ulaşılamıyor. Lütfen daha sonra tekrar deneyin.',
    change_language: 'Dili değiştir',

    // Login
    login_title: 'Giriş Yap',
    login_failed: 'Giriş başarısız.',
    login_success_redirect: 'Giriş başarılı! 2 saniye içinde yönlendirileceksiniz.',
    redirecting: 'Yönlendiriliyor…',
    login_button: 'Giriş Yap',
    register_button: 'Kayıt Ol',
    forgot_password: 'Şifremi Unuttum',

    // Register
    register_title: 'Kayıt Ol',
    have_account_login: 'Zaten hesabın var mı? Giriş Yap',
    min_password_length: 'Şifre en az 6 karakter olmalıdır.',
    password_mismatch: 'Şifreler eşleşmiyor.',
    enter_first_last_name: 'Lütfen en az isim ve soyisim girin.',
    registration_error_generic: 'Kayıt sırasında bir hata oluştu.',
    register_success: 'Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...',

    // Forgot Password
    forgot_password_title: 'Şifremi Unuttum',
    forgot_password_desc: 'E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.',
    enter_email_error: 'Lütfen e-posta adresinizi girin.',
    sending: 'Gönderiliyor…',
    send_security_code: 'Güvenlik Kodu Gönder',
    code_sent: 'Güvenlik kodu e-posta adresinize gönderildi.',
    enter_code_and_continue: 'Kodu Gir ve Devam Et',
    back_to_login: 'Giriş sayfasına dön',

    // Reset Password
    reset_password_title: 'Şifreyi Sıfırla',
    security_code: 'Güvenlik Kodu',
    new_password: 'Yeni Şifre',
    new_password_confirm: 'Yeni Şifre (Tekrar)',
    update_password: 'Şifreyi Güncelle',
    reset_failed: 'Şifre sıfırlanamadı.',
    password_updated_redirect: 'Şifreniz güncellendi! 2 saniye içinde giriş sayfasına yönlendirileceksiniz.',

    // GraphList
    all_graphs: 'Tüm Graphlar',
    select_all: 'Tümünü Seç',
    graph_selected_suffix: 'graph seçildi',
    no_graphs_message: 'Henüz hiç graph bulunamadı. İlk graphı oluşturun!',
    view_edit: 'Görüntüle/Düzenle',
    delete: 'Sil',
    cancel: 'İptal',
    close: 'Kapat',
    delete_graphs_title: 'Graphları Sil',
    graphs_delete_confirm_suffix: 'adet graphı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
    delete_graph_title: "Graph'ı Sil",
    delete_graph_confirm: 'Bu graphı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
    operation_result: 'İşlem Sonucu',
    graphs_deleted_success: 'Graphlar başarıyla silindi',
    bulk_delete_failed: 'Toplu silme işlemi başarısız',
    graph_delete_error: 'Graph silinirken hata oluştu',
    node_count: 'Node sayısı:',
    edge_count: 'Edge sayısı:',
    created_at: 'Oluşturulma:',
    updated_at: 'Güncellenme:',
    unknown: 'Bilinmiyor',
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

    // Login/Register shared
    password: 'Password',
    confirm_password: 'Confirm Password',
    full_name: 'Full Name',
    required_fields_error: 'Please fill in all fields.',
    invalid_email_error: 'Please enter a valid email address.',
    server_unreachable: 'Cannot reach the server. Please try again later.',
    change_language: 'Change language',

    // Login
    login_title: 'Login',
    login_failed: 'Login failed.',
    login_success_redirect: 'Login successful! You will be redirected in 2 seconds.',
    redirecting: 'Redirecting…',
    login_button: 'Login',
    register_button: 'Register',
    forgot_password: 'Forgot Password',

    // Register
    register_title: 'Register',
    have_account_login: 'Already have an account? Sign In',
    min_password_length: 'Password must be at least 6 characters.',
    password_mismatch: 'Passwords do not match.',
    enter_first_last_name: 'Please enter at least first and last name.',
    registration_error_generic: 'An error occurred during registration.',
    register_success: 'Registration successful! Redirecting to login...',

    // Forgot Password
    forgot_password_title: 'Forgot Password',
    forgot_password_desc: 'Enter your email and we will send you a reset link.',
    enter_email_error: 'Please enter your email.',
    sending: 'Sending…',
    send_security_code: 'Send Security Code',
    code_sent: 'A security code has been sent to your email.',
    enter_code_and_continue: 'Enter Code and Continue',
    back_to_login: 'Back to Login',

    // Reset Password
    reset_password_title: 'Reset Password',
    security_code: 'Security Code',
    new_password: 'New Password',
    new_password_confirm: 'New Password (Confirm)',
    update_password: 'Update Password',
    reset_failed: 'Password could not be reset.',
    password_updated_redirect: 'Your password has been updated! Redirecting to login in 2 seconds.',

    // GraphList
    all_graphs: 'All Graphs',
    select_all: 'Select All',
    graph_selected_suffix: 'graph selected',
    no_graphs_message: 'No graphs found yet. Create your first graph!',
    view_edit: 'View/Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    close: 'Close',
    delete_graphs_title: 'Delete Graphs',
    graphs_delete_confirm_suffix: 'graphs. Are you sure you want to delete them? This action cannot be undone.',
    delete_graph_title: 'Delete Graph',
    delete_graph_confirm: 'Are you sure you want to delete this graph? This action cannot be undone.',
    operation_result: 'Operation Result',
    graphs_deleted_success: 'Graphs deleted successfully',
    bulk_delete_failed: 'Bulk delete failed',
    graph_delete_error: 'An error occurred while deleting the graph',
    node_count: 'Nodes:',
    edge_count: 'Edges:',
    created_at: 'Created:',
    updated_at: 'Updated:',
    unknown: 'Unknown',
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
