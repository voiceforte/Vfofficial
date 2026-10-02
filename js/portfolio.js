import { getSettings, getPageContent, getPortfolioItems } from './firestore-service.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const settings = await getSettings();
        if (settings) updateCommonElements(settings);
        
        const portfolioContent = await getPageContent('portfolio');
        if (portfolioContent) {
            if (portfolioContent.heroTitle) document.querySelector('.hero-title').textContent = portfolioContent.heroTitle;
            if (portfolioContent.heroSubtitle) document.querySelector('.hero-subtitle').textContent = portfolioContent.heroSubtitle;
        }

        // Load Portfolio Items
        const portfolioGrid = document.getElementById('portfolio-grid');
        if (portfolioGrid) {
            const items = await getPortfolioItems();
            if (items.length > 0) {
                portfolioGrid.innerHTML = '';
                items.forEach(item => {
                    const itemEl = document.createElement('div');
                    itemEl.className = 'portfolio-item animate-fade-in';
                    itemEl.innerHTML = `
                        <div class="portfolio-card">
                            <div class="portfolio-image">
                                <img src="${item.imageUrl || 'images/portfolio-placeholder.jpg'}" alt="${item.title}" referrerPolicy="no-referrer">
                                <div class="portfolio-overlay">
                                    <div class="portfolio-info">
                                        <span class="portfolio-category">${item.category}</span>
                                        <h3>${item.title}</h3>
                                        <p>${item.description.substring(0, 80)}...</p>
                                        ${item.link ? `<a href="${item.link}" class="btn btn-success btn-sm" target="_blank">View Project</a>` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    portfolioGrid.appendChild(itemEl);
                });
            }
        }
    } catch (error) {
        console.error('Error loading portfolio page content:', error);
    }
});

function updateCommonElements(settings) {
    if (settings.siteName) {
        document.querySelectorAll('.logo-text h1, .footer-logo h3').forEach(el => {
            const trademark = el.querySelector('.trademark');
            el.textContent = settings.siteName;
            if (trademark) el.appendChild(trademark);
        });
    }
}
