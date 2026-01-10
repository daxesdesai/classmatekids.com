/**
 * Invitation Page - Firebase Integration
 * For Sara's 8th Birthday Party
 */

// ============================================
// FIREBASE CONFIGURATION
// Replace with your Firebase config from console.firebase.google.com
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyDJFjIPt9nvKUVy7VtQnWPklsvKfj0Xe0Q",
    authDomain: "sara-8th-bday.firebaseapp.com",
    databaseURL: "https://sara-8th-bday-default-rtdb.firebaseio.com",
    projectId: "sara-8th-bday",
    storageBucket: "sara-8th-bday.firebasestorage.app",
    messagingSenderId: "499762848158",
    appId: "1:499762848158:web:69af46ec976b4631a6368f"
};

// Event ID - matches Firebase data structure
const EVENT_ID = "sara-8th-birthday";

// Admin secret key (change this to something secure!)
const ADMIN_SECRET = "sara2026admin";

// ============================================
// INITIALIZE FIREBASE
// ============================================
let db = null;
let isFirebaseReady = false;

function initFirebase() {
    try {
        if (typeof firebase !== 'undefined') {
            firebase.initializeApp(firebaseConfig);
            db = firebase.database();
            isFirebaseReady = true;
            console.log('Firebase initialized successfully');
            return true;
        }
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
    return false;
}

// ============================================
// URL PARAMETER HELPERS
// ============================================
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        inviteId: params.get('invite'),
        adminKey: params.get('admin')
    };
}

function isAdminMode() {
    const { adminKey } = getUrlParams();
    return adminKey === ADMIN_SECRET;
}

// ============================================
// GUEST PAGE FUNCTIONS
// ============================================

async function loadInviteData(inviteId) {
    if (!isFirebaseReady || !inviteId) return null;

    try {
        const snapshot = await db.ref(`events/${EVENT_ID}/invites/${inviteId}`).once('value');
        return snapshot.val();
    } catch (error) {
        console.error('Error loading invite:', error);
        return null;
    }
}

async function loadExistingRsvp(inviteId) {
    if (!isFirebaseReady || !inviteId) return null;

    try {
        const snapshot = await db.ref(`events/${EVENT_ID}/rsvps/${inviteId}`).once('value');
        return snapshot.val();
    } catch (error) {
        console.error('Error loading RSVP:', error);
        return null;
    }
}

async function recordView(inviteId) {
    if (!isFirebaseReady || !inviteId) return;

    try {
        await db.ref(`events/${EVENT_ID}/views/${inviteId}`).set({
            viewedAt: firebase.database.ServerValue.TIMESTAMP,
            viewCount: firebase.database.ServerValue.increment(1)
        });
    } catch (error) {
        console.error('Error recording view:', error);
    }
}

async function loadAllViews() {
    if (!isFirebaseReady) return {};

    try {
        const snapshot = await db.ref(`events/${EVENT_ID}/views`).once('value');
        return snapshot.val() || {};
    } catch (error) {
        console.error('Error loading views:', error);
        return {};
    }
}

async function submitRsvp(inviteId, rsvpData) {
    if (!isFirebaseReady || !inviteId) return false;

    try {
        await db.ref(`events/${EVENT_ID}/rsvps/${inviteId}`).set({
            ...rsvpData,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        });
        return true;
    } catch (error) {
        console.error('Error submitting RSVP:', error);
        return false;
    }
}

async function submitMessage(inviteId, guestName, messageText) {
    if (!isFirebaseReady || !inviteId || !messageText.trim()) return false;

    try {
        const newMessageRef = db.ref(`events/${EVENT_ID}/messages`).push();
        await newMessageRef.set({
            inviteId: inviteId,
            guestName: guestName,
            text: messageText.trim(),
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });
        return true;
    } catch (error) {
        console.error('Error submitting message:', error);
        return false;
    }
}

// ============================================
// ADMIN PAGE FUNCTIONS
// ============================================

async function loadAllInvites() {
    if (!isFirebaseReady) return {};

    try {
        const snapshot = await db.ref(`events/${EVENT_ID}/invites`).once('value');
        return snapshot.val() || {};
    } catch (error) {
        console.error('Error loading invites:', error);
        return {};
    }
}

async function loadAllRsvps() {
    if (!isFirebaseReady) return {};

    try {
        const snapshot = await db.ref(`events/${EVENT_ID}/rsvps`).once('value');
        return snapshot.val() || {};
    } catch (error) {
        console.error('Error loading RSVPs:', error);
        return {};
    }
}

