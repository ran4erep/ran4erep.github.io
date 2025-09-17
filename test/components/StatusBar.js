import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const StatusBar = ({ playerHealth, maxHealth }) => {
    const healthPercentage = Math.max(0, (playerHealth / maxHealth) * 100);
    const getHealthColor = () => {
        if (healthPercentage > 60)
            return 'bg-green-500';
        if (healthPercentage > 30)
            return 'bg-yellow-500';
        return 'bg-red-600';
    };
    return (_jsxs("header", { className: "w-full bg-gray-800 p-2 border-b-2 border-gray-600 shadow-lg flex items-center space-x-4 flex-shrink-0", children: [_jsx("div", { className: "font-bold text-base text-gray-300", children: "HP:" }), _jsx("div", { className: "w-48 h-6 bg-gray-900 rounded overflow-hidden border border-gray-600", children: _jsx("div", { className: `h-full ${getHealthColor()} transition-all duration-300 ease-out`, style: { width: `${healthPercentage}%` } }) }), _jsxs("div", { className: "text-base text-gray-200", children: [Math.max(0, playerHealth), "/", maxHealth] })] }));
};
export default StatusBar;
