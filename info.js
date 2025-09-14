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
const topAnimeList = document.getElementById('topAnimeList');
const tabs = document.querySelectorAll('.tabs button');


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

// Current active tab
let activeTab = 'today';

// Tab click handlers
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    // Remove active class from all tabs
    tabs.forEach(t => t.classList.remove('active'));
    
    // Add active class to clicked tab
    tab.classList.add('active');
    
    // Set active tab
    activeTab = tab.dataset.filter;
    
    // Fetch data for the selected tab
    fetchTopAnime(activeTab);
  });
});

// Fetch top anime based on filter
async function fetchTopAnime(filter = 'today') {
  try {
    showLoader();
    topAnimeList.innerHTML = '<div class="loading">Loading...</div>';
    
    let endpoint = '';
    
    // Set API endpoint based on filter
    switch(filter) {
      case 'today':
        endpoint = 'https://api.jikan.moe/v4/top/anime?filter=airing&limit=15'; // Get extra to filter duplicates
        break;
      case 'popular':
        endpoint = 'https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=10';
        break;
      case 'favorite':
        endpoint = 'https://api.jikan.moe/v4/top/anime?filter=favorite&limit=10';
        break;
      default:
        endpoint = 'https://api.jikan.moe/v4/top/anime?filter=airing&limit=15';
    }
    
    const response = await fetch(endpoint);
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      // Remove duplicates for today's tab
      const uniqueAnime = filter === 'today' ? removeDuplicates(data.data) : data.data.slice(0, 10);
      renderTopAnime(uniqueAnime, filter);
    } else {
      topAnimeList.innerHTML = '<div class="loading">No anime found</div>';
    }
  } catch (error) {
    console.error(`Error fetching ${filter} anime:`, error);
    topAnimeList.innerHTML = '<div class="loading">Failed to load anime</div>';
  } finally {
    hideLoader();
  }
}

// Function to remove duplicate anime (by mal_id)
function removeDuplicates(animeList) {
  const uniqueAnime = [];
  const ids = new Set();
  
  for (const anime of animeList) {
    if (!ids.has(anime.mal_id)) {
      ids.add(anime.mal_id);
      uniqueAnime.push(anime);
      
      // Stop when we have 10 unique anime
      if (uniqueAnime.length === 10) break;
    }
  }
  
  return uniqueAnime;
}

// Render top anime list
function renderTopAnime(animeList, filter) {
  topAnimeList.innerHTML = '';
  
  animeList.forEach((anime, index) => {
    const rank = index + 1;
    const title = anime.title_english || anime.title;
    const episodes = anime.episodes || '?';
    const score = anime.score ? anime.score.toFixed(1) : 'N/A';
    const type = anime.type || 'TV';
    
    // Different metrics based on filter
    let metricValue, metricIcon;
    switch(filter) {
      case 'today':
        metricValue = `Ep ${anime.episodes || '?'}`;
        metricIcon = '<i class="fas fa-tv"></i>';
        break;
      case 'popular':
        metricValue = `${anime.scored_by?.toLocaleString() || 'N/A'} votes`;
        metricIcon = '<i class="fas fa-users"></i>';
        break;
      case 'favorite':
        metricValue = `${anime.favorites?.toLocaleString() || 'N/A'} favs`;
        metricIcon = '<i class="fas fa-heart"></i>';
        break;
    }
    
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.innerHTML = `
      <div class="rank">${rank}</div>
      <img src="${anime.images?.jpg?.image_url}" alt="${title}" class="anime-img" 
           onerror="this.src='https://via.placeholder.com/60x85?text=No+Image'">
      <div class="anime-details">
        <div style="font-size: 0.9rem"; class="anime-title">${title}</div>
        <div class="tags">
          <div class="tag">${metricIcon} ${metricValue}</div>
          <div class="tag"><i class="fas fa-star"></i> ${score}</div>
          <div class="tag"><i class="fas fa-film"></i> ${type}</div>
        </div>
      </div>
    `;
    
    // Add click handler
    card.addEventListener('click', () => {
      showAnimeDetails(anime.mal_id);
    });
    
    topAnimeList.appendChild(card);
  });
}

// Show anime details
function showAnimeDetails(malId) {
  // Find anime in our data that matches the MAL ID
  const anime = animeData.find(a => a.syncData.mal_id == malId);
  if (anime) {
    storeScrollPosition();
    window.location.href = `info.html?id=${anime.id}`;
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

        // Set first tab as active by default
    document.querySelector('.tabs button[data-filter="today"]').classList.add('active');
    
    // Fetch today's anime
    fetchTopAnime('today');
});
