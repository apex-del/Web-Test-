// Current language (sub/dub)
let currentLanguage = 'sub';

// DOM Elements
const infoPage = document.getElementById('infoPage');
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const closeLogin = document.getElementById('closeLogin');
const loader = document.getElementById('loader');
const watchBtn = document.getElementById('watchBtn');
const cancelBtn = document.getElementById('cancelBtn');

// Show info page
async function showInfoPage(animeId) {
    const anime = animeData.find(a => a.id == animeId);
    if (!anime) {
        window.location.href = 'index.html';
        return;
    }
    
    showLoader();
    
    // Set basic info
    document.getElementById('infoPoster').src = anime.poster;
    document.getElementById('infoTitle').textContent = anime.name;
    document.getElementById('animeHeroBg').style.background = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${anime.poster}') center/cover`;
    
    // Set watch button
// info.js (inside showInfoPage)
watchBtn.onclick = () => {
  window.location.href = `watch.html?id=${anime.id}&anime_id=${anime.syncData.anime_id}&title=${encodeURIComponent(anime.name)}`;
};
    
    // Set cancel button
    cancelBtn.onclick = () => {
        window.history.back();
    };
    
    // Set add to list button
    document.getElementById('addBtn').onclick = () => {
        alert(`Added ${anime.name} to your list`);
    };
    
    // Fetch detailed info from Jikan (MyAnimeList API)
    try {
        const malId = anime.syncData.mal_id;
        if (malId) {
            const response = await fetch(`https://api.jikan.moe/v4/anime/${malId}/full`);
            const data = await response.json();
            const animeInfo = data.data;
            
            // Set meta info
            const infoMeta = document.getElementById('infoMeta');
            infoMeta.innerHTML = `
                <div class="anime-meta-item">
                    <i class="fas fa-star"></i> ${animeInfo.score || 'N/A'}
                </div>
                <div class="anime-meta-item">
                    <i class="fas fa-film"></i> ${animeInfo.type || 'TV'}
                </div>
                <div class="anime-meta-item">
                    <i class="fas fa-tv"></i> ${animeInfo.episodes || '?'} eps
                </div>
                <div class="anime-meta-item">
                    <i class="fas fa-info-circle"></i> ${animeInfo.status || 'Unknown'}
                </div>
                <div class="anime-meta-item">
                    <i class="fas fa-calendar-alt"></i> ${animeInfo.year || ''}
                </div>
            `;
            
            // Set description
            document.getElementById('infoDescription').textContent = 
                animeInfo.synopsis || 'No description available.';
            
            // Set details
            document.getElementById('infoJapaneseTitle').textContent = animeInfo.title_japanese || 'N/A';
            document.getElementById('infoEnglishTitle').textContent = animeInfo.title_english || 'N/A';
            document.getElementById('infoType').textContent = animeInfo.type || 'Unknown';
            document.getElementById('infoEpisodes').textContent = animeInfo.episodes || 'Unknown';
            document.getElementById('infoStatus').textContent = animeInfo.status || 'Unknown';
            
            // Format aired date
            const startDate = animeInfo.aired?.from ? 
                new Date(animeInfo.aired.from).toLocaleDateString() : 
                'Unknown';
            document.getElementById('infoAired').textContent = startDate;
            
            // Format genres
            const genres = animeInfo.genres?.map(g => g.name).join(', ') || 'N/A';
            document.getElementById('infoGenres').textContent = genres;
            
            document.getElementById('infoRating').textContent = animeInfo.rating || 'N/A';
            
            // Format score
            const score = animeInfo.score ? 
                `${animeInfo.score} (${animeInfo.scored_by?.toLocaleString() || '0'} votes)` : 
                'N/A';
            document.getElementById('infoScore').textContent = score;
            
            // Format rank and popularity
            document.getElementById('infoRank').textContent = animeInfo.rank ? `#${animeInfo.rank}` : 'N/A';
            document.getElementById('infoPopularity').textContent = animeInfo.popularity ? `#${animeInfo.popularity}` : 'N/A';
            
            // Fetch characters
            const charactersResponse = await fetch(`https://api.jikan.moe/v4/anime/${malId}/characters`);
            const charactersData = await charactersResponse.json();
            const characters = charactersData.data;
            
            const charactersGrid = document.getElementById('charactersGrid');
            charactersGrid.innerHTML = '';
            
            if (characters && characters.length > 0) {
                // Show top 10 characters
                characters.slice(0, 10).forEach(character => {
                    const characterCard = document.createElement('div');
                    characterCard.className = 'character-card';
                    characterCard.innerHTML = `
                        <img src="${character.character.images.jpg.image_url}" alt="${character.character.name}" class="character-image" onerror="this.src='https://via.placeholder.com/150x200?text=No+Image'">
                        <div class="character-name">${character.character.name}</div>
                    `;
                    characterCard.onclick = () => {
                        // Could link to character page if available
                        alert(`Viewing ${character.character.name}'s details`);
                    };
                    charactersGrid.appendChild(characterCard);
                });
            } else {
                charactersGrid.innerHTML = '<p>No character data available.</p>';
            }

            // Load recommendations
            loadRecommendations(malId);
        }
    } catch (error) {
        console.error('Failed to load anime details:', error);
        
        // Set fallback info if API fails
        document.getElementById('infoDescription').textContent = 'Failed to load anime details. Please try again later.';
    } finally {
        hideLoader();
    }
}

// Load recommendations
async function loadRecommendations(malId) {
    try {
        const response = await fetch(`https://api.jikan.moe/v4/anime/${malId}/recommendations`);
        const data = await response.json();
        const recommendations = data.data;
        
        const recommendationsGrid = document.getElementById('recommendationsGrid');
        recommendationsGrid.innerHTML = '';
        
        if (recommendations && recommendations.length > 0) {
            // Show top 6 recommendations
            recommendations.slice(0, 6).forEach(rec => {
                const recAnime = rec.entry;
                const matchingAnime = animeData.find(a => 
                    a.syncData.mal_id == recAnime.mal_id || 
                    a.name.toLowerCase().includes(recAnime.title.toLowerCase())
                );
                
                if (matchingAnime) {
                    const recItem = document.createElement('div');
                    recItem.className = 'recommendation-item';
                    recItem.innerHTML = `
                        <img src="${matchingAnime.poster}" alt="${matchingAnime.name}" onerror="this.src='https://via.placeholder.com/150x200?text=No+Image'">
                        <p>${matchingAnime.name}</p>
                    `;
                    recItem.onclick = () => {
                        window.location.href = `info.html?id=${matchingAnime.id}`;
                    };
                    recommendationsGrid.appendChild(recItem);
                }
            });
        } else {
            // Fallback to random anime if no recommendations
            const randomAnime = [...animeData]
                .sort(() => 0.5 - Math.random())
                .slice(0, 6);
            
            randomAnime.forEach(anime => {
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
    } catch (error) {
        console.error('Failed to load recommendations:', error);
    }
}

// Loader functions
function showLoader() {
    loader.style.display = 'flex';
}

function hideLoader() {
    loader.style.display = 'none';
}

// Side Nav Functions
function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
}

// Login button functionality
loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'flex';
});

closeLogin.addEventListener('click', () => {
    loginModal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.style.display = 'none';
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Get anime ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const animeId = urlParams.get('id');
    
    if (animeId) {
        showInfoPage(parseInt(animeId));
    } else {
        window.location.href = 'index.html';
    }
});