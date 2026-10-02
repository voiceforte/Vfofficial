import { getSettings, getPageContent } from './firestore-service.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const settings = await getSettings();
        if (settings) updateCommonElements(settings);
        
        const servicesContent = await getPageContent('services');
        if (servicesContent) {
            if (servicesContent.heroTitle) document.querySelector('.hero-title').textContent = servicesContent.heroTitle;
            if (servicesContent.heroSubtitle) document.querySelector('.hero-subtitle').textContent = servicesContent.heroSubtitle;
        }
    } catch (error) {
        console.error('Error loading services page content:', error);
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
