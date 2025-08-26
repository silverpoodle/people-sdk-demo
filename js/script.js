// js/script.js

async function logout() {
    if (window.pe) {
        await pe.forgetPerson();
    }
    // localStorage도 함께 비워줍니다.
    await localStorage.removeItem('PE:state');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');
    window.location.reload();
}

document.addEventListener('DOMContentLoaded', () => {
  const welcomeNameSpan = document.getElementById('welcomeName');
  const loginBtn = document.getElementById('goToLoginBtn');
  const logoutBtn = document.getElementById('goToLogoutBtn');

  // Navigation button handlers
  loginBtn?.addEventListener('click', () => { window.location.href = 'login.html'; });
  logoutBtn?.addEventListener('click', logout);

  // Extract user ID from PE:state in localStorage
  function getUserIdFromPEState() {
    try {
      const stored = localStorage.getItem('PE:state');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return parsed?.person?.id || null;
    } catch (e) {
      console.error('Failed to parse PE:state:', e);
      return null;
    }
  }

  // Fetch customer info by user ID via API
  async function fetchCustomerInfo(userId) {
    if (!userId) return null;

    const apiUrl = `https://ejgdwr.api.infobip.com/people/2/persons?type=PHONE&identifier=` + userId;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'App 8370536f468242d2bef67e8f832dd9d3-6cab6484-13e1-4d3e-8114-3b83bef5bf19'
    };

    try {
      const response = await fetch(apiUrl, { method: 'GET', headers });
      if (!response.ok) {
        console.warn(`API request failed with status ${response.status}`);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching customer info:', error);
      return null;
    }
  }

  // Update UI based on login status
  async function updateLoginStatus() {
    let displayName = null;

    // Check localStorage first (immediate post-login display)
    const firstName = localStorage.getItem('userFirstName');
    const lastName = localStorage.getItem('userLastName');

    if (firstName && lastName) {
      displayName = `${lastName}${firstName}`;
      localStorage.removeItem('userFirstName');
      localStorage.removeItem('userLastName');
    } else {
      // Check PE:state and fetch from API
      const userId = getUserIdFromPEState();
      if (userId) {
        const customer = await fetchCustomerInfo(userId);
        if (customer?.firstName) {
          displayName = `${customer.lastName || ''}${customer.firstName}`;
        } else {
          displayName = userId;
        }
      }
    }

    // Set welcome text
    welcomeNameSpan.textContent = displayName || '방문자';

    // Toggle buttons visibility
    if (displayName) {
      logoutBtn.style.display = 'block';
      loginBtn.style.display = 'none';
    } else {
      logoutBtn.style.display = 'none';
      loginBtn.style.display = 'block';
    }
  }

  // Run login status check after slight delay to ensure SDK/data load
  setTimeout(updateLoginStatus, 200);
});