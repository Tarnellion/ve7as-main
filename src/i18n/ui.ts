import { DEFAULT_LANGUAGE, type Language } from './languages';

export interface Translation {
  site: { tagline: string };
  nav: {
    home: string;
    faq: string;
    about: string;
    contacts: string;
    menu: string;
  };
  sections: {
    'casino-slots': string;
    'sports-betting': string;
    'poker-table-games': string;
    'lottery-esports': string;
  };
  sectionDescriptions: {
    'casino-slots': string;
    'sports-betting': string;
    'poker-table-games': string;
    'lottery-esports': string;
  };
  hero: { badge: string; title: string; subtitle: string };
  home: {
    sectionsTitle: string;
    sectionsSubtitle: string;
    latestTitle: string;
    latestSubtitle: string;
    faqTitle: string;
    faqSubtitle: string;
    viewAll: string;
  };
  section: { articlesIn: string };
  notFound: {
    title: string;
    description: string;
    backHome: string;
    sectionsTitle: string;
  };
  article: {
    readingTime: string;
    /** Короткая единица для рельса: под крупной цифрой полная
     *  формулировка вроде «min de lectura» ложится в две строки и ломает
     *  колонку чисел. */
    readingUnit: string;
    publishedOn: string;
    author: string;
    /** Строка «Обновлено» перед датой правки; показывается, когда правка заметно позже публикации. */
    updatedOn: string;
    back: string;
    translationNotice: string;
    tableOfContents: string;
  };
  /**
   * Блок ответственной игры в конце каждого материала. Ссылки на службы
   * помощи лежат отдельно, в `src/i18n/helplines.ts`: это данные, а не копия,
   * и их состав зависит от юрисдикции, а не от языка интерфейса.
   */
  responsible: {
    title: string;
    body: string;
    helpLabel: string;
  };
  common: { readMore: string; allArticles: string };
  footer: {
    about: string;
    /** Подпись ссылки на указатель инструментов в футере. */
    tools: string;
    /** Подпись ссылки на редакционную политику — в футере и в шапке статьи. */
    editorial: string;
    disclaimer: string;
    ageWarning: string;
    rights: string;
    privacy: string;
    terms: string;
    contacts: string;
  };
}

