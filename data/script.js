
 // Глобальные переменные
const wrapper = document.querySelector('.cards-wrapper');
const container = document.querySelector('.cards');
const images = document.querySelectorAll('.cards li img');
const listItems = document.querySelectorAll('.cards li');
const navigation = document.querySelector('.navigation');

let isDragging = false;
let startX;
let scrollLeft;
let albumData = [];

// Загрузка данных
async function loadAlbumData() {
    try {
        const response = await fetch('data/albums.json');
        const data = await response.json();
        return data.posts;
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        return getFallbackData();
    }
}

// Резервные данные
function getFallbackData() {
    return [
        {
            title: "Данные загружаются...",
            artist: "Пожалуйста, подождите",
            description: "Информация скоро появится",
            image: "images/post1.jfif"
        }
    ];
}

// Инициализация при загрузке страницы
async function initializePage() {
    albumData = await loadAlbumData();
    updateNavigation();
    initEventListeners();
    updateTransforms();
}

// Обновление навигационных кнопок
let currentNavPage = 0;
const buttonsPerPage = 3;

function updateNavigation() {
    const navButtons = document.getElementById('navButtons');
    navButtons.innerHTML = '';
    
    const start = currentNavPage * buttonsPerPage;
    const end = start + buttonsPerPage;
    
    for (let i = start; i < end && i < albumData.length; i++) {
        const button = document.createElement('button');
        button.className = 'nav-btn';
        button.textContent = i + 1;
        button.onclick = () => scrollToCard(i);
        navButtons.appendChild(button);
    }
}

function scrollNav(direction) {
    const totalPages = Math.ceil(albumData.length / buttonsPerPage);
    currentNavPage = (currentNavPage + direction + totalPages) % totalPages;
    updateNavigation();
}
// Инициализация всех обработчиков событий
function initEventListeners() {
    // Drag events
    wrapper.addEventListener('mousedown', startDrag);
    wrapper.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('mousemove', duringDrag);
    document.addEventListener('touchmove', duringDrag, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
    wrapper.addEventListener('dragstart', (e) => e.preventDefault());

    // Scroll events
    container.addEventListener('scroll', updateTransforms);
    window.addEventListener('resize', updateTransforms);

    // Click events for cards
    listItems.forEach((li, index) => {
        li.addEventListener('click', () => {
            if (!isDragging) {
                openModal(index);
            }
        });
    });

    // Touch events for mobile
    initTouchEvents();
}

// Функции для перетаскивания
function startDrag(e) {
    isDragging = true;
    startX = e.pageX || e.touches[0].pageX;
    scrollLeft = container.scrollLeft;
    e.preventDefault();
}

function duringDrag(e) {
    if (!isDragging) return;
    const x = e.pageX || (e.touches && e.touches[0].pageX);
    const walk = (x - startX) * 1.5;
    container.scrollLeft = scrollLeft - walk;
}

function endDrag() {
    isDragging = false;
}

// Прокрутка к конкретной карточке
function scrollToCard(cardIndex) {
    if (cardIndex < 0 || cardIndex >= listItems.length) return;
    
    const li = listItems[cardIndex];
    const liCenter = li.offsetLeft + li.offsetWidth / 2;
    const containerCenter = container.clientWidth / 2;
    const targetScroll = liCenter - containerCenter;
    
    container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
    });
}

// Обновление 3D трансформаций
function updateTransforms() {
    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    let activeCardIndex = -1;
    let minDistance = Infinity;
    
    images.forEach((img, index) => {
        const li = img.parentElement;
        const imgCenter = li.offsetLeft + li.offsetWidth / 2;
        const distanceFromCenter = Math.abs(containerCenter - imgCenter);
        
        if (distanceFromCenter < minDistance) {
            minDistance = distanceFromCenter;
            activeCardIndex = index;
        }
        
        const normalizedDistance = (containerCenter - imgCenter) / (container.clientWidth / 2);
        const rotation = normalizedDistance * 25;
        const scale = 1 - Math.abs(normalizedDistance) * 0.2;
        const translateZ = Math.abs(normalizedDistance) * 20;
        
        img.style.transform = `rotateY(${rotation}deg) scale(${scale}) translateZ(${translateZ}px)`;
        
        li.classList.remove('active');
        
        if (Math.abs(normalizedDistance) < 0.1) {
            img.style.boxShadow = '0 15px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.2)';
        } else {
            img.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)';
        }
    });
    
    if (activeCardIndex !== -1) {
        listItems[activeCardIndex].classList.add('active');
    }
}