async function loadAllMessages() {
    if (!isFirebaseReady) return {};

    try {
        const snapshot = await db.ref(`events/${EVENT_ID}/messages`).once('value');
        return snapshot.val() || {};
    } catch (error) {
        console.error('Error loading messages:', error);
        return {};
    }
}

async function createInvite(guestName, maxAdults, maxKids, showInvitedCount) {
    if (!isFirebaseReady || !guestName.trim()) return null;

    try {
        // Generate a URL-friendly invite ID
        const inviteId = guestName.trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') +
            '-' + Math.random().toString(36).substring(2, 8);

        await db.ref(`events/${EVENT_ID}/invites/${inviteId}`).set({
            guestName: guestName.trim(),
            maxAdults: parseInt(maxAdults) || 2,
            maxKids: parseInt(maxKids) || 0,
            showInvitedCount: showInvitedCount !== false,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });

        return inviteId;
    } catch (error) {
        console.error('Error creating invite:', error);
        return null;
    }
}

async function deleteInvite(inviteId) {
    if (!isFirebaseReady || !inviteId) return false;

    try {
        await db.ref(`events/${EVENT_ID}/invites/${inviteId}`).remove();
        await db.ref(`events/${EVENT_ID}/rsvps/${inviteId}`).remove();
        return true;
    } catch (error) {
        console.error('Error deleting invite:', error);
        return false;
    }
}

// ============================================
// UI HELPERS
// ============================================

function showElement(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
}

function hideElement(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}

function setElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function generateInviteUrl(inviteId) {
    const baseUrl = window.location.origin + '/invitation/';
    return `${baseUrl}?invite=${inviteId}`;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Link copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Link copied to clipboard!');
    });
}

function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

// ============================================
// GUEST PAGE INITIALIZATION
// ============================================

async function initGuestPage() {
    const { inviteId } = getUrlParams();

    // Show loading
    showElement('loading');
    hideElement('invitation-content');
    hideElement('error-container');

    // Check if Firebase is configured
    if (firebaseConfig.apiKey === "YOUR_API_KEY") {
        // Demo mode - show page without Firebase
        console.log('Running in demo mode (Firebase not configured)');
        hideElement('loading');
        showElement('invitation-content');

        // Demo data
        if (inviteId) {
            setElementText('guest-name', 'Demo Guest');
            populateAdultsDropdown(2);
            populateKidsDropdown(2);
            showInvitedCount(2, 2);
        } else {
            setElementText('guest-name', 'Guest');
            populateAdultsDropdown(2);
            populateKidsDropdown(2);
            showInvitedCount(2, 2);
        }
        setupRsvpForm(inviteId || 'demo', 'Demo Guest');
        return;
    }

    // Initialize Firebase
    if (!initFirebase()) {
        hideElement('loading');
        showElement('error-container');
        setElementText('error-message', 'Could not connect to the server. Please try again later.');
        return;
    }

    // Check for valid invite ID
    if (!inviteId) {
        hideElement('loading');
        showElement('error-container');
        setElementText('error-title', 'Invitation Required');
        setElementText('error-message', 'Please use the invitation link you received to access this page.');
        return;
    }

    // Load invite data
    const invite = await loadInviteData(inviteId);

    if (!invite) {
        hideElement('loading');
        showElement('error-container');
        setElementText('error-title', 'Invalid Invitation');
        setElementText('error-message', 'This invitation link is not valid. Please check the link or contact the host.');
        return;
    }

    // Load existing RSVP if any
    const existingRsvp = await loadExistingRsvp(inviteId);

    // Hide loading, show content
    hideElement('loading');
    showElement('invitation-content');

    // Record that this invite was viewed
    recordView(inviteId);

    // Populate guest name
    setElementText('guest-name', invite.guestName);

    // Populate dropdowns based on maxAdults and maxKids
    const maxAdults = invite.maxAdults || 2;
    const maxKids = invite.maxKids || 0;
    const showCount = invite.showInvitedCount !== false;
    populateAdultsDropdown(maxAdults);
    populateKidsDropdown(maxKids);
    showInvitedCount(maxAdults, maxKids, showCount);

    // If there's an existing RSVP, pre-fill the form
    if (existingRsvp) {
        prefillRsvpForm(existingRsvp);
    }

    // Setup form submission
    setupRsvpForm(inviteId, invite.guestName);
}

