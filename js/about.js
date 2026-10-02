import { getSettings, getPageContent } from './firestore-service.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const settings = await getSettings();
        if (settings) {
            // Update common elements (header/footer)
            updateCommonElements(settings);
        }
        
        const aboutContent = await getPageContent('about');
        if (aboutContent) {
            if (aboutContent.heroTitle) document.querySelector('.hero-title').textContent = aboutContent.heroTitle;
            if (aboutContent.heroSubtitle) document.querySelector('.hero-subtitle').textContent = aboutContent.heroSubtitle;
        }
    } catch (error) {
        console.error('Error loading about page content:', error);
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
    // ... other common updates
}
