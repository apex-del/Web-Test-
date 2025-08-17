// Current language (sub/dub)
let currentLanguage = 'sub';
let currentSlide = 0;
let currentPage = 1;
const itemsPerPage = 24;
let lastScrollPosition = 0;

// DOM Elements
const homePage = document.getElementById('homePage');
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const closeLogin = document.getElementById('closeLogin');
const trendingSlider = document.getElementById('trendingSlider');
const animeGrid = document.getElementById('animeGrid');
const pagination = document.getElementById('pagination');
const loader = document.getElementById('loader');
const welcomeMarquee = document.getElementById('welcomeMarquee');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const topAnimeList = document.getElementById('topAnimeList');
const tabs = document.querySelectorAll('.tabs button');

// Store scroll position before page change
function storeScrollPosition() {
    lastScrollPosition = window.scrollY || document.documentElement.scrollTop;
}

// Restore scroll position
function restoreScrollPosition() {
    window.scrollTo(0, lastScrollPosition);
}

// Render anime cards on home page with pagination
function renderAnimeCards(page = 1) {
    currentPage = page;
    animeGrid.innerHTML = '';
    
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedAnime = animeData.slice(startIndex, endIndex);
    
    paginatedAnime.forEach(anime => {
        const card = document.createElement('div');
        card.className = 'anime-item';
        card.innerHTML = `
            <img src="${anime.poster}" alt="${anime.name}" class="anime-poster">
            <p>${anime.name}</p>
            ${anime.syncData.mal_id ? `<div class="anime-rating">${Math.floor(Math.random() * 5) + 5}.${Math.floor(Math.random() * 9)}</div>` : ''}
        `;
        card.onclick = () => {
            storeScrollPosition();
            window.location.href = `info.html?id=${anime.id}`;
        };
        animeGrid.appendChild(card);
    });
    
    // Render pagination buttons
    renderPagination();
    
    // Load trending anime from AniList
    loadTrendingAnime();
}

// Render pagination buttons
function renderPagination() {
    pagination.innerHTML = '';
    const totalPages = Math.ceil(animeData.length / itemsPerPage);
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            window.scrollTo(0, 0);
            renderAnimeCards(currentPage - 1);
        }
    };
    pagination.appendChild(prevBtn);
    
    // Page buttons
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => {
            window.scrollTo(0, 0);
            renderAnimeCards(i);
        };
        pagination.appendChild(pageBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            window.scrollTo(0, 0);
            renderAnimeCards(currentPage + 1);
        }
    };
    pagination.appendChild(nextBtn);
}

// Load trending anime from AniList
async function loadTrendingAnime() {
    showLoader();
    trendingSlider.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        // GraphQL query for trending anime
        const query = `
            query {
                Page(page: 1, perPage: 10) {
                    media(type: ANIME, sort: TRENDING_DESC) {
                        id
                        title {
                            romaji
                            english
                        }
                        coverImage {
                            large
                        }
                        averageScore
                    }
                }
            }
        `;
        
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: query
            })
        });
        
        const data = await response.json();
        const trendingAnime = data.data.Page.media;
        
        trendingSlider.innerHTML = '';
        
        trendingAnime.forEach((anime, index) => {
            const slide = document.createElement('div');
            slide.className = 'slide';
            slide.innerHTML = `
                <img style="height: 55vh" src="${anime.coverImage.large}" alt="${anime.title.romaji}">
                <h3>${anime.title.english || anime.title.romaji}</h3>
                ${anime.averageScore ? `<p>Rating: ${anime.averageScore / 10}</p>` : ''}
            `;
            
            // Find matching anime in our data to get the ID
            const matchingAnime = animeData.find(a => 
                a.syncData.anilist_id === String(anime.id) || 
                a.name.toLowerCase().includes(anime.title.romaji.toLowerCase()) ||
                (anime.title.english && a.name.toLowerCase().includes(anime.title.english.toLowerCase()))
            );
            
            if (matchingAnime) {
                slide.onclick = () => {
                    storeScrollPosition();
                    window.location.href = `info.html?id=${matchingAnime.id}`;
                };
            }
            
            trendingSlider.appendChild(slide);
        });
        
        // Initialize slider
        updateSlider();
    } catch (error) {
        console.error('Failed to load trending anime:', error);
        trendingSlider.innerHTML = '<p style="padding: 20px;">Failed to load trending anime. Please try again later.</p>';
    } finally {
        hideLoader();
    }
}

