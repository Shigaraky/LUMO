// ==========================================
// LUMO - Sistema PIN
// ==========================================

const PIN_STORAGE_KEY = 'lumo_pin';
let pinConfigured = false;
let pinHash = '';

// ==========================================
// FUNZIONI UTILITY
// ==========================================
function hashPin(pin) {
  // Hash semplice per il PIN (non crittograficamente sicuro ma sufficiente per privacy locale)
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

function isValidPin(pin) {
  return /^\d{4,6}$/.test(pin);
}

function showPinScreen(screenId) {
  const screens = ['pinSetupScreen', 'pinLoginScreen', 'pinResetScreen'];
  screens.forEach(screen => {
    document.getElementById(screen).style.display = screen === screenId ? 'block' : 'none';
  });
  document.getElementById('pinOverlay').style.display = 'flex';
}

function hidePinScreen() {
  document.getElementById('pinOverlay').style.display = 'none';
  document.getElementById('mainContainer').style.display = 'block';
}

function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.parentElement.classList.add('pin-shake');
    setTimeout(() => {
      errorElement.parentElement.classList.remove('pin-shake');
    }, 300);
  }
}

function clearError(elementId) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = '';
  }
}

// ==========================================
// GESTIONE PIN
// ==========================================
function checkPinStatus() {
  return new Promise((resolve) => {
    const storedPin = localStorage.getItem(PIN_STORAGE_KEY);
    pinConfigured = !!storedPin;
    pinHash = storedPin || '';
    
    if (!pinConfigured) {
      // Mostra schermata di setup PIN
      showPinScreen('pinSetupScreen');
      setupPinListeners();
    } else {
      // Mostra schermata di login PIN
      showPinScreen('pinLoginScreen');
      setupLoginListeners();
    }
    
    resolve();
  });
}

function setupPin() {
  const pinInput = document.getElementById('pinSetupInput').value;
  const pinConfirm = document.getElementById('pinSetupConfirm').value;
  
  clearError('pinSetupError');
  
  // Validazione
  if (!isValidPin(pinInput)) {
    showError('pinSetupError', 'Il PIN deve avere 4-6 cifre numeriche');
    return;
  }
  
  if (pinInput !== pinConfirm) {
    showError('pinSetupError', 'I PIN non corrispondono');
    return;
  }
  
  // Salva il PIN (hash)
  const hashedPin = hashPin(pinInput);
  localStorage.setItem(PIN_STORAGE_KEY, hashedPin);
  pinConfigured = true;
  pinHash = hashedPin;
  
  // Mostra successo
  const errorElement = document.getElementById('pinSetupError');
  errorElement.textContent = '✓ PIN configurato con successo!';
  errorElement.style.color = '#11998e';
  
  // Nascondi schermata dopo 1.5 secondi
  setTimeout(() => {
    hidePinScreen();
  }, 1500);
}

function verifyPin(pin) {
  const hashedInput = hashPin(pin);
  return hashedInput === pinHash;
}

function loginWithPin() {
  const pinInput = document.getElementById('pinLoginInput').value;
  
  clearError('pinLoginError');
  
  if (!isValidPin(pinInput)) {
    showError('pinLoginError', 'PIN non valido');
    return;
  }
  
  if (verifyPin(pinInput)) {
    hidePinScreen();
  } else {
    showError('pinLoginError', 'PIN errato');
    // Pulisci l'input
    document.getElementById('pinLoginInput').value = '';
  }
}

function resetPin() {
  const pinInput = document.getElementById('pinResetInput').value;
  const pinConfirm = document.getElementById('pinResetConfirm').value;
  
  clearError('pinResetError');
  
  // Validazione
  if (!isValidPin(pinInput)) {
    showError('pinResetError', 'Il PIN deve avere 4-6 cifre numeriche');
    return;
  }
  
  if (pinInput !== pinConfirm) {
    showError('pinResetError', 'I PIN non corrispondono');
    return;
  }
  
  // Conferma importante (resetta tutti i dati!)
  if (!confirm('ATTENZIONE: Reset del PIN eliminerà TUTTI i dati dell\'app. Continuare?')) {
    return;
  }
  
  // Salva nuovo PIN
  const hashedPin = hashPin(pinInput);
  localStorage.setItem(PIN_STORAGE_KEY, hashedPin);
  pinHash = hashedPin;
  
  // Cancella tutti gli altri dati
  localStorage.removeItem('lumo_users');
  localStorage.removeItem('lumo_theme');
  
  // Mostra successo
  const errorElement = document.getElementById('pinResetError');
  errorElement.textContent = '✓ PIN resettato. Dati cancellati.';
  errorElement.style.color = '#11998e';
  
  // Rilascia pagina dopo 2 secondi
  setTimeout(() => {
    location.reload();
  }, 2000);
}

