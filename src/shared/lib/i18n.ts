import { useSettingsStore } from '../../features/settings/model';

export const translations = {
    uz: {
        // Common
        search: "Mahsulot qidirish...",
        all: "Barchasi",
        back: "Orqaga",
        save: "Saqlash",
        add: "Qo'shish",
        buy: "Sotib olish",
        send: "Yuborish",
        loading: "Yuklanmoqda...",
        no_results: "Hech narsa topilmadi",
        retry: "Qayta urinish",

        // Navigation
        home: "Bosh sahifa",
        favorites: "Sevimlilar",
        profile: "Profil",

        // Home
        special_for_you: "Siz uchun maxsus",
        see_all: "Barchasi",
        cat_jackets: "Kurtkalar",
        cat_shirts: "Ko'ylaklar",
        cat_pants: "Shimlar",
        cat_shoes: "Oyoq kiyimlar",
        cat_accessories: "Aksessuarlar",
        cat_hoodies: "Hudilar",
        cat_tshirts: "Futbolkalar",
        promos: [
            "Birinchi xarid uchun maxsus chegirma!",
            "Yozgi kolleksiya: 50% gacha keshbek",
            "Yangi kelgan: Eksklyuziv krossovkalar"
        ],
        promo_badges: [
            "Maxsus Taklif",
            "Yozgi Sotuv",
            "Yangi"
        ],

        // Search
        search_results: "Qidiruv natijalari",
        products_found: "ta mahsulot topildi",
        placeholder_search: "Mahsulot qidirish",
        type_to_search: "Qidirish uchun yozing",
        no_search_results: "Hech narsa topilmadi",
        try_different_keywords: "Boshqa kalit so'zlar bilan qidirib ko'ring",

        // Favorites
        no_favorites: "Hali sevimli mahsulotlar yo'q.",

        // Profile
        user: "Foydalanuvchi",
        saved_products: "Saqlangan mahsulotlar",
        help_faq: "Yordam / FAQ",
        answers_to_questions: "Savollarga javob",
        settings: "Sozlamalar",
        language_theme_security: "Til, tema, xavfsizlik",
        is_store_owner: "Do'kon egasimisiz?",
        list_products_manage_stock: "Mahsulotingizni joylang va stockni boshqaring!",
        activation_after_approval: "Arizangiz qabul qilingandan so'ng faollashadi!",
        add_store: "Do'kon qo'shish",
        seller_panel: "Sotuvchi paneli",

        // Settings
        theme: "Mavzu",
        language: "Til",
        dark: "Tungi",
        light: "Kunduzgi",
        system: "Tizim",
        appearance: "Ilova ko'rinishi",
        data: "Ma'lumotlar",
        reset_description: "Bu amal localStorage'dagi barcha mock test ma'lumotlarini o'chiradi va ilk holatga qaytaradi.",
        clear_data: "Ma'lumotlarni tozalash",
        reset_success: "Barcha ma'lumotlar tozalandi. Sahifa yangilanadi",

        // Store
        store_apply: "Do'kon ochish",
        store_name: "Do'kon nomi",
        address: "Manzil",
        store_image: "Do'kon rasmi",
        upload_image: "Rasm yuklash",
        change: "O'zgartirish",
        submit_application: "Arizani yuborish",
        application_received: "Arizangiz qabul qilindi",
        fill_all_fields: "Barcha maydonlarni to'ldiring",
        error_occurred: "Xatolik yuz berdi",
        status_pending: "Kutilmoqda",
        status_approved: "Tasdiqlandi",
        status_rejected: "Rad etildi",

        // Product
        comments: "Izohlar",
        add_comment: "Izoh qoldirish",
        no_comments: "Hali izohlar yo'q. Birinchi bo'ling!",
        comment_added: "Izoh muvaffaqiyatli qo'shildi",
        failed_to_add_comment: "Izohni qo'shib bo'lmadi",
        price: "Narxi",
        description: "Tavsif",
        in_stock: "Sotuvda bor",
        fav_added: "Sevimlilarga qo'shildi",
        fav_removed: "Sevimlilardan o'chirildi",
        application_status: "Ariza holati",
        no_application: "Arizangiz yo'q",
        no_application_desc: "Siz hali do'kon ochish uchun ariza bermagansiz.",
        apply_now: "Ariza berish",
        pending_desc: "Arizangiz adminga yuborildi. Tasdiqlanishi kutilmoqda.",
        approved_title: "Tasdiqlandi!",
        approved_desc: "Do'koningiz ACTIVE holatda. Endi mahsulot sota olasiz.",
        back_to_profile: "Profilga qaytish",
        rejected_title: "Rad etildi",
        rejected_desc: "Arizangiz tasdiqlanmadi. Iltimos qayta urinib ko'ring.",
        reapply: "Qayta ariza berish",
    },
    ru: {
        // Common
        search: "Поиск товаров...",
        all: "Все",
        back: "Назад",
        save: "Сохранить",
        add: "Добавить",
        buy: "View",
        send: "Отправить",
        loading: "Загрузка...",
        no_results: "Ничего не найдено",
        retry: "Повторить",

        // Navigation
        home: "Главная",
        favorites: "Избранное",
        profile: "Профиль",

        // Home
        special_for_you: "Специально для вас",
        see_all: "Все",
        cat_jackets: "Куртки",
        cat_shirts: "Рубашки",
        cat_pants: "Брюки",
        cat_shoes: "Обувь",
        cat_accessories: "Аксессуары",
        cat_hoodies: "Худи",
        cat_tshirts: "Футболки",
        promos: [
            "Специальная скидка на первую покупку!",
            "Летняя коллекция: кэшбэк до 50%",
            "Новинка: эксклюзивные кроссовки"
        ],
        promo_badges: [
            "Спецпредложение",
            "Летняя распродажа",
            "Новинка"
        ],

        // Search
        search_results: "Результаты поиска",
        products_found: "товаров найдено",
        placeholder_search: "Поиск товаров",
        type_to_search: "Введите для поиска",
        no_search_results: "Ничего не найдено",
        try_different_keywords: "Попробуйте поискать по другим ключевым словам",

        // Favorites
        no_favorites: "Избранных товаров пока нет.",

        // Profile
        user: "Пользователь",
        saved_products: "Сохраненные товары",
        help_faq: "Помощь / FAQ",
        answers_to_questions: "Ответы на вопросы",
        settings: "Настройки",
        language_theme_security: "Язык, тема, безопасность",
        is_store_owner: "Вы владелец магазина?",
        list_products_manage_stock: "Размещайте товары и управляйте стоком!",
        activation_after_approval: "Активируется после одобрения заявки!",
        add_store: "Добавить магазин",
        seller_panel: "Панель продавца",

        // Settings
        theme: "Тема",
        language: "Язык",
        dark: "Темная",
        light: "Светлая",
        system: "Системная",
        appearance: "Внешний вид",
        data: "Данные",
        reset_description: "Это действие удалит все данные для тестов из localStorage и вернет их в исходное состояние.",
        clear_data: "Очистить данные",
        reset_success: "Все данные очищены. Страница обновится",

        // Store
        store_apply: "Открыть магазин",
        store_name: "Название магазина",
        address: "Адрес",
        store_image: "Фото магазина",
        upload_image: "Загрузить фото",
        change: "Изменить",
        submit_application: "Отправить заявку",
        application_received: "Ваша заявка принята",
        fill_all_fields: "Заполните все поля",
        error_occurred: "Произошла ошибка",
        status_pending: "В ожидании",
        status_approved: "Одобрено",
        status_rejected: "Отклонено",

        // Product
        comments: "Комментарии",
        add_comment: "Оставить комментарий",
        no_comments: "Комментариев пока нет. Будьте первыми!",
        comment_added: "Комментарий успешно добавлен",
        failed_to_add_comment: "Не удалось добавить комментарий",
        price: "Цена",
        description: "Описание",
        in_stock: "В наличии",
        fav_added: "Добавлено в избранное",
        fav_removed: "Удалено из избранного",
        application_status: "Статус заявки",
        no_application: "У вас нет заявок",
        no_application_desc: "Вы еще не подали заявку на открытие магазина.",
        apply_now: "Подать заявку",
        pending_desc: "Ваша заявка отправлена администратору. Ожидайте подтверждения.",
        approved_title: "Одобрено!",
        approved_desc: "Ваш магазин ACTIVE. Теперь вы можете продавать товары.",
        back_to_profile: "Вернуться в профиль",
        rejected_title: "Отклонено",
        rejected_desc: "Ваша заявка не была одобрена. Пожалуйста, попробуйте снова.",
        reapply: "Подать заявку снова",
    },
    en: {
        // Common
        search: "Search products...",
        all: "All",
        back: "Back",
        save: "Save",
        add: "Add",
        buy: "Buy Now",
        send: "Send",
        loading: "Loading...",
        no_results: "No results found",
        retry: "Retry",

        // Navigation
        home: "Home",
        favorites: "Favorites",
        profile: "Profile",

        // Home
        special_for_you: "Special for you",
        see_all: "See All",
        cat_jackets: "Jackets",
        cat_shirts: "Shirts",
        cat_pants: "Pants",
        cat_shoes: "Shoes",
        cat_accessories: "Accessories",
        cat_hoodies: "Hoodies",
        cat_tshirts: "T-Shirts",
        promos: [
            "Special discount for your first purchase!",
            "Summer collection: up to 50% cashback",
            "New arrival: Exclusive sneakers"
        ],
        promo_badges: [
            "Special Offer",
            "Summer Sale",
            "New"
        ],

        // Search
        search_results: "Search Results",
        products_found: "products found",
        placeholder_search: "Search products",
        type_to_search: "Type to search",
        no_search_results: "Nothing found",
        try_different_keywords: "Try searching with different keywords",

        // Favorites
        no_favorites: "No favorite products yet.",

        // Profile
        user: "User",
        saved_products: "Saved products",
        help_faq: "Help / FAQ",
        answers_to_questions: "Answers to questions",
        settings: "Settings",
        language_theme_security: "Language, theme, security",
        is_store_owner: "Are you a store owner?",
        list_products_manage_stock: "List your products and manage stock!",
        activation_after_approval: "Activation after application approval!",
        add_store: "Add Store",
        seller_panel: "Seller Panel",

        // Settings
        theme: "Theme",
        language: "Language",
        dark: "Dark",
        light: "Light",
        system: "System",
        appearance: "App Appearance",
        data: "Data",
        reset_description: "This action will delete all mock test data from localStorage and reset it to initial state.",
        clear_data: "Clear Data",
        reset_success: "All data cleared. Page will refresh",

        // Store
        store_apply: "Open Store",
        store_name: "Store Name",
        address: "Address",
        store_image: "Store Image",
        upload_image: "Upload Image",
        change: "Change",
        submit_application: "Submit Application",
        application_received: "Application received",
        fill_all_fields: "Please fill all fields",
        error_occurred: "An error occurred",
        status_pending: "Pending",
        status_approved: "Approved",
        status_rejected: "Rejected",

        // Product
        comments: "Comments",
        add_comment: "Add comment",
        no_comments: "No comments yet. Be the first!",
        comment_added: "Comment added successfully",
        failed_to_add_comment: "Failed to add comment",
        price: "Price",
        description: "Description",
        in_stock: "In Stock",
        fav_added: "Added to favorites",
        fav_removed: "Removed from favorites",
        application_status: "Application Status",
        no_application: "No Applications",
        no_application_desc: "You haven't applied to open a store yet.",
        apply_now: "Apply Now",
        pending_desc: "Your application has been sent to admin. Pending approval.",
        approved_title: "Approved!",
        approved_desc: "Your store is ACTIVE. You can now sell products.",
        back_to_profile: "Back to Profile",
        rejected_title: "Rejected",
        rejected_desc: "Your application was not approved. Please try again.",
        reapply: "Re-apply",
    }
};

export type Language = keyof typeof translations;

export function useTranslation() {
    const language = useSettingsStore((s) => s.settings.language) as Language;
    const t = translations[language] || translations.uz;
    return { t, language };
}