function populateAdultsDropdown(maxAdults) {
    const select = document.getElementById('num-adults');
    if (!select) return;

    select.innerHTML = '';
    for (let i = 0; i <= maxAdults; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i === 1 ? '1 adult' : `${i} adults`;
        select.appendChild(option);
    }
    // Default to max adults
    select.value = maxAdults;
}

function populateKidsDropdown(maxKids) {
    const select = document.getElementById('num-kids');
    if (!select) return;

    select.innerHTML = '';
    for (let i = 0; i <= maxKids; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i === 1 ? '1 kid' : `${i} kids`;
        select.appendChild(option);
    }
    // Default to max kids
    select.value = maxKids;
}

function showInvitedCount(maxAdults, maxKids, showCount) {
    const el = document.getElementById('invited-count');
    if (!el) return;

    // If showCount is false, just show "You're invited!" with emoji
    if (showCount === false) {
        el.textContent = "You're invited! 🎉";
        return;
    }

    const adultText = maxAdults === 1 ? '1 adult' : `${maxAdults} adults`;
    const kidText = maxKids === 1 ? '1 kid' : `${maxKids} kids`;

    if (maxKids === 0) {
        el.textContent = `You're invited: ${adultText}`;
    } else {
        el.textContent = `You're invited: ${adultText}, ${kidText}`;
    }
}

function prefillRsvpForm(rsvp) {
    // Select the RSVP option
    const options = document.querySelectorAll('.rsvp-option');
    options.forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.value === rsvp.attending) {
            opt.classList.add('selected');
        }
    });

    // Set number of adults
    const numAdultsSelect = document.getElementById('num-adults');
    if (numAdultsSelect && rsvp.numAdults !== undefined) {
        numAdultsSelect.value = rsvp.numAdults;
    }

    // Set number of kids
    const numKidsSelect = document.getElementById('num-kids');
    if (numKidsSelect && rsvp.numKids !== undefined) {
        numKidsSelect.value = rsvp.numKids;
    }

    // Show confirmation that RSVP was already submitted
    const statusEl = document.getElementById('rsvp-status');
    if (statusEl) {
        statusEl.textContent = 'You have already RSVP\'d. You can update your response below.';
        statusEl.style.display = 'block';
    }
}

function setupRsvpForm(inviteId, guestName) {
    // RSVP option buttons
    const options = document.querySelectorAll('.rsvp-option');
    let selectedOption = null;

    options.forEach(opt => {
        opt.addEventListener('click', () => {
            options.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedOption = opt.dataset.value;
        });
    });

    // Submit button
    const submitBtn = document.getElementById('submit-rsvp');
    const form = document.getElementById('rsvp-form');
    const successMsg = document.getElementById('success-message');

    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            if (!selectedOption) {
                alert('Please select Yes, No, or Maybe');
                return;
            }

            const numAdults = document.getElementById('num-adults')?.value || 0;
            const numKids = document.getElementById('num-kids')?.value || 0;
            const message = document.getElementById('guest-message')?.value || '';

            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            const rsvpData = {
                attending: selectedOption,
                numAdults: parseInt(numAdults),
                numKids: parseInt(numKids),
                message: message.trim()
            };

            // Submit to Firebase (or demo mode)
            if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
                const success = await submitRsvp(inviteId, rsvpData);
                if (!success) {
                    alert('There was an error submitting your RSVP. Please try again.');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit RSVP';
                    return;
                }
            }

            // Show success
            if (form) form.classList.add('hidden');
            if (successMsg) {
                successMsg.classList.remove('hidden');
                const responseText = selectedOption === 'yes'
                    ? "We can't wait to see you!"
                    : selectedOption === 'maybe'
                    ? "We hope you can make it!"
                    : "We'll miss you!";
                setElementText('success-response', responseText);
            }
        });
    }

    // Message form (separate from RSVP)
    const messageBtn = document.getElementById('submit-message');
    if (messageBtn) {
        messageBtn.addEventListener('click', async () => {
            const messageInput = document.getElementById('birthday-message');
            const messageText = messageInput?.value || '';

            if (!messageText.trim()) {
                alert('Please enter a message');
                return;
            }

            messageBtn.disabled = true;
            messageBtn.textContent = 'Sending...';

            if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
                const success = await submitMessage(inviteId, guestName, messageText);
                if (!success) {
                    alert('There was an error sending your message. Please try again.');
                    messageBtn.disabled = false;
                    messageBtn.textContent = 'Send Message';
                    return;
                }
            }

            messageInput.value = '';
            messageBtn.textContent = 'Message Sent!';
            setTimeout(() => {
                messageBtn.disabled = false;
                messageBtn.textContent = 'Send Message';
            }, 2000);
        });
    }
}