function changePin() {
  if (!pinConfigured) return;
  
  const oldPin = prompt('Inserisci il PIN attuale:');
  if (!oldPin || !verifyPin(oldPin)) {
    alert('PIN non valido!');
    return;
  }
  
  const newPin = prompt('Inserisci il nuovo PIN (4-6 cifre):');
  if (!newPin || !isValidPin(newPin)) {
    alert('Nuovo PIN non valido!');
    return;
  }
  
  const confirmPin = prompt('Conferma il nuovo PIN:');
  if (newPin !== confirmPin) {
    alert('I PIN non corrispondono!');
    return;
  }
  
  // Salva nuovo PIN
  const hashedPin = hashPin(newPin);
  localStorage.setItem(PIN_STORAGE_KEY, hashedPin);
  pinHash = hashedPin;
  
  alert('✓ PIN cambiato con successo!');
}

function showPinSetup(isChange = false) {
  if (isChange) {
    document.getElementById('pinSetupScreen').querySelector('h3').textContent = '🔐 Cambia PIN';
    document.getElementById('pinSetupButton').textContent = 'Cambia PIN';
  } else {
    document.getElementById('pinSetupScreen').querySelector('h3').textContent = '🔐 Crea il tuo PIN';
    document.getElementById('pinSetupButton').textContent = 'Crea PIN';
  }
  showPinScreen('pinSetupScreen');
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function setupPinListeners() {
  // Setup PIN
  const pinSetupButton = document.getElementById('pinSetupButton');
  if (pinSetupButton) {
    pinSetupButton.onclick = setupPin;
  }
  
  // Input Enter per setup
  const pinSetupInput = document.getElementById('pinSetupInput');
  const pinSetupConfirm = document.getElementById('pinSetupConfirm');
  
  if (pinSetupInput) {
    pinSetupInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        pinSetupConfirm.focus();
      }
    });
  }
  
  if (pinSetupConfirm) {
    pinSetupConfirm.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        setupPin();
      }
    });
  }
}

function setupLoginListeners() {
  // Login PIN
  const pinLoginButton = document.getElementById('pinLoginButton');
  if (pinLoginButton) {
    pinLoginButton.onclick = loginWithPin;
  }
  
  // Forgot PIN
  const forgotPinLink = document.getElementById('forgotPinLink');
  if (forgotPinLink) {
    forgotPinLink.onclick = () => {
      showPinScreen('pinResetScreen');
      setupResetListeners();
    };
  }
  
  // Input Enter per login
  const pinLoginInput = document.getElementById('pinLoginInput');
  if (pinLoginInput) {
    pinLoginInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        loginWithPin();
      }
    });
  }
}

function setupResetListeners() {
  // Reset PIN
  const pinResetButton = document.getElementById('pinResetButton');
  if (pinResetButton) {
    pinResetButton.onclick = resetPin;
  }
  
  // Back to login
  const backToLoginLink = document.getElementById('backToLoginLink');
  if (backToLoginLink) {
    backToLoginLink.onclick = () => {
      showPinScreen('pinLoginScreen');
      setupLoginListeners();
    };
  }
  
  // Input Enter per reset
  const pinResetInput = document.getElementById('pinResetInput');
  const pinResetConfirm = document.getElementById('pinResetConfirm');
  
  if (pinResetInput) {
    pinResetInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        pinResetConfirm.focus();
      }
    });
  }
  
  if (pinResetConfirm) {
    pinResetConfirm.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        resetPin();
      }
    });
  }
}

// ==========================================
// ESPORTAZIONE FUNZIONI GLOBALI
// ==========================================
window.verifyPin = verifyPin;
window.showPinSetup = showPinSetup;
window.changePin = changePin;

console.log('Sistema PIN inizializzato!');