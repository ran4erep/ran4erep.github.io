import React, { useState, useCallback } from 'react';
import MainMenu from './components/MainMenu';
import Game from './components/Game';

type GameState = 'menu' | 'playing' | 'gameOver';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [gameId, setGameId] = useState(1); // Used to force remount of Game component

  const startGame = useCallback(() => {
    setGameState('playing');
  }, []);

  const endGame = useCallback(() => {
    setGameState('gameOver');
  }, []);

  const restartGame = useCallback(() => {
    setGameId(prevId => prevId + 1);
    setGameState('playing');
  }, []);

  const backToMenu = useCallback(() => {
    setGameId(prevId => prevId + 1);
    setGameState('menu');
  }, []);

  const renderContent = () => {
    switch (gameState) {
      case 'playing':
        return <Game key={gameId} onGameOver={endGame} />;
      case 'gameOver':
        return (
          <div className="flex flex-col items-center justify-center h-screen text-white">
            <h1 className="text-6xl font-bold mb-4 text-red-500">Game Over</h1>
            <p className="text-xl mb-8">You have been vanquished.</p>
            <div className="space-x-4">
              <button
                onClick={restartGame}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-xl font-semibold transition-transform transform hover:scale-105"
              >
                Try Again
              </button>
              <button
                onClick={backToMenu}
                className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-xl font-semibold transition-transform transform hover:scale-105"
              >
                Main Menu
              </button>
            </div>
          </div>
        );
      case 'menu':
      default:
        return <MainMenu onStartGame={startGame} />;
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen font-sans">
      {renderContent()}
    </div>
  );
};

export default App;
