
import type { NavLink, SocialLink, Project, RecommendationCategory } from './types';

export const navLinks: NavLink[] = [
    { href: '#gallery', labelKey: 'nav_gallery' },
    { href: '#ai-projects', labelKey: 'nav_ai_projects' },
    { href: '#info', labelKey: 'nav_misc' },
    { href: '#games', labelKey: 'nav_games' },
    { href: '#tools', labelKey: 'nav_tools' },
    { href: '#recommendations', labelKey: 'nav_recommendations' },
];

export const socialLinks: SocialLink[] = [
    { href: 'https://www.youtube.com/youran4erep', label: 'YouTube', icon: 'icons/youtube.ico', tooltipKey: 'my_videos_tooltip' },
    { href: 'https://buymeacoffee.com/ran4erep', label: 'Buy me a coffee', icon: 'icons/buymeacoffee.ico', tooltipKey: 'support_tooltip' },
    { href: 'https://github.com/ran4erep', label: 'GitHub', icon: 'icons/github.ico', tooltipKey: 'my_repos_tooltip' },
    { href: 'https://steamcommunity.com/id/ran4erep/', label: 'Steam', icon: 'icons/steam.ico', tooltipKey: 'my_games_tooltip' },
];

// FIX: Centralize languageIcons to be used across components.
export const languageIcons: { [key: string]: string } = {
    'javascript': 'devicon-javascript-plain', 'python': 'devicon-python-plain', 'react': 'devicon-react-original',
    'windows': 'devicon-windows8-original', 'gimp': 'devicon-gimp-plain', 'chrome': 'devicon-chrome-plain',
    'msdos': 'devicon-msdos-plain', 'html': 'devicon-html5-plain', 'android': 'devicon-android-plain',
    'devicon': 'devicon-devicon-plain', 'cpp': 'devicon-cplusplus-plain',
};

