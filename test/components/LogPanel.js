import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect } from 'react';
const LogPanel = ({ messages }) => {
    const logEndRef = useRef(null);
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    return (_jsxs("div", { className: "h-full flex flex-col p-4 text-xs bg-gray-800", children: [_jsx("h2", { className: "text-xl font-bold mb-4 pb-2 border-b border-gray-600 text-gray-300 flex-shrink-0", children: "\u0416\u0443\u0440\u043D\u0430\u043B" }), _jsxs("div", { className: "flex-grow overflow-y-auto pr-2", children: [messages.map((msg, index) => {
                        if (msg.startsWith('$$SEP$$')) {
                            return (_jsx("p", { className: "text-center text-gray-500 my-2", children: msg.substring(7) }, index));
                        }
                        return (_jsxs("p", { className: `mb-1 ${index === messages.length - 1 ? 'text-yellow-300 animate-pulse' : 'text-gray-400'}`, children: ["> ", msg] }, index));
                    }), _jsx("div", { ref: logEndRef })] })] }));
};
export default LogPanel;
