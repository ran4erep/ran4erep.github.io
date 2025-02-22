// Load sidebar
async function loadSidebar() {
    const response = await fetch('sidebar.html');
    const sidebarHtml = await response.text();
    document.getElementById('wrapper').insertAdjacentHTML('afterbegin', sidebarHtml);
    
    // Set active menu item based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const menuItems = document.querySelectorAll('.article-list a');
    menuItems.forEach(item => {
        if (item.getAttribute('data-href') === currentPage) {
            item.classList.add('active');
        }
    });
}

// Sidebar Toggle
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('hidden');
}

// Language Switching
function switchLanguage(lang) {
    const buttons = document.querySelectorAll('.lang-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase() === lang.toLowerCase()) {
            btn.classList.add('active');
        }
    });

    // Here you would typically load the content for the selected language
    // For now, we'll just log the language change
    console.log(`Switching to ${lang}`);
}

// Initialize sidebar state based on screen size
function initializeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (window.innerWidth <= 768) {
        sidebar.classList.add('hidden');
    } else {
        sidebar.classList.remove('hidden');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await loadSidebar();
    initializeSidebar();
    
    // Setup loading overlay for links and images
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
    loadingOverlay.style.display = "none";
}

// Call initializeSidebar when the window is resized
window.addEventListener('resize', initializeSidebar); 