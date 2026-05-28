document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const headerTime = document.getElementById('header-time');
  const headerDate = document.getElementById('header-date');
  const btnRequestPermission = document.getElementById('btn-request-permission');
  const permissionOverlay = document.getElementById('permission-overlay');
  const simulatedAvatar = document.getElementById('simulated-avatar');
  const soundwaveIndicator = simulatedAvatar.querySelector('.avatar-soundwave-indicator');
  const webcamVideo = document.getElementById('webcam-video');
  
  // Notification elements
  const notificationsDialog = document.getElementById('notifications-dialog');
  const btnNotNowNotifications = document.getElementById('btn-not-now-notifications');
  const btnAllowNotifications = document.getElementById('btn-allow-notifications');
  
  // Device dropdowns
  const selectMic = document.getElementById('select-mic');
  const selectSpeaker = document.getElementById('select-speaker');
  const selectCamera = document.getElementById('select-camera');
  
  // Modal device dropdowns
  const modalSelectMic = document.getElementById('modal-select-mic');
  const modalSelectSpeaker = document.getElementById('modal-select-speaker');
  const modalSelectCamera = document.getElementById('modal-select-camera');
  
  // Toggle controls
  const btnToggleMic = document.getElementById('btn-toggle-mic');
  const btnToggleVideo = document.getElementById('btn-toggle-video');
  const micIcon = document.getElementById('mic-icon');
  const videoIcon = document.getElementById('video-icon');
  const micErrorBadge = document.getElementById('mic-error-badge');
  const videoErrorBadge = document.getElementById('video-error-badge');
  
  // Settings Modal
  const btnOpenSettings = document.getElementById('btn-open-settings');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const settingsModal = document.getElementById('settings-modal');
  const modalTabs = document.querySelectorAll('.modal-tab');
  const tabAudio = document.getElementById('tab-audio');
  const tabVideo = document.getElementById('tab-video');
  
  // Join actions & other ways dropdown
  const btnJoinNow = document.getElementById('btn-join-now');
  const btnOtherWays = document.getElementById('btn-other-ways');
  const otherWaysDropdown = document.getElementById('other-ways-dropdown');
  const btnGeminiStart = document.getElementById('btn-gemini-start');

  // Profile Elements
  const userEmailEl = document.getElementById('user-email');
  const userAvatarEl = document.getElementById('user-avatar');
  const avatarLetterEl = document.getElementById('avatar-letter');
  const userNameTagEl = document.getElementById('user-name-tag');

  // User Profile Initialization Logic (optional URL overrides, defaults to guestuser##@gmail.com and USER)
  function initUserProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    let name = urlParams.get('name') || 'USER';
    let email = urlParams.get('email') || 'guestuser##@gmail.com';

    // Update UI elements
    userEmailEl.textContent = email;
    userNameTagEl.textContent = name;
    
    // Get first letter of name or email for avatars
    const firstLetter = email.trim().charAt(0).toUpperCase() || 'G';
    userAvatarEl.textContent = firstLetter;
    avatarLetterEl.textContent = firstLetter;
  }

  // Run user profile setup
  initUserProfile();


  // Media Stream State
  let localStream = null;
  let isMicActive = false;
  let isVideoActive = false;
  let hasGrantedPermissions = false;

  // Real-time Clock
  function updateClock() {
    const now = new Date();
    
    // Time format (HH:MM)
    let hours = now.getHours();
    let minutes = now.getMinutes();
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    headerTime.textContent = `${hours}:${minutes}`;
    
    // Date format (e.g. Wed, May 27)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    headerDate.textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
  }
  
  updateClock();
  setInterval(updateClock, 60000);

  // Initialize page: check notification status and prompt
  if (Notification && Notification.permission !== 'default') {
    notificationsDialog.classList.add('hidden');
  }

  btnNotNowNotifications.addEventListener('click', () => {
    notificationsDialog.classList.add('hidden');
  });

  btnAllowNotifications.addEventListener('click', () => {
    if (Notification) {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
        notificationsDialog.classList.add('hidden');
      });
    } else {
      notificationsDialog.classList.add('hidden');
    }
  });

  // Toggle Other Ways dropdown
  btnOtherWays.addEventListener('click', (e) => {
    e.stopPropagation();
    otherWaysDropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    otherWaysDropdown.classList.add('hidden');
  });

  // Settings Modal Show / Hide
  btnOpenSettings.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
  });

  btnCloseSettings.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
  });

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.add('hidden');
    }
  });

  // Settings Modal Tabs
  modalTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      modalTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const tabTarget = tab.getAttribute('data-tab');
      if (tabTarget === 'audio') {
        tabAudio.classList.remove('hidden');
        tabVideo.classList.add('hidden');
      } else {
        tabAudio.classList.add('hidden');
        tabVideo.classList.remove('hidden');
      }
    });
  });

  // Helper to populate mock devices if hardware access is restricted (e.g. Insecure HTTP connection or no camera found)
  function populateMockDevices() {
    selectMic.innerHTML = '<option value="mock-mic">Default Microphone (Guest Mode)</option>';
    selectCamera.innerHTML = '<option value="mock-cam">Default Front Camera (Guest Mode)</option>';
    modalSelectMic.innerHTML = '<option value="mock-mic">Default Microphone (Guest Mode)</option>';
    modalSelectCamera.innerHTML = '<option value="mock-cam">Default Front Camera (Guest Mode)</option>';
    selectSpeaker.innerHTML = '<option value="mock-speaker">Default Speaker (Guest Mode)</option>';
    modalSelectSpeaker.innerHTML = '<option value="mock-speaker">Default Speaker (Guest Mode)</option>';
  }

  let isMockStream = false;
  let canvasAnimationId = null;

  // Start animated canvas stream fallback
  function startMockStream() {
    isMockStream = true;
    hasGrantedPermissions = true;

    // Hide permission overlays
    permissionOverlay.classList.add('hidden');
    simulatedAvatar.classList.add('hidden');

    // Show and configure video preview
    webcamVideo.classList.remove('hidden');

    // Create a mock canvas stream to simulate camera
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    let angle = 0;
    function draw() {
      if (!hasGrantedPermissions || !isVideoActive) {
        canvasAnimationId = requestAnimationFrame(draw);
        return;
      }
      ctx.fillStyle = '#202124';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw beautiful dynamic colored rings to simulate a live camera stream / visualizer
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(angle);

      const gradient = ctx.createRadialGradient(0, 0, 10, 0, 0, 150);
      gradient.addColorStop(0, '#8ab4f8');
      gradient.addColorStop(0.5, '#4285f4');
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, 150, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Render overlay text
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Google Sans, Roboto, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Camera Feed Active (Simulated)', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillStyle = '#8ab4f8';
      ctx.font = '14px Google Sans, Roboto, Arial';
      ctx.fillText('Secure context (HTTPS) required for physical webcam', canvas.width / 2, canvas.height / 2 + 20);

      angle += 0.02;
      canvasAnimationId = requestAnimationFrame(draw);
    }

    draw();

    // Capture stream from canvas
    let stream;
    if (canvas.captureStream) {
      stream = canvas.captureStream(30);
    } else if (canvas.mozCaptureStream) {
      stream = canvas.mozCaptureStream(30);
    } else {
      stream = new MediaStream();
    }

    localStream = stream;
    webcamVideo.srcObject = stream;

    isMicActive = true;
    isVideoActive = true;

    updateControlsUI();
    loadDevices();
  }

  // Request Microphone and Camera Permissions
  async function requestPermissions() {
    // If browser doesn't support getUserMedia (e.g. running locally via HTTP, or in-app browser with restrictions)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('getUserMedia is not supported or context is insecure. Using simulated media stream.');
      startMockStream();
      return;
    }

    try {
      // First try with modern ideal constraints (more compatible on mobile)
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      handleStreamSuccess(stream);
    } catch (error) {
      console.warn('Ideal getUserMedia failed, trying simple constraints:', error);
      try {
        // Fallback to simple standard video/audio parameters
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        handleStreamSuccess(stream);
      } catch (fallbackError) {
        console.error('All getUserMedia attempts failed, falling back to simulated stream:', fallbackError);
        // Fall back to mock stream to ensure UI and meeting controls are active and functional
        startMockStream();
      }
    }
  }

  btnRequestPermission.addEventListener('click', requestPermissions);

  function handleStreamSuccess(stream) {
    isMockStream = false;
    localStream = stream;
    hasGrantedPermissions = true;
    
    // Hide permission overlays
    permissionOverlay.classList.add('hidden');
    simulatedAvatar.classList.add('hidden');
    
    // Show and configure video preview
    webcamVideo.classList.remove('hidden');
    webcamVideo.srcObject = stream;
    
    // Default active state is true for both
    isMicActive = true;
    isVideoActive = true;
    
    // Update Control buttons to active (white transparent, no error exclamation mark)
    updateControlsUI();
    
    // Enumerate devices and populate dropdowns
    loadDevices();
  }

  function handleStreamFailure(error) {
    // Show placeholder, log permission error
    permissionOverlay.classList.add('hidden');
    simulatedAvatar.classList.remove('hidden');
    soundwaveIndicator.style.display = 'none';
    
    // Update UI states to indicate disabled/error
    isMicActive = false;
    isVideoActive = false;
    updateControlsUI();
    
    alert('Failed to access camera and microphone. Please ensure permissions are granted in your browser settings.');
  }

  function updateControlsUI() {
    // Microphone Button UI
    if (isMicActive) {
      btnToggleMic.classList.remove('btn-error-state');
      micIcon.textContent = 'mic';
      micErrorBadge.classList.add('hidden');
      soundwaveIndicator.style.display = 'block';
    } else {
      btnToggleMic.classList.add('btn-error-state');
      micIcon.textContent = 'mic_off';
      if (!hasGrantedPermissions) {
        micErrorBadge.classList.remove('hidden');
      } else {
        micErrorBadge.classList.add('hidden');
      }
      soundwaveIndicator.style.display = 'none';
    }

    // Video Button UI
    if (isVideoActive) {
      btnToggleVideo.classList.remove('btn-error-state');
      videoIcon.textContent = 'videocam';
      videoErrorBadge.classList.add('hidden');
      simulatedAvatar.classList.add('hidden');
      webcamVideo.classList.remove('hidden');
    } else {
      btnToggleVideo.classList.add('btn-error-state');
      videoIcon.textContent = 'videocam_off';
      if (!hasGrantedPermissions) {
        videoErrorBadge.classList.remove('hidden');
      } else {
        videoErrorBadge.classList.add('hidden');
      }
      simulatedAvatar.classList.remove('hidden');
      webcamVideo.classList.add('hidden');
    }
  }

  // Toggle Mic state
  btnToggleMic.addEventListener('click', () => {
    if (!hasGrantedPermissions) {
      requestPermissions();
      return;
    }
    
    isMicActive = !isMicActive;
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMicActive;
      });
    }
    updateControlsUI();
  });

  // Toggle Video state
  btnToggleVideo.addEventListener('click', () => {
    if (!hasGrantedPermissions) {
      requestPermissions();
      return;
    }
    
    isVideoActive = !isVideoActive;
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoActive;
      });
    }
    updateControlsUI();
  });

  // Device Enumeration
  async function loadDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      populateMockDevices();
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      // Clear options
      selectMic.innerHTML = '';
      selectCamera.innerHTML = '';
      modalSelectMic.innerHTML = '';
      modalSelectCamera.innerHTML = '';

      let micCount = 0;
      let cameraCount = 0;

      devices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        
        if (device.kind === 'audioinput') {
          micCount++;
          option.text = device.label || `Microphone ${micCount}`;
          selectMic.appendChild(option.cloneNode(true));
          modalSelectMic.appendChild(option.cloneNode(true));
        } else if (device.kind === 'videoinput') {
          cameraCount++;
          option.text = device.label || `Camera ${cameraCount}`;
          selectCamera.appendChild(option.cloneNode(true));
          modalSelectCamera.appendChild(option.cloneNode(true));
        } else if (device.kind === 'audiooutput') {
          // Note: Browser support for output device selection varies (mostly Chrome/Edge)
          option.text = device.label || 'Speaker';
          selectSpeaker.appendChild(option.cloneNode(true));
          modalSelectSpeaker.appendChild(option.cloneNode(true));
        }
      });

      // Synchronize selection values
      if (localStream) {
        const activeVideoTrack = localStream.getVideoTracks()[0];
        const activeAudioTrack = localStream.getAudioTracks()[0];

        if (activeVideoTrack) {
          const videoSettings = activeVideoTrack.getSettings ? activeVideoTrack.getSettings() : {};
          const targetId = videoSettings.deviceId;
          const targetLabel = activeVideoTrack.label;

          let found = false;
          for (let opt of selectCamera.options) {
            if (targetId && opt.value === targetId) {
              opt.selected = true;
              found = true;
              break;
            } else if (targetLabel && opt.text === targetLabel) {
              opt.selected = true;
              found = true;
              break;
            }
          }
          if (!found && selectCamera.options.length > 0) {
            selectCamera.options[0].selected = true;
          }
          modalSelectCamera.value = selectCamera.value;
        }

        if (activeAudioTrack) {
          const audioSettings = activeAudioTrack.getSettings ? activeAudioTrack.getSettings() : {};
          const targetId = audioSettings.deviceId;
          const targetLabel = activeAudioTrack.label;

          let found = false;
          for (let opt of selectMic.options) {
            if (targetId && opt.value === targetId) {
              opt.selected = true;
              found = true;
              break;
            } else if (targetLabel && opt.text === targetLabel) {
              opt.selected = true;
              found = true;
              break;
            }
          }
          if (!found && selectMic.options.length > 0) {
            selectMic.options[0].selected = true;
          }
          modalSelectMic.value = selectMic.value;
        }
      }
    } catch (e) {
      console.error('Error enumerating devices:', e);
      populateMockDevices();
    }
  }

  // Switch camera/mic on selection change
  async function changeDevice(kind, deviceId) {
    if (!localStream) return;
    if (isMockStream || deviceId === 'mock-mic' || deviceId === 'mock-cam' || deviceId === 'mock-speaker') {
      console.log('Skipping physical device switch since we are in guest/mock mode.');
      return;
    }
    
    // Stop tracks of the chosen kind
    localStream.getTracks().forEach(track => {
      if ((kind === 'video' && track.kind === 'video') || (kind === 'audio' && track.kind === 'audio')) {
        track.stop();
      }
    });

    const constraints = {
      video: kind === 'video' ? { deviceId: { exact: deviceId } } : isVideoActive,
      audio: kind === 'audio' ? { deviceId: { exact: deviceId } } : isMicActive
    };

    try {
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (kind === 'video') {
        const newVideoTrack = newStream.getVideoTracks()[0];
        const oldVideoTracks = localStream.getVideoTracks();
        if (oldVideoTracks.length > 0) {
          localStream.removeTrack(oldVideoTracks[0]);
        }
        localStream.addTrack(newVideoTrack);
        newVideoTrack.enabled = isVideoActive;
      } else {
        const newAudioTrack = newStream.getAudioTracks()[0];
        const oldAudioTracks = localStream.getAudioTracks();
        if (oldAudioTracks.length > 0) {
          localStream.removeTrack(oldAudioTracks[0]);
        }
        localStream.addTrack(newAudioTrack);
        newAudioTrack.enabled = isMicActive;
      }

      // Re-attach stream
      webcamVideo.srcObject = null;
      webcamVideo.srcObject = localStream;
    } catch (err) {
      console.error('Failed to change device stream:', err);
    }
  }

  // Bind Selector changes
  selectMic.addEventListener('change', (e) => {
    const val = e.target.value;
    modalSelectMic.value = val;
    changeDevice('audio', val);
  });
  
  modalSelectMic.addEventListener('change', (e) => {
    const val = e.target.value;
    selectMic.value = val;
    changeDevice('audio', val);
  });

  selectCamera.addEventListener('change', (e) => {
    const val = e.target.value;
    modalSelectCamera.value = val;
    changeDevice('video', val);
  });

  modalSelectCamera.addEventListener('change', (e) => {
    const val = e.target.value;
    selectCamera.value = val;
    changeDevice('video', val);
  });

  // Action responses (visual only for mockup interactive goodness)
  btnJoinNow.addEventListener('click', () => {
    btnJoinNow.textContent = 'Waiting to be let in...';
    btnJoinNow.disabled = true;
    btnJoinNow.style.backgroundColor = '#9aa0a6';
    
    // Simulate being accepted into the meet
    setTimeout(() => {
      alert('You have been admitted to the meeting!');
      btnJoinNow.textContent = 'Ask to join';
      btnJoinNow.disabled = false;
      btnJoinNow.style.backgroundColor = '';
    }, 3000);
  });

  btnGeminiStart.addEventListener('click', () => {
    btnGeminiStart.textContent = 'Active';
    btnGeminiStart.style.color = 'var(--google-green)';
    btnGeminiStart.style.borderColor = 'var(--google-green)';
    alert('Gemini Note Taking AI activated. Meet transcripts will be shared.');
  });
});
