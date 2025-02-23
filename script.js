document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

document.addEventListener('mousemove', (e) => {
    const orbs = document.querySelectorAll('.orb');
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;

    orbs.forEach(orb => {
        const speed = 30;
        const x = (mouseX * speed);
        const y = (mouseY * speed);
        orb.style.transform = `translate(${x}px, ${y}px)`;
    });
});

const cards = document.querySelectorAll('.glass-card');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, {
    threshold: 0.1
});

cards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(card);
});

document.getElementById('sidebar-toggle').addEventListener('click', () => {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('hidden');
});

const sidebar = document.querySelector('.sidebar');
let scrollTimeout;

sidebar.addEventListener('wheel', (e) => {
    if (!sidebar.classList.contains('visible')) return;
    
    const maxScroll = sidebar.scrollHeight - sidebar.clientHeight;
    const currentScroll = sidebar.scrollTop;
    
    if ((e.deltaY > 0 && currentScroll < maxScroll) || 
        (e.deltaY < 0 && currentScroll > 0) ||
        (Math.abs(e.deltaY) < Math.abs(e.deltaX))) {
        e.stopPropagation();
        
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            sidebar.style.scrollBehavior = 'auto';
        }, 150);
    }
});

class Gallery {
    constructor() {
        this.currentImageIndex = 0;
        this.images = [];
        this.currentPosition = 0;
        this.itemWidth = 316;
        
        this.grid = document.getElementById('gallery-grid');
        this.prevButton = document.getElementById('gallery-prev');
        this.nextButton = document.getElementById('gallery-next');
        this.viewport = document.querySelector('.gallery-viewport');
        
        this.bindEvents();
    }
    
    bindEvents() {
        this.prevButton?.addEventListener('click', () => this.showPrevPage());
        this.nextButton?.addEventListener('click', () => this.showNextPage());
        window.addEventListener('resize', () => this.updateNavigation());
        
        document.addEventListener('keydown', (e) => {
            const chatModal = document.getElementById('chat-modal');
            if (chatModal && !chatModal.classList.contains('hidden')) {
                return;
            }
            
            if (e.key === 'Escape') gallery.hideImage();
            if (e.key === 'ArrowLeft') gallery.showPreviousImage();
            if (e.key === 'ArrowRight') gallery.showNextImage();
        });
    }
    
    async load() {
        try {
            const response = await fetch('/gallery/gallery.json'); // Загружаем JSON
            if (!response.ok) throw new Error('Failed to load gallery data');
            
            this.images = await response.json(); // Получаем список файлов
    
            this.render();
            this.updateNavigation();
        } catch (error) {
            console.error('Error loading gallery:', error);
        }
    }
    
    
    render() {
        if (!this.grid) return;
        
        this.grid.innerHTML = '';
        
        this.images.forEach((filename, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            
            const img = document.createElement('img');
            img.src = `gallery/${filename}`;
            img.alt = filename;
            img.loading = 'lazy';
            
            item.addEventListener('click', () => this.showImage(filename, index));
            item.appendChild(img);
            this.grid.appendChild(item);
        });
    }
    
    updateNavigation() {
        if (!this.grid || !this.viewport) return;
        
        const totalWidth = this.grid.scrollWidth;
        const viewportWidth = this.viewport.clientWidth;
        const maxScroll = totalWidth - viewportWidth;
        
        this.prevButton?.classList.toggle('hidden', this.currentPosition <= 0);
        this.nextButton?.classList.toggle('hidden', this.currentPosition >= maxScroll);
    }
    
    showPrevPage() {
        if (!this.viewport || !this.grid) return;
        
        const visibleItems = Math.floor(this.viewport.clientWidth / this.itemWidth);
        const scrollAmount = visibleItems * this.itemWidth;
        
        this.currentPosition = Math.max(0, this.currentPosition - scrollAmount);
        this.grid.style.transform = `translateX(-${this.currentPosition}px)`;
        this.updateNavigation();
    }
    
