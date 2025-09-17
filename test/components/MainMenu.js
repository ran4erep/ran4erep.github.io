import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MAIN_MENU_BACKGROUND_BASE64 } from '../assets/ui';
const MainMenu = ({ onStartGame }) => {
    const menuStyle = {
        backgroundImage: `url(${MAIN_MENU_BACKGROUND_BASE64})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
    };
    return (_jsx("div", { className: "flex flex-col items-center justify-end h-full text-white text-center pb-[15%]", style: menuStyle, children: _jsxs("div", { className: "flex flex-col items-center space-y-4", children: [_jsx("button", { onClick: onStartGame, className: "px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-xl font-semibold transition-transform transform hover:scale-105 shadow-lg", children: "\u041D\u0430\u0447\u0430\u0442\u044C \u043D\u043E\u0432\u0443\u044E \u0438\u0433\u0440\u0443" }), _jsx("button", { className: "px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-xl font-semibold transition-transform transform hover:scale-105 shadow-lg cursor-not-allowed opacity-75", disabled: true, children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438" })] }) }));
};
export default MainMenu;
