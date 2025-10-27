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

    prev: 'Geri',
    next: 'İleri',

    graph_simulator: 'Graph Simülatörü',

    // TopBar
    'topbar.options': 'Seçenekler',
    'topbar.actions_aria': 'topbar-actions',
    'topbar.select_placeholder': '--',

    // GraphCreation / common form messages
    vertex_name_required: 'İsim boş olamaz',
    vertex_name_max: 'Düğüm adı en fazla 6 karakter olabilir',
    vertex_name_duplicate: 'Aynı isimli düğüm zaten var',
    weighted_mode_on: 'Ağırlıklı moda geçildi — kenarlar sıfırlandı, lütfen tekrar ekleyin.',
    weighted_mode_off: 'Ağırlıklı mod kapandı — kenarlar sıfırlandı.',
    file_empty: 'Dosya boş görünüyor',
    file_format_error: 'Dosya formatı hatalı.',
    file_read_error: 'Dosya okunamadı',
    edge_exists_error: 'Bu kenar zaten var',
    weight_required_error: 'Ağırlıklı graph için kenar ağırlığı gereklidir',
    graph_name_empty: 'Graph adı boş olamaz',
    min_vertices_required: 'En az bir düğüm eklemelisiniz',
    graph_create_error: 'Graph oluşturulurken hata oluştu',
    graph_loaded: 'Graph yüklendi',
    graph_reset: 'Graph sıfırlandı',
    unsupported_graph_type: 'Desteklenmeyen graph tipi',
    quickgraph_full_created: 'Tam graph oluşturuldu ({n} düğüm, {m} kenar)',
    quickgraph_tree_created: 'Ağaç oluşturuldu (n={n}, k={k})',
    quickgraph_star_created: 'Star oluşturuldu (n={n}, merkez sayısı={c})',
    quickgraph_ring_created: 'Ring oluşturuldu ({m})',
    quickgraph_bipartite_created: 'Tam bipartite oluşturuldu (A={a}, B={b}, toplam={n}, kenar={m})',
    quickgraph_grid_created: 'Grid oluşturuldu ({r}x{c}, toplam={n}, kenar={m}, w={w})',
    quickgraph_error: 'Hızlı graph oluşturulurken hata oluştu',

    // weight editor
    edit_weight_title: 'Kenar Ağırlığını Düzenle',
    weight_label: 'Ağırlık',
    cancel: 'İptal',
    save: 'Kaydet',

    // Weighted example / File info
    weighted_example_title: 'Ağırlıklı Graph Ekle - Bilgilendirme',
    weighted_example_desc: 'Aşağıdaki örnek, kenar ağırlıklarını içeren dosya formatını gösterir:',
    weighted_example_code: 'L1:(L2, 3),(L3, 1),(L4, 2),(L5, 4)\nL2:(L1, 3),(L3, 5),(L4, 1)',
    weighted_example_note1: 'Bu format, yönlü graph’ı tanımlar.',
    weighted_example_select_file: 'Dosya Seç',

    file_info_title: 'Graph Ekle - Bilgilendirme',
    file_info_desc: 'Dosyanız aşağıdaki formatta olmalıdır:',
    file_info_code: 'L1:L2,L3,L4,L5\nL2:L1,L3,L4',
    file_info_select_weighted: 'Ağırlıklı Örnek',

    // Vertices / Edges panels
    vertices_title: 'Düğümler (Vertex)',
    new_vertex_label: 'Yeni Düğüm',
    add_label: 'Ekle',

    edges_title: 'Kenarlar (Edges)',
    edges_toggle_open: 'Kenar Ekle',
    edges_toggle_close: 'Kapat',
    from_label: 'From',
    to_label: 'To',
    edge_weight_label: 'Kenar Ağırlığı',

    // Edge list
    edit_weight_tooltip: 'Ağırlığı düzenle',

    // QuickGraph dialog
    quickgraph_title: 'Hızlı Graph Oluştur',
    quickgraph_graph_type: 'Graph Tipi',
    quickgraph_type_full: 'Tam Graph (Complete)',
    quickgraph_type_tree: 'Ağaç (n, k)',
    quickgraph_type_star: 'Star (n, merkez)',
    quickgraph_type_ring: 'Ring (n)',
    quickgraph_type_bipartite: 'Tam İki Parça (a, b)',
    quickgraph_type_grid: 'Grid (m, n, w)',
    quickgraph_type_random: 'Random (öneri)',
    quickgraph_layout: 'Layout',
    quickgraph_layout_circular: 'Dairesel (Circular)',
    quickgraph_layout_grid: 'Izgara (Grid)',
    quickgraph_node_count: 'Düğüm Sayısı (n)',
    quickgraph_node_helper: '1-200 arasında bir sayı girin',
    quickgraph_tree_k: 'Çocuk Sayısı (k)',
    quickgraph_star_centers: 'Merkez Sayısı',
    quickgraph_grid_rows: 'Satır Sayısı (m)',
    quickgraph_grid_cols: 'Sütun Sayısı (n)',
    quickgraph_grid_weight: 'Kenar Ağırlığı (w)',
    quickgraph_bipartite_a: 'A kümesi (a)',
    quickgraph_bipartite_b: 'B kümesi (b)',
    quickgraph_random_info_title: 'Random graph önerileri',
    quickgraph_create: 'Oluştur',
    quickgraph_cancel: 'İptal',

    // Bottom actions
    quick_graph_btn: 'Hızlı Graph',
    reset_btn: 'Reset',
    file_add_btn: 'Dosya Ekle',
    create_btn: 'Oluştur',

    // GraphNameOptions
    graph_name_label: 'Graph Adı',
    directed_label: 'Yönlü (Directed)',
    weighted_label: 'Ağırlıklı (Weighted)',
    enter_valid_number: 'Geçerli bir sayı girin',
    previous_page: 'Önceki sayfa',
    next_page: 'Sonraki sayfa',
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

    prev: 'Previous',
    next: 'Next',
    
    graph_simulator: 'Graph Simulator',

    // TopBar
    'topbar.options': 'Options',
    'topbar.actions_aria': 'topbar-actions',
    'topbar.select_placeholder': '--',

    // GraphCreation / common form messages
    vertex_name_required: 'Name cannot be empty',
    vertex_name_max: 'Vertex name can be up to 6 characters',
    vertex_name_duplicate: 'A vertex with the same name already exists',
    weighted_mode_on: 'Switched to weighted mode — edges cleared, please re-add.',
    weighted_mode_off: 'Weighted mode turned off — edges cleared.',
    file_empty: 'File appears empty',
    file_format_error: 'File format invalid',
    file_read_error: 'Could not read file',
    edge_exists_error: 'This edge already exists',
    weight_required_error: 'Edge weight is required for weighted graph',
    graph_name_empty: 'Graph name cannot be empty',
    min_vertices_required: 'You must add at least one vertex',
    graph_create_error: 'Error while creating graph',
    graph_loaded: 'Graph loaded',
    graph_reset: 'Graph reset',
    unsupported_graph_type: 'Unsupported graph type',
    quickgraph_full_created: 'Complete graph created ({n} nodes, {m} edges)',
    quickgraph_tree_created: 'Tree created (n={n}, k={k})',
    quickgraph_star_created: 'Star created (n={n}, centers={c})',
    quickgraph_ring_created: 'Ring created ({m})',
    quickgraph_bipartite_created: 'Complete bipartite created (A={a}, B={b}, total={n}, edges={m})',
    quickgraph_grid_created: 'Grid created ({r}x{c}, total={n}, edges={m}, w={w})',
    quickgraph_error: 'Error creating quick graph',

    // weight editor
    edit_weight_title: 'Edit Edge Weight',
    weight_label: 'Weight',
    cancel: 'Cancel',
    save: 'Save',

    // Weighted example / File info
    weighted_example_title: 'Add Weighted Graph - Info',
    weighted_example_desc: 'The example below shows file format that includes edge weights:',
    weighted_example_code: 'L1:(L2, 3),(L3, 1),(L4, 2),(L5, 4)\nL2:(L1, 3),(L3, 5),(L4, 1)',
    weighted_example_note1: 'This format represents a directed graph.',
    weighted_example_select_file: 'Select File',

    file_info_title: 'Add Graph - Info',
    file_info_desc: 'Your file should use the format below:',
    file_info_code: 'L1:L2,L3,L4,L5\nL2:L1,L3,L4',
    file_info_select_weighted: 'Weighted Example',

    // Vertices / Edges panels
    vertices_title: 'Vertices',
    new_vertex_label: 'New Vertex',
    add_label: 'Add',

    edges_title: 'Edges',
    edges_toggle_open: 'Add Edge',
    edges_toggle_close: 'Close',
    from_label: 'From',
    to_label: 'To',
    edge_weight_label: 'Edge Weight',

    // Edge list
    edit_weight_tooltip: 'Edit weight',

    // QuickGraph dialog
    quickgraph_title: 'Quick Graph Create',
    quickgraph_graph_type: 'Graph Type',
    quickgraph_type_full: 'Complete Graph',
    quickgraph_type_tree: 'Tree (n, k)',
    quickgraph_type_star: 'Star (n, centers)',
    quickgraph_type_ring: 'Ring (n)',
    quickgraph_type_bipartite: 'Complete Bipartite (a, b)',
    quickgraph_type_grid: 'Grid (m, n, w)',
    quickgraph_type_random: 'Random (suggest)',
    quickgraph_layout: 'Layout',
    quickgraph_layout_circular: 'Circular',
    quickgraph_layout_grid: 'Grid',
    quickgraph_node_count: 'Node Count (n)',
    quickgraph_node_helper: 'Enter a number 1-200',
    quickgraph_tree_k: 'Child count (k)',
    quickgraph_star_centers: 'Number of centers',
    quickgraph_grid_rows: 'Rows (m)',
    quickgraph_grid_cols: 'Columns (n)',
    quickgraph_grid_weight: 'Edge weight (w)',
    quickgraph_bipartite_a: 'Set A (a)',
    quickgraph_bipartite_b: 'Set B (b)',
    quickgraph_random_info_title: 'Random graph suggestions',
    quickgraph_create: 'Create',
    quickgraph_cancel: 'Cancel',

    // Bottom actions
    quick_graph_btn: 'Quick Graph',
    reset_btn: 'Reset',
    file_add_btn: 'Add File',
    create_btn: 'Create',

    // GraphNameOptions
    graph_name_label: 'Graph Name',
    directed_label: 'Directed',
    weighted_label: 'Weighted',
    enter_valid_number: 'Enter a valid number',
    previous_page: 'Previous page',
    next_page: 'Next page',
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