    showNextPage() {
        if (!this.viewport || !this.grid) return;
        
        const visibleItems = Math.floor(this.viewport.clientWidth / this.itemWidth);
        const scrollAmount = visibleItems * this.itemWidth;
        const maxScroll = this.grid.scrollWidth - this.viewport.clientWidth;
        
        this.currentPosition = Math.min(maxScroll, this.currentPosition + scrollAmount);
        this.grid.style.transform = `translateX(-${this.currentPosition}px)`;
        this.updateNavigation();
    }
    
    showImage(filename, index) {
        const viewer = document.getElementById('image-viewer');
        const img = document.getElementById('viewer-image');
        if (!viewer || !img) return;
        
        viewer.classList.remove('hidden');
        this.currentImageIndex = index;
        
        document.body.style.overflow = 'hidden';
        
        img.classList.remove('show', 'fade-out', 'slide-left', 'slide-right');
        img.src = `gallery/${filename}`;
        
        void img.offsetWidth;
        img.classList.add('show');
        
        this.updateImageNavigation();
    }
    
    hideImage() {
        const viewer = document.getElementById('image-viewer');
        const img = document.getElementById('viewer-image');
        if (!viewer || !img) return;
        
        img.classList.remove('show');
        img.classList.add('fade-out');
        
        setTimeout(() => {
            viewer.classList.add('hidden');
            img.classList.remove('fade-out');
            document.body.style.overflow = '';
        }, 300);
    }
    
    showNextImage() {
        if (this.currentImageIndex >= this.images.length - 1) return;
        
        const img = document.getElementById('viewer-image');
        if (!img) return;
        
        img.classList.remove('show');
        img.classList.add('slide-left');
        
        setTimeout(() => {
            this.showImage(this.images[this.currentImageIndex + 1], this.currentImageIndex + 1);
        }, 300);
    }
    
    showPreviousImage() {
        if (this.currentImageIndex <= 0) return;
        
        const img = document.getElementById('viewer-image');
        if (!img) return;
        
        img.classList.remove('show');
        img.classList.add('slide-right');
        
        setTimeout(() => {
            this.showImage(this.images[this.currentImageIndex - 1], this.currentImageIndex - 1);
        }, 300);
    }
    
    updateImageNavigation() {
        const prevButton = document.getElementById('viewer-prev');
        const nextButton = document.getElementById('viewer-next');
        if (!prevButton || !nextButton) return;
        
        prevButton.classList.toggle('hidden', this.currentImageIndex <= 0);
        nextButton.classList.toggle('hidden', this.currentImageIndex >= this.images.length - 1);
    }
}

let gallery;

document.addEventListener('DOMContentLoaded', () => {
    gallery = new Gallery();
    gallery.load();

    const viewer = document.getElementById('image-viewer');
    const closeBtn = viewer.querySelector('#viewer-close');
    const prevBtn = viewer.querySelector('#viewer-prev');
    const nextBtn = viewer.querySelector('#viewer-next');

    closeBtn.addEventListener('click', () => gallery.hideImage());
    prevBtn.addEventListener('click', () => gallery.showPreviousImage());
    nextBtn.addEventListener('click', () => gallery.showNextImage());

    const faviconFrames = [
        'favicon1.ico',
        'favicon2.ico',
        'favicon3.ico',
        'favicon4.ico'
    ];
    
    const faviconAnimator = new FaviconAnimator(faviconFrames, 80);
    faviconAnimator.start();

    initializeProjectLanguages();
});

let translations = {};

async function loadTranslations() {
    try {
        const response = await fetch('language.json');
        translations = await response.json();
    } catch (error) {
        console.error('Error loading translations:', error);
    }
}

function translatePage(toEnglish) {
    const currentLang = toEnglish ? 'en' : 'ru';
    
    document.querySelector('.ru-btn').classList.toggle('active', !toEnglish);
    document.querySelector('.us-btn').classList.toggle('active', toEnglish);

    document.querySelectorAll('[data-lang-id]').forEach(element => {
        const key = element.getAttribute('data-lang-id');
        if (translations[key]) {
            if (element.tagName.toLowerCase() === 'input') {
                element.placeholder = translations[key][currentLang];
            } else {
                element.textContent = translations[key][currentLang];
            }
        }
    });

    localStorage.setItem('language', currentLang);
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadTranslations();
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage === 'en') {
        translatePage(true);
    }
});