export const projects: { [key: string]: Project[] } = {
    ai: [
        { titleKey: 'universe_title', descriptionKey: 'universe_desc', link: '/projects/ai/universe/', linkTypeKey: 'btn_go', tech: 'javascript' },
        { titleKey: 'film_cod_title', descriptionKey: 'film_cod_desc', link: 'https://youtu.be/XS_UAkd24AQ?si=l7s4bjYZNNFb9NDO', linkTypeKey: 'btn_watch', image: 'https://img.youtube.com/vi/XS_UAkd24AQ/sddefault.jpg' },
        { titleKey: 'stable_colab_title', descriptionKey: 'stable_colab_desc', link: 'https://github.com/ran4erep/Stable-Colab/', linkTypeKey: 'btn_github', tech: 'python' },
        { titleKey: 'snake_ai_title', descriptionKey: 'snake_ai_desc', link: '/projects/ai/snake/', linkTypeKey: 'btn_go', tech: 'javascript' },
    ],
    misc: [
        { titleKey: 'tilecuti_title', descriptionKey: 'tilecut_desc', link: '/projects/misc/tilecut/', linkTypeKey: 'btn_go', tech: 'react' },
        { titleKey: 'wiki_title', descriptionKey: 'wiki_desc', link: '/projects/misc/wiki/', linkTypeKey: 'btn_go', tech: 'windows' },
        { titleKey: 'switch_theme_title', descriptionKey: 'switch_theme_desc', link: 'https://themezer.net/packs/Skulls-8be', linkTypeKey: 'btn_go', tech: 'gimp' },
        { titleKey: 'cod_book_title', descriptionKey: 'cod_book_desc', link: '/projects/misc/cod_book/', linkTypeKey: 'btn_read' },
    ],
    games: [
		{ titleKey: 'scraper_title', descriptionKey: 'scraper_desc', link: '/projects/games/scraper/', linkTypeKey: 'btn_go', tech: 'react' },
        { titleKey: 'dos_title', descriptionKey: 'dos_desc', link: 'https://r4dos.pages.dev', linkTypeKey: 'btn_go', tech: 'msdos' },
        { titleKey: 'faggots_hunter_title', descriptionKey: 'faggots_hunter_desc', link: '/projects/games/hunter', linkTypeKey: 'btn_play', tech: 'html' },
        { titleKey: 'arlade_title', descriptionKey: 'arlade_desc', link: '/arlade', linkTypeKey: 'btn_play', tech: 'javascript' },
        { titleKey: 'game_or_title', descriptionKey: 'game_or_desc', link: '/projects/games/opposite_reaction/game.apk', linkTypeKey: 'btn_download_apk', tech: 'android', secondaryLink: '/projects/games/opposite_reaction', secondaryLinkTypeKey: 'btn_play' },
        { titleKey: 'game_cod_title', descriptionKey: 'game_cod_desc', link: 'https://ran4erep.itch.io/cod', linkTypeKey: 'btn_play' },
        { titleKey: 'game_tetris_title', descriptionKey: 'game_tetris_desc', link: '/projects/games/tetris/', linkTypeKey: 'btn_play', tech: 'javascript' },
        { titleKey: 'game_memory_title', descriptionKey: 'game_memory_desc', link: '/projects/games/cardgame/', linkTypeKey: 'btn_play', tech: 'javascript' },
        { titleKey: 'game_guess_title', descriptionKey: 'game_guess_desc', link: '/projects/games/guess/', linkTypeKey: 'btn_play', tech: 'javascript' },
        { titleKey: 'game_snake_title', descriptionKey: 'game_snake_desc', link: '/projects/games/snake/', linkTypeKey: 'btn_play', tech: 'javascript' },
        { titleKey: 'game_sokoban_title', descriptionKey: 'game_sokoban_desc', link: '/projects/games/sokoban/', linkTypeKey: 'btn_play', tech: 'javascript' },
    ],
    tools: [
		{ titleKey: 'frame_extractor_title', descriptionKey: 'frame_extractor_desc', link: '/projects/tools/frame-extractor/', linkTypeKey: 'btn_open', tech: 'html' },
		{ titleKey: 'chromaclean_title', descriptionKey: 'chromaclean_desc', link: '/projects/tools/chromaclean/', linkTypeKey: 'btn_open', tech: 'react' },
        { titleKey: 'passgen_title', descriptionKey: 'passgen_desc', link: '/projects/tools/passgen/', linkTypeKey: 'btn_open', tech: 'react' },
        { titleKey: 'tool_webide_title', descriptionKey: 'tool_webide_desc', link: '/projects/tools/ide/', linkTypeKey: 'btn_open', tech: 'html' },
        { titleKey: 'tool_birthday_title', descriptionKey: 'tool_birthday_desc', link: '/projects/tools/bdgen/', linkTypeKey: 'btn_open', tech: 'javascript' },
        { titleKey: 'tool_calendar_title', descriptionKey: 'tool_calendar_desc', link: '/projects/tools/calendar/', linkTypeKey: 'btn_open', tech: 'javascript' },
        { titleKey: 'tool_synth_title', descriptionKey: 'tool_synth_desc', link: '/projects/tools/piano/', linkTypeKey: 'btn_open', tech: 'javascript' },
        { titleKey: 'tool_particles_title', descriptionKey: 'tool_particles_desc', link: '/projects/tools/particles/', linkTypeKey: 'btn_open' },
        { titleKey: 'tool_calc_title', descriptionKey: 'tool_calc_desc', link: '/projects/tools/calculator/', linkTypeKey: 'btn_open', tech: 'javascript' },
        { titleKey: 'tool_password_title', descriptionKey: 'tool_password_desc', link: '/projects/tools/password/', linkTypeKey: 'btn_open', tech: 'javascript' },
        { titleKey: 'tool_pixelart_title', descriptionKey: 'tool_pixelart_desc', link: '/projects/tools/pixel/', linkTypeKey: 'btn_open', tech: 'javascript' },
        { titleKey: 'tool_layout_title', descriptionKey: 'tool_layout_desc', link: '/projects/tools/qwerty/', linkTypeKey: 'btn_open', tech: 'javascript' },
        { titleKey: 'tool_scancode_title', descriptionKey: 'tool_scancode_desc', link: '/projects/tools/scan/', linkTypeKey: 'btn_open', tech: 'javascript' },
        { titleKey: 'tool_soundtest_title', descriptionKey: 'tool_soundtest_desc', link: '/projects/tools/sound_test/', linkTypeKey: 'btn_open', tech: 'javascript' },
        { titleKey: 'tool_emumouse_title', descriptionKey: 'tool_emumouse_desc', link: 'https://github.com/ran4erep/EmuMouse', linkTypeKey: 'btn_github', tech: 'cpp' },
        { titleKey: 'tool_epct_title', descriptionKey: 'tool_epct_desc', link: 'https://github.com/ran4erep/EPCT', linkTypeKey: 'btn_github', tech: 'cpp' },
    ]
};

