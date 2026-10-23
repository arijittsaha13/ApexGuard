/**
 * ApexForms • Form Design & Validation Logic
 * Project 4: Form Design & Validation
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const form = document.getElementById('registration-form');
  const card = document.getElementById('form-card');
  const progressBar = document.getElementById('progress-bar');
  const completionText = document.getElementById('completion-text');
  const completionPill = document.getElementById('completion-pill');
  
  // Inputs
  const fullnameInput = document.getElementById('fullname');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const termsInput = document.getElementById('terms');
  const roleCards = document.querySelectorAll('.role-card');

  // Groups
  const groupFullname = document.getElementById('group-fullname');
  const groupEmail = document.getElementById('group-email');
  const groupPhone = document.getElementById('group-phone');
  const groupPassword = document.getElementById('group-password');
  const groupConfirmPassword = document.getElementById('group-confirm-password');
  const groupTerms = document.getElementById('group-terms');

  // Feedback elements
  const fullnameMsg = document.getElementById('fullname-msg');
  const emailMsg = document.getElementById('email-msg');
  const phoneMsg = document.getElementById('phone-msg');
  const passwordMsg = document.getElementById('password-msg');
  const confirmPasswordMsg = document.getElementById('confirm-password-msg');
  const termsMsg = document.getElementById('terms-msg');

  // Password Strength & Criteria Elements
  const strengthBadge = document.getElementById('strength-badge');
  const meterSegments = [
    document.getElementById('meter-segment-1'),
    document.getElementById('meter-segment-2'),
    document.getElementById('meter-segment-3'),
    document.getElementById('meter-segment-4'),
  ];
  const ruleLength = document.getElementById('rule-length');
  const ruleUpper = document.getElementById('rule-upper');
  const ruleNumber = document.getElementById('rule-number');
  const ruleSpecial = document.getElementById('rule-special');
  const togglePasswordBtn = document.getElementById('toggle-password');

  // Buttons & Controls
  const submitBtn = document.getElementById('submit-btn');
  const btnSpinner = document.getElementById('btn-spinner');
  const resetBtn = document.getElementById('reset-btn');
  const themeToggle = document.getElementById('theme-toggle');
  const soundToggle = document.getElementById('sound-toggle');
  const themeMoon = document.getElementById('theme-moon');
  const themeSun = document.getElementById('theme-sun');
  const emailSuggestions = document.getElementById('email-suggestions');
  const domainChips = document.querySelectorAll('.domain-chip');

  // Success Modal
  const successModal = document.getElementById('success-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const receiptName = document.getElementById('receipt-name');
  const receiptEmail = document.getElementById('receipt-email');
  const receiptPhone = document.getElementById('receipt-phone');
  const receiptRole = document.getElementById('receipt-role');
  const confettiCanvas = document.getElementById('confetti-canvas');

  // Status Banner
  const statusBanner = document.getElementById('status-banner');
  const bannerTitle = document.getElementById('banner-title');
  const bannerDesc = document.getElementById('banner-desc');
  const bannerIcon = document.getElementById('banner-icon');
  const bannerClose = document.getElementById('banner-close');

  // --- Audio Synthesis via Web Audio API ---
  let soundEnabled = true;
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function playTone(freq, type = 'sine', duration = 0.08, gainVal = 0.04) {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') audioCtx.resume();
      
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio context might be restricted
    }
  }

  function playSuccessChime() {
    if (!soundEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => playTone(freq, 'triangle', 0.22, 0.07), idx * 80);
    });
  }

  function playErrorBuzz() {
    if (!soundEnabled) return;
    playTone(180, 'sawtooth', 0.18, 0.05);
  }

  // --- Sound Toggle Handler ---
  soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    const onIcon = soundToggle.querySelector('.audio-on-icon');
    const offIcon = soundToggle.querySelector('.audio-off-icon');
    if (soundEnabled) {
      onIcon.classList.remove('hidden');
      offIcon.classList.add('hidden');
      soundToggle.classList.add('active');
      playTone(600, 'sine', 0.1, 0.06);
      showToast('Sound enabled', 'info');
    } else {
      onIcon.classList.add('hidden');
      offIcon.classList.remove('hidden');
      soundToggle.classList.remove('active');
      showToast('Sound muted', 'info');
    }
  });

  // --- Theme Toggle Handler ---
  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    if (theme === 'light') {
      themeMoon.classList.add('hidden');
      themeSun.classList.remove('hidden');
    } else {
      themeMoon.classList.remove('hidden');
      themeSun.classList.add('hidden');
    }
    localStorage.setItem('apex_theme', theme);
  }

  const savedTheme = localStorage.getItem('apex_theme') || 'dark';
  applyTheme(savedTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    playTone(450, 'sine', 0.08);
  });

  // --- Validation State Tracking ---
  const validStatus = {
    fullname: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
    terms: false
  };

  function updateProgress() {
    const totalFields = Object.keys(validStatus).length;
    const validCount = Object.values(validStatus).filter(Boolean).length;
    const pct = Math.round((validCount / totalFields) * 100);

    progressBar.style.width = `${pct}%`;
    completionText.textContent = `${validCount} / ${totalFields} Completed`;

    if (validCount === totalFields) {
      completionPill.classList.add('all-done');
    } else {
      completionPill.classList.remove('all-done');
    }
  }

  // --- Helper UI Setters ---
  function setFieldValid(groupEl, msgEl) {
    groupEl.classList.remove('is-invalid');
    groupEl.classList.add('is-valid');
    if (msgEl) {
      msgEl.textContent = '';
    }
  }

  function setFieldInvalid(groupEl, msgEl, errorText) {
    groupEl.classList.remove('is-valid');
    groupEl.classList.add('is-invalid');
    if (msgEl) {
      msgEl.textContent = errorText;
    }
  }

  function clearFieldState(groupEl, msgEl) {
    groupEl.classList.remove('is-valid', 'is-invalid');
    if (msgEl) msgEl.textContent = '';
  }

  // --- Validation Functions ---

  // 1. Full Name
  function validateFullName(showError = true) {
    const value = fullnameInput.value.trim();
    const nameRegex = /^[a-zA-Z\s'.]+$/;

    if (value === '') {
      if (showError) setFieldInvalid(groupFullname, fullnameMsg, 'Please enter your full name');
      validStatus.fullname = false;
    } else if (value.length < 3) {
      if (showError) setFieldInvalid(groupFullname, fullnameMsg, 'Name must be at least 3 characters');
      validStatus.fullname = false;
    } else if (!nameRegex.test(value)) {
      if (showError) setFieldInvalid(groupFullname, fullnameMsg, 'Name can only contain letters and spaces');
      validStatus.fullname = false;
    } else {
      setFieldValid(groupFullname, fullnameMsg);
      validStatus.fullname = true;
    }
    updateProgress();
    return validStatus.fullname;
  }

  // 2. Email Address
  function validateEmail(showError = true) {
    const value = emailInput.value.trim();
    // High-accuracy email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Dynamic quick chips visibility
    if (value.length > 1 && !value.includes('@')) {
      emailSuggestions.classList.remove('hidden');
    } else {
      emailSuggestions.classList.add('hidden');
    }

    if (value === '') {
      if (showError) setFieldInvalid(groupEmail, emailMsg, 'Please enter your email address');
      validStatus.email = false;
    } else if (!emailRegex.test(value)) {
      if (showError) setFieldInvalid(groupEmail, emailMsg, 'Please enter a valid email (e.g. name@domain.com)');
      validStatus.email = false;
    } else {
      setFieldValid(groupEmail, emailMsg);
      validStatus.email = true;
    }
    updateProgress();
    return validStatus.email;
  }

  // Quick domain chips click handler
  domainChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const currentVal = emailInput.value.trim();
      if (!currentVal.includes('@')) {
        emailInput.value = currentVal + chip.getAttribute('data-domain');
      } else {
        const prefix = currentVal.split('@')[0];
        emailInput.value = prefix + chip.getAttribute('data-domain');
      }
      playTone(550, 'sine', 0.05);
      validateEmail(true);
      emailInput.focus();
    });
  });

  // 3. Phone Number
  function validatePhone(showError = true) {
    const rawValue = phoneInput.value.replace(/[\s-]/g, '');
    const phoneRegex = /^[6-9]\d{9}$/; // Standard 10-digit mobile number format

    if (rawValue === '') {
      if (showError) setFieldInvalid(groupPhone, phoneMsg, 'Please enter your 10-digit mobile number');
      validStatus.phone = false;
    } else if (!/^\d+$/.test(rawValue)) {
      if (showError) setFieldInvalid(groupPhone, phoneMsg, 'Only digits are allowed');
      validStatus.phone = false;
    } else if (rawValue.length !== 10) {
      if (showError) setFieldInvalid(groupPhone, phoneMsg, `Must be 10 digits (current: ${rawValue.length})`);
      validStatus.phone = false;
    } else if (!phoneRegex.test(rawValue)) {
      if (showError) setFieldInvalid(groupPhone, phoneMsg, 'Mobile number should start with 6, 7, 8, or 9');
      validStatus.phone = false;
    } else {
      setFieldValid(groupPhone, phoneMsg);
      validStatus.phone = true;
    }
    updateProgress();
    return validStatus.phone;
  }

  // 4. Password & Dynamic Strength Meter
  function evaluatePasswordStrength(val) {
    let score = 0;
    const checks = {
      length: val.length >= 8,
      upper: /[A-Z]/.test(val),
      number: /[0-9]/.test(val),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val)
    };

    // Update Criteria Checklist
    function updateRule(elem, passed) {
      const icon = elem.querySelector('.crit-icon');
      if (passed) {
        elem.classList.add('met');
        icon.textContent = '✓';
      } else {
        elem.classList.remove('met');
        icon.textContent = '○';
      }
    }

    updateRule(ruleLength, checks.length);
    updateRule(ruleUpper, checks.upper);
    updateRule(ruleNumber, checks.number);
    updateRule(ruleSpecial, checks.special);

    if (checks.length) score++;
    if (checks.upper) score++;
    if (checks.number) score++;
    if (checks.special) score++;

    return { score, checks };
  }

  function validatePassword(showError = true) {
    const value = passwordInput.value;
    const { score, checks } = evaluatePasswordStrength(value);

    // Reset meter segments
    meterSegments.forEach(seg => {
      seg.className = 'meter-bar';
    });

    strengthBadge.className = 'strength-tag';

    if (value === '') {
      strengthBadge.textContent = 'Required';
      if (showError) setFieldInvalid(groupPassword, passwordMsg, 'Please create a secure password');
      validStatus.password = false;
    } else {
      // Color-code meter segments according to score
      if (score === 1) {
        meterSegments[0].classList.add('active-weak');
        strengthBadge.classList.add('weak');
        strengthBadge.textContent = 'Weak';
      } else if (score === 2) {
        meterSegments[0].classList.add('active-fair');
        meterSegments[1].classList.add('active-fair');
        strengthBadge.classList.add('fair');
        strengthBadge.textContent = 'Fair';
      } else if (score === 3) {
        meterSegments[0].classList.add('active-good');
        meterSegments[1].classList.add('active-good');
        meterSegments[2].classList.add('active-good');
        strengthBadge.classList.add('good');
        strengthBadge.textContent = 'Good';
      } else if (score === 4) {
        meterSegments.forEach(seg => seg.classList.add('active-strong'));
        strengthBadge.classList.add('strong');
        strengthBadge.textContent = 'Strong';
      }

      const allCriteriaMet = checks.length && checks.upper && checks.number && checks.special;
      if (allCriteriaMet) {
        setFieldValid(groupPassword, passwordMsg);
        validStatus.password = true;
      } else {
        if (showError) setFieldInvalid(groupPassword, passwordMsg, 'Password must meet all 4 security criteria below');
        validStatus.password = false;
      }
    }

    // Trigger confirm-password recheck if confirm password has value
    if (confirmPasswordInput.value.length > 0) {
      validateConfirmPassword(true);
    }

    updateProgress();
    return validStatus.password;
  }

  // 5. Confirm Password
  function validateConfirmPassword(showError = true) {
    const pwd = passwordInput.value;
    const confirmPwd = confirmPasswordInput.value;

    if (confirmPwd === '') {
      if (showError) setFieldInvalid(groupConfirmPassword, confirmPasswordMsg, 'Please re-enter your password');
      validStatus.confirmPassword = false;
    } else if (confirmPwd !== pwd) {
      if (showError) setFieldInvalid(groupConfirmPassword, confirmPasswordMsg, 'Passwords do not match');
      validStatus.confirmPassword = false;
    } else {
      setFieldValid(groupConfirmPassword, confirmPasswordMsg);
      validStatus.confirmPassword = true;
    }
    updateProgress();
    return validStatus.confirmPassword;
  }

  // 6. Terms Checkbox
  function validateTerms(showError = true) {
    if (!termsInput.checked) {
      if (showError) setFieldInvalid(groupTerms, termsMsg, 'You must accept terms & privacy to proceed');
      validStatus.terms = false;
    } else {
      setFieldValid(groupTerms, termsMsg);
      validStatus.terms = true;
    }
    updateProgress();
    return validStatus.terms;
  }

  // --- Real-time Event Listeners ---
  fullnameInput.addEventListener('input', () => {
    validateFullName(false);
  });
  fullnameInput.addEventListener('blur', () => {
    validateFullName(true);
  });

  emailInput.addEventListener('input', () => {
    validateEmail(false);
  });
  emailInput.addEventListener('blur', () => {
    validateEmail(true);
  });

  phoneInput.addEventListener('input', (e) => {
    // Auto format spaces for easy reading
    let v = e.target.value.replace(/\D/g, '').slice(0, 10);
    if (v.length > 5) {
      v = v.slice(0, 5) + ' ' + v.slice(5);
    }
    e.target.value = v;
    validatePhone(false);
  });
  phoneInput.addEventListener('blur', () => {
    validatePhone(true);
  });

  passwordInput.addEventListener('input', () => {
    validatePassword(false);
  });
  passwordInput.addEventListener('blur', () => {
    validatePassword(true);
  });

  confirmPasswordInput.addEventListener('input', () => {
    validateConfirmPassword(false);
  });
  confirmPasswordInput.addEventListener('blur', () => {
    validateConfirmPassword(true);
  });

  termsInput.addEventListener('change', () => {
    validateTerms(true);
    playTone(600, 'sine', 0.04);
  });

  // Password Visibility Toggle
  togglePasswordBtn.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    confirmPasswordInput.setAttribute('type', isPassword ? 'text' : 'password');
    
    const eyeOpen = togglePasswordBtn.querySelector('.eye-open');
    const eyeClosed = togglePasswordBtn.querySelector('.eye-closed');
    
    if (isPassword) {
      eyeOpen.classList.add('hidden');
      eyeClosed.classList.remove('hidden');
      togglePasswordBtn.setAttribute('title', 'Hide password');
    } else {
      eyeOpen.classList.remove('hidden');
      eyeClosed.classList.add('hidden');
      togglePasswordBtn.setAttribute('title', 'Show password');
    }
    playTone(400, 'sine', 0.05);
  });

  // Role Card Selection
  roleCards.forEach(cardElem => {
    cardElem.addEventListener('click', () => {
      roleCards.forEach(c => c.classList.remove('active'));
      cardElem.classList.add('active');
      const radio = cardElem.querySelector('input[type="radio"]');
      radio.checked = true;
      playTone(500, 'sine', 0.04);
    });
  });

  // Terms and Privacy links
  document.getElementById('terms-link').addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Terms of Service: All submitted test data is validated purely client-side.', 'info');
  });

  document.getElementById('privacy-link').addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Privacy Policy: No personal credentials or entries are transmitted or stored remotely.', 'info');
  });

  // Banner Close
  bannerClose.addEventListener('click', () => {
    statusBanner.classList.add('hidden');
  });

  function showStatusBanner(title, desc, isError = true) {
    statusBanner.className = `status-banner ${isError ? 'error-mode' : 'success-mode'}`;
    bannerTitle.textContent = title;
    bannerDesc.textContent = desc;
    bannerIcon.innerHTML = isError ? '⚠️' : '🎉';
    statusBanner.classList.remove('hidden');
  }

  // --- Reset Form Handler ---
  resetBtn.addEventListener('click', () => {
    form.reset();
    [groupFullname, groupEmail, groupPhone, groupPassword, groupConfirmPassword, groupTerms].forEach(g => {
      clearFieldState(g, null);
    });
    fullnameMsg.textContent = '';
    emailMsg.textContent = '';
    phoneMsg.textContent = '';
    passwordMsg.textContent = '';
    confirmPasswordMsg.textContent = '';
    termsMsg.textContent = '';

    meterSegments.forEach(seg => seg.className = 'meter-bar');
    strengthBadge.className = 'strength-tag';
    strengthBadge.textContent = 'Too Weak';

    [ruleLength, ruleUpper, ruleNumber, ruleSpecial].forEach(elem => {
      elem.classList.remove('met');
      elem.querySelector('.crit-icon').textContent = '○';
    });

    Object.keys(validStatus).forEach(k => validStatus[k] = false);
    updateProgress();
    statusBanner.classList.add('hidden');
    emailSuggestions.classList.add('hidden');

    roleCards.forEach(c => c.classList.remove('active'));
    roleCards[0].classList.add('active');
    roleCards[0].querySelector('input').checked = true;

    playTone(320, 'sine', 0.1);
    showToast('Form reset to defaults', 'info');
  });

  // --- Toast Notifications System ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'error') icon = '⚠️';
    if (type === 'success') icon = '✅';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // --- Confetti Particles Animation Engine ---
  let confettiAnimationId = null;
  function triggerCelebrationConfetti() {
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#6366f1', '#10b981', '#38bdf8', '#f59e0b', '#ec4899', '#a855f7'];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: confettiCanvas.width / 2,
        y: confettiCanvas.height / 2 + 50,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.9) * 18 - 3,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    let startTime = Date.now();
    function render() {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      const elapsed = Date.now() - startTime;

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.vx *= 0.98; // air resistance
        p.rotation += p.rotSpeed;
        if (elapsed > 1800) {
          p.opacity = Math.max(0, p.opacity - 0.02);
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      if (elapsed < 3800) {
        confettiAnimationId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      }
    }

    if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);
    render();
  }

  // --- Form Submission Handling ---
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Trigger all validations with error messages enabled
    const isNameValid = validateFullName(true);
    const isEmailValid = validateEmail(true);
    const isPhoneValid = validatePhone(true);
    const isPasswordValid = validatePassword(true);
    const isConfirmValid = validateConfirmPassword(true);
    const isTermsValid = validateTerms(true);

    const isAllValid = isNameValid && isEmailValid && isPhoneValid && isPasswordValid && isConfirmValid && isTermsValid;

    if (!isAllValid) {
      // Audio buzz & shake visual
      playErrorBuzz();
      card.classList.remove('shake-element');
      void card.offsetWidth; // Force CSS reflow
      card.classList.add('shake-element');

      showStatusBanner(
        'Form Validation Incomplete',
        'Please review the highlighted fields with red warning indicators before submitting.',
        true
      );
      showToast('Please fix the errors before submitting', 'error');

      // Scroll smoothly to first invalid field
      const firstInvalid = document.querySelector('.form-group.is-invalid input');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // If completely valid, simulate submission with spinner
    submitBtn.disabled = true;
    btnSpinner.classList.remove('hidden');
    submitBtn.querySelector('.btn-text').textContent = 'Validating Securely...';
    playTone(580, 'sine', 0.1);

    setTimeout(() => {
      submitBtn.disabled = false;
      btnSpinner.classList.add('hidden');
      submitBtn.querySelector('.btn-text').textContent = 'Submit Registration';

      // Fill Receipt
      receiptName.textContent = fullnameInput.value.trim();
      receiptEmail.textContent = emailInput.value.trim();
      receiptPhone.textContent = phoneInput.value.trim();
      
      const selectedRole = document.querySelector('input[name="role"]:checked')?.value || 'Developer';
      receiptRole.textContent = selectedRole;

      // Show Success Modal
      successModal.classList.remove('hidden');
      triggerCelebrationConfetti();
      playSuccessChime();
      showToast('Validation Successful! Account ready.', 'success');
      showStatusBanner('Account Validated Successfully', 'All inputs passed client-side security checks.', false);
    }, 700);
  });

  // Modal Close Button
  modalCloseBtn.addEventListener('click', () => {
    successModal.classList.add('hidden');
    playTone(480, 'sine', 0.08);
  });

  // Close modal when clicking outside
  successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
      successModal.classList.add('hidden');
    }
  });

  // Initial progress calculation
  updateProgress();
});