const ruBtn = document.querySelector('.ru-btn');
const usBtn = document.querySelector('.us-btn');

ruBtn.addEventListener('click', () => translatePage(false));
usBtn.addEventListener('click', () => translatePage(true));

class MusicPlayer {
    constructor() {
        this.audio = document.getElementById('audio-player');
        this.playBtn = document.getElementById('play-btn');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.currentTimeEl = document.getElementById('current-time');
        this.totalTimeEl = document.getElementById('total-time');
        this.currentTrackEl = document.querySelector('.current-track');
        this.progressBar = document.querySelector('.progress-bar');
        this.progress = document.querySelector('.progress');

        this.playlist = [];
        this.currentTrack = -1;
        this.isPlaying = false;
        this.isLooping = true;

        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.playPrev());
        this.nextBtn.addEventListener('click', () => this.playNext());
        
        if (this.progressBar) {
            this.progressBar.addEventListener('click', (e) => this.seek(e));
        }
        
        this.audio.addEventListener('timeupdate', () => {
            this.updateTime();
            this.updateProgress();
        });
        this.audio.addEventListener('ended', () => {
            if (this.currentTrack < this.playlist.length - 1) {
                this.setTrack(this.currentTrack + 1);
                this.audio.play().catch(e => {
                    console.error('Error playing track:', e);
                    this.currentTrackEl.textContent = 'Ошибка воспроизведения';
                });
                this.updatePlayButton(true);
            } else if (this.isLooping) {
                this.setTrack(0);
                this.audio.play().catch(e => {
                    console.error('Error playing track:', e);
                    this.currentTrackEl.textContent = 'Ошибка воспроизведения';
                });
                this.updatePlayButton(true);
            }
        });
        this.audio.addEventListener('loadedmetadata', () => {
            this.totalTimeEl.textContent = this.formatTime(this.audio.duration);
        });
        this.audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.currentTrackEl.textContent = 'Ошибка воспроизведения';
        });
    
        this.loadPlaylist();
    }

    async loadPlaylist() {
        try {
            const response = await fetch('music/playlist.json');
            if (!response.ok) throw new Error('Failed to load playlist');
            
            const data = await response.json();
            this.playlist = data.tracks;
            
            if (this.playlist && this.playlist.length > 0) {
                const visualizerContainer = document.querySelector('.visualizer-container');
                visualizerContainer.classList.add('paused');
                this.currentTrack = 0;
                this.updateTrackDisplay();
                this.audio.src = this.playlist[0].path;
            } else {
                console.error('Playlist is empty');
            }
        } catch (error) {
            console.error('Error loading playlist:', error);
            this.currentTrackEl.textContent = 'Ошибка загрузки плейлиста';
        }
    }

    setTrack(index) {
        if (!this.playlist || this.playlist.length === 0) return;
        
        if (index < 0) index = this.isLooping ? this.playlist.length - 1 : 0;
        if (index >= this.playlist.length) index = this.isLooping ? 0 : this.playlist.length - 1;

        const visualizerContainer = document.querySelector('.visualizer-container');
        const wasPaused = this.audio.paused;
        const isFirstTrack = this.currentTrack === -1;
        
        this.currentTrack = index;
        const track = this.playlist[index];
        
        this.audio.src = track.path;
        this.updateTrackDisplay();
        
        if (isFirstTrack || wasPaused) {
            this.audio.pause();
            this.updatePlayButton(false);
        } else {
            this.audio.play().catch(e => {
                console.error('Error playing track:', e);
                this.currentTrackEl.textContent = 'Ошибка воспроизведения';
            });
            this.updatePlayButton(true);
        }
    }

    updateTrackDisplay() {
        if (this.currentTrack >= 0 && this.playlist.length > 0) {
            const track = this.playlist[this.currentTrack];
            this.currentTrackEl.innerHTML = `<span>${track.artist} - ${track.title}</span>`;
            
            const textSpan = this.currentTrackEl.querySelector('span');
            const containerWidth = this.currentTrackEl.clientWidth;
            const textWidth = textSpan.scrollWidth;
            
            if (textWidth > containerWidth + 10) {
                this.currentTrackEl.classList.add('scroll-needed');
                const scrollWidth = textWidth - containerWidth;
                this.currentTrackEl.style.setProperty('--scroll-width', `${-scrollWidth}px`);
            } else {
                this.currentTrackEl.classList.remove('scroll-needed');
                this.currentTrackEl.style.removeProperty('--scroll-width');
            }
        } else {
            this.currentTrackEl.innerHTML = '<span>Нет воспроизведения</span>';
            this.currentTrackEl.classList.remove('scroll-needed');
            this.currentTrackEl.style.removeProperty('--scroll-width');
        }
    }

    updatePlayButton(isPlaying) {
        if (isPlaying) {
            this.playBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
                <span data-lang-id="pause_tooltip" class="tooltip">Пауза</span>
            `;
            document.querySelector('.visualizer-container').classList.remove('paused');
        } else {
            this.playBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M8 5v14l11-7z"/>
                </svg>
                <span data-lang-id="play_tooltip" class="tooltip">Воспроизвести</span>
            `;
            document.querySelector('.visualizer-container').classList.add('paused');
        }

        const currentLang = localStorage.getItem('language') === 'en' ? 'en' : 'ru';
        translatePage(currentLang === 'en');
    }

    togglePlay() {
        if (this.audio.paused) {
            this.audio.play();
            this.updatePlayButton(true);
        } else {
            this.audio.pause();
            this.updatePlayButton(false);
        }
    }

    playNext() {
        const wasPaused = this.audio.paused;
        if (this.currentTrack < this.playlist.length - 1) {
            this.setTrack(this.currentTrack + 1);
            if (!wasPaused) {
                this.audio.play().catch(e => {
                    console.error('Error playing next track:', e);
                    this.currentTrackEl.textContent = 'Ошибка воспроизведения';
                });
                this.updatePlayButton(true);
            }
        } else if (this.isLooping) {
            this.setTrack(0);
            if (!wasPaused) {
                this.audio.play().catch(e => {
                    console.error('Error playing first track:', e);
                    this.currentTrackEl.textContent = 'Ошибка воспроизведения';
                });
                this.updatePlayButton(true);
            }
        }
    }

    playPrev() {
        const wasPaused = this.audio.paused;
        if (this.currentTrack > 0) {
            this.setTrack(this.currentTrack - 1);
            if (!wasPaused) {
                this.audio.play().catch(e => {
                    console.error('Error playing previous track:', e);
                    this.currentTrackEl.textContent = 'Ошибка воспроизведения';
                });
                this.updatePlayButton(true);
            }
        } else if (this.isLooping) {
            this.setTrack(this.playlist.length - 1);
            if (!wasPaused) {
                this.audio.play().catch(e => {
                    console.error('Error playing last track:', e);
                    this.currentTrackEl.textContent = 'Ошибка воспроизведения';
                });
                this.updatePlayButton(true);
            }
        }
    }

    formatTime(seconds) {
        if (!seconds) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    updateTime() {
        this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
        this.updateProgress();
    }

    updateProgress() {
        if (!this.audio.duration || !this.progress) return;
        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        this.progress.style.width = `${progress}%`;
    }

    seek(event) {
        if (!this.progressBar || !this.audio.duration) return;
        const rect = this.progressBar.getBoundingClientRect();
        const pos = (event.clientX - rect.left) / rect.width;
        this.audio.currentTime = pos * this.audio.duration;
    }
}

