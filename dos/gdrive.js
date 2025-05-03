// Конфигурация Google Drive
const API_KEY = 'AIzaSyCTVUfMDmj3fsVYD341-Nen-zO0qXxupDs';
const FOLDER_ID = '1rfW-ULXZw255l5kVE4JxW9BlVM-YBVOV';

// Кэш для файлов
let foldersCache = null;
let lastCacheUpdate = 0;
const CACHE_LIFETIME = 5 * 60 * 1000; // 5 минут

// Получение списка папок с играми из Google Drive
async function getGDriveFolders() {
    try {
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?` +
            `q='${FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder'` +
            `&key=${API_KEY}` +
            `&fields=files(id,name)`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Ошибка получения папок:', errorText);
            throw new Error(`HTTP error! status: ${response.status}\nDetails: ${errorText}`);
        }

        const data = await response.json();
        return data.files || [];
    } catch (error) {
        console.error('Error fetching folders from Google Drive:', error);
        return [];
    }
}

// Получение файлов из папки игры
async function getGameFiles(gameName) {
    try {
        // Получаем список папок
        const folders = await getGDriveFolders();
        
        // Ищем папку игры
        const gameFolder = folders.find(folder => folder.name === gameName);
        if (!gameFolder) {
            console.error('Папка не найдена:', gameName);
            return [];
        }

        // Получаем файлы из папки
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?` +
            `q='${gameFolder.id}' in parents` +
            `&key=${API_KEY}` +
            `&fields=files(id,name,size,modifiedTime,mimeType)`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Ошибка получения файлов:', errorText);
            throw new Error(`HTTP error! status: ${response.status}\nDetails: ${errorText}`);
        }

        const data = await response.json();
        return data.files || [];
    } catch (error) {
        console.error('Error fetching game files:', error);
        return [];
    }
}

// Получение файла игры по имени папки
async function getFileByName(gameName) {
    try {
        // Получаем список папок
        const folders = await getGDriveFolders();
        
        // Ищем папку игры
        const gameFolder = folders.find(folder => folder.name === gameName);
        if (!gameFolder) {
            return null;
        }

        // Получаем файлы из папки
        const gameFiles = await getGameFiles(gameName);
        
        // Ищем .jsdos или .zip файл
        const gameFile = gameFiles.find(file => file.name === 'game.jsdos' || file.name.endsWith('.zip'));
        return gameFile;
    } catch (error) {
        return null;
    }
}

// Получение прямой ссылки на скачивание файла
function getDownloadLink(fileId) {
    return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${API_KEY}`;
}

// Получение списка игр
async function getGamesList() {
    try {
        const folders = await getGDriveFolders();
        return folders.map(folder => folder.name);
    } catch (error) {
        console.error('Error getting games list:', error);
        return [];
    }
}

// Экспортируем функции
window.gdrive = {
    getGamesList,
    getFileByName,
    getDownloadLink,
    getGameFiles
}; 