// ============================================
// ADMIN PAGE INITIALIZATION
// ============================================

async function initAdminPage() {
    // Check admin access
    if (!isAdminMode()) {
        window.location.href = window.location.pathname;
        return;
    }

    showElement('loading');
    hideElement('admin-content');

    // Demo mode check
    if (firebaseConfig.apiKey === "YOUR_API_KEY") {
        console.log('Running admin in demo mode');
        hideElement('loading');
        showElement('admin-content');
        loadDemoAdminData();
        setupAdminForms();
        return;
    }

    // Initialize Firebase
    if (!initFirebase()) {
        alert('Could not connect to Firebase. Please check your configuration.');
        return;
    }

    // Load all data
    await refreshAdminData();

    hideElement('loading');
    showElement('admin-content');

    // Setup real-time listeners
    setupRealtimeListeners();

    // Setup forms
    setupAdminForms();
}

async function refreshAdminData() {
    const [invites, rsvps, messages, views] = await Promise.all([
        loadAllInvites(),
        loadAllRsvps(),
        loadAllMessages(),
        loadAllViews()
    ]);

    renderAdminStats(invites, rsvps, views);
    renderGuestTable(invites, rsvps, views);
    renderMessages(messages, invites);
}

function loadDemoAdminData() {
    // Demo data for testing without Firebase
    const demoInvites = {
        'smith-family-abc123': { guestName: 'Smith Family', maxAdults: 2, maxKids: 2, createdAt: Date.now() },
        'johnson-xyz789': { guestName: 'Johnson Family', maxAdults: 2, maxKids: 1, createdAt: Date.now() },
        'davis-demo': { guestName: 'Davis Family', maxAdults: 2, maxKids: 0, createdAt: Date.now() }
    };

    const demoRsvps = {
        'smith-family-abc123': { attending: 'yes', numAdults: 2, numKids: 1, message: 'So excited!', updatedAt: Date.now() },
        'johnson-xyz789': { attending: 'maybe', numAdults: 1, numKids: 1, message: '', updatedAt: Date.now() }
    };

    const demoViews = {
        'smith-family-abc123': { viewedAt: Date.now(), viewCount: 2 },
        'johnson-xyz789': { viewedAt: Date.now(), viewCount: 1 }
    };

    const demoMessages = {
        'msg1': { inviteId: 'smith-family-abc123', guestName: 'Smith Family', text: 'Happy birthday Sara!', createdAt: Date.now() }
    };

    renderAdminStats(demoInvites, demoRsvps, demoViews);
    renderGuestTable(demoInvites, demoRsvps, demoViews);
    renderMessages(demoMessages, demoInvites);
}

function renderAdminStats(invites, rsvps, views) {
    const inviteIds = Object.keys(invites);
    const rsvpData = Object.values(rsvps);

    const totalInvites = inviteIds.length;
    const viewedCount = views ? Object.keys(views).length : 0;
    const yesCount = rsvpData.filter(r => r.attending === 'yes').length;
    const noCount = rsvpData.filter(r => r.attending === 'no').length;
    const maybeCount = rsvpData.filter(r => r.attending === 'maybe').length;
    const pendingCount = totalInvites - rsvpData.length;

    // Calculate total adults and kids from confirmed attendees
    const totalAdults = rsvpData
        .filter(r => r.attending === 'yes')
        .reduce((sum, r) => sum + (r.numAdults || 0), 0);
    const totalKids = rsvpData
        .filter(r => r.attending === 'yes')
        .reduce((sum, r) => sum + (r.numKids || 0), 0);

    setElementText('stat-total', totalInvites);
    setElementText('stat-viewed', viewedCount);
    setElementText('stat-yes', yesCount);
    setElementText('stat-no', noCount);
    setElementText('stat-maybe', maybeCount);
    setElementText('stat-pending', pendingCount);
    setElementText('stat-adults', totalAdults);
    setElementText('stat-kids', totalKids);
}

