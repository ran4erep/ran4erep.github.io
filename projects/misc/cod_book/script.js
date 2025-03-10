document.addEventListener('DOMContentLoaded', async function() {
    // Определяем, является ли устройство мобильным
    const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isMobile = mobileUserAgent && window.innerWidth <= 768;
    
    // Для отладки
    console.log('UserAgent:', navigator.userAgent);
    console.log('Window width:', window.innerWidth);
    console.log('Is mobile device:', mobileUserAgent);
    console.log('Using mobile view:', isMobile);
    
    // Variables for book content and pagination
    let bookContent = '';
    let currentPage = 0;
    let totalPages = 0;
    let pages = [];
    const pagesPerView = 2;
    let charsPerPage = 0; // Будет определено динамически
    let pageFlip = null;
    
    // DOM elements
    const bookElement = document.getElementById('book');
    
    // Создаем контейнер для тултипов
    const tooltipContainer = document.createElement('div');
    tooltipContainer.className = 'tooltip-container';
    document.body.appendChild(tooltipContainer);

    // Добавляем обработчики для тултипов
    document.addEventListener('mouseover', function(e) {
        if (!isMobile) {  // Отключаем тултипы на мобильных
            const footnote = e.target.closest('.footnote');
            if (footnote) {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = footnote.getAttribute('data-tooltip');
                
                const rect = footnote.getBoundingClientRect();
                tooltip.style.position = 'fixed';
                tooltip.style.left = rect.left + (rect.width / 2) + 'px';
                tooltip.style.top = rect.top - 10 + 'px';
                
                tooltipContainer.appendChild(tooltip);
                
                footnote.addEventListener('mouseleave', function() {
                    tooltip.remove();
                }, { once: true });
            }
        }
    });
    
    // Создаем невидимый элемент для измерения
    const testElement = document.createElement('div');
    testElement.className = 'page-content';
    testElement.style.position = 'absolute';
    testElement.style.visibility = 'hidden';
    testElement.style.zIndex = '-1000';
    testElement.style.width = '100%';
    document.body.appendChild(testElement);
    
    console.log("Всего страниц:", pages.length);
    console.log("Содержимое последней страницы:", pages[pages.length - 1]);

    // Initialize PageFlip
    function initPageFlip() {
        // Очищаем контейнер книги перед добавлением страниц
        while (bookElement.firstChild) {
            bookElement.removeChild(bookElement.firstChild);
        }
        
        // Create pages for PageFlip
        pages.forEach((content, index) => {
            const pageElement = document.createElement('div');
            pageElement.className = 'page-content';
            
            if (index === 0) {
                // Cover page
                pageElement.innerHTML = `<div class="book-cover"><img src="cover.jpg" alt="Обложка книги"></div>`;
            } else {
                // Добавляем контент напрямую в элемент страницы
                pageElement.innerHTML = formatContent(content);
                
                // Add page number
                const pageNumberElement = document.createElement('div');
                pageNumberElement.className = 'page-number';
                pageNumberElement.textContent = index;
                pageElement.appendChild(pageNumberElement);
            }
            
            bookElement.appendChild(pageElement);
        });

        // Получаем сохраненную страницу из localStorage
        const savedPage = localStorage.getItem('bookmarkPage');
        const startPage = savedPage ? parseInt(savedPage) : 1;

        // Initialize PageFlip
        pageFlip = new St.PageFlip(bookElement, {
            width: bookElement.offsetWidth / 2,
            height: bookElement.offsetHeight,
            showCover: false,
            maxShadowOpacity: 0.75,
            minShadowOpacity: 0.50,
            flippingTime: 500,
            usePortrait: false,
            startPage: startPage,
            autoSize: true,
            drawShadow: true,
            mobileScrollSupport: true
        });

        // Load pages into PageFlip
        pageFlip.loadFromHTML(document.querySelectorAll('.page-content'));

        // Изменение содержимого последней страницы
        if (pageFlip.pages && pageFlip.pages.pages && pageFlip.pages.pages.length > 0) {
            const lastPageIndex = pageFlip.pages.pages.length - 1;
            const lastPage = pageFlip.pages.pages[lastPageIndex];
            
            if (lastPage && lastPage.element) {
                // Находим контейнер содержимого для последней страницы
                const contentElement = lastPage.element.querySelector('.page-content');
                if (contentElement) {
                    // Устанавливаем новое содержимое
                    contentElement.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100%; font-size: 14px !important;">Колыбель смерти<br>by ran4erep, 2025</div>';
                } else {
                    // Если нет контейнера .page-content, работаем с самим элементом
                    lastPage.element.innerHTML = '<div class="page-content"><div style="display: flex; justify-content: center; align-items: center; height: 100%; font-size: 14px !important;">Колыбель смерти<br>by ran4erep, 2025</div></div>';
                }
            }
        }

        // Event listeners for PageFlip
        pageFlip.on('flip', (e) => {
            currentPage = e.data;
            // Автоматически сохраняем текущую страницу
            localStorage.setItem('bookmarkPage', currentPage);
        });
    }
    
    // Fetch book content from output.txt
    async function fetchBookContent() {
        try {
            const response = await fetch('cod.txt');
            if (!response.ok) {
                throw new Error('Не удалось загрузить файл книги');
            }
            bookContent = await response.text();
            
            // Нормализуем переводы строк (CRLF -> LF)
            bookContent = bookContent.replace(/\r\n/g, '\n');
            
            if (isMobile) {
                initMobileView();
            } else {
                calculateCharsPerPage();
                preparePages();
                initPageFlip();
            }
        } catch (error) {
            console.error('Ошибка загрузки книги:', error);
            alert('Не удалось загрузить книгу. Пожалуйста, проверьте, что файл output.txt доступен.');
        }
    }

    // Инициализация мобильного представления
    function initMobileView() {
        // Очищаем контейнер книги
        bookElement.innerHTML = '';
        bookElement.className = 'mobile-book';
        
        // Добавляем обложку
        bookElement.innerHTML = '<div class="mobile-cover"><img src="cover.jpg" alt="Обложка книги"></div>';
        
        // Обрабатываем изображения перед форматированием текста
        let processedContent = bookContent.replace(/<img\/([^>]+)>/g, (match, src) => {
            return `<div class="mobile-illustration"><img src="${src}" alt="Иллюстрация"></div>`;
        });
        
        // Форматируем весь контент как одну длинную страницу
        const formattedContent = formatContent(processedContent);
        bookElement.innerHTML += formattedContent;
        
        // Восстанавливаем позицию скролла после того, как все изображения загружены
        const images = bookElement.getElementsByTagName('img');
        let loadedImages = 0;
        
        function tryRestoreScroll() {
            loadedImages++;
            if (loadedImages === images.length) {
                const savedPosition = localStorage.getItem('bookmarkPosition');
                if (savedPosition) {
                    setTimeout(() => {
                        window.scrollTo(0, parseInt(savedPosition));
                    }, 100);
                }
            }
        }
        
        // Если нет изображений, сразу восстанавливаем позицию
        if (images.length === 0) {
            const savedPosition = localStorage.getItem('bookmarkPosition');
            if (savedPosition) {
                setTimeout(() => {
                    window.scrollTo(0, parseInt(savedPosition));
                }, 100);
            }
        } else {
            // Ждем загрузки всех изображений
            Array.from(images).forEach(img => {
                if (img.complete) {
                    tryRestoreScroll();
                } else {
                    img.addEventListener('load', tryRestoreScroll);
                    img.addEventListener('error', tryRestoreScroll);
                }
            });
        }
        
        // Сохраняем позицию скролла при прокрутке
        let scrollTimeout;
        window.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
                localStorage.setItem('bookmarkPosition', window.pageYOffset.toString());
            }, 100);
        });
        
        // Отключаем overflow: hidden на body и html
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
    }

    // Функция для определения количества слов на страницу
    function calculateCharsPerPage() {
        // Базовое количество слов для Full HD (1920x1080)
        const baseWordsPerPage = 150;
        
        // Получаем разрешение экрана
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Рассчитываем коэффициент масштабирования на основе разрешения
        const widthRatio = screenWidth / 1920;
        const heightRatio = screenHeight / 1080;
        const scaleFactor = Math.max(widthRatio, heightRatio);
        
        // Более агрессивное масштабирование для высоких разрешений
        let wordsPerPage;
        if (scaleFactor > 1) {
            // Для разрешений выше Full HD используем более быстрый рост
            wordsPerPage = Math.round(baseWordsPerPage * (1 + (scaleFactor - 1) * 1.5));
        } else {
            // Для разрешений ниже Full HD оставляем линейное масштабирование
            wordsPerPage = Math.round(baseWordsPerPage * scaleFactor);
        }
        
        // Устанавливаем минимальное и максимальное значения
        wordsPerPage = Math.max(120, Math.min(400, wordsPerPage));
        
        // Сохраняем значение в переменной charsPerPage
        charsPerPage = wordsPerPage;
        
        // Увеличиваем шрифт только для разрешений выше Full HD
        if (screenWidth > 1920 || screenHeight > 1080) {
            // Создаем стиль только для увеличенного шрифта
            const styleElement = document.createElement('style');
            let fontSize;
            
            if (screenWidth >= 3840 || screenHeight >= 2160) {
                // 4K
                fontSize = 32;
            } else {
                // 2K
                fontSize = 28;
            }
            
            styleElement.textContent = `
                .page-content {
                    font-size: ${fontSize}px !important;
                }
                .page-content h2 {
                    font-size: ${fontSize + 4}px !important;
                }
                .page-number {
                    font-size: ${fontSize}px !important;
                    bottom: 30px !important;
                }
            `;
            document.head.appendChild(styleElement);
            console.log(`Установлен размер шрифта: ${fontSize}px`);
        }
        
        console.log(`Разрешение экрана: ${screenWidth}x${screenHeight}`);
        console.log(`Коэффициент масштабирования: ${scaleFactor}`);
        console.log(`Установлено количество слов на странице: ${wordsPerPage}`);
    }
    
    // Функция разбивки текста на страницы по количеству слов
    function preparePages() {
        pages = [];
        let position = 0;
        
        // Add cover page
        pages.push('');
        
        while (position < bookContent.length) {
            // Получаем следующий фрагмент текста для анализа
            const remainingText = bookContent.substring(position);
            
            // Проверяем, есть ли изображение в начале оставшегося текста
            const imgMatch = remainingText.match(/^<img\/([^>]+)>/);
            if (imgMatch) {
                // Если нашли изображение, добавляем его на отдельную страницу как обложку
                pages.push(`<div class="book-cover illustration-page"><img src="${imgMatch[1]}" alt="Иллюстрация"></div>`);
                position += imgMatch[0].length;
                
                // Пропускаем пробелы и переводы строк после изображения
                while (position < bookContent.length && /[\s\n\r]/.test(bookContent[position])) {
                    position++;
                }
                continue;
            }
            
            // Разбиваем текст на строки
            const lines = remainingText.split('\n');
            let pageLines = [];
            let currentLength = 0;
            let hasImage = false;
            let processedLength = 0;
            
            for (let line of lines) {
                // Проверяем наличие маркера изображения
                if (line.includes('<img/')) {
                    hasImage = true;
                    break;
                }
                
                // Считаем количество слов в строке
                const words = line.trim() ? line.split(' ').length : 1;
                
                // Проверяем, поместится ли вся строка
                if (currentLength + words <= charsPerPage) {
                    pageLines.push(line);
                    currentLength += words;
                    processedLength += line.length + 1; // +1 для учета символа новой строки
                } else {
                    break;
                }
            }
            
            let pageText = pageLines.join('\n');
            
            // Если нашли изображение в тексте
            if (hasImage) {
                const imgIndex = pageText.indexOf('<img/');
                if (imgIndex !== -1) {
                    pageText = pageText.substring(0, imgIndex).trim();
                    processedLength = imgIndex;
                }
            }
            
            // Проверяем, не разрезаем ли мы заголовок
            const titleMatch = pageText.match(/---.*?---/);
            if (titleMatch) {
                const titleStart = pageText.indexOf('---');
                if (titleStart > 0) {
                    pageText = pageText.substring(0, titleStart).trim();
                    processedLength = titleStart;
                }
            }
            
            // Добавляем страницу только если в ней есть текст
            if (pageText.trim()) {
                pages.push(pageText);
                position += processedLength;
            } else {
                // Если текст пустой, продвигаемся вперёд
                position++;
            }
            
            // Пропускаем пробелы и переводы строк
            while (position < bookContent.length && /[\s\n\r]/.test(bookContent[position])) {
                position++;
            }
        }
        
        // Ensure even number of pages for proper book layout
        if (pages.length % 2 !== 0) {
            pages.push('');
        }
        
        console.log(`Книга разбита на ${pages.length} страниц`);
    }
    
    // Форматирование содержимого для отображения
    function formatContent(content) {
        if (!content) return '';
        
        // Если это страница с изображением, возвращаем как есть
        if (content.startsWith('<div class="book-cover illustration-page">')) {
            return content;
        }
        
        // Обрабатываем заголовки в строгом формате "--- Текст ---"
        content = content.replace(/---\s+(.+?)\s+---/g, '<h2>$1</h2>');
        
        // Обрабатываем текст в квадратных скобках - подчеркивание
        content = content.replace(/\[([^\]]+)\]/g, '<u>$1</u>');
        
        // Обрабатываем сноски (только слово без звездочки)
        content = content.replace(/(\S+)\*\(([^)]+)\)/g, '<span class="footnote" data-tooltip="$2">$1</span>');
        
        // Разбиваем текст на строки
        const lines = content.split('\n');
        const formattedLines = lines.map(line => {
            // Если строка пустая, возвращаем div для отступа
            if (!line.trim()) {
                return '<div class="empty-paragraph"></div>';
            }
            
            // Если это заголовок или иллюстрация, возвращаем как есть
            if (line.startsWith('<h2>') || line.startsWith('<div class="book-illustration">')) {
                return line;
            }
            
            // Обычная строка текста
            return `<p>${line}</p>`;
        });
        
        return formattedLines.join('\n');
    }
    
    // Initialize the book
    fetchBookContent();
    
    // Стили для титульной страницы и заголовков
    const style = document.createElement('style');
    style.textContent = `
        .page-content {
            position: relative;
            height: 100%;
            overflow: hidden;
            box-sizing: border-box;
            padding: 20px;
            font-size: 14px !important;
            line-height: 1.4 !important;
            font-family: Arial, sans-serif !important;
            background-color: #fffef8;
            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
            cursor: pointer;
            user-select: none;
        }
        .stf__parent {
            background-color: #f0ebdf !important;
        }
        .stf__block {
            background-color: #fffef8 !important;
            -webkit-transform-style: preserve-3d;
            transform-style: preserve-3d;
            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
        }
        .stf__item {
            background-color: #fffef8 !important;
            box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.1) !important;
            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
        }
        .stf__wrapper {
            background-color: #fffef8 !important;
            -webkit-transform-style: preserve-3d;
            transform-style: preserve-3d;
        }
        .page-number {
            position: absolute;
            bottom: 20px;
            width: 100%;
            left: 0;
            text-align: center;
            font-size: 14px !important;
            color: #666;
        }
        .cover-content {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100%;
            text-align: center;
        }
        .cover-content h1 {
            font-size: 24px !important;
            margin-bottom: 20px;
        }
        .cover-content p {
            font-size: 16px !important;
            font-style: italic;
        }
        .book-cover {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
        }
        .book-cover img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }
        .book-illustration {
            width: 100%;
            margin: 10px 0;
            text-align: center;
        }
        .book-illustration img {
            max-width: 100%;
            max-height: 200px;
            object-fit: contain;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        h2 {
            font-size: 16px !important;
            margin: 10px 0;
            text-align: center;
            color: #333;
            font-weight: bold;
        }
        p {
            margin: 0 0 8px 0;
            text-indent: 20px;
        }
        u {
            text-decoration: underline;
            text-underline-offset: 2px;
        }
        .book-illustration.full-page {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: #fffef8;
        }
        .book-illustration.full-page img {
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .book-cover.illustration-page {
            width: 100%;
            height: calc(100% - 4px);
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            background-color: #fffef8;
            padding: 0;
            margin: 0;
        }
        .book-cover.illustration-page img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }
        .bookmark-button {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            border: none;
            border-radius: 50%;
            background: #fff;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            cursor: pointer;
            font-size: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: transform 0.2s;
            z-index: 1000;
        }
        .bookmark-button:hover {
            transform: scale(1.1);
        }
        .bookmark-button:active {
            transform: scale(0.95);
        }
        .bookmark-notification {
            position: fixed;
            top: 70px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 14px;
            animation: fadeOut 2s forwards;
            z-index: 1000;
        }
        @keyframes fadeOut {
            0% { opacity: 1; }
            70% { opacity: 1; }
            100% { opacity: 0; }
        }
        .empty-paragraph {
            height: 0.6em;
            margin: 0;
        }
    `;
    document.head.appendChild(style);
}); 