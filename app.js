// Application state
let currentBook = '';
let currentChapter = 1;
let bookmarks = JSON.parse(localStorage.getItem('bibleBookmarks')) || [];
let deferredPrompt;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    displayBooks();
    checkTheme();
    setupInstallPrompt();
    loadRecentReading();
});

// Display all books
function displayBooks() {
    const booksGrid = document.getElementById('booksGrid');
    booksGrid.innerHTML = '';
    
    bibleData.books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        bookCard.textContent = book;
        bookCard.onclick = () => selectBook(book);
        booksGrid.appendChild(bookCard);
    });
}

// Select a book to show chapters
function selectBook(book) {
    currentBook = book;
    document.getElementById('selectedBookTitle').textContent = book;
    document.getElementById('booksView').style.display = 'none';
    document.getElementById('chaptersView').style.display = 'block';
    
    const chaptersGrid = document.getElementById('chaptersGrid');
    chaptersGrid.innerHTML = '';
    
    const chapterCount = bibleData.chapterCounts[book] || 30;
    
    for(let i = 1; i <= chapterCount; i++) {
        const chapterBtn = document.createElement('button');
        chapterBtn.className = 'chapter-btn';
        chapterBtn.textContent = i;
        chapterBtn.onclick = () => selectChapter(book, i);
        chaptersGrid.appendChild(chapterBtn);
    }
}

// Go back to books view
function backToBooks() {
    document.getElementById('booksView').style.display = 'block';
    document.getElementById('chaptersView').style.display = 'none';
}

// Select a chapter to read
function selectChapter(book, chapter) {
    currentBook = book;
    currentChapter = chapter;
    
    document.getElementById('booksView').style.display = 'block';
    document.getElementById('chaptersView').style.display = 'none';
    
    document.getElementById('currentBookTitle').textContent = book;
    document.getElementById('currentChapter').textContent = `Chapter ${chapter}`;
    
    // Save to recent reading
    saveRecentReading(book, chapter);
    
    // Display verses
    displayVerses(book, chapter);
}

// Display verses for a chapter
function displayVerses(book, chapter) {
    const versesDiv = document.getElementById('verses');
    versesDiv.innerHTML = '<div class="spinner"></div>';
    
    // Simulate loading verses
    setTimeout(() => {
        let verses = '';
        const verseCount = book === 'Psalms' ? 30 : 25; // Sample verse count
        
        for(let i = 1; i <= verseCount; i++) {
            const verseRef = `${book} ${chapter}:${i}`;
            const isBookmarked = bookmarks.includes(verseRef);
            
            verses += `<div class="verse-text">
                <span class="verse-number">${i}</span>
                Sample verse ${i} from ${book} ${chapter}. This is placeholder text. 
                In a production app, this would contain real Bible verses from an API.
                <span class="bookmark-star" onclick="toggleBookmark('${verseRef}')">${isBookmarked ? '★' : '☆'}</span>
            </div>`;
        }
        versesDiv.innerHTML = verses;
    }, 500);
}

// Show books view
function showBooks() {
    document.getElementById('booksView').style.display = 'block';
    document.getElementById('chaptersView').style.display = 'none';
    updateActiveNav('booksBtn');
}

// Show daily verse
function showDailyVerse() {
    document.getElementById('booksView').style.display = 'block';
    document.getElementById('chaptersView').style.display = 'none';
    updateActiveNav('dailyBtn');
    
    const verses = Object.entries(bibleData.popularVerses);
    const randomVerse = verses[Math.floor(Math.random() * verses.length)];
    
    document.getElementById('currentBookTitle').textContent = 'Daily Verse';
    document.getElementById('currentChapter').textContent = randomVerse[0];
    document.getElementById('verses').innerHTML = `
        <div class="verse-text">
            <span class="verse-number">📖</span>
            ${randomVerse[1]}
            <span class="bookmark-star" onclick="toggleBookmark('${randomVerse[0]}')">${bookmarks.includes(randomVerse[0]) ? '★' : '☆'}</span>
        </div>
    `;
}

