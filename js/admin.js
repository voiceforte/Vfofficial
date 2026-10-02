import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getSettings, updateSettings,
    getPageContent, updatePageContent,
    getPortfolioItems, addPortfolioItem, updatePortfolioItem, deletePortfolioItem,
    getContactMessages, addContactMessage, deleteContactMessage
} from './firestore-service.js';

document.addEventListener('DOMContentLoaded', function() {
    const loginSection = document.getElementById('login-section');
    const adminDashboard = document.getElementById('admin-dashboard');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    const loadingOverlay = document.getElementById('loading-overlay');

    const adminTabBtns = document.querySelectorAll('.admin-tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Forms
    const settingsForm = document.getElementById('settings-form');
    const pageContentForm = document.getElementById('page-content-form');
    const portfolioForm = document.getElementById('portfolio-form');
    const contactForm = document.getElementById('contactForm'); // From contact.html, for adding messages

    // Lists
    const portfolioItemsList = document.getElementById('portfolio-items-list');
    const clientMessagesList = document.getElementById('client-messages-list');

    // Error displays
    const settingsError = document.getElementById('settings-error');
    const pagesError = document.getElementById('pages-error');
    const portfolioError = document.getElementById('portfolio-error');
    const messagesError = document.getElementById('messages-error');

    // Utility functions
    function showLoading() {
        loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }

    function showMessage(element, message, isError = true) {
        element.textContent = message;
        element.style.display = 'block';
        element.style.color = isError ? '#ef4444' : '#10b981';
        element.style.backgroundColor = isError ? '#fee2e2' : '#d1fae5';
        element.style.borderColor = isError ? '#fca5a5' : '#a7f3d0';
    }

    function hideMessage(element) {
        element.style.display = 'none';
    }

    // --- Authentication ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loginSection.style.display = 'none';
            adminDashboard.style.display = 'block';
            loadAdminData();
        } else {
            loginSection.style.display = 'block';
            adminDashboard.style.display = 'none';
        }
        hideLoading();
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessage(loginError);
        showLoading();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // UI will update via onAuthStateChanged
        } catch (error) {
            showMessage(loginError, `Login failed: ${error.message}`);
            console.error("Login error:", error);
        } finally {
            hideLoading();
        }
    });

    logoutBtn.addEventListener('click', async () => {
        showLoading();
        try {
            await signOut(auth);
            // UI will update via onAuthStateChanged
        } catch (error) {
            console.error("Logout error:", error);
            alert("Logout failed: " + error.message);
        } finally {
            hideLoading();
        }
    });

    // --- Tab Management ---
    adminTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            adminTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            tabContents.forEach(content => content.style.display = 'none');
            const targetTabId = btn.dataset.tab + '-tab';
            document.getElementById(targetTabId).style.display = 'block';

            // Load data specific to the activated tab
            if (btn.dataset.tab === 'settings') loadSettings();
            if (btn.dataset.tab === 'pages') loadPageContent();
            if (btn.dataset.tab === 'portfolio') loadPortfolioItems();
            if (btn.dataset.tab === 'messages') loadContactMessages();
        });
    });

    // --- Data Loading Functions ---
    async function loadAdminData() {
        // Load initial data for the default active tab (settings)
        loadSettings();
        // Optionally pre-load other data or set up listeners
    }

    async function loadSettings() {
        hideMessage(settingsError);
        showLoading();
        try {
            const settings = await getSettings();
            if (settings) {
                document.getElementById('site-name').value = settings.siteName || '';
                document.getElementById('tagline').value = settings.tagline || '';
                document.getElementById('phone-number').value = settings.phoneNumber || '';
                document.getElementById('whatsapp-number').value = settings.whatsappNumber || '';
                document.getElementById('email-address').value = settings.emailAddress || '';
                document.getElementById('facebook-url').value = settings.facebookUrl || '';
                document.getElementById('instagram-url').value = settings.instagramUrl || '';
                document.getElementById('youtube-url').value = settings.youtubeUrl || '';
                document.getElementById('tiktok-url').value = settings.tiktokUrl || '';
                document.getElementById('linkedin-url').value = settings.linkedinUrl || '';
            }
        } catch (error) {
            showMessage(settingsError, `Failed to load settings: ${error.message}`);
            console.error("Error loading settings:", error);
        } finally {
            hideLoading();
        }
    }

    async function loadPageContent() {
        hideMessage(pagesError);
        showLoading();
        try {
            const pageSelect = document.getElementById('page-select');
            const selectedPage = pageSelect.value;
            const content = await getPageContent(selectedPage);
            if (content) {
                document.getElementById('page-hero-title').value = content.heroTitle || '';
                document.getElementById('page-hero-subtitle').value = content.heroSubtitle || '';
            } else {
                // Clear fields if no content found for selected page
                document.getElementById('page-hero-title').value = '';
                document.getElementById('page-hero-subtitle').value = '';
            }
        } catch (error) {
            showMessage(pagesError, `Failed to load page content: ${error.message}`);
            console.error("Error loading page content:", error);
        } finally {
            hideLoading();
        }
    }

    async function loadPortfolioItems() {
        hideMessage(portfolioError);
        showLoading();
        try {
            const items = await getPortfolioItems();
            portfolioItemsList.innerHTML = '';
            if (items.length === 0) {
                portfolioItemsList.innerHTML = '<p class="text-center text-gray-500">No portfolio items found. Add one above!</p>';
                return;
            }
            items.forEach(item => {
                const itemCard = document.createElement('div');
                itemCard.className = 'item-card';
                itemCard.innerHTML = `
                    <div class="item-details">
                        <h5>${item.title}</h5>
                        <p>${item.category} - ${item.description.substring(0, 100)}...</p>
                        ${item.imageUrl ? `<p><a href="${item.imageUrl}" target="_blank">View Image</a></p>` : ''}
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-outline-primary btn-sm edit-portfolio-item" data-id="${item.id}" data-image-url="${item.imageUrl || ''}">Edit</button>
                        <button class="btn btn-outline-danger btn-sm delete-portfolio-item" data-id="${item.id}" data-image-url="${item.imageUrl || ''}">Delete</button>
                    </div>
                `;
                portfolioItemsList.appendChild(itemCard);
            });

            // Add event listeners for edit/delete buttons
            portfolioItemsList.querySelectorAll('.edit-portfolio-item').forEach(button => {
                button.addEventListener('click', (e) => editPortfolioItem(e.target.dataset.id, e.target.dataset.imageUrl));
            });
            portfolioItemsList.querySelectorAll('.delete-portfolio-item').forEach(button => {
                button.addEventListener('click', (e) => deletePortfolioItemHandler(e.target.dataset.id, e.target.dataset.imageUrl));
            });

        } catch (error) {
            showMessage(portfolioError, `Failed to load portfolio items: ${error.message}`);
            console.error("Error loading portfolio items:", error);
        } finally {
            hideLoading();
        }
    }

    async function loadContactMessages() {
        hideMessage(messagesError);
        showLoading();
        try {
            const messages = await getContactMessages();
            clientMessagesList.innerHTML = '';
            if (messages.length === 0) {
                clientMessagesList.innerHTML = '<p class="text-center text-gray-500">No messages received yet.</p>';
                return;
            }
            messages.forEach(message => {
                const messageCard = document.createElement('div');
                messageCard.className = 'message-card';
                messageCard.innerHTML = `
                    <h5>From: ${message.name} (${message.email})</h5>
                    <p><strong>Service:</strong> ${message.service || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${message.phone || 'N/A'}</p>
                    <p>${message.message}</p>
                    <p class="message-date">${new Date(message.timestamp).toLocaleString()}</p>
                    <div class="text-right mt-2">
                        <button class="btn btn-outline-danger btn-sm delete-message" data-id="${message.id}">Delete</button>
                    </div>
                `;
                clientMessagesList.appendChild(messageCard);
            });

            clientMessagesList.querySelectorAll('.delete-message').forEach(button => {
                button.addEventListener('click', (e) => deleteContactMessage(e.target.dataset.id));
            });

        } catch (error) {
            showMessage(messagesError, `Failed to load messages: ${error.message}`);
            console.error("Error loading messages:", error);
        } finally {
            hideLoading();
        }
    }

    // --- Form Submissions ---
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessage(settingsError);
        showLoading();
        const formData = new FormData(settingsForm);
        const data = {};
        formData.forEach((value, key) => data[key] = value);

        try {
            await updateSettings(data);
            showMessage(settingsError, 'Settings updated successfully!', false);
        } catch (error) {
            showMessage(settingsError, `Failed to update settings: ${error.message}`);
            console.error("Error updating settings:", error);
        } finally {
            hideLoading();
        }
    });

    pageContentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessage(pagesError);
        showLoading();
        const pageSelect = document.getElementById('page-select');
        const selectedPage = pageSelect.value;
        const formData = new FormData(pageContentForm);
        const data = {};
        formData.forEach((value, key) => data[key] = value);

        try {
            await updatePageContent(selectedPage, data);
            showMessage(pagesError, `Content for ${selectedPage} updated successfully!`, false);
        } catch (error) {
            showMessage(pagesError, `Failed to update page content: ${error.message}`);
            console.error("Error updating page content:", error);
        } finally {
            hideLoading();
        }
    });

    // Handle page selection change to load relevant content
    document.getElementById('page-select').addEventListener('change', loadPageContent);

    portfolioForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessage(portfolioError);
        showLoading();

        const formData = new FormData(portfolioForm);
        const id = document.getElementById('portfolio-item-id').value;
        const imageFile = formData.get('imageFile');
        const oldImageUrl = document.getElementById('current-portfolio-image').dataset.imageUrl;

        const itemData = {
            title: formData.get('title'),
            description: formData.get('description'),
            category: formData.get('category'),
            tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
            link: formData.get('link'),
            imageUrl: formData.get('imageUrl'), // Use this if no new file is uploaded
            oldImageUrl: oldImageUrl // Pass old image URL for deletion if new one is uploaded or cleared
        };

        // Remove imageFile from itemData if it's empty or not a File object
        let fileToUpload = null;
        if (imageFile instanceof File && imageFile.name) {
            fileToUpload = imageFile;
        }

        try {
            if (id) {
                await updatePortfolioItem(id, itemData, fileToUpload);
                showMessage(portfolioError, 'Portfolio item updated successfully!', false);
            } else {
                await addPortfolioItem(itemData, fileToUpload);
                showMessage(portfolioError, 'Portfolio item added successfully!', false);
            }
            portfolioForm.reset();
            document.getElementById('portfolio-item-id').value = '';
            document.getElementById('current-portfolio-image').textContent = '';
            document.getElementById('current-portfolio-image').dataset.imageUrl = '';
            loadPortfolioItems();
        } catch (error) {
            showMessage(portfolioError, `Failed to save portfolio item: ${error.message}`);
            console.error("Error saving portfolio item:", error);
        } finally {
            hideLoading();
        }
    });

    document.getElementById('clear-portfolio-form').addEventListener('click', () => {
        portfolioForm.reset();
        document.getElementById('portfolio-item-id').value = '';
        document.getElementById('current-portfolio-image').textContent = '';
        document.getElementById('current-portfolio-image').dataset.imageUrl = '';
        hideMessage(portfolioError);
    });

    // --- Portfolio Item Actions ---
    async function editPortfolioItem(id, imageUrl) {
        showLoading();
        try {
            const items = await getPortfolioItems();
            const itemToEdit = items.find(item => item.id === id);
            if (itemToEdit) {
                document.getElementById('portfolio-item-id').value = itemToEdit.id;
                document.getElementById('portfolio-title').value = itemToEdit.title || '';
                document.getElementById('portfolio-description').value = itemToEdit.description || '';
                document.getElementById('portfolio-category').value = itemToEdit.category || '';
                document.getElementById('portfolio-tags').value = itemToEdit.tags ? itemToEdit.tags.join(', ') : '';
                document.getElementById('portfolio-link').value = itemToEdit.link || '';
                document.getElementById('portfolio-image-url').value = itemToEdit.imageUrl || '';

                const currentImageDisplay = document.getElementById('current-portfolio-image');
                if (itemToEdit.imageUrl) {
                    currentImageDisplay.textContent = `Current Image: ${itemToEdit.imageUrl.split('/').pop().split('?')[0]}`;
                    currentImageDisplay.dataset.imageUrl = itemToEdit.imageUrl;
                } else {
                    currentImageDisplay.textContent = '';
                    currentImageDisplay.dataset.imageUrl = '';
                }
                showMessage(portfolioError, 'Editing portfolio item. Clear form to add new.', false);
            }
        } catch (error) {
            showMessage(portfolioError, `Failed to load item for editing: ${error.message}`);
            console.error("Error loading item for editing:", error);
        } finally {
            hideLoading();
        }
    }

    async function deletePortfolioItemHandler(id, imageUrl) {
        if (!confirm('Are you sure you want to delete this portfolio item?')) return;
        showLoading();
        hideMessage(portfolioError);
        try {
            await deletePortfolioItem(id, imageUrl);
            showMessage(portfolioError, 'Portfolio item deleted successfully!', false);
            loadPortfolioItems();
        } catch (error) {
            showMessage(portfolioError, `Failed to delete portfolio item: ${error.message}`);
            console.error("Error deleting portfolio item:", error);
        } finally {
            hideLoading();
        }
    }

    // --- Message Actions ---
    async function deleteContactMessage(id) {
        if (!confirm('Are you sure you want to delete this message?')) return;
        showLoading();
        hideMessage(messagesError);
        try {
            await deleteContactMessage(id);
            showMessage(messagesError, 'Message deleted successfully!', false);
            loadContactMessages();
        } catch (error) {
            showMessage(messagesError, `Failed to delete message: ${error.message}`);
            console.error("Error deleting message:", error);
        } finally {
            hideLoading();
        }
    }

    // Refresh buttons
    document.getElementById('refresh-portfolio-list').addEventListener('click', loadPortfolioItems);
    document.getElementById('refresh-messages-list').addEventListener('click', loadContactMessages);

    // --- Contact Form Submission (for public contact.html) ---
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            showLoading();
            
            const formData = new FormData(contactForm);
            const data = {};
            formData.forEach((value, key) => data[key] = value);
            
            try {
                await addContactMessage(data);
                alert('Thank you for your message! We will get back to you shortly.');
                contactForm.reset();
            } catch (error) {
                console.error('Error submitting contact form:', error);
                alert('Failed to send message. Please try again later.');
            } finally {
                hideLoading();
            }
        });
    }
});
