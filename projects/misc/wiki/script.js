// Навигация вики для моста с главной страницей.
// Это те же вкладки, что были в боковом меню (кроме «Вернуться на главную»
// и «Начальная страница» — они на главной не нужны).
const TABLET_WIKI_NAV = [
    { label: 'Сенсорное управление в играх при помощи программы GestureWorks Gameplay', path: '/projects/misc/wiki/gwg.html' },
    { label: 'Сенсорное управление в играх при помощи программы Comfort Keys Pro', path: '/projects/misc/wiki/comfort_keys.html' },
    { label: 'Улучшаем старые игры при помощи DgVoodoo 2', path: '/projects/misc/wiki/dgvoodoo.html' },
    { label: 'Вся площадь экрана в качестве тачпада при помощи программы Touch Mouse Pointer', path: '/projects/misc/wiki/touchmousepointer.html' },
    { label: 'Делаем меню Пуск красивее', path: '/projects/misc/wiki/start_menu.html' },
    { label: 'Увеличиваем количество свободной оперативной памяти при помощи программы MemReduct', path: '/projects/misc/wiki/mem_reduct.html' },
];

// Отправляем навигацию родительской странице (главной),
// чтобы она показывала эти вкладки в своём боковом меню.
function notifyParentNav() {
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'app-nav', items: TABLET_WIKI_NAV }, '*');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    notifyParentNav();

    // Setup loading overlay for external links and images
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadLinks = document.querySelectorAll('.load-link');

    loadLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetHref = this.getAttribute('data-href');
            loadingOverlay.style.display = 'flex';
            window.location.href = targetHref;
        });
    });

    const images = document.getElementsByTagName('img');
    for (const image of images) {
        image.addEventListener('click', function () {
            loadingOverlay.style.display = 'flex';
            const originalImageURL = this.src;
            window.open(originalImageURL, '_blank');
        });
    }
});

// Hide loading overlay when window gets focus
window.onfocus = function () {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = "none";
    }
};
