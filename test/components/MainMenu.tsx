import React from 'react';

interface MainMenuProps {
  onStartGame: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-white text-center">
      <div className="bg-gray-800 p-10 rounded-xl shadow-2xl border border-gray-700">
        <h1 className="text-6xl font-bold mb-2 text-blue-400 tracking-wider" style={{ fontFamily: '"Courier New", Courier, monospace' }}>
          React Roguelike
        </h1>
        <p className="text-xl text-gray-400 mb-10">A Dungeon Crawler Adventure</p>
        <button
          onClick={onStartGame}
          className="px-10 py-5 bg-blue-600 hover:bg-blue-700 rounded-lg text-2xl font-semibold transition-transform transform hover:scale-105 shadow-lg"
        >
          Start New Game
        </button>
      </div>
    </div>
  );
};

export default MainMenu;