// Модальное окно
async function openModal(albumIndex) {
    const modal = document.getElementById('albumModal');
    
    if (albumData.length === 0) {
        albumData = await loadAlbumData();
    }
    
    const album = albumData[albumIndex];
    
    if (album) {
        document.getElementById('modalImage').src = album.image || document.querySelectorAll('.cards li img')[albumIndex].src;
        document.getElementById('modalTitle').textContent = album.title;
        document.getElementById('modalArtist').textContent = album.artist;
        document.getElementById('modalDescription').innerHTML = album.description;
        
        modal.style.display = 'flex';
    }
}

function closeModal() {
    document.getElementById('albumModal').style.display = 'none';
}

// Touch events для мобильных
function initTouchEvents() {
    let touchStartX = 0;
    let touchStartTime = 0;
    let isTap = false;

    wrapper.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
        touchStartTime = Date.now();
        isTap = true;
    });

    wrapper.addEventListener('touchmove', function(e) {
        const touchMoveX = e.touches[0].clientX;
        if (Math.abs(touchMoveX - touchStartX) > 10) {
            isTap = false;
        }
    });

    wrapper.addEventListener('touchend', function(e) {
        const touchEndTime = Date.now();
        const isQuickTap = (touchEndTime - touchStartTime) < 300;
        
        if (isTap && isQuickTap) {
            const activeCard = document.querySelector('.cards li.active');
            if (activeCard) {
                const index = Array.from(listItems).indexOf(activeCard);
                openModal(index);
            }
        }
    });
}

// Авто-скролл для мобильных
let scrollTimeout;
container.addEventListener('scroll', function() {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function() {
        const containerCenter = container.scrollLeft + container.clientWidth / 2;
        let closestCardIndex = 0;
        let minDistance = Infinity;
        
        listItems.forEach((li, index) => {
            const liCenter = li.offsetLeft + li.offsetWidth / 2;
            const distance = Math.abs(containerCenter - liCenter);
            if (distance < minDistance) {
                minDistance = distance;
                closestCardIndex = index;
            }
        });
        
        scrollToCard(closestCardIndex);
    }, 100);
});

// Музыкальный плеер
const backgroundMusic = document.getElementById('backgroundMusic');
const musicBtn = document.querySelector('.music-btn');

function toggleMusic() {
    if (backgroundMusic.paused) {
        backgroundMusic.play();
        musicBtn.classList.add('playing');
        musicBtn.innerHTML = '♫';
    } else {
        backgroundMusic.pause();
        musicBtn.classList.remove('playing');
        musicBtn.innerHTML = "🔇";
    }
}

// Автозапуск музыки
document.addEventListener('click', function() {
    if (backgroundMusic.paused) {
        backgroundMusic.play().then(() => {
            musicBtn.classList.add('playing');
            musicBtn.innerHTML = '♫';
        }).catch(error => {
            console.log('Автозапуск музыки заблокирован браузером');
        });
    }
}, { once: true });

function initStaticBackground() {
    const bgSlides = document.querySelectorAll('.bg-slide');
    const totalSlides = bgSlides.length;
    
    function updateBackground() {
        const scrollLeft = container.scrollLeft;
        const maxScroll = container.scrollWidth - container.clientWidth;
        const scrollProgress = maxScroll > 0 ? scrollLeft / maxScroll : 0;
        
        // Определяем активный слайд на основе прогресса прокрутки
        const activeSlideIndex = Math.floor(scrollProgress * totalSlides);
        
        bgSlides.forEach((slide, index) => {
            if (index === activeSlideIndex) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });
    }
    
    container.addEventListener("scroll", updateBackground);
    window.addEventListener("resize", updateBackground);
    updateBackground();
}

document.addEventListener("DOMContentLoaded", function() {
    initializePage();
   initStaticBackground();
});


document.getElementById('albumModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});


document.addEventListener('touchstart', function(e) {
    if (e.target.closest('.cards-wrapper')) {
        e.stopPropagation();
    }
}, { passive: true });

function toggleRightsSection() {
    const modal = document.getElementById('albumModal');
    const rightsModal = document.getElementById('rightsModal');
    

    if (modal.style.display === 'flex') {
        modal.style.display = 'none';
    }
    
    if (rightsModal.style.display === 'flex') {
        rightsModal.style.display = 'none';
    } else {
        rightsModal.style.display = 'flex';
    }
}