function renderGuestTable(invites, rsvps, views) {
    const tbody = document.getElementById('guest-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    Object.entries(invites).forEach(([inviteId, invite]) => {
        const rsvp = rsvps[inviteId];
        const view = views ? views[inviteId] : null;
        const row = document.createElement('tr');

        const status = rsvp ? rsvp.attending : 'pending';
        const statusClass = status;
        const statusText = status.charAt(0).toUpperCase() + status.slice(1);
        const viewedText = view ? '👁 Viewed' : 'Not viewed';
        const viewedStyle = view ? 'color: var(--zombie-green);' : 'color: rgba(255,255,255,0.4);';

        // Format adults: attending/max (e.g., "2/2")
        const maxAdults = invite.maxAdults || 2;
        const maxKids = invite.maxKids || 0;
        const adultsText = rsvp ? `${rsvp.numAdults || 0}/${maxAdults}` : `0/${maxAdults}`;
        const kidsText = rsvp ? `${rsvp.numKids || 0}/${maxKids}` : `0/${maxKids}`;

        row.innerHTML = `
            <td>${invite.guestName}</td>
            <td><span style="${viewedStyle} font-size: 0.8rem;">${viewedText}</span></td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${adultsText}</td>
            <td>${kidsText}</td>
            <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${rsvp?.message || ''}">${rsvp?.message || '-'}</td>
            <td>
                <button class="btn-copy" onclick="copyToClipboard('${generateInviteUrl(inviteId)}')" style="padding: 4px 8px; font-size: 0.75rem;">Copy Link</button>
            </td>
        `;

        tbody.appendChild(row);
    });

    if (Object.keys(invites).length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; opacity: 0.5;">No invites created yet</td></tr>';
    }
}

function renderMessages(messages, invites) {
    const container = document.getElementById('messages-list');
    if (!container) return;

    container.innerHTML = '';

    const messageArray = Object.entries(messages)
        .map(([id, msg]) => ({ id, ...msg }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (messageArray.length === 0) {
        container.innerHTML = '<p style="opacity: 0.5; text-align: center;">No messages yet</p>';
        return;
    }

    messageArray.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'message-item';
        div.innerHTML = `
            <div class="message-author">${msg.guestName}</div>
            <div class="message-text">"${msg.text}"</div>
            <div class="message-time">${formatTimestamp(msg.createdAt)}</div>
        `;
        container.appendChild(div);
    });
}

function setupRealtimeListeners() {
    if (!isFirebaseReady) return;

    // Listen for changes to refresh data
    db.ref(`events/${EVENT_ID}`).on('value', () => {
        refreshAdminData();
    });
}

function setupAdminForms() {
    // Create invite form
    const createBtn = document.getElementById('create-invite-btn');
    if (createBtn) {
        createBtn.addEventListener('click', async () => {
            const nameInput = document.getElementById('new-guest-name');
            const maxAdultsInput = document.getElementById('new-max-adults');
            const maxKidsInput = document.getElementById('new-max-kids');
            const showCountInput = document.getElementById('new-show-count');
            const linkDisplay = document.getElementById('new-invite-link');

            const guestName = nameInput?.value || '';
            const maxAdults = maxAdultsInput?.value || 2;
            const maxKids = maxKidsInput?.value || 2;
            const showInvitedCount = showCountInput?.checked !== false;

            if (!guestName.trim()) {
                alert('Please enter a guest name');
                return;
            }

            createBtn.disabled = true;
            createBtn.textContent = 'Creating...';

            let inviteId;
            if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
                inviteId = await createInvite(guestName, maxAdults, maxKids, showInvitedCount);
            } else {
                // Demo mode
                inviteId = guestName.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
            }

            if (inviteId) {
                const url = generateInviteUrl(inviteId);
                if (linkDisplay) {
                    linkDisplay.value = url;
                    linkDisplay.parentElement.classList.remove('hidden');
                }
                nameInput.value = '';

                // Refresh table in demo mode
                if (firebaseConfig.apiKey === "YOUR_API_KEY") {
                    loadDemoAdminData();
                }
            } else {
                alert('Error creating invite. Please try again.');
            }

            createBtn.disabled = false;
            createBtn.textContent = 'Create Invite';
        });
    }

    // Copy link button
    const copyLinkBtn = document.getElementById('copy-new-link');
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', () => {
            const linkInput = document.getElementById('new-invite-link');
            if (linkInput?.value) {
                copyToClipboard(linkInput.value);
            }
        });
    }
}

// ============================================
// PAGE INITIALIZATION
// ============================================

// Auto-detect which page we're on and initialize
document.addEventListener('DOMContentLoaded', () => {
    const isAdmin = document.body.classList.contains('admin-page');

    if (isAdmin || isAdminMode()) {
        initAdminPage();
    } else {
        initGuestPage();
    }
});