export const recommendations: RecommendationCategory[] = [
    {
        titleKey: 'rec_emulators_title',
        icon: 'controller',
        tech: 'chrome',
        links: [
            { url: 'https://www.retrogames.cc/', favicon: 'https://www.retrogames.cc/favicon.ico', name: 'RetroGames.cc', descriptionKey: 'rec_retrogames_desc' },
            { url: 'https://emupedia.net/beta/emuos/', favicon: 'https://emupedia.net/beta/emuos/favicon.ico', name: 'EmuOS', descriptionKey: 'rec_emuos_desc' },
            { url: 'https://www.lexaloffle.com/bbs/?cat=7&carts_tab=1#mode=carts&sub=2', favicon: 'https://www.lexaloffle.com/favicon.ico', name: 'Pico-8', descriptionKey: 'rec_pico8_desc' },
            { url: 'https://zxart.ee/rus/glavnaja/', favicon: 'https://zxart.ee/favicon.ico', name: 'ZXArt', descriptionKey: 'rec_zxart_desc' },
            { url: 'https://dos.zone/', favicon: 'https://dos.zone/favicon.ico', name: 'DOS Zone', descriptionKey: 'rec_doszone_desc' },
            { url: 'https://gam.onl/', favicon: 'https://gam.onl/favicon.ico', name: 'GAM.ONL', descriptionKey: 'rec_gamonl_desc' },
        ]
    },
    {
        titleKey: 'rec_downloads_title',
        icon: 'tools',
        tech: 'chrome',
        links: [
            { url: 'https://www.flaticon.com/', favicon: 'https://www.flaticon.com/favicon.ico', name: 'Flaticon', descriptionKey: 'rec_flaticon_desc' },
            { url: 'https://freesound.org/', favicon: 'https://freesound.org/favicon.ico', name: 'Freesound', descriptionKey: 'rec_freesound_desc' },
            { url: 'https://cdromance.org/', favicon: 'https://cdromance.org/favicon.ico', name: 'CDROMance', descriptionKey: 'rec_cdromance_desc' },
            { url: 'https://gog-games.to/', favicon: 'https://gog-games.to/favicon.ico', name: 'GOG games', descriptionKey: 'rec_goggames_desc' },
            { url: 'https://doomworld.com/cacowards/', favicon: 'https://doomworld.com/favicon.ico', name: 'Doomworld\'s Cacoward', descriptionKey: 'rec_cacoward_desc' },
            { url: 'https://win7games.com/', favicon: 'https://win7games.com/images/favicon-32x32.png', name: 'Win7Games', descriptionKey: 'rec_win7games_desc' },
        ]
    },
    {
        titleKey: 'rec_info_title',
        icon: 'joystick',
        tech: 'chrome',
        links: [
            { url: 'https://jekyllgrim.github.io/ZScript_Basics/', favicon: 'https://github.com/favicon.ico', name: 'ZScript Basics', descriptionKey: 'rec_zscript_desc' },
            { url: 'https://www.pcgamingwiki.com/wiki/Home', favicon: 'https://www.pcgamingwiki.com/favicon.ico', name: 'PCGamingWiki', descriptionKey: 'rec_pcgamingwiki_desc' },
            { url: 'https://store.steampowered.com/search/?sort_by=Price_ASC&filter=weeklongdeals', favicon: 'https://store.steampowered.com/favicon.ico', name: 'Steam', descriptionKey: 'rec_steam_desc' },
        ]
    },
    {
        titleKey: 'rec_services_title',
        icon: 'film',
        tech: 'chrome',
        links: [
            { url: 'https://huggingface.co/spaces?sort=trending&search=color', favicon: 'https://huggingface.co/favicon.ico', name: 'Hugging Face', descriptionKey: 'rec_huggingface_desc' },
            { url: 'https://podcast.adobe.com/enhance#', favicon: 'https://podcast.adobe.com/adobe-podcast-favicon.svg', name: 'Adobe Podcast', descriptionKey: 'rec_adobepodcast_desc' },
            { url: 'https://temp-mail.org/', favicon: 'https://temp-mail.org/favicon.ico', name: 'Temp-mail', descriptionKey: 'rec_tempmail_desc' },
        ]
    }
];

