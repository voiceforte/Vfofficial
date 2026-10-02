import { db, storage } from './firebase-config.js';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// --- Global Settings Service ---
const settingsCollection = collection(db, 'settings');

export async function getSettings() {
    try {
        const q = query(settingsCollection, limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
        }
        return null;
    } catch (error) {
        console.error("Error getting settings:", error);
        throw error;
    }
}

export async function updateSettings(settingsData) {
    try {
        const existingSettings = await getSettings();
        if (existingSettings) {
            const settingsDocRef = doc(db, 'settings', existingSettings.id);
            await updateDoc(settingsDocRef, settingsData);
            return { id: existingSettings.id, ...settingsData };
        } else {
            const docRef = await addDoc(settingsCollection, settingsData);
            return { id: docRef.id, ...settingsData };
        }
    } catch (error) {
        console.error("Error updating settings:", error);
        throw error;
    }
}

// --- Page Content Service ---
const pageContentCollection = collection(db, 'pageContent');

export async function getPageContent(pageName) {
    try {
        const q = query(pageContentCollection, orderBy('pageName'), limit(1)); // Assuming pageName is unique
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const pageData = querySnapshot.docs.find(doc => doc.data().pageName === pageName);
            if (pageData) {
                return { id: pageData.id, ...pageData.data() };
            }
        }
        return null;
    } catch (error) {
        console.error(`Error getting content for page ${pageName}:`, error);
        throw error;
    }
}

export async function updatePageContent(pageName, contentData) {
    try {
        const existingContent = await getPageContent(pageName);
        if (existingContent) {
            const pageDocRef = doc(db, 'pageContent', existingContent.id);
            await updateDoc(pageDocRef, contentData);
            return { id: existingContent.id, ...contentData };
        } else {
            const docRef = await addDoc(pageContentCollection, { pageName, ...contentData });
            return { id: docRef.id, pageName, ...contentData };
        }
    } catch (error) {
        console.error(`Error updating content for page ${pageName}:`, error);
        throw error;
    }
}

// --- Portfolio Service ---
const portfolioCollection = collection(db, 'portfolio');

export async function getPortfolioItems() {
    try {
        const q = query(portfolioCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting portfolio items:", error);
        throw error;
    }
}

export async function addPortfolioItem(itemData, imageFile) {
    try {
        let imageUrl = itemData.imageUrl || '';
        if (imageFile) {
            const storageRef = ref(storage, `portfolio_images/${imageFile.name}_${Date.now()}`);
            const snapshot = await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(snapshot.ref);
        }
        const docRef = await addDoc(portfolioCollection, { ...itemData, imageUrl, createdAt: new Date().toISOString() });
        return { id: docRef.id, ...itemData, imageUrl };
    } catch (error) {
        console.error("Error adding portfolio item:", error);
        throw error;
    }
}

export async function updatePortfolioItem(id, itemData, imageFile) {
    try {
        const itemDocRef = doc(db, 'portfolio', id);
        let imageUrl = itemData.imageUrl || '';

        // If a new image file is provided, upload it
        if (imageFile) {
            // Delete old image if it exists and is a storage URL
            if (itemData.oldImageUrl && itemData.oldImageUrl.startsWith('https://firebasestorage.googleapis.com')) {
                const oldImageRef = ref(storage, itemData.oldImageUrl);
                await deleteObject(oldImageRef).catch(e => console.warn("Could not delete old image:", e));
            }
            const storageRef = ref(storage, `portfolio_images/${imageFile.name}_${Date.now()}`);
            const snapshot = await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(snapshot.ref);
        } else if (itemData.oldImageUrl && !itemData.imageUrl) {
            // If imageUrl is explicitly cleared and there was an old image, delete it
            if (itemData.oldImageUrl.startsWith('https://firebasestorage.googleapis.com')) {
                const oldImageRef = ref(storage, itemData.oldImageUrl);
                await deleteObject(oldImageRef).catch(e => console.warn("Could not delete old image:", e));
            }
            imageUrl = '';
        }

        await updateDoc(itemDocRef, { ...itemData, imageUrl });
        return { id, ...itemData, imageUrl };
    } catch (error) {
        console.error("Error updating portfolio item:", error);
        throw error;
    }
}

export async function deletePortfolioItem(id, imageUrl) {
    try {
        // Delete image from storage if it's a Firebase Storage URL
        if (imageUrl && imageUrl.startsWith('https://firebasestorage.googleapis.com')) {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef).catch(e => console.warn("Could not delete image from storage:", e));
        }
        const itemDocRef = doc(db, 'portfolio', id);
        await deleteDoc(itemDocRef);
        return true;
    } catch (error) {
        console.error("Error deleting portfolio item:", error);
        throw error;
    }
}

// --- Contact Messages Service ---
const messagesCollection = collection(db, 'messages');

export async function addContactMessage(messageData) {
    try {
        const docRef = await addDoc(messagesCollection, { ...messageData, timestamp: new Date().toISOString() });
        return { id: docRef.id, ...messageData };
    } catch (error) {
        console.error("Error adding contact message:", error);
        throw error;
    }
}

export async function getContactMessages() {
    try {
        const q = query(messagesCollection, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting contact messages:", error);
        throw error;
    }
}

export async function deleteContactMessage(id) {
    try {
        const messageDocRef = doc(db, 'messages', id);
        await deleteDoc(messageDocRef);
        return true;
    } catch (error) {
        console.error("Error deleting contact message:", error);
        throw error;
    }
}
