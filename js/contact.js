import { getSettings, getPageContent, addContactMessage } from './firestore-service.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const settings = await getSettings();
        if (settings) updateCommonElements(settings);
        
        const contactContent = await getPageContent('contact');
        if (contactContent) {
            if (contactContent.heroTitle) document.querySelector('.hero-title').textContent = contactContent.heroTitle;
            if (contactContent.heroSubtitle) document.querySelector('.hero-subtitle').textContent = contactContent.heroSubtitle;
        }

        // Handle Contact Form
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitBtn = contactForm.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Sending...';

                const formData = new FormData(contactForm);
                const data = {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    service: formData.get('service'),
                    message: formData.get('message'),
                    timestamp: new Date().toISOString()
                };

                try {
                    await addContactMessage(data);
                    alert('Thank you for your message! We will get back to you shortly.');
                    contactForm.reset();
                } catch (error) {
                    console.error('Error sending message:', error);
                    alert('Failed to send message. Please try again later.');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            });
        }
    } catch (error) {
        console.error('Error loading contact page content:', error);
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