const player = new MusicPlayer();

class AudioVisualizer {
    constructor(audio) {
        this.audio = audio;
        this.container = document.querySelector('.visualizer-container');
        this.canvas = document.getElementById('stripes');
        this.ctx = this.canvas.getContext('2d');
        this.isInitialized = false;
        
        this.glowElement = document.createElement('div');
        this.glowElement.className = 'visualizer-glow';
        this.container.appendChild(this.glowElement);
        
        this.colors = [
            [255, 0, 255],
            [0, 255, 255],
            [148, 0, 211],
            [255, 105, 180]
        ];
        
        this.dataArray = new Uint8Array(64);
        this.currentBars = new Float32Array(64);
        
        this.lastBass = 0.5;
        this.lastMid = 0.5;
        this.lastTreble = 0.5;
        
        this.isAnimating = false;
        this.isFading = false;
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.updateGradient(this.lastBass, this.lastMid, this.lastTreble);
    }

    async initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 128;
            
            try {
                this.source = this.audioContext.createMediaElementSource(this.audio);
                this.source.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
                
                this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
                this.currentBars = new Float32Array(this.analyser.frequencyBinCount);
            } catch (error) {
                console.error('Error initializing audio context:', error);
                throw error;
            }
        }
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.offsetWidth;
        this.canvas.height = container.offsetHeight;
    }

    async start() {
        if (!this.isInitialized) {
            await this.initAudioContext();
            this.isInitialized = true;
        }

        this.isAnimating = true;
        this.isFading = false;
        this.animate();
    }

    stop() {
        this.isAnimating = false;
        this.isFading = true;
        this.fadeOut();
    }

    animate() {
        if (!this.isAnimating) return;

        this.analyser.getByteFrequencyData(this.dataArray);
        
        for (let i = 0; i < this.dataArray.length; i++) {
            this.currentBars[i] = this.dataArray[i];
        }
        
        this.lastBass = this.getAverageFrequency(0, 4);
        this.lastMid = this.getAverageFrequency(4, 8);
        this.lastTreble = this.getAverageFrequency(8, 16);
        
        this.updateGradient(this.lastBass, this.lastMid, this.lastTreble);
        this.drawBars();
        
        requestAnimationFrame(() => this.animate());
    }

    fadeOut() {
        if (!this.isFading) return;

        let hasVisibleBars = false;
        
        for (let i = 0; i < this.currentBars.length; i++) {
            if (this.currentBars[i] > 0) {
                this.currentBars[i] = Math.max(0, this.currentBars[i] - 8);
                hasVisibleBars = true;
            }
        }
        
        this.drawBars();
        
        if (hasVisibleBars) {
            requestAnimationFrame(() => this.fadeOut());
        } else {
            this.isFading = false;
        }
    }

    drawBars() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const barWidth = (this.canvas.width / this.currentBars.length) * 2.5;
        
        for (let i = 0; i < this.currentBars.length; i++) {
            const barHeight = (this.currentBars[i] / 255) * this.canvas.height;
            const x = i * barWidth;
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            
            this.ctx.beginPath();
            this.ctx.rect(x, this.canvas.height - barHeight, barWidth - 1, barHeight);
            this.ctx.fill();
        }
    }

    getAverageFrequency(start, end) {
        const values = this.dataArray.slice(start, end);
        const average = values.reduce((a, b) => a + b, 0) / values.length;
        return average / 255;
    }

    updateGradient(bass, mid, treble) {
        const color1 = this.interpolateColor(this.colors[0], this.colors[1], bass);
        const color2 = this.interpolateColor(this.colors[2], this.colors[3], treble);
        
        const gradient = `radial-gradient(circle at ${mid * 100}% ${treble * 100}%, 
            rgba(${color1.join(',')}, ${bass * 0.8}), 
            rgba(${color2.join(',')}, ${treble * 0.8}))`;
            
        this.glowElement.style.background = gradient;
    }

    interpolateColor(color1, color2, factor) {
        return color1.map((c, i) => Math.round(c + (color2[i] - c) * factor));
    }
}

