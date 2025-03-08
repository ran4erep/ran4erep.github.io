document.addEventListener('DOMContentLoaded', async function() {
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

        // Initialize PageFlip
        pageFlip = new St.PageFlip(bookElement, {
            width: bookElement.offsetWidth / 2, // Half of book width for each page
            height: bookElement.offsetHeight,
            showCover: false,
            maxShadowOpacity: 0.2,
            flippingTime: 500,
            usePortrait: false,
            startPage: 1,
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
        });
    }
    
    // Fetch book content from cod.txt
    async function fetchBookContent() {
        try {
            const response = await fetch('cod.txt');
            if (!response.ok) {
                throw new Error('Could not fetch book content');
            }
            bookContent = await response.text();
            
            // Нормализуем переводы строк (CRLF -> LF)
            bookContent = bookContent.replace(/\r\n/g, '\n');
            
            // Определяем количество символов на странице
            calculateCharsPerPage();
            
            // Разбиваем текст на страницы
            preparePages();
            
            // Initialize PageFlip after content is loaded
            initPageFlip();
        } catch (error) {
            console.error('Error loading book:', error);
            alert('Не удалось загрузить книгу. Пожалуйста, проверьте, что файл cod.txt доступен.');
        }
    }

    // Функция для определения количества слов на страницу
    function calculateCharsPerPage() {
        // Это значение можно регулировать для изменения плотности текста на странице
        // Чем меньше значение, тем меньше текста будет на странице
        // Чем больше значение, тем больше текста будет на странице
        const wordsPerPage = 120; // Регулируемый параметр - количество слов на страницу
        
        // Сохраняем значение в переменной charsPerPage для совместимости с остальным кодом
        charsPerPage = wordsPerPage;
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
            
            // Разбиваем текст на слова. Слово - это все символы до пробела.
            // Только пробел является разделителем слов.
            const words = remainingText.split(' ');
            
            // Определяем количество слов для текущей страницы
            let wordCount = Math.min(charsPerPage, words.length);
            
            if (wordCount < words.length) {
                // Собираем текст из выбранных слов, включая пробелы между ними
                let pageText = words.slice(0, wordCount).join(' ');
                
                // Проверяем, не разрезаем ли мы заголовок
                if (pageText.includes('---') && !pageText.match(/---\s+.*?\s+---/)) {
                    // Ищем начало заголовка
                    const titleStart = pageText.lastIndexOf('---');
                    if (titleStart > 0) {
                        // Обрезаем текст до начала заголовка
                        pageText = pageText.substring(0, titleStart).trim();
                        // Пересчитываем количество слов
                        wordCount = pageText.split(' ').length;
                    }
                }
                
                // Проверяем, не разрезаем ли мы форматирование в квадратных скобках
                let openBrackets = (pageText.match(/\[/g) || []).length;
                let closeBrackets = (pageText.match(/\]/g) || []).length;
                
                if (openBrackets > closeBrackets) {
                    // Ищем последнюю открывающую скобку без закрывающей
                    const lastOpenBracket = pageText.lastIndexOf('[');
                    if (lastOpenBracket > 0) {
                        // Обрезаем текст до последней открывающей скобки
                        pageText = pageText.substring(0, lastOpenBracket).trim();
                        // Пересчитываем количество слов
                        wordCount = pageText.split(' ').length;
                    }
                }
                
                // Проверяем, не обрывается ли предложение (если последний символ не точка, восклицательный или вопросительный знак)
                const lastChar = pageText.trim().slice(-1);
                if (lastChar && !'.!?'.includes(lastChar)) {
                    // Ищем последнюю точку, восклицательный или вопросительный знак
                    const lastSentenceEnd = Math.max(
                        pageText.lastIndexOf('.'), 
                        pageText.lastIndexOf('!'), 
                        pageText.lastIndexOf('?')
                    );
                    
                    // Если нашли конец предложения и он не в самом начале текста, обрезаем до него
                    if (lastSentenceEnd > pageText.length * 0.5) {
                        pageText = pageText.substring(0, lastSentenceEnd + 1).trim();
                        // Пересчитываем количество слов
                        wordCount = pageText.split(' ').length;
                    }
                }
                
                // Добавляем страницу
                pages.push(pageText);
                
                // Обновляем позицию для следующей страницы
                position += pageText.length;
                
                // Если мы не в конце текста, добавляем длину пробела
                if (position < bookContent.length) {
                    position++; // Пропускаем пробел после текста
                }
                
                // Пропускаем дополнительные пробелы и переводы строк
                while (position < bookContent.length && /[\s\n\r]/.test(bookContent[position])) {
                position++;
                }
            } else {
                // Добавляем оставшийся текст
                pages.push(remainingText);
                position = bookContent.length;
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
        
        // Обрабатываем заголовки в строгом формате "--- Текст ---"
        content = content.replace(/---\s+(.+?)\s+---/g, '<h2>$1</h2>');
        
        // Обрабатываем текст в квадратных скобках - делаем его подчеркнутым
        content = content.replace(/\[([^\]]+)\]/g, '<u>$1</u>');
        
        // Обрабатываем теги изображений
        content = content.replace(/<img\/([^>]+)>/g, function(match, imagePath) {
            return `<div class="book-illustration"><img src="${imagePath}" alt="Иллюстрация"></div>`;
        });
        
        // Разбиваем на строки и обрабатываем каждую
        const lines = content.split('\n');
        const formattedLines = [];
        
        let inParagraph = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Пропускаем пустые строки
            if (line === '') {
                if (inParagraph) {
                    formattedLines.push('</p>');
                    inParagraph = false;
                }
                continue;
            }
            
            if (line.match(/^<h2>/) || line.match(/^<div class="book-illustration">/)) {
                if (inParagraph) {
                    formattedLines.push('</p>');
                    inParagraph = false;
                }
                
                formattedLines.push(line);
            } else {
                if (!inParagraph) {
                    formattedLines.push('<p>');
                    inParagraph = true;
                } else {
                    // Добавляем пробел между строками вместо <br>, чтобы текст выглядел более естественно
                    formattedLines.push(' ');
                }
                
                formattedLines.push(line);
            }
        }
        
        if (inParagraph) {
            formattedLines.push('</p>');
        }
        
        return formattedLines.join('');
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
        }
        .stf__block {
            background-color: #fffef8 !important;
        }
        .stf__item {
            background-color: #fffef8 !important;
            box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.1) !important;
        }
        .stf__wrapper {
            background-color: #fffef8 !important;
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
    `;
    document.head.appendChild(style);
}); 