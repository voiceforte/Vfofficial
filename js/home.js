import { getSettings, getPageContent } from './firestore-service.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Home page loading dynamic content...');
    
    try {
        // Load Site Settings
        const settings = await getSettings();
        if (settings) {
            if (settings.siteName) {
                const logoTexts = document.querySelectorAll('.logo-text h1');
                logoTexts.forEach(el => {
                    const trademark = el.querySelector('.trademark');
                    el.textContent = settings.siteName;
                    if (trademark) el.appendChild(trademark);
                });
                
                const footerLogos = document.querySelectorAll('.footer-logo h3');
                footerLogos.forEach(el => {
                    const trademark = el.querySelector('.trademark');
                    el.textContent = settings.siteName;
                    if (trademark) el.appendChild(trademark);
                });
            }
            
            if (settings.tagline) {
                const taglines = document.querySelectorAll('.logo-tagline, .footer-description');
                taglines.forEach(el => {
                    if (el.classList.contains('logo-tagline')) {
                        el.textContent = settings.tagline;
                    }
                });
            }
            
            // Update contact info in footer
            if (settings.phoneNumber) {
                const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
                phoneLinks.forEach(link => {
                    link.href = `tel:${settings.phoneNumber}`;
                    if (link.textContent.includes('+92')) {
                        link.textContent = settings.phoneNumber;
                    }
                });
            }
            
            if (settings.emailAddress) {
                const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
                emailLinks.forEach(link => {
                    link.href = `mailto:${settings.emailAddress}`;
                    link.textContent = settings.emailAddress;
                });
            }
            
            // Update social links
            if (settings.facebookUrl) document.querySelectorAll('.social-item.facebook, .social-links a[aria-label="Facebook"]').forEach(el => el.href = settings.facebookUrl);
            if (settings.instagramUrl) document.querySelectorAll('.social-item.instagram, .social-links a[aria-label="Instagram"]').forEach(el => el.href = settings.instagramUrl);
            if (settings.youtubeUrl) document.querySelectorAll('.social-item.youtube, .social-links a[aria-label="YouTube"]').forEach(el => el.href = settings.youtubeUrl);
            if (settings.tiktokUrl) document.querySelectorAll('.social-item.tiktok, .social-links a[aria-label="TikTok"]').forEach(el => el.href = settings.tiktokUrl);
            if (settings.linkedinUrl) document.querySelectorAll('.social-item.linkedin, .social-links a[aria-label="LinkedIn"]').forEach(el => el.href = settings.linkedinUrl);
        }
        
        // Load Home Page Content
        const homeContent = await getPageContent('home');
        if (homeContent) {
            if (homeContent.heroTitle) {
                const heroTitle = document.querySelector('.hero-title');
                if (heroTitle) heroTitle.textContent = homeContent.heroTitle;
            }
            if (homeContent.heroSubtitle) {
                const heroSubtitle = document.querySelector('.hero-subtitle');
                if (heroSubtitle) heroSubtitle.textContent = homeContent.heroSubtitle;
            }
        }
        
    } catch (error) {
        console.error('Error loading home page content:', error);
    }
});
