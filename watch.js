// Current language (sub/dub)
let currentLanguage = 'sub';

// DOM Elements
const iframe = document.getElementById('iframe-embed');
const playerAnimeTitle = document.getElementById('playerAnimeTitle');
const episodesGrid = document.getElementById('episodesGrid');
const subBtn = document.getElementById('subBtn');
const dubBtn = document.getElementById('dubBtn');
const closePlayer = document.getElementById('closePlayer');
const episodeTitle = document.getElementById('episodeTitle');
const episodeDescription = document.getElementById('episodeDescription');
const recommendationsGrid = document.getElementById('recommendationsGrid');
const fullscreenLoader = document.getElementById('fullscreenLoader');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const animeId = urlParams.get('id');
    const animeTitle = urlParams.get('title');

    if (animeId && animeTitle) {
        playerAnimeTitle.textContent = decodeURIComponent(animeTitle);
        showLoadingMessage('Loading anime details...');
        fetchEpisodes(animeId, decodeURIComponent(animeTitle));
        loadRecommendations(animeId);
    } else {
        window.location.href = 'index.html';
    }
});

// Show loader
function showLoadingMessage(message) {
    fullscreenLoader.innerHTML = `
        <div class="loading-content">
            <i class="fas fa-spinner fa-pulse"></i>
            <p>${message}</p>
        </div>
    `;
    fullscreenLoader.style.display = 'flex';
}

// Hide loader
function hideLoader() {
    fullscreenLoader.style.display = 'none';
}

// Close player button
if (closePlayer) {
    closePlayer.addEventListener('click', () => {
        window.history.back();
    });
}

// Switch Sub/Dub
function switchLanguage(lang) {
    currentLanguage = lang;
    subBtn.classList.toggle('active', lang === 'sub');
    dubBtn.classList.toggle('active', lang === 'dub');

    const activeEpisode = document.querySelector('.episode-card.active');
    if (activeEpisode) {
        showLoadingMessage('Switching language...');
        activeEpisode.click();
    }
}

// Fetch episodes from Aniwatch AJAX
async function fetchEpisodes(animeId, animeName) {
    showLoadingMessage('Loading episodes list...');
    episodesGrid.innerHTML = '';

    try {
        const encodedUrl = encodeURIComponent(`https://aniwatchtv.to/ajax/v2/episode/list/${animeId}`);
        const apiUrl = `https://proxy-api-kyot.onrender.com/proxy?url=${encodedUrl}`;

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Network response was not ok');

        const json = await response.json();
        const html = json.html;
        const doc = new DOMParser().parseFromString(html, 'text/html');

        const eps = [...doc.querySelectorAll('.ssl-item.ep-item')].map(el => {
            const number = el.getAttribute('data-number').replace(/[^0-9]/g, '');
            const id = el.getAttribute('data-id').replace(/[^0-9]/g, '');
            const titleDiv = el.querySelector('.ep-name.e-dynamic-name');
            const title = titleDiv ? (titleDiv.getAttribute('title') || titleDiv.textContent.trim()) : `Episode ${number}`;
            return { number, id, title };
        });

        if (!eps.length) throw new Error('No episodes found');

        // Render episodes
        episodesGrid.innerHTML = '';
        eps.forEach(ep => {
            const card = document.createElement('div');
            card.className = 'episode-card';
            card.textContent = ep.number;
            card.onclick = () => loadEpisode(animeId, animeName, ep.id, card, ep.title, ep.number);
            episodesGrid.appendChild(card);
        });

        // Auto-load first episode
        if (eps.length > 0) {
            const firstEpisode = eps[0];
            document.querySelector('.episode-card')?.classList.add('active');
            loadEpisode(animeId, animeName, firstEpisode.id, null, firstEpisode.title, firstEpisode.number);
        }
    } catch (error) {
        console.error('Failed to load episodes:', error);
        showErrorMessage('Failed to load episodes. Please try again.');
        episodesGrid.innerHTML = '<p class="error-message">Error loading episodes. Try refreshing the page.</p>';
    }
}

// Load episode in iframe
function loadEpisode(animeId, animeName, episodeId, cardElement = null, epTitle = '', epNumber = '') {
    if (cardElement) {
        document.querySelectorAll('.episode-card').forEach(c => c.classList.remove('active'));
        cardElement.classList.add('active');
    }

    showLoadingMessage('Loading video player...');
    iframe.style.display = 'none';

    // Format: Episode 1 - Title
    const formattedTitle = epNumber ? `Episode ${epNumber} - ${epTitle}` : (epTitle || `Episode ${episodeId}`);
    episodeTitle.textContent = formattedTitle;
    episodeDescription.textContent = `${formattedTitle} of ${animeName}`;

    const type = currentLanguage === 'sub' ? 'sub' : 'dub';
    const playerUrl = `https://gogoanime.com.by/streaming.php?id=${animeName.toLowerCase().replace(/ /g, '-')}-${animeId}&ep=${episodeId}&server=none&type=${type}&autostart=true`;

    iframe.onload = () => {
        hideLoader();
        iframe.style.display = 'block';
    };

    iframe.onerror = () => {
        showErrorMessage('Failed to load video. Try another episode.');
        iframe.style.display = 'none';
    };

    iframe.src = playerUrl;
}

// Recommendations
function loadRecommendations(animeId) {
    const currentAnime = animeData.find(a => a.id == animeId);
    if (!currentAnime) return;

    const currentGenres = currentAnime.syncData.genres || [];
    const similarAnime = animeData.filter(a => {
        if (a.id == animeId) return false;
        const genres = a.syncData.genres || [];
        return genres.some(g => currentGenres.includes(g));
    });

    const recommendations = similarAnime.length >= 6 ?
        similarAnime.slice(0, 6) :
        [...animeData]
            .filter(a => a.id != animeId)
            .sort(() => 0.5 - Math.random())
            .slice(0, 6);

    recommendationsGrid.innerHTML = '';
    recommendations.forEach(anime => {
        const recItem = document.createElement('div');
        recItem.className = 'recommendation-item';
        recItem.innerHTML = `
            <img src="${anime.poster}" alt="${anime.name}" onerror="this.src='https://via.placeholder.com/150x200?text=No+Image'">
            <p>${anime.name}</p>
        `;
        recItem.onclick = () => {
            window.location.href = `info.html?id=${anime.id}`;
        };
        recommendationsGrid.appendChild(recItem);
    });
}

// Error handling
function showErrorMessage(message) {
    fullscreenLoader.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
            <button id="retryBtn">Try Again</button>
        </div>
    `;
    fullscreenLoader.style.display = 'flex';

    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            location.reload();
        });
    }
}