// js/script.js

// DEMO ONLY: Secret key in client-side JS exposes it to anyone viewing source.
// In production, generate the JWT on a server and return only the signed token.
async function generateLiveChatJWT(msisdn) {
  const WIDGET_ID = '5123049c-df72-497f-b2e6-a2e0114709cb';
  const SKI      = '89c55909-8e41-4de5-b70d-fbccc4d06882';
  const SECRET   = 'PknOMPgn6CbDE71HHfZgZtrJHxkkTRRm1Sz2Fc2LfVg=';

  const now = Math.floor(Date.now() / 1000);
  const toB64Url = s => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const header  = toB64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = toB64Url(JSON.stringify({
    iat: now,
    exp: now + 300,
    iss: WIDGET_ID,
    jti: crypto.randomUUID(),
    ski: SKI,
    stp: 'msisdn',
    sub: msisdn,
  }));

  const msg      = `${header}.${payload}`;
  const keyBytes = Uint8Array.from(atob(SECRET), c => c.charCodeAt(0));
  const key      = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig    = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  return `${msg}.${sigB64}`;
}

async function logout() {
    if (window.liveChat) {
        liveChat('logout');
    }
    if (window.pe) {
        await pe.forgetPerson();
    }
    localStorage.removeItem('PE:state');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');
    localStorage.removeItem('userMobile');
    window.location.reload();
}

document.addEventListener('DOMContentLoaded', () => {
  const welcomeNameSpan = document.getElementById('welcomeName');
  const loginBtn  = document.getElementById('goToLoginBtn');
  const logoutBtn = document.getElementById('goToLogoutBtn');

  loginBtn?.addEventListener('click', () => { window.location.href = 'login.html'; });
  logoutBtn?.addEventListener('click', logout);

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

  async function fetchCustomerInfo(userId) {
    if (!userId) return null;

    const apiUrl = `https://16jmn.api.infobip.com/people/2/persons?type=PHONE&identifier=` + userId;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'App 5772f8da8c9d72e8b4ac52b356a3a430-b27e6019-cc26-45c2-b029-e92b0bf8ada7'
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

  async function authenticateLiveChat(mobile) {
    if (!mobile || !window.liveChat) return;
    try {
      const jwt = await generateLiveChatJWT(mobile);
      liveChat('auth', jwt, (err) => {
        if (err) console.error('LiveChat auth failed:', err);
      });
    } catch (e) {
      console.error('JWT generation failed:', e);
    }
  }

  async function updateLoginStatus() {
    let displayName = null;
    let mobile = localStorage.getItem('userMobile');

    const firstName = localStorage.getItem('userFirstName');
    const lastName  = localStorage.getItem('userLastName');

    if (firstName && lastName) {
      displayName = `${lastName}${firstName}`;
      localStorage.removeItem('userFirstName');
      localStorage.removeItem('userLastName');
    } else {
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

    welcomeNameSpan.textContent = displayName || '방문자';

    if (displayName) {
      logoutBtn.style.display = 'block';
      loginBtn.style.display  = 'none';
      await authenticateLiveChat(mobile);
    } else {
      logoutBtn.style.display = 'none';
      loginBtn.style.display  = 'block';
    }
  }

  setTimeout(updateLoginStatus, 200);
});
