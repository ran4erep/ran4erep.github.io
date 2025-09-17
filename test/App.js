import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import MainMenu from './components/MainMenu';
import Game from './components/Game';
import { generateDungeon } from './hooks/useDungeonGenerator';
const LoadingScreen = ({ progress, message }) => {
    return (_jsx("div", { className: "flex flex-col items-center justify-center h-full text-white bg-gray-900", children: _jsxs("div", { className: "w-1/2 max-w-lg mb-4", children: [_jsx("h1", { className: "text-3xl font-bold mb-4 text-center", children: "\u0413\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u044F \u043F\u043E\u0434\u0437\u0435\u043C\u0435\u043B\u044C\u044F..." }), _jsx("div", { className: "w-full bg-gray-700 rounded-full h-8 border-2 border-gray-600", children: _jsxs("div", { className: "bg-blue-600 h-full rounded-full text-center text-white flex items-center justify-center transition-all duration-300 ease-linear", style: { width: `${progress}%` }, children: [Math.round(progress), "%"] }) }), _jsx("p", { className: "text-center mt-4 text-lg text-gray-400", children: message })] }) }));
};
const App = () => {
    const [gameState, setGameState] = useState('menu');
    const [gameId, setGameId] = useState(1);
    const [dungeonData, setDungeonData] = useState(null);
    const [loadingProgress, setLoadingProgress] = useState({ progress: 0, message: '' });
    const startGame = useCallback(async () => {
        setGameState('loading');
        setLoadingProgress({ progress: 0, message: 'Начало генерации...' });
        const generator = generateDungeon();
        for await (const update of generator) {
            setLoadingProgress({ progress: update.progress, message: update.message });
            if (update.result) {
                setDungeonData(update.result);
                setGameState('playing');
            }
        }
    }, []);
    const endGame = useCallback(() => {
        setGameState('gameOver');
    }, []);
    const restartGame = useCallback(() => {
        setGameId(prevId => prevId + 1);
        startGame();
    }, [startGame]);
    const backToMenu = useCallback(() => {
        setGameId(prevId => prevId + 1);
        setDungeonData(null);
        setGameState('menu');
    }, []);
    const renderContent = () => {
        switch (gameState) {
            case 'loading':
                return _jsx(LoadingScreen, { progress: loadingProgress.progress, message: loadingProgress.message });
            case 'playing':
                if (!dungeonData)
                    return null; // Should not happen in normal flow
                return _jsx(Game, { onGameOver: endGame, dungeonData: dungeonData }, gameId);
            case 'gameOver':
                return (_jsxs("div", { className: "flex flex-col items-center justify-center h-full text-white text-center", children: [_jsx("h1", { className: "text-5xl font-bold mb-4 text-red-500 leading-relaxed", children: "\u0418\u0433\u0440\u0430 \u043E\u043A\u043E\u043D\u0447\u0435\u043D\u0430" }), _jsx("p", { className: "text-lg mb-8", children: "\u0412\u044B \u0431\u044B\u043B\u0438 \u043F\u043E\u0432\u0435\u0440\u0436\u0435\u043D\u044B." }), _jsxs("div", { className: "space-x-4", children: [_jsx("button", { onClick: restartGame, className: "px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold transition-transform transform hover:scale-105", children: "\u041F\u043E\u043F\u0440\u043E\u0431\u043E\u0432\u0430\u0442\u044C \u0441\u043D\u043E\u0432\u0430" }), _jsx("button", { onClick: backToMenu, className: "px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-lg font-semibold transition-transform transform hover:scale-105", children: "\u0413\u043B\u0430\u0432\u043D\u043E\u0435 \u043C\u0435\u043D\u044E" })] })] }));
            case 'menu':
            default:
                return _jsx(MainMenu, { onStartGame: startGame });
        }
    };
    return (_jsx("div", { className: "bg-gray-900 h-screen w-screen flex flex-col", children: _jsx("div", { className: "flex-grow min-h-0", children: renderContent() }) }));
};
export default App;