export const ui: Record<Language, Translation> = {
  ru: {
    site: { tagline: 'Независимый портал об азартных развлечениях' },
    nav: {
      home: 'Главная',
      faq: 'FAQ',
      about: 'О проекте',
      contacts: 'Контакты',
      menu: 'Меню',
    },
    sections: {
      'casino-slots': 'Казино и слоты',
      'sports-betting': 'Спортивные ставки',
      'poker-table-games': 'Покер и игры за столом',
      'lottery-esports': 'Лотереи и киберспорт',
    },
    sectionDescriptions: {
      'casino-slots': 'Разбираем механику игровых автоматов, RTP и волатильность, провайдеров и принципы выбора надёжных площадок — без рейтингов и рекламы конкретных операторов.',
      'sports-betting': 'Виды ставок и пари, букмекерская аналитика, управление банкроллом и стратегии — рассказываем, как устроен беттинг изнутри.',
      'poker-table-games': 'Форматы покера, блэкджек, рулетка и баккара — объясняем правила, базовые стратегии и математику игр за столом.',
      'lottery-esports': 'Форматы лотерей и розыгрышей, а также относительно новая ниша — ставки на киберспортивные турниры. Разбираем механику и особенности.',
    },
    hero: {
      badge: 'Обновлено: июнь 2026',
      title: 'Гид по миру азартных развлечений — без рейтингов и рекламы',
      subtitle:
        'Объясняем механику игр, ставок и лотерей простым языком. Независимая редакция, ноль партнёрских ссылок.',
    },
    home: {
      sectionsTitle: 'Разделы',
      sectionsSubtitle: 'Выберите нишу, чтобы почитать гиды и разборы по теме',
      latestTitle: 'Последние материалы',
      latestSubtitle: 'Свежие статьи и гиды от редакции',
      faqTitle: 'Частые вопросы',
      faqSubtitle: 'Коротко о том, как устроен этот сайт',
      viewAll: 'Смотреть все',
    },
    section: { articlesIn: 'Статьи в разделе' },
    notFound: {
      title: 'Страница не найдена',
      description:
        'Такой страницы у нас нет: материал могли удалить или переименовать, а ссылка — содержать опечатку. Начните с главной или выберите раздел ниже.',
      backHome: 'Вернуться на главную',
      sectionsTitle: 'Разделы портала',
    },
    article: {
      readingTime: 'мин чтения',
      readingUnit: 'мин',
      publishedOn: 'Опубликовано',
      author: 'Автор',
      updatedOn: 'Обновлено',
      back: 'Назад к разделу',
      translationNotice:
        'Эта статья пока доступна только на русском языке. Перевод появится позже.',
      tableOfContents: 'Содержание',
    },
    common: { readMore: 'Читать', allArticles: 'Все статьи' },
    responsible: {
      title: 'Ответственная игра',
      body: "Азартные игры — развлечение для совершеннолетних, а не способ заработка. Если игра перестаёт быть развлечением, помощь доступна бесплатно и анонимно.",
      helpLabel: 'Куда обратиться',
    },
    footer: {
      about:
        'Независимый информационный портал об азартных развлечениях. Не является оператором азартных игр.',
      tools: 'Инструменты',
      editorial: 'Редакционная политика',
      disclaimer:
        'Материалы сайта носят информационный характер и не являются рекомендацией к действию.',
      ageWarning:
        'Азартные игры предназначены только для лиц старше 18 лет. Играйте ответственно.',
      rights: 'Все права защищены.',
      privacy: 'Политика конфиденциальности',
      terms: 'Условия использования',
      contacts: 'Контакты',
    },
  },

  en: {
    site: { tagline: 'Independent guide to gambling entertainment' },
    nav: {
      home: 'Home',
      faq: 'FAQ',
      about: 'About',
      contacts: 'Contact',
      menu: 'Menu',
    },
    sections: {
      'casino-slots': 'Casino & Slots',
      'sports-betting': 'Sports Betting',
      'poker-table-games': 'Poker & Table Games',
      'lottery-esports': 'Lottery & Esports',
    },
    sectionDescriptions: {
      'casino-slots': 'We break down slot mechanics, RTP and volatility, providers, and how to choose a reliable platform — no rankings, no operator ads.',
      'sports-betting': 'Types of bets and wagers, bookmaker analytics, bankroll management and strategies — we explain how betting works from the inside.',
      'poker-table-games': 'Poker formats, blackjack, roulette and baccarat — we explain the rules, basic strategies and the math behind table games.',
      'lottery-esports': 'Lottery formats and prize draws, plus the relatively new niche of esports tournament betting. We break down how each works.',
    },
    hero: {
      badge: 'Updated: June 2026',
      title: 'A guide to gambling entertainment — no rankings, no ads',
      subtitle:
        'We explain how games, betting and lotteries actually work, in plain language. Independent editorial team, zero affiliate links.',
    },
    home: {
      sectionsTitle: 'Sections',
      sectionsSubtitle: 'Pick a niche to read guides and breakdowns on the topic',
      latestTitle: 'Latest articles',
      latestSubtitle: 'Fresh guides and breakdowns from the editorial team',
      faqTitle: 'Frequently asked questions',
      faqSubtitle: 'A quick rundown of how this site works',
      viewAll: 'View all',
    },
    section: { articlesIn: 'Articles in this section' },
    notFound: {
      title: 'Page not found',
      description:
        'This page does not exist: the material may have been removed or renamed, or the link contains a typo. Start from the homepage or pick a section below.',
      backHome: 'Back to homepage',
      sectionsTitle: 'Browse the sections',
    },
    article: {
      readingTime: 'min read',
      readingUnit: 'min',
      publishedOn: 'Published',
      author: 'Author',
      updatedOn: 'Updated',
      back: 'Back to section',
      translationNotice:
        'This article is currently available in Russian only. A translation is coming soon.',
      tableOfContents: 'Contents',
    },
    common: { readMore: 'Read', allArticles: 'All articles' },
    responsible: {
      title: 'Responsible gambling',
      body: "Gambling is adult entertainment, not a way to make money. If it stops being entertainment, free and confidential help is available.",
      helpLabel: 'Where to get help',
    },
    footer: {
      about:
        'Independent information portal about gambling entertainment. Not a gambling operator.',
      tools: 'Tools',
      editorial: 'Editorial policy',
      disclaimer:
        'Site content is for informational purposes only and is not a recommendation to act.',
      ageWarning:
        'Gambling-related content is intended for individuals aged 18 and over. Please play responsibly.',
      rights: 'All rights reserved.',
      privacy: 'Privacy Policy',
      terms: 'Terms of Use',
      contacts: 'Contact',
    },
  },

  es: {
    site: { tagline: 'Guía independiente sobre el entretenimiento de azar' },
    nav: {
      home: 'Inicio',
      faq: 'Preguntas frecuentes',
      about: 'Sobre nosotros',
      contacts: 'Contacto',
      menu: 'Menú',
    },
    sections: {
      'casino-slots': 'Casino y tragaperras',
      'sports-betting': 'Apuestas deportivas',
      'poker-table-games': 'Póquer y juegos de mesa',
      'lottery-esports': 'Loterías y esports',
    },
    sectionDescriptions: {
      'casino-slots': 'Analizamos la mecánica de las tragaperras, RTP y volatilidad, proveedores y cómo elegir plataformas fiables — sin rankings ni publicidad de operadores.',
      'sports-betting': 'Tipos de apuestas, análisis de casas de apuestas, gestión del bankroll y estrategias — explicamos cómo funciona el betting por dentro.',
      'poker-table-games': 'Formatos de póquer, blackjack, ruleta y bacará — explicamos las reglas, estrategias básicas y la matemática de los juegos de mesa.',
      'lottery-esports': 'Formatos de lotería y sorteos, más la relativamente nueva área de apuestas en torneos de esports. Analizamos su mecánica y particularidades.',
    },
    hero: {
      badge: 'Actualizado: junio de 2026',
      title: 'Una guía sobre el entretenimiento de azar — sin rankings ni publicidad',
      subtitle:
        'Explicamos cómo funcionan los juegos, las apuestas y las loterías en lenguaje sencillo. Redacción independiente, cero enlaces de afiliados.',
    },
    home: {
      sectionsTitle: 'Secciones',
      sectionsSubtitle: 'Elige un nicho para leer guías y análisis sobre el tema',
      latestTitle: 'Últimos artículos',
      latestSubtitle: 'Guías y análisis recientes de la redacción',
      faqTitle: 'Preguntas frecuentes',
      faqSubtitle: 'Un resumen rápido de cómo funciona este sitio',
      viewAll: 'Ver todo',
    },
    section: { articlesIn: 'Artículos de esta sección' },
    notFound: {
      title: 'Página no encontrada',
      description:
        'Esta página no existe: el contenido pudo eliminarse o cambiar de nombre, o el enlace tiene una errata. Empieza por la portada o elige una sección más abajo.',
      backHome: 'Volver al inicio',
      sectionsTitle: 'Secciones del portal',
    },
    article: {
      readingTime: 'min de lectura',
      readingUnit: 'min',
      publishedOn: 'Publicado',
      author: 'Autor',
      updatedOn: 'Actualizado',
      back: 'Volver a la sección',
      translationNotice:
        'Este artículo solo está disponible en ruso por ahora. La traducción llegará pronto.',
      tableOfContents: 'Contenido',
    },
    common: { readMore: 'Leer', allArticles: 'Todos los artículos' },
    responsible: {
      title: 'Juego responsable',
      body: "El juego es un entretenimiento para adultos, no una forma de ganar dinero. Si deja de ser un entretenimiento, existe ayuda gratuita y confidencial.",
      helpLabel: 'Dónde pedir ayuda',
    },
    footer: {
      about:
        'Portal informativo independiente sobre entretenimiento de azar. No somos un operador de juego.',
      tools: 'Herramientas',
      editorial: 'Política editorial',
      disclaimer:
        'El contenido del sitio tiene fines informativos y no constituye una recomendación para actuar.',
      ageWarning:
        'El contenido sobre juego está dirigido a personas mayores de 18 años. Juega con responsabilidad.',
      rights: 'Todos los derechos reservados.',
      privacy: 'Política de privacidad',
      terms: 'Términos de uso',
      contacts: 'Contacto',
    },
  },

  pt: {
    site: { tagline: 'Guia independente sobre entretenimento de jogo' },
    nav: {
      home: 'Início',
      faq: 'Perguntas frequentes',
      about: 'Sobre nós',
      contacts: 'Contacto',
      menu: 'Menu',
    },
    sections: {
      'casino-slots': 'Casino e slots',
      'sports-betting': 'Apostas desportivas',
      'poker-table-games': 'Póquer e jogos de mesa',
      'lottery-esports': 'Lotarias e esports',
    },
    sectionDescriptions: {
      'casino-slots': 'Analisamos a mecânica das slot machines, RTP e volatilidade, fornecedores e como escolher plataformas fiáveis — sem rankings nem publicidade de operadores.',
      'sports-betting': 'Tipos de apostas, análise de casas de apostas, gestão do bankroll e estratégias — explicamos como o betting funciona por dentro.',
      'poker-table-games': 'Formatos de póquer, blackjack, roleta e bacará — explicamos as regras, estratégias básicas e a matemática dos jogos de mesa.',
      'lottery-esports': 'Formatos de lotaria e sorteios, mais a área relativamente nova de apostas em torneios de esports. Analisamos a mecânica e as particularidades.',
    },
    hero: {
      badge: 'Atualizado: junho de 2026',
      title: 'Um guia sobre entretenimento de jogo — sem rankings nem publicidade',
      subtitle:
        'Explicamos como funcionam os jogos, as apostas e as lotarias em linguagem simples. Redação independente, zero links de afiliados.',
    },
    home: {
      sectionsTitle: 'Secções',
      sectionsSubtitle: 'Escolha um nicho para ler guias e análises sobre o tema',
      latestTitle: 'Artigos recentes',
      latestSubtitle: 'Guias e análises recentes da redação',
      faqTitle: 'Perguntas frequentes',
      faqSubtitle: 'Um resumo rápido de como este site funciona',
      viewAll: 'Ver tudo',
    },
    section: { articlesIn: 'Artigos desta secção' },
    notFound: {
      title: 'Página não encontrada',
      description:
        'Esta página não existe: o conteúdo pode ter sido removido ou renomeado, ou a ligação tem um erro. Comece pela página inicial ou escolha uma secção abaixo.',
      backHome: 'Voltar ao início',
      sectionsTitle: 'Secções do portal',
    },
    article: {
      readingTime: 'min de leitura',
      readingUnit: 'min',
      publishedOn: 'Publicado',
      author: 'Autor',
      updatedOn: 'Atualizado',
      back: 'Voltar à secção',
      translationNotice:
        'Este artigo está disponível apenas em russo, por enquanto. A tradução chegará em breve.',
      tableOfContents: 'Conteúdo',
    },
    common: { readMore: 'Ler', allArticles: 'Todos os artigos' },
    responsible: {
      title: 'Jogo responsável',
      body: "O jogo é um entretenimento para adultos, não uma forma de ganhar dinheiro. Se deixar de ser um entretenimento, existe ajuda gratuita e confidencial.",
      helpLabel: 'Onde procurar ajuda',
    },
    footer: {
      about:
        'Portal informativo independente sobre entretenimento de jogo. Não somos um operador de jogo.',
      tools: 'Ferramentas',
      editorial: 'Política editorial',
      disclaimer:
        'O conteúdo do site tem fins informativos e não constitui uma recomendação para agir.',
      ageWarning:
        'O conteúdo sobre jogo destina-se a maiores de 18 anos. Jogue com responsabilidade.',
      rights: 'Todos os direitos reservados.',
      privacy: 'Política de privacidade',
      terms: 'Termos de utilização',
      contacts: 'Contacto',
    },
  },

  de: {
    site: { tagline: 'Unabhängiger Guide zur Welt der Glücksspiel-Unterhaltung' },
    nav: {
      home: 'Start',
      faq: 'FAQ',
      about: 'Über uns',
      contacts: 'Kontakt',
      menu: 'Menü',
    },
    sections: {
      'casino-slots': 'Casino & Slots',
      'sports-betting': 'Sportwetten',
      'poker-table-games': 'Poker & Tischspiele',
      'lottery-esports': 'Lotterien & E-Sport',
    },
    sectionDescriptions: {
      'casino-slots': 'Wir erklären die Mechanik von Spielautomaten, RTP und Volatilität, Anbieter und wie man seriöse Plattformen auswählt — ohne Rankings und Betreiber-Werbung.',
      'sports-betting': 'Wettarten und Quoten, Buchmacher-Analyse, Bankroll-Management und Strategien — wir erklären, wie Sportwetten von innen funktionieren.',
      'poker-table-games': 'Poker-Formate, Blackjack, Roulette und Baccarat — wir erklären die Regeln, Grundstrategien und die Mathematik hinter Tischspielen.',
      'lottery-esports': 'Lotterie-Formate und Gewinnspiele sowie die relativ neue Nische der Wetten auf E-Sport-Turniere. Wir beleuchten Mechanik und Besonderheiten.',
    },
    hero: {
      badge: 'Aktualisiert: Juni 2026',
      title: 'Ein Guide zur Glücksspiel-Unterhaltung — ohne Rankings und Werbung',
      subtitle:
        'Wir erklären verständlich, wie Spiele, Wetten und Lotterien funktionieren. Unabhängige Redaktion, keine Affiliate-Links.',
    },
    home: {
      sectionsTitle: 'Themenbereiche',
      sectionsSubtitle: 'Wählen Sie eine Nische und lesen Sie Guides und Hintergründe zum Thema',
      latestTitle: 'Neueste Artikel',
      latestSubtitle: 'Aktuelle Guides und Analysen der Redaktion',
      faqTitle: 'Häufige Fragen',
      faqSubtitle: 'Kurz erklärt: Wie diese Seite funktioniert',
      viewAll: 'Alle ansehen',
    },
    section: { articlesIn: 'Artikel in diesem Bereich' },
    notFound: {
      title: 'Seite nicht gefunden',
      description:
        'Diese Seite existiert nicht: Der Beitrag wurde möglicherweise gelöscht oder umbenannt, oder der Link enthält einen Tippfehler. Beginnen Sie auf der Startseite oder wählen Sie unten einen Bereich.',
      backHome: 'Zur Startseite',
      sectionsTitle: 'Themenbereiche des Portals',
    },
    article: {
      readingTime: 'Min. Lesezeit',
      readingUnit: 'Min',
      publishedOn: 'Veröffentlicht',
      author: 'Autor',
      updatedOn: 'Aktualisiert',
      back: 'Zurück zum Bereich',
      translationNotice:
        'Dieser Artikel ist derzeit nur auf Russisch verfügbar. Eine Übersetzung folgt in Kürze.',
      tableOfContents: 'Inhalt',
    },
    common: { readMore: 'Lesen', allArticles: 'Alle Artikel' },
    responsible: {
      title: 'Verantwortungsvolles Spielen',
      body: "Glücksspiel ist Unterhaltung für Erwachsene, kein Weg, Geld zu verdienen. Wenn das Spielen keine Unterhaltung mehr ist, gibt es kostenlose und vertrauliche Hilfe.",
      helpLabel: 'Hier gibt es Hilfe',
    },
    footer: {
      about:
        'Unabhängiges Informationsportal über Glücksspiel-Unterhaltung. Kein Glücksspielanbieter.',
      tools: 'Rechner',
      editorial: 'Redaktionelle Richtlinien',
      disclaimer:
        'Die Inhalte dieser Seite dienen ausschließlich Informationszwecken und stellen keine Handlungsempfehlung dar.',
      ageWarning:
        'Inhalte rund um Glücksspiel richten sich an Personen ab 18 Jahren. Spielen Sie verantwortungsbewusst.',
      rights: 'Alle Rechte vorbehalten.',
      privacy: 'Datenschutzerklärung',
      terms: 'Nutzungsbedingungen',
      contacts: 'Kontakt',
    },
  },

  fr: {
    site: { tagline: "Guide indépendant sur le divertissement autour des jeux d'argent" },
    nav: {
      home: 'Accueil',
      faq: 'FAQ',
      about: 'À propos',
      contacts: 'Contact',
      menu: 'Menu',
    },
    sections: {
      'casino-slots': 'Casino et machines à sous',
      'sports-betting': 'Paris sportifs',
      'poker-table-games': 'Poker et jeux de table',
      'lottery-esports': 'Loteries et esport',
    },
    sectionDescriptions: {
      'casino-slots': "Nous analysons la mécanique des machines à sous, le RTP et la volatilité, les fournisseurs et comment choisir une plateforme fiable — sans classements ni publicités d'opérateurs.",
      'sports-betting': "Types de paris, analyse des bookmakers, gestion du bankroll et stratégies — nous expliquons comment fonctionne le betting de l'intérieur.",
      'poker-table-games': 'Formats de poker, blackjack, roulette et baccara — nous expliquons les règles, les stratégies de base et les mathématiques des jeux de table.',
      'lottery-esports': 'Formats de loteries et tirages au sort, plus la niche relativement récente des paris sur les tournois esport. Nous décryptons les mécanismes et spécificités.',
    },
    hero: {
      badge: 'Mis à jour : juin 2026',
      title:
        "Un guide sur le divertissement autour des jeux d'argent — sans classements ni publicité",
      subtitle:
        "Nous expliquons simplement le fonctionnement des jeux, des paris et des loteries. Rédaction indépendante, aucun lien d'affiliation.",
    },
    home: {
      sectionsTitle: 'Rubriques',
      sectionsSubtitle: 'Choisissez une thématique pour lire nos guides et analyses',
      latestTitle: 'Derniers articles',
      latestSubtitle: 'Guides et analyses récents de la rédaction',
      faqTitle: 'Questions fréquentes',
      faqSubtitle: 'Un aperçu rapide du fonctionnement de ce site',
      viewAll: 'Tout voir',
    },
    section: { articlesIn: 'Articles de cette rubrique' },
    notFound: {
      title: 'Page introuvable',
      description:
        "Cette page n'existe pas : le contenu a peut-être été supprimé ou renommé, ou le lien comporte une erreur. Repartez de l'accueil ou choisissez une rubrique ci-dessous.",
      backHome: "Retour à l'accueil",
      sectionsTitle: 'Rubriques du portail',
    },
    article: {
      readingTime: 'min de lecture',
      readingUnit: 'min',
      publishedOn: 'Publié le',
      author: 'Auteur',
      updatedOn: 'Mis à jour',
      back: 'Retour à la rubrique',
      translationNotice:
        "Cet article n'est actuellement disponible qu'en russe. Une traduction sera bientôt disponible.",
      tableOfContents: 'Sommaire',
    },
    common: { readMore: 'Lire', allArticles: 'Tous les articles' },
    responsible: {
      title: 'Jeu responsable',
      body: "Le jeu est un divertissement pour adultes, pas un moyen de gagner de l'argent. S'il cesse d'être un divertissement, une aide gratuite et confidentielle existe.",
      helpLabel: "Où trouver de l'aide",
    },
    footer: {
      about:
        "Portail d'information indépendant sur le divertissement autour des jeux d'argent. Nous ne sommes pas un opérateur de jeux.",
      tools: 'Outils',
      editorial: 'Politique éditoriale',
      disclaimer:
        "Le contenu du site est fourni à titre informatif et ne constitue pas une recommandation d'action.",
      ageWarning:
        "Les contenus liés aux jeux d'argent s'adressent aux personnes de 18 ans et plus. Jouez de façon responsable.",
      rights: 'Tous droits réservés.',
      privacy: 'Politique de confidentialité',
      terms: "Conditions d'utilisation",
      contacts: 'Contact',
    },
  },

  br: {
    site: { tagline: 'Guia independente sobre entretenimento de apostas e jogos de azar' },
    nav: {
      home: 'Início',
      faq: 'Perguntas frequentes',
      about: 'Sobre nós',
      contacts: 'Contato',
      menu: 'Menu',
    },
    sections: {
      'casino-slots': 'Cassino e caça-níqueis',
      'sports-betting': 'Apostas esportivas',
      'poker-table-games': 'Pôquer e jogos de mesa',
      'lottery-esports': 'Loterias e esports',
    },
    sectionDescriptions: {
      'casino-slots': 'Analisamos a mecânica dos caça-níqueis, RTP e volatilidade, fornecedores e como escolher plataformas confiáveis — sem rankings nem publicidade de operadores.',
      'sports-betting': 'Tipos de apostas, análise de casas de apostas, gestão do bankroll e estratégias — explicamos como o betting funciona por dentro.',
      'poker-table-games': 'Formatos de pôquer, blackjack, roleta e bacará — explicamos as regras, estratégias básicas e a matemática dos jogos de mesa.',
      'lottery-esports': 'Formatos de loteria e sorteios, mais a área relativamente nova de apostas em torneios de esports. Analisamos a mecânica e as particularidades.',
    },
    hero: {
      badge: 'Atualizado: junho de 2026',
      title:
        'Um guia sobre entretenimento de apostas e jogos de azar — sem rankings e sem publicidade',
      subtitle:
        'Explicamos como funcionam os jogos, as apostas e as loterias em linguagem simples. Redação independente, zero links de afiliados.',
    },
    home: {
      sectionsTitle: 'Seções',
      sectionsSubtitle: 'Escolha um nicho para ler guias e análises sobre o tema',
      latestTitle: 'Artigos recentes',
      latestSubtitle: 'Guias e análises recentes da redação',
      faqTitle: 'Perguntas frequentes',
      faqSubtitle: 'Um resumo rápido de como este site funciona',
      viewAll: 'Ver tudo',
    },
    section: { articlesIn: 'Artigos desta seção' },
    notFound: {
      title: 'Página não encontrada',
      description:
        'Esta página não existe: o conteúdo pode ter sido removido ou renomeado, ou o link tem um erro de digitação. Comece pela página inicial ou escolha uma seção abaixo.',
      backHome: 'Voltar ao início',
      sectionsTitle: 'Seções do portal',
    },
    article: {
      readingTime: 'min de leitura',
      readingUnit: 'min',
      publishedOn: 'Publicado em',
      author: 'Autor',
      updatedOn: 'Atualizado',
      back: 'Voltar para a seção',
      translationNotice:
        'Este artigo está disponível apenas em russo, por enquanto. A tradução chega em breve.',
      tableOfContents: 'Conteúdo',
    },
    common: { readMore: 'Ler', allArticles: 'Todos os artigos' },
    responsible: {
      title: 'Jogo responsável',
      body: "O jogo é um entretenimento para adultos, não uma forma de ganhar dinheiro. Se deixar de ser um entretenimento, há ajuda gratuita e sigilosa.",
      helpLabel: 'Onde buscar ajuda',
    },
    footer: {
      about:
        'Portal informativo independente sobre entretenimento de apostas e jogos de azar. Não somos um operador de jogos.',
      tools: 'Ferramentas',
      editorial: 'Política editorial',
      disclaimer:
        'O conteúdo do site tem caráter informativo e não constitui recomendação para agir.',
      ageWarning:
        'O conteúdo sobre jogos de azar é destinado a maiores de 18 anos. Jogue com responsabilidade.',
      rights: 'Todos os direitos reservados.',
      privacy: 'Política de privacidade',
      terms: 'Termos de uso',
      contacts: 'Contato',
    },
  },
};

export function useTranslations(lang: Language) {
  return ui[lang] ?? ui[DEFAULT_LANGUAGE];
}