// Show bookmarks
function showBookmarks() {
    document.getElementById('booksView').style.display = 'block';
    document.getElementById('chaptersView').style.display = 'none';
    updateActiveNav('bookmarksBtn');
    
    if(bookmarks.length > 0) {
        document.getElementById('currentBookTitle').textContent = 'Bookmarks';
        document.getElementById('currentChapter').textContent = 'Your saved verses';
        
        let bookmarksHtml = '';
        bookmarks.forEach(verse => {
            const verseText = bibleData.popularVerses[verse] || 'Verse text not available';
            bookmarksHtml += `
                <div class="verse-text" style="cursor: pointer; padding: 1rem; background: #f5f5f5; border-radius: 5px; margin-bottom: 0.5rem;" onclick="loadVerse('${verse}')">
                    <span class="verse-number">📖</span>
                    <strong>${verse}</strong>: ${verseText}
                    <span class="bookmark-star" onclick="event.stopPropagation(); toggleBookmark('${verse}')">★</span>
                </div>
            `;
        });
        document.getElementById('verses').innerHTML = bookmarksHtml;
    } else {
        document.getElementById('verses').innerHTML = '<div class="verse-text">No bookmarks yet. Click on the star icon next to verses to bookmark them.</div>';
    }
}

// Toggle bookmark
function toggleBookmark(verseRef) {
    const index = bookmarks.indexOf(verseRef);
    if(index === -1) {
        bookmarks.push(verseRef);
        showToast('Bookmark added!');
    } else {
        bookmarks.splice(index, 1);
        showToast('Bookmark removed');
    }
    localStorage.setItem('bibleBookmarks', JSON.stringify(bookmarks));
    
    // Refresh current view if on bookmarks
    if(document.getElementById('bookmarksBtn').classList.contains('active')) {
        showBookmarks();
    }
}

// Load a specific verse
function loadVerse(verseRef) {
    const [book, chapterVerse] = verseRef.split(' ');
    const [chapter, verse] = chapterVerse.split(':');
    
    selectChapter(book, parseInt(chapter));
    showToast(`Loaded ${verseRef}`);
}

// Search for verses
function searchVerse() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    
    if(bibleData.popularVerses[searchTerm]) {
        document.getElementById('currentBookTitle').textContent = 'Search Result';
        document.getElementById('currentChapter').textContent = searchTerm;
        document.getElementById('verses').innerHTML = `
            <div class="verse-text">
                <span class="verse-number">📖</span>
                ${bibleData.popularVerses[searchTerm]}
                <span class="bookmark-star" onclick="toggleBookmark('${searchTerm}')">${bookmarks.includes(searchTerm) ? '★' : '☆'}</span>
            </div>
        `;
    } else {
        showToast('Verse not found. Try: John 3:16, Psalm 23:1, etc.');
    }
}

// Toggle dark mode
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

// Check saved theme
function checkTheme() {
    if(localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').textContent = '☀️';
    }
}

// Update active navigation button
function updateActiveNav(activeId) {
    document.getElementById('booksBtn').classList.remove('active');
    document.getElementById('dailyBtn').classList.remove('active');
    document.getElementById('bookmarksBtn').classList.remove('active');
    document.getElementById(activeId).classList.add('active');
}

// Save recent reading
function saveRecentReading(book, chapter) {
    const recent = {
        book: book,
        chapter: chapter,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('recentReading', JSON.stringify(recent));
}

// Load recent reading
function loadRecentReading() {
    const recent = JSON.parse(localStorage.getItem('recentReading'));
    if(recent) {
        setTimeout(() => {
            if(confirm(`Continue reading from ${recent.book} ${recent.chapter}?`)) {
                selectChapter(recent.book, recent.chapter);
            }
        }, 1000);
    }
}

// Show toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// PWA Installation
function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallButton();
    });
}

function showInstallButton() {
    const installBtn = document.createElement('button');
    installBtn.className = 'install-btn show';
    installBtn.textContent = '📱 Install App';
    installBtn.onclick = installApp;
    document.body.appendChild(installBtn);
}

function installApp() {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            showToast('Thank you for installing!');
        }
        deferredPrompt = null;
        document.querySelector('.install-btn').remove();
    });
}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('ServiceWorker registered');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed');
            });
    });
}