let visualizer = null;

document.addEventListener('DOMContentLoaded', () => {
    visualizer = new AudioVisualizer(player.audio);
});

player.audio.addEventListener('play', () => {
    if (visualizer) {
        visualizer.start();
    }
});

player.audio.addEventListener('pause', () => {
    if (visualizer) visualizer.stop();
});

player.audio.addEventListener('ended', () => {
    if (visualizer) visualizer.stop();
});

class FaviconAnimator {
    constructor(frames, interval = 250) {
        this.frames = frames;
        this.interval = interval;
        this.currentFrame = 0;
        this.link = document.querySelector("link[rel*='icon']") || this.createFaviconLink();
        this.isAnimating = false;
    }

    createFaviconLink() {
        const link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'icon';
        document.head.appendChild(link);
        return link;
    }

    start() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.animate();
    }

    stop() {
        this.isAnimating = false;
    }

    animate() {
        if (!this.isAnimating) return;
        
        this.link.href = this.frames[this.currentFrame];
        this.currentFrame = (this.currentFrame + 1) % this.frames.length;
        
        setTimeout(() => this.animate(), this.interval);
    }
}

const languageIcons = {
    // Языки программирования
    'javascript': 'devicon-javascript-plain',
    'python': 'devicon-python-plain',
    'java': 'devicon-java-plain',
    'cpp': 'devicon-cplusplus-plain',
    'c': 'devicon-c-plain',
    'csharp': 'devicon-csharp-plain',
    'php': 'devicon-php-plain',
    'ruby': 'devicon-ruby-plain',
    'swift': 'devicon-swift-plain',
    'kotlin': 'devicon-kotlin-plain',
    'go': 'devicon-go-plain',
    'rust': 'devicon-rust-plain',
    'typescript': 'devicon-typescript-plain',
    'scala': 'devicon-scala-plain',
    'perl': 'devicon-perl-plain',
    'haskell': 'devicon-haskell-plain',
    'lua': 'devicon-lua-plain',
    'r': 'devicon-r-plain',
    'dart': 'devicon-dart-plain',
    'erlang': 'devicon-erlang-plain',
    'elixir': 'devicon-elixir-plain',
    'clojure': 'devicon-clojure-line',
    'matlab': 'devicon-matlab-plain',

    // Веб-технологии
    'html': 'devicon-html5-plain',
    'css': 'devicon-css3-plain',
    'sass': 'devicon-sass-original',
    'less': 'devicon-less-plain-wordmark',
    'bootstrap': 'devicon-bootstrap-plain',
    'tailwindcss': 'devicon-tailwindcss-plain',
    'jquery': 'devicon-jquery-plain',
    'webpack': 'devicon-webpack-plain',
    'babel': 'devicon-babel-plain',
    'gulp': 'devicon-gulp-plain',
    'grunt': 'devicon-grunt-plain',

    // Фреймворки и библиотеки
    'react': 'devicon-react-original',
    'vue': 'devicon-vuejs-plain',
    'angular': 'devicon-angularjs-plain',
    'backbone': 'devicon-backbonejs-plain',
    'django': 'devicon-django-plain',
    'flask': 'devicon-flask-original',
    'laravel': 'devicon-laravel-plain',
    'spring': 'devicon-spring-plain',
    'rails': 'devicon-rails-plain',
    'express': 'devicon-express-original',
    'nodejs': 'devicon-nodejs-plain',
    'nextjs': 'devicon-nextjs-original',
    'nuxtjs': 'devicon-nuxtjs-plain',
    'svelte': 'devicon-svelte-plain',
    'electron': 'devicon-electron-original',
    'flutter': 'devicon-flutter-plain',
    'ionic': 'devicon-ionic-original',
    'xamarin': 'devicon-xamarin-original',

    // Базы данных
    'mongodb': 'devicon-mongodb-plain',
    'mysql': 'devicon-mysql-plain',
    'postgresql': 'devicon-postgresql-plain',
    'sqlite': 'devicon-sqlite-plain',
    'redis': 'devicon-redis-plain',
    'oracle': 'devicon-oracle-original',
    'cassandra': 'devicon-cassandra-plain',
    'couchdb': 'devicon-couchdb-plain',
    'neo4j': 'devicon-neo4j-plain',

    // Облачные сервисы и DevOps
    'aws': 'devicon-amazonwebservices-original',
    'azure': 'devicon-azure-plain',
    'google': 'devicon-google-plain',
    'firebase': 'devicon-firebase-plain',
    'heroku': 'devicon-heroku-original',
    'digitalocean': 'devicon-digitalocean-plain',
    'docker': 'devicon-docker-plain',
    'kubernetes': 'devicon-kubernetes-plain',
    'nginx': 'devicon-nginx-original',
    'jenkins': 'devicon-jenkins-line',
    'travis': 'devicon-travis-plain',
    'circleci': 'devicon-circleci-plain',

    // Системы контроля версий
    'git': 'devicon-git-plain',
    'github': 'devicon-github-original',
    'gitlab': 'devicon-gitlab-plain',
    'bitbucket': 'devicon-bitbucket-original',

    // Операционные системы
    'linux': 'devicon-linux-plain',
    'ubuntu': 'devicon-ubuntu-plain',
    'debian': 'devicon-debian-plain',
    'centos': 'devicon-centos-plain',
    'redhat': 'devicon-redhat-plain',
    'apple': 'devicon-apple-original',
    'windows': 'devicon-windows8-original',
    'android': 'devicon-android-plain',

    // IDE и текстовые редакторы
    'vscode': 'devicon-vscode-plain',
    'vim': 'devicon-vim-plain',
    'atom': 'devicon-atom-original',
    'intellij': 'devicon-intellij-plain',
    'phpstorm': 'devicon-phpstorm-plain',
    'webstorm': 'devicon-webstorm-plain',
    'pycharm': 'devicon-pycharm-plain',

    // CMS и платформы
    'wordpress': 'devicon-wordpress-plain',
    'drupal': 'devicon-drupal-plain',
    'joomla': 'devicon-joomla-plain',
    'magento': 'devicon-magento-original',
    'shopify': 'devicon-shopify-plain',

    // Инструменты и утилиты
    'npm': 'devicon-npm-original-wordmark',
    'yarn': 'devicon-yarn-plain',
    'bash': 'devicon-bash-plain',
    'ssh': 'devicon-ssh-original',
    'markdown': 'devicon-markdown-original',
    'latex': 'devicon-latex-original',
    'jira': 'devicon-jira-plain',
    'trello': 'devicon-trello-plain',
    'figma': 'devicon-figma-plain',
    'photoshop': 'devicon-photoshop-plain',
    'illustrator': 'devicon-illustrator-plain',
    'xd': 'devicon-xd-plain',
    'sketch': 'devicon-sketch-line',

    // Тестирование
    'jest': 'devicon-jest-plain',
    'mocha': 'devicon-mocha-plain',
    'jasmine': 'devicon-jasmine-plain',
    'selenium': 'devicon-selenium-original',
    
    // Прочее
    'apache': 'devicon-apache-plain',
    'tensorflow': 'devicon-tensorflow-original',
    'pytorch': 'devicon-pytorch-original',
    'pandas': 'devicon-pandas-original',
    'jupyter': 'devicon-jupyter-plain',
    'threejs': 'devicon-threejs-original',
    'unity': 'devicon-unity-original',
    'unreal': 'devicon-unrealengine-original',
    'blender': 'devicon-blender-original',
    'chrome': 'devicon-chrome-plain',
    'codepen': 'devicon-codepen-original',
    'devicon': 'devicon-devicon-plain',
    'godot': 'devicon-godot-plain',
    'msdos': 'devicon-msdos-plain',
    'powershell': 'devicon-powershell-plain',
};

function initializeProjectLanguages() {
    const projects = document.querySelectorAll('.project');
    
    projects.forEach(project => {
        const lang = project.dataset.lang;
        if (lang && languageIcons[lang.toLowerCase()]) {
            const contentWrapper = document.createElement('div');
            contentWrapper.className = 'content-wrapper';
            
            while (project.firstChild) {
                contentWrapper.appendChild(project.firstChild);
            }
            
            const langIcon = document.createElement('div');
            langIcon.className = 'lang-icon';
            langIcon.innerHTML = `<i class="${languageIcons[lang.toLowerCase()]}"></i>`;
            
            project.appendChild(contentWrapper);
            project.appendChild(langIcon);
        }
    });
}