// Slider functions
function updateSlider() {
    trendingSlider.style.transform = `translateX(-${currentSlide * 100}%)`;
}

function prevSlide() {
    if (currentSlide > 0) {
        currentSlide--;
        updateSlider();
    }
}

function nextSlide() {
    const slides = document.querySelectorAll('.slide');
    if (currentSlide < slides.length - 1) {
        currentSlide++;
        updateSlider();
    }
}

// Search anime data
function searchAnime(query) {
    if (!query.trim()) {
        searchResults.style.display = 'none';
        return;
    }
    
    const results = animeData.filter(anime => 
        anime.name.toLowerCase().includes(query.toLowerCase())
    );
    
    displaySearchResults(results);
}

// Display search results
function displaySearchResults(results) {
    searchResults.innerHTML = '';
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No anime found matching your search</div>';
        searchResults.style.display = 'block';
        return;
    }
    
    results.slice(0, 10).forEach(anime => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.innerHTML = `
            <img src="${anime.poster}" alt="${anime.name}" onerror="this.src='https://via.placeholder.com/60x85?text=No+Image'">
            <div class="title">${anime.name}</div>
        `;
        resultItem.addEventListener('click', () => {
            storeScrollPosition();
            window.location.href = `info.html?id=${anime.id}`;
            searchResults.style.display = 'none';
            searchInput.value = '';
        });
        searchResults.appendChild(resultItem);
    });
    
    searchResults.style.display = 'block';
}

// Close search results when clicking outside
document.addEventListener('click', (e) => {
    if (!searchResults.contains(e.target) && e.target !== searchInput) {
        searchResults.style.display = 'none';
    }
});

// Initialize search
searchInput.addEventListener('input', (e) => {
    searchAnime(e.target.value);
});

// Show search results when input is focused
searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim()) {
        searchAnime(searchInput.value);
    }
});

// Keyboard navigation for search results
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items = searchResults.querySelectorAll('.search-result-item');
        if (items.length === 0) return;
        
        let currentIndex = -1;
        items.forEach((item, index) => {
            if (item.classList.contains('highlighted')) {
                item.classList.remove('highlighted');
                currentIndex = index;
            }
        });
        
        if (e.key === 'ArrowDown') {
            currentIndex = (currentIndex + 1) % items.length;
        } else {
            currentIndex = (currentIndex - 1 + items.length) % items.length;
        }
        
        items[currentIndex].classList.add('highlighted');
        items[currentIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
        const highlighted = searchResults.querySelector('.highlighted');
        if (highlighted) {
            highlighted.click();
        }
    }
});

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
        <div class="anime-title">${title}</div>
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
    renderAnimeCards();
    
    // Watch trending button
    document.getElementById('trendBtn').addEventListener('click', () => {
        // Find first anime with mal_id to show as trending
        const trendingAnime = animeData.find(a => a.syncData.mal_id);
        if (trendingAnime) {
            storeScrollPosition();
            window.location.href = `info.html?id=${trendingAnime.id}`;
        }
    });
    
    // Set first tab as active by default
    document.querySelector('.tabs button[data-filter="today"]').classList.add('active');
    
    // Fetch today's anime
    fetchTopAnime('today');
    
    // Restore scroll position if coming back
    if (sessionStorage.getItem('scrollPosition')) {
        setTimeout(() => {
            window.scrollTo(0, parseInt(sessionStorage.getItem('scrollPosition')));
            sessionStorage.removeItem('scrollPosition');
        }, 100);
    }
});

// Store scroll position before unloading
window.addEventListener('beforeunload', () => {
    sessionStorage.setItem('scrollPosition', window.scrollY || document.documentElement.scrollTop);
});