export const translations: { [key: string]: { ru: string, en: string } } = {
    // Tooltips
    "prev_track_tooltip": { "ru": "Предыдущий трек", "en": "Previous track" },
    "play_tooltip": { "ru": "Воспроизвести", "en": "Play" },
    "pause_tooltip": { "ru": "Пауза", "en": "Pause" },
    "next_track_tooltip": { "ru": "Следующий трек", "en": "Next track" },
    "my_videos_tooltip": { "ru": "Мои видосы", "en": "My videos" },
    "support_tooltip": { "ru": "Купить мне чашечку кофе", "en": "Buy me a coffee" },
    "my_repos_tooltip": { "ru": "Мои репозитории", "en": "My repositories" },
    "my_games_tooltip": { "ru": "Мои игры", "en": "My games" },
    "ontop_tooltip": { "ru": "Подняться наверх", "en": "Scroll to top" },
    "close_tooltip": { "ru": "Закрыть", "en": "Close" },
    "chat_tooltip": { "ru": "Чилл-зона", "en": "Chill Zone" },
    "upload_image_tooltip": { "ru": "Загрузить изображение", "en": "Upload image" },
    "send_message_tooltip": { "ru": "Отправить", "en": "Send" },
    
    // Navigation
    "nav_gallery": { "ru": "Галерея", "en": "Gallery" },
    "nav_ai_projects": { "ru": "AI Проекты", "en": "AI Projects" },
    "nav_misc": { "ru": "Разное", "en": "Misc" },
    "nav_games": { "ru": "Игры", "en": "Games" },
    "nav_tools": { "ru": "Инструменты & Утилиты", "en": "Tools & Utilities" },
    "nav_recommendations": { "ru": "ran4erep рекомендует", "en": "ran4erep recommends" },
    
    // Buttons
    "btn_go": { "ru": "Перейти", "en": "Go to" },
    "btn_watch": { "ru": "Посмотреть на YouTube", "en": "Watch on YouTube" },
    "btn_github": { "ru": "Перейти в репозиторий", "en": "Go to repository" },
    "btn_read": { "ru": "Прочитать", "en": "Read" },
    "btn_play": { "ru": "Играть в браузере", "en": "Play in browser" },
    "btn_download_apk": { "ru": "Скачать APK", "en": "Download APK" },
    "btn_open": { "ru": "Открыть", "en": "Open" },

    // AI Projects
    "universe_title": { "ru": "Universe A-Life", "en": "Universe A-Life" },
    "universe_desc": { "ru": "Симуляция жизни бактерий с простыми правилами: ешь или будь съеденным. Но с одним нюансом: каждая бактерия управляется нейросетью, которая пытается научиться выжить в этом суровом мире.", "en": "A simulation of bacteria life with simple rules: eat or be eaten. But with one nuance: each bacterium is controlled by a neural network that tries to learn how to survive in this harsh world." },
    "film_cod_title": { "ru": "Короткометражный фильм Cradle of Death", "en": "Short film Cradle of Death" },
    "film_cod_desc": { "ru": "Фильм, созданный при помощи нейросетей. Видеоряд, частично музыка, озвучка персонажей - всё это сгенерировали нейросети.", "en": "A film created with the help of neural networks. The video sequence, partly the music, the voice acting of the characters - all this was generated by neural networks." },
    "stable_colab_title": { "ru": "Stable Colab", "en": "Stable Colab" },
    "stable_colab_desc": { "ru": "Скрипт на Python для запуска нейросети Stable Diffusion в сервисе Google Colab без платной подписки.", "en": "A Python script to run the Stable Diffusion neural network in Google Colab without a paid subscription." },
    "snake_ai_title": { "ru": "🐍 Snake AI", "en": "🐍 Snake AI" },
    "snake_ai_desc": { "ru": "Простая самописная нейросеть, которая обучается методом Q-learning играть в игру Змейка прямо в вашем браузере. В фоне не работает, страница должна быть активна. Можно сохранять и загружать обученную модель. Есть график, который показывает успешность обучения нейросети.", "en": "A simple self-written neural network that learns using Q-learning to play the Snake game right in your browser. Does not work in the background, the page must be active. You can save and load the trained model. There is a graph that shows the success of the neural network training." },
    
    // Misc
    "tilecuti_title": { "ru": "Экспортёр тайлов", "en": "Tile Exporter" },
    "tilecut_desc": { "ru": "Утилита для извлечения тайлов из тайлсетов. Можно извлечь как все вместе, так и по отдельности, кликая на нужный. Скачивает либо в .png либо выдаёт base64 строку.", "en": "A utility for extracting tiles from tilesets. You can extract them all together or separately by clicking on the desired one. Downloads either in .png or gives a base64 string." },
    "wiki_title": { "ru": "Вики по планшетам на ОС Windows", "en": "Wiki on Windows OS tablets" },
    "wiki_desc": { "ru": "Здесь вы найдёте всю важную информацию по эксплуатации и геймингу на планшетах под управлением ОС Windows.", "en": "Here you will find all the important information on the operation and gaming on tablets running Windows OS." },
    "switch_theme_title": { "ru": "Тема Skulls для Nintendo Switch", "en": "Skulls Theme for Nintendo Switch" },
    "switch_theme_desc": { "ru": "Тема для консоли Nintendo Switch выполненная в тёмных тонах. На Switch OLED должна смотреться просто шикарно.", "en": "A theme for the Nintendo Switch console made in dark colors. It should look just gorgeous on the Switch OLED." },
    "cod_book_title": { "ru": "Книга \"Колыбель смерти\"", "en": "Book \"Cradle of Death\"" },
    "cod_book_desc": { "ru": "Современная версия моей книги, которая полностью переписана с учётом событий фильма. С иллюстрациями, среди которых есть неиспользованные в фильме материалы.", "en": "A modern version of my book, which has been completely rewritten to take into account the events of the film. With illustrations, among which there are materials not used in the film." },
    
    // Games
    "scraper_title": { "ru": "Скрапер для игровых ромов", "en": "Game ROMs scraper" },
    "scraper_desc": { "ru": "Ищет обложки для ромов через API сервиса Libretro Thumbnails. Для работы использует регулярные выражения.", "en": "Searches covers for ROMs through Libretro Thumbnails service's API. Uses regular expressions." },
    "dos_title": { "ru": "DOS Games Library", "en": "DOS Games Library" },
    "dos_desc": { "ru": "Каталог DOS игр с возможностью играть в них прямо в браузере. Используется эмулятор JS-DOS, который поддерживает мультиплеер через IPX. Крутится это всё на другом хостинге, так как там дают 20 гигов.", "en": "A catalog of DOS games with the ability to play them directly in the browser. It uses the JS-DOS emulator, which supports multiplayer via IPX. This is all running on another hosting, as they provide 20 gigs of space." },
    "faggots_hunter_title": { "ru": "Охота на пидоров", "en": "Faggot Hunt" },
    "faggots_hunter_desc": { "ru": "Старая добрая (🙃) Flash игра про отважного охотника, который отправился на сафари на пидоров. На кону стоит ваша жопа, будьте максимально бдительны, они могут поджидать вас в каждом кусту... Собственно запустил игру на сайте через библиотеку Ruffle, сверху добавил простое сенсорное управление, чтобы сидя в туалете можно было ПРОЧУВСТВОВАТЬ всю боль поражения в этой игре. 😄", "en": "The good old (🙃) Flash game about a brave hunter who went on a faggot safari. Your ass is on the line, be as vigilant as possible, they can be waiting for you in every bush... Actually, I launched the game on the site through the Ruffle library, and added simple touch controls on top, so that while sitting on the toilet you could FEEL all the pain of defeat in this game. 😄" },
    "arlade_title": { "ru": "Roguelike игра Arlade", "en": "Roguelike game Arlade" },
    "arlade_desc": { "ru": "Пока что не доделанный до конца рогалик (пересел с него на другой проект), но многие типичные механики подобных игр полностью реализованы. Когда-нибудь доделаю, а пока что он лежит в долгом ящике и ждёт свой час.", "en": "A roguelike that is not yet finished (I switched from it to another project), but many typical mechanics of such games are fully implemented. I'll finish it someday, but for now it's on the back burner waiting for its time." },
    "game_or_title": { "ru": "Игра Opposite Reaction", "en": "Game Opposite Reaction" },
    "game_or_desc": { "ru": "Простой раннер, который я сделал чтобы протестировать конструктор игр GDevelop.", "en": "A simple runner that I made to test the GDevelop game engine." },
    "game_cod_title": { "ru": "Игра Cradle of Death", "en": "Game Cradle of Death" },
    "game_cod_desc": { "ru": "Мой личный долгострой. Игра по моему рассказу «Колыбель смерти», сделанная в конструкторе игр Construct 2. Это всего лишь демо, планов на релиз было очень много.", "en": "My personal long-term project. A game based on my story 'Cradle of Death', made in the Construct 2 game engine. This is just a demo, there were many plans for the release." },
    "game_tetris_title": { "ru": "Игра Тетрис", "en": "Game Tetris" },
    "game_tetris_desc": { "ru": "Однажды мне захотелось сделать тетрис, но с первого раза ничего не получилось. И вот, со второго раза удалось написать тетрис. Управление полностью сенсорное, заодно научился делать свайпы.", "en": "Once I wanted to make Tetris, but nothing came of it the first time. And so, the second time I managed to write Tetris. The controls are completely touch-based, and at the same time I learned to make swipes." },
    "game_memory_title": { "ru": "Игра Clash of Memory", "en": "Game Clash of Memory" },
    "game_memory_desc": { "ru": "Игра на память, в которой нужно запоминать какие карты лежат на столе рубашкой вверх и переворачивать две одинаковые. Дизайн карт взят из игры Clash Royale.", "en": "A memory game in which you need to remember which cards are on the table face down and turn over two identical ones. The card design is taken from the game Clash Royale." },
    "game_guess_title": { "ru": "Игра угадайка", "en": "Guessing game" },
    "game_guess_desc": { "ru": "Игра, в которой компьютер загадывает число, а игрок должен его угадать. Компьютер подсказывает, больше или меньше названное число, чем загаданное.", "en": "A game in which the computer thinks of a number, and the player must guess it. The computer hints whether the named number is greater or less than the hidden number." },
    "game_snake_title": { "ru": "Змейка", "en": "Snake" },
    "game_snake_desc": { "ru": "Классическая Змейка на JavaScript, но отрисовка графики происходит не через canvas, а через стороннюю библиотеку для реализации консоли.", "en": "Classic Snake in JavaScript, but the graphics are rendered not through canvas, but through a third-party library for implementing a console." },
    "game_sokoban_title": { "ru": "Сокобан", "en": "Sokoban" },
    "game_sokoban_desc": { "ru": "Классический Сокобан. В этой логической игре вы выступите в роли грузчика, которому нужно расставить ящики на складе в определённые места. Уровни для игры устроены в виде двумерных массивов, что делает их создание очень простым.", "en": "Classic Sokoban. In this logic game, you will act as a loader who needs to arrange boxes in a warehouse in certain places. The levels for the game are arranged in the form of two-dimensional arrays, which makes their creation very simple." },
    
    // Tools
	"frame_extractor_title": { "ru": "Экстрактор кадров", "en": "Frame extractor" },
    "frame_extractor_desc": { "ru": "Инструмент для извлечения кадров из видеофайлов. Можно извлечь как один кадр, так и несколько кадров в диапазоне.", "en": "A tool for extracting frames from video files. You can extract either a single frame or multiple frames within a specified range." },
    "chromaclean_title": { "ru": "Chromaclean", "en": "Chromaclean" },
    "chromaclean_desc": { "ru": "Полностью вырезает зелёный канал из изображения. Полезно для удаления хромакея.", "en": "Completely deletes green channel from the image. Usefull for chromakey removing." },
    "passgen_title": { "ru": "Генератор цифровых паролей", "en": "Digital Password Generator" },
    "passgen_desc": { "ru": "Утилита для генерации .txt файлов содержащих цифровые пароли.", "en": "Utility for generating .txt files containing numeric passwords." },
    "tool_webide_title": { "ru": "Web IDE", "en": "Web IDE" },
    "tool_webide_desc": { "ru": "IDE для написания HTML, CSS и JavaScript кода. Делал для работы с кодом с планшета или телефона. Проверка на ошибки работает не идеально, также не работает кастомная сенсорная клавиатура, отключил её из-за багов.", "en": "IDE for writing HTML, CSS, and JavaScript code. I made it for working with code from a tablet or phone. Error checking does not work perfectly, and the custom touch keyboard does not work, I disabled it due to bugs." },
    "tool_birthday_title": { "ru": "Генератор дней рождения", "en": "Birthday Generator" },
    "tool_birthday_desc": { "ru": "Генерирует огромный список дней рождения по диапазону годов. При помощи брут-форса (метода перебора) можно подобрать пароль, если его ввели в виде дня рождения.", "en": "Generates a huge list of birthdays by year range. Using brute-force (the enumeration method), you can guess a password if it was entered as a birthday." },
    "tool_calendar_title": { "ru": "Календарь", "en": "Calendar" },
    "tool_calendar_desc": { "ru": "Календарь написанный на JavaScript. У каждого времени года отдельная картинка с девочкой.", "en": "A calendar written in JavaScript. Each season has a separate picture with a girl." },
    "tool_synth_title": { "ru": "Синтезатор", "en": "Synthesizer" },
    "tool_synth_desc": { "ru": "Простой музыкальный синтезатор. Сделал чтобы понять как в JavaScript генерируется звук. То есть звуки нот генерируются прямо в коде, никаких аудиофайлов там нет.", "en": "A simple music synthesizer. I made it to understand how sound is generated in JavaScript. That is, the sounds of the notes are generated directly in the code, there are no audio files there." },
    "tool_particles_title": { "ru": "Визуализатор частиц", "en": "Particle Visualizer" },
    "tool_particles_desc": { "ru": "Сделал для того, чтобы в реальном времени видеть частицы перед добавлением их в конструктор игр Construct 2.", "en": "I made it to see particles in real time before adding them to the Construct 2 game engine." },
    "tool_calc_title": { "ru": "Калькулятор", "en": "Calculator" },
    "tool_calc_desc": { "ru": "«Портировал» калькулятор со своего старого телефона Lenovo Vibe p1ma40 на JavaScript.", "en": "'Ported' the calculator from my old Lenovo Vibe p1ma40 phone to JavaScript." },
    "tool_password_title": { "ru": "Генератор паролей", "en": "Password Generator" },
    "tool_password_desc": { "ru": "Генерирует случайные пароли указанной длины со спецсимволами или без них, по желанию.", "en": "Generates random passwords of a specified length with or without special characters, as desired." },
    "tool_pixelart_title": { "ru": "Пиксель-арт редактор", "en": "Pixel-art editor" },
    "tool_pixelart_desc": { "ru": "Простой редактор, который позволяет рисовать пиксельные изображения размером 8х8. Выбор цвета ограничен палитрой фентезийной консоли Pico-8. Полученное изображение можно скачать.", "en": "A simple editor that allows you to draw pixel images of size 8x8. The color choice is limited to the palette of the Pico-8 fantasy console. The resulting image can be downloaded." },
    "tool_layout_title": { "ru": "Конвертер раскладки", "en": "Layout Converter" },
    "tool_layout_desc": { "ru": "Конвертирует русский текст, написанный в английской раскладке клавиатуры, в читаемый вид.", "en": "Converts Russian text written in the English keyboard layout into a readable form." },
    "tool_scancode_title": { "ru": "Определитель скан-кодов", "en": "Scan-code detector" },
    "tool_scancode_desc": { "ru": "Показывает скан-код любой нажатой клавиши на клавиатуре.", "en": "Shows the scan code of any key pressed on the keyboard." },
    "tool_soundtest_title": { "ru": "Тест звуковых каналов", "en": "Sound channel test" },
    "tool_soundtest_desc": { "ru": "Позволяет воспроизвести звук в левом, либо в правом канале. Писал для своих старых наушников, у которых не было маркировок L и R, чтобы понимать правильно ли я их надел.", "en": "Allows you to play sound in the left or right channel. I wrote it for my old headphones, which did not have L and R markings, to understand if I put them on correctly." },
    "tool_emumouse_title": { "ru": "EmuMouse", "en": "EmuMouse" },
    "tool_emumouse_desc": { "ru": "Эмулятор колёсика мыши, для скролла с клавиатуры.", "en": "Mouse wheel emulator, for scrolling with the keyboard." },
    "tool_epct_title": { "ru": "EPCT (Earphone Channel Test)", "en": "EPCT (Earphone Channel Test)" },
    "tool_epct_desc": { "ru": "Тоже тест стерео каналов, если нет маркировок на наушниках, только уже на C++ и в автоматическом режиме.", "en": "Also a stereo channel test, if there are no markings on the headphones, only already in C++ and in automatic mode." },
    
    // Recommendations
    "rec_emulators_title": { "ru": "Эмуляторы онлайн", "en": "Online Emulators" },
    "rec_retrogames_desc": { "ru": "Годные эмуляторы самых разных консолей.", "en": "Good emulators for various consoles." },
    "rec_emuos_desc": { "ru": "Виртуальный рабочий стол Windows 95/98 с множеством различных игр.", "en": "Virtual Windows 95/98 desktop with many different games." },
    "rec_pico8_desc": { "ru": "Каталог картриджей для Pico-8, в которые можно играть онлайн.", "en": "Catalog of Pico-8 cartridges that can be played online." },
    "rec_zxart_desc": { "ru": "Огромный каталог игр для ZX Spectrum, со скриншотами, обложками, мануалами и прочим. Ну и в них можно играть прямо на сайте.", "en": "A huge catalog of games for the ZX Spectrum, with screenshots, covers, manuals, and more. And you can play them right on the site." },
    "rec_doszone_desc": { "ru": "Каталог игр для DOS, с возможностью играть прямо на сайте. Также это официальный сайт разработчика эмулятора JS DOS.", "en": "Catalog of games for DOS, with the ability to play right on the site. It is also the official website of the developer of the JS DOS emulator." },
    "rec_gamonl_desc": { "ru": "Это буквально RetroArch в браузере, с дизайном похожим на всякие игровые ОС типа Batocera.", "en": "This is literally RetroArch in a browser, with a design similar to various gaming OS like Batocera." },
    "rec_downloads_title": { "ru": "Полезные загрузки", "en": "Useful Downloads" },
    "rec_flaticon_desc": { "ru": "Лучший сайт для скачивания иконок.", "en": "The best site for downloading icons." },
    "rec_freesound_desc": { "ru": "Лучший сайт для скачивания звуков.", "en": "The best site for downloading sounds." },
    "rec_cdromance_desc": { "ru": "Лучший сайт для скачивания ромов для любой консоли.", "en": "The best site for downloading ROMs for any console." },
    "rec_goggames_desc": { "ru": "Сайт, который симулирует дизайн магазина GOG.com и содержит, собственно, игры с GOG'а. Обновляется очень оперативно. Короче бесплатный GOG 🙃", "en": "A site that simulates the design of the GOG.com store and contains, in fact, games from GOG. It is updated very quickly. In short, free GOG 🙃" },
    "rec_cacoward_desc": { "ru": "Сайт знаменитой церемонии Cacoward. Всегда есть интересные моды для Doom.", "en": "The site of the famous Cacoward ceremony. There are always interesting mods for Doom." },
    "rec_win7games_desc": { "ru": "Классические игры из Windows 7 для Windows 10/11. И не только игры.", "en": "Classic games from Windows 7 for Windows 10/11. And not just games." },
    "rec_info_title": { "ru": "Информация", "en": "Information" },
    "rec_zscript_desc": { "ru": "Гайд от Agent Ash по языку ZScript для создания модов для Doom.", "en": "A guide from Agent Ash on the ZScript language for creating mods for Doom." },
    "rec_pcgamingwiki_desc": { "ru": "Подробная информация про игры. Год выхода, движок, оценки и самое главное — решения проблем со старыми играми.", "en": "Detailed information about games. Year of release, engine, ratings and most importantly - solutions to problems with old games." },
    "rec_steam_desc": { "ru": "Текущие скидочки в Стиме.", "en": "Current discounts on Steam." },
    "rec_services_title": { "ru": "Сервисы", "en": "Services" },
    "rec_huggingface_desc": { "ru": "Бесплатный каталог нейросетей на все случаи жизни.", "en": "A free catalog of neural networks for all occasions." },
    "rec_adobepodcast_desc": { "ru": "Улучшает качество речи в аудио до студийного уровня.", "en": "Improves speech quality in audio to studio level." },
    "rec_tempmail_desc": { "ru": "Бесплатный сервис, который даёт временный E-Mail адрес для регистрации на сайтах.", "en": "A free service that provides a temporary E-Mail address for registration on sites." },
    
    // Chat
    "chat_title": { "ru": "Чилл-зона. Побеседуем?", "en": "Chill Zone. Shall we talk?" },
    "chat_nickname_placeholder": { "ru": "Никнейм", "en": "Nickname" },
    "chat_message_placeholder": { "ru": "Сообщение", "en": "Message" },
    "chat_notification_ok": { "ru": "Понял", "en": "Got it" },
    "chat_error_nickname": { "ru": "Сначала введи никнейм!", "en": "Enter a nickname first!" },
    "chat_error_message": { "ru": "Нельзя отправить пустое сообщение!", "en": "Cannot send an empty message!" },
    "chat_error_too_long": { "ru": "Сообщение слишком длинное!", "en": "Message is too long!" },
    "chat_error_forbidden_links": { "ru": "Ссылки запрещены! Разрешены только ссылки на YouTube и ran4erep.github.io", "en": "Links are forbidden! Only links to YouTube and ran4erep.github.io are allowed" },
    "chat_error_send": { "ru": "Не удалось отправить сообщение.", "en": "Failed to send message." }
};
