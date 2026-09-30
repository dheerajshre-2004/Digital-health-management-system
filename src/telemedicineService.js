// Comprehensive WebRTC and Telemedicine Service for DHMS with Supabase Realtime & Hybrid DB-Signaling
import { supabase } from './supabaseClient';

let audioCtx = null;
let ringtoneInterval = null;
let activeNotification = null;
let titleBlinkInterval = null;
let originalDocTitle = '';

// Pre-unlock AudioContext on user interaction
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);
}

// Request native browser notification permission
export function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        console.log('[Telemedicine] Notification permission status:', perm);
      }).catch(() => {});
    }
  }
}

// Show native OS notification & phone vibration
export function showIncomingCallNotification(callData) {
  if (!callData) return;
  const docName = cleanDoctorName(callData.doctorName);
  const dept = callData.department || 'Specialist Consultation';

  // 1. Phone Vibration (Android / mobile devices)
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate([500, 250, 500, 250, 500, 250, 500]);
    } catch (e) {}
  }

  // 2. Native OS / Browser Notification
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      if (activeNotification) {
        activeNotification.close();
      }
      activeNotification = new Notification(`🚨 Incoming Video Call: ${docName}`, {
        body: `${dept} is calling you now. Click to answer your consultation.`,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: 'dhms_tele_incoming_call',
        requireInteraction: true,
        vibrate: [500, 250, 500]
      });

      activeNotification.onclick = function () {
        window.focus();
        this.close();
      };
    } catch (e) {
      console.warn("Notification error:", e);
    }
  }

  // 3. Document Title Blinking Alert
  if (typeof document !== 'undefined') {
    if (!originalDocTitle) originalDocTitle = document.title;
    if (titleBlinkInterval) clearInterval(titleBlinkInterval);
    let toggle = false;
    titleBlinkInterval = setInterval(() => {
      document.title = toggle ? `📞 INCOMING CALL: ${docName}!` : `🔔 (1) DOCTOR IS CALLING YOU...`;
      toggle = !toggle;
    }, 800);
  }
}

export function clearIncomingCallNotification() {
  if (activeNotification) {
    try { activeNotification.close(); } catch (e) {}
    activeNotification = null;
  }
  if (titleBlinkInterval) {
    clearInterval(titleBlinkInterval);
    titleBlinkInterval = null;
  }
  if (originalDocTitle && typeof document !== 'undefined') {
    document.title = originalDocTitle;
    originalDocTitle = '';
  }
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(0); } catch (e) {}
  }
}

// Ringtone chime using Web Audio API
export function playIncomingRingtone() {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const playTone = () => {
      if (!audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5

        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.45);
      } catch (err) {
        console.warn("Ringtone tone error:", err);
      }
    };

    playTone();
    if (ringtoneInterval) clearInterval(ringtoneInterval);
    ringtoneInterval = setInterval(playTone, 2000);
  } catch (e) {
    console.warn("AudioContext error:", e);
  }
}

export function stopIncomingRingtone() {
  if (ringtoneInterval) {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }
  if (audioCtx && audioCtx.state === 'running') {
    try {
      audioCtx.suspend();
    } catch (e) {}
  }
  clearIncomingCallNotification();
}

// Clean duplicate Dr. prefixes like "Dr. Dr.Hemavathi Rao" -> "Dr. Hemavathi Rao"
export function cleanDoctorName(name) {
  if (!name) return "Doctor";
  let cleaned = name.replace(/^(Dr\.?\s*)+/gi, '').trim();
  return `Dr. ${cleaned}`;
}

// WebRTC Configuration with comprehensive global STUN servers for cross-network connectivity
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.services.mozilla.com' }
  ],
  iceCandidatePoolSize: 10
};

class TelemedicineSignaling {
  constructor() {
    this.channel = typeof window !== 'undefined' && window.BroadcastChannel 
      ? new BroadcastChannel('dhms_telemedicine_signal_channel')
      : null;
    this.listeners = new Set();
    this.peerConnections = new Map();
    this.supabaseChannel = null;

    if (this.channel) {
      this.channel.onmessage = (event) => {
        this.notifyListeners(event.data);
      };
    }

    if (typeof window !== 'undefined') {
      // Listen to storage events (cross-tab and from Supabase Sync)
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('dhms_tele_')) {
          try {
            const data = e.newValue ? JSON.parse(e.newValue) : null;
            if (data && data.type) {
              this.notifyListeners(data);
            }
          } catch (err) {}
        }
      });

      // Custom window event for instant in-tab dispatch
      window.addEventListener('dhms_tele_signal_local', (e) => {
        if (e.detail) {
          this.notifyListeners(e.detail);
        }
      });
    }

    this.initSupabaseChannel();
  }

  initSupabaseChannel() {
    try {
      if (supabase && supabase.channel) {
        this.supabaseChannel = supabase.channel('dhms_tele_realtime_broadcast', {
          config: { broadcast: { self: true } }
        });

        this.supabaseChannel
          .on('broadcast', { event: 'tele_signal' }, ({ payload }) => {
            this.notifyListeners(payload);
          })
          .subscribe((status) => {
            console.log('[Telemedicine Supabase Channel status]:', status);
            if (status === 'TIMED_OUT' || status === 'CLOSED') {
              setTimeout(() => this.initSupabaseChannel(), 2000);
            }
          });
      }
    } catch (err) {
      console.warn("Supabase Realtime Channel init error:", err);
    }
  }

  notifyListeners(data) {
    if (!data) return;
    this.listeners.forEach(fn => {
      try { fn(data); } catch (e) { console.error(e); }
    });
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  broadcast(message) {
    const payload = { ...message, _ts: Date.now() };
    const callIdStr = message.callId ? String(message.callId) : null;

    // 1. BroadcastChannel (Same device, multi-tab)
    if (this.channel) {
      try { this.channel.postMessage(payload); } catch (e) {}
    }

    // 2. Custom local window event
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('dhms_tele_signal_local', { detail: payload }));
      } catch (e) {}
    }

    // 3. Supabase Realtime broadcast (Cross-device, lowest latency)
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'tele_signal',
          payload: payload
        });
      } catch (e) {
        console.warn("Supabase broadcast send error:", e);
      }
    }

    // 4. Persistent key-value store in LocalStorage & Supabase table for guaranteed fallback
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('dhms_tele_signal_event', JSON.stringify(payload));
      } catch (e) {}
    }

    // Write dedicated per-call signal keys so candidate bursts don't overwrite SDP Offer/Answer
    if (callIdStr) {
      if (payload.type === 'OFFER') {
        try { localStorage.setItem(`dhms_tele_call_${callIdStr}_offer`, JSON.stringify(payload)); } catch (e) {}
        if (supabase && supabase.from) {
          supabase.from('dhms_store')
            .upsert({ key: `dhms_tele_call_${callIdStr}_offer`, value: payload, updated_at: new Date().toISOString() })
            .then(() => {});
        }
      } else if (payload.type === 'ANSWER') {
        try { localStorage.setItem(`dhms_tele_call_${callIdStr}_answer`, JSON.stringify(payload)); } catch (e) {}
        if (supabase && supabase.from) {
          supabase.from('dhms_store')
            .upsert({ key: `dhms_tele_call_${callIdStr}_answer`, value: payload, updated_at: new Date().toISOString() })
            .then(() => {});
        }
      } else if (payload.type === 'ICE_CANDIDATE' && payload.candidate) {
        const storeKey = `dhms_tele_call_${callIdStr}_candidates_${payload.isInitiator ? 'init' : 'resp'}`;
        try {
          const existing = JSON.parse(localStorage.getItem(storeKey) || '[]');
          existing.push(payload.candidate);
          localStorage.setItem(storeKey, JSON.stringify(existing));
          if (supabase && supabase.from) {
            supabase.from('dhms_store')
              .upsert({ key: storeKey, value: existing, updated_at: new Date().toISOString() })
              .then(() => {});
          }
        } catch (e) {}
      }
    }

    // General sync to dhms_store for general event types
    if (supabase && supabase.from && payload.type && payload.type !== 'CHAT_MESSAGE' && payload.type !== 'ICE_CANDIDATE') {
      try {
        supabase.from('dhms_store')
          .upsert({ key: 'dhms_tele_signal_event', value: payload, updated_at: new Date().toISOString() })
          .then(() => {});
      } catch (e) {}
    }
  }

  // Ringing Call Signaling
  initiateCall(callData) {
    const callObj = {
      appointmentId: String(callData.appointmentId),
      patientId: callData.patientId,
      patientName: callData.patientName,
      doctorId: callData.doctorId,
      doctorName: cleanDoctorName(callData.doctorName),
      department: callData.department,
      type: 'INCOMING_CALL',
      status: 'calling',
      timestamp: Date.now()
    };

    try {
      localStorage.setItem('dhms_active_tele_call', JSON.stringify(callObj));
    } catch (e) {}

    // Direct Supabase store write as a rock-solid backup
    if (supabase && supabase.from) {
      try {
        supabase.from('dhms_store')
          .upsert({ key: 'dhms_active_tele_call', value: callObj, updated_at: new Date().toISOString() })
          .then(() => {});
      } catch (e) {}
    }

    // Broadcast immediately and send multiple pulses to ensure delivery across mobile network transitions
    this.broadcast(callObj);
    setTimeout(() => this.broadcast(callObj), 600);
    setTimeout(() => this.broadcast(callObj), 1500);
    setTimeout(() => this.broadcast(callObj), 3000);

    return callObj;
  }

  acceptCall(callData) {
    const callObj = {
      ...callData,
      appointmentId: String(callData.appointmentId),
      type: 'CALL_ACCEPTED',
      status: 'connected',
      timestamp: Date.now()
    };
    try {
      localStorage.setItem('dhms_active_tele_call', JSON.stringify(callObj));
    } catch (e) {}
    if (supabase && supabase.from) {
      try {
        supabase.from('dhms_store')
          .upsert({ key: 'dhms_active_tele_call', value: callObj, updated_at: new Date().toISOString() })
          .then(() => {});
      } catch (e) {}
    }
    this.broadcast(callObj);
    setTimeout(() => this.broadcast(callObj), 500);
    return callObj;
  }

  declineCall(callData) {
    const callObj = {
      ...callData,
      appointmentId: String(callData.appointmentId),
      type: 'CALL_DECLINED',
      status: 'declined',
      timestamp: Date.now()
    };
    try {
      localStorage.removeItem('dhms_active_tele_call');
    } catch (e) {}
    if (supabase && supabase.from) {
      try {
        supabase.from('dhms_store')
          .delete()
          .eq('key', 'dhms_active_tele_call')
          .then(() => {});
      } catch (e) {}
    }
    this.broadcast(callObj);
    return callObj;
  }

  endCall(rawAppointmentId) {
    const appointmentId = String(rawAppointmentId);
    const endObj = {
      appointmentId,
      callId: appointmentId,
      type: 'CALL_ENDED',
      status: 'ended',
      timestamp: Date.now()
    };
    try {
      localStorage.removeItem('dhms_active_tele_call');
      localStorage.removeItem(`dhms_tele_call_${appointmentId}_offer`);
      localStorage.removeItem(`dhms_tele_call_${appointmentId}_answer`);
      localStorage.removeItem(`dhms_tele_call_${appointmentId}_candidates_init`);
      localStorage.removeItem(`dhms_tele_call_${appointmentId}_candidates_resp`);
    } catch (e) {}
    if (supabase && supabase.from) {
      try {
        supabase.from('dhms_store')
          .delete()
          .eq('key', 'dhms_active_tele_call')
          .then(() => {});
        supabase.from('dhms_store')
          .delete()
          .in('key', [
            `dhms_tele_call_${appointmentId}_offer`,
            `dhms_tele_call_${appointmentId}_answer`,
            `dhms_tele_call_${appointmentId}_candidates_init`,
            `dhms_tele_call_${appointmentId}_candidates_resp`
          ])
          .then(() => {});
      } catch (e) {}
    }
    this.broadcast(endObj);
    return endObj;
  }

  // WebRTC Peer Connection Helper with Full Dual-Signaling & Automatic State Recovery
  createPeerConnection(rawCallId, localStream, onRemoteStream, isInitiator = false) {
    const callId = String(rawCallId);
    console.log(`[WebRTC] Creating PeerConnection for call ${callId}, isInitiator: ${isInitiator}`);
    
    const pc = new RTCPeerConnection(rtcConfig);
    this.peerConnections.set(callId, pc);
    const pendingCandidates = [];
    const appliedCandidateKeys = new Set();
    let isRemoteDescSet = false;
    let isCleanedUp = false;
    const remoteStream = new MediaStream();

    // Pre-allocate transceivers only if localStream is not immediately provided
    if (localStream && localStream.getTracks().length > 0) {
      localStream.getTracks().forEach(track => {
        try {
          pc.addTrack(track, localStream);
          console.log(`[WebRTC - ${isInitiator ? 'Doctor' : 'Patient'}] Added local track:`, track.kind, track.id, "enabled:", track.enabled);
        } catch (err) {
          console.warn("[WebRTC] addTrack error:", err);
        }
      });
    } else {
      try {
        pc.addTransceiver('audio', { direction: 'sendrecv' });
        pc.addTransceiver('video', { direction: 'sendrecv' });
      } catch (e) {
        console.warn("[WebRTC] addTransceiver note:", e);
      }
    }

    // Handle remote tracks and deliver composite remote stream
    pc.ontrack = (event) => {
      console.log(`[WebRTC - ${isInitiator ? 'Doctor' : 'Patient'}] ontrack event received:`, event.track.kind, event.track.id);
      
      try {
        event.track.enabled = true;
      } catch (e) {}

      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach(t => {
          t.enabled = true;
          if (!remoteStream.getTracks().some(existing => existing.id === t.id)) {
            remoteStream.addTrack(t);
          }
        });
        onRemoteStream(event.streams[0]);
      } else if (event.track) {
        if (!remoteStream.getTracks().some(existing => existing.id === event.track.id)) {
          remoteStream.addTrack(event.track);
        }
        onRemoteStream(remoteStream);
      }

      event.track.onunmute = () => {
        console.log(`[WebRTC - ${isInitiator ? 'Doctor' : 'Patient'}] Track unmuted:`, event.track.kind);
        event.track.enabled = true;
        if (event.streams && event.streams[0]) {
          onRemoteStream(event.streams[0]);
        } else {
          onRemoteStream(remoteStream);
        }
      };
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.broadcast({
          type: 'ICE_CANDIDATE',
          callId,
          candidate: event.candidate,
          isInitiator
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC - ${isInitiator ? 'Doctor' : 'Patient'}] Connection state: ${pc.connectionState}`);
      if (pc.connectionState === 'connected') {
        console.log(`[WebRTC - ${isInitiator ? 'Doctor' : 'Patient'}] Connected successfully! Total remote tracks: ${remoteStream.getTracks().length}`);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC - ${isInitiator ? 'Doctor' : 'Patient'}] ICE Connection state: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        try {
          if (pc.restartIce) pc.restartIce();
        } catch (e) {}
      }
    };

    const flushPendingCandidates = async () => {
      while (pendingCandidates.length > 0) {
        const candidate = pendingCandidates.shift();
        const candKey = JSON.stringify(candidate);
        if (appliedCandidateKeys.has(candKey)) continue;
        appliedCandidateKeys.add(candKey);
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn("[WebRTC] Error adding queued ICE candidate:", e);
        }
      }
    };

    const applyCandidateSafely = async (candidate) => {
      if (!candidate) return;
      const candKey = JSON.stringify(candidate);
      if (appliedCandidateKeys.has(candKey)) return;

      if (isRemoteDescSet && pc.remoteDescription) {
        appliedCandidateKeys.add(candKey);
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn("[WebRTC] Add ICE candidate error:", e);
        }
      } else {
        pendingCandidates.push(candidate);
      }
    };

    const sendOffer = async () => {
      if (isCleanedUp || pc.signalingState === 'closed') return;
      try {
        if (pc.signalingState === 'have-local-offer' && pc.localDescription) {
          console.log("[WebRTC] Re-broadcasting existing local offer for call:", callId);
          this.broadcast({
            type: 'OFFER',
            callId,
            offer: pc.localDescription,
            isInitiator: true
          });
          return;
        }

        if (pc.signalingState !== 'stable') {
          console.log("[WebRTC] Signaling state not stable (" + pc.signalingState + "), delaying new offer...");
          return;
        }

        console.log("[WebRTC] Creating fresh offer for call:", callId);
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await pc.setLocalDescription(offer);
        this.broadcast({
          type: 'OFFER',
          callId,
          offer,
          isInitiator: true
        });
      } catch (e) {
        console.warn("[WebRTC] Offer creation failed:", e);
      }
    };

    const handleSignal = async (msg) => {
      if (isCleanedUp || !msg || String(msg.callId) !== callId) return;

      try {
        if (msg.type === 'OFFER' && !isInitiator) {
          console.log("[WebRTC - Patient] Received OFFER, creating ANSWER...");
          if (pc.signalingState === 'closed') return;
          
          if (pc.signalingState !== 'stable') {
            console.log("[WebRTC - Patient] State is " + pc.signalingState + ", rolling back description...");
            await Promise.all([
              pc.setLocalDescription({ type: 'rollback' }).catch(() => {}),
            ]);
          }

          await pc.setRemoteDescription(new RTCSessionDescription(msg.offer));
          isRemoteDescSet = true;
          await flushPendingCandidates();

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          this.broadcast({
            type: 'ANSWER',
            callId,
            answer,
            isInitiator: false
          });
        } else if (msg.type === 'ANSWER' && isInitiator) {
          console.log("[WebRTC - Doctor] Received ANSWER, setting remote description...");
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
            isRemoteDescSet = true;
            await flushPendingCandidates();
          }
        } else if (msg.type === 'ICE_CANDIDATE' && msg.candidate) {
          await applyCandidateSafely(msg.candidate);
        } else if ((msg.type === 'CALL_ACCEPTED' || msg.type === 'PATIENT_READY_FOR_CALL' || msg.type === 'REQUEST_OFFER') && isInitiator) {
          console.log("[WebRTC - Doctor] Peer requested offer, dispatching...");
          sendOffer();
        }
      } catch (err) {
        console.warn("[WebRTC] Signaling Error:", err);
      }
    };

    const unsubscribe = this.subscribe(handleSignal);

    // Active DB Sync Poller: In case WebSockets dropped packets or joined with delay
    const syncDbSignals = async () => {
      if (isCleanedUp || pc.signalingState === 'closed' || pc.connectionState === 'connected') return;

      try {
        // Patient checks for stored offer
        if (!isInitiator && !isRemoteDescSet) {
          let offerMsg = null;
          const localStr = localStorage.getItem(`dhms_tele_call_${callId}_offer`);
          if (localStr) {
            try { offerMsg = JSON.parse(localStr); } catch (e) {}
          }
          if (!offerMsg && supabase && supabase.from) {
            const { data } = await supabase.from('dhms_store').select('value').eq('key', `dhms_tele_call_${callId}_offer`).maybeSingle();
            if (data && data.value) {
              offerMsg = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
            }
          }
          if (offerMsg && offerMsg.offer && pc.signalingState === 'stable') {
            console.log("[WebRTC - Patient] Found stored offer via DB Sync, answering...");
            handleSignal(offerMsg);
          }
        }

        // Doctor checks for stored answer
        if (isInitiator && !isRemoteDescSet && pc.signalingState === 'have-local-offer') {
          let answerMsg = null;
          const localStr = localStorage.getItem(`dhms_tele_call_${callId}_answer`);
          if (localStr) {
            try { answerMsg = JSON.parse(localStr); } catch (e) {}
          }
          if (!answerMsg && supabase && supabase.from) {
            const { data } = await supabase.from('dhms_store').select('value').eq('key', `dhms_tele_call_${callId}_answer`).maybeSingle();
            if (data && data.value) {
              answerMsg = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
            }
          }
          if (answerMsg && answerMsg.answer) {
            console.log("[WebRTC - Doctor] Found stored answer via DB Sync, applying...");
            handleSignal(answerMsg);
          }
        }

        // Sync candidate list
        const remoteCandidateKey = `dhms_tele_call_${callId}_candidates_${isInitiator ? 'resp' : 'init'}`;
        let candList = [];
        const localCandStr = localStorage.getItem(remoteCandidateKey);
        if (localCandStr) {
          try { candList = JSON.parse(localCandStr) || []; } catch (e) {}
        }
        if (candList.length === 0 && supabase && supabase.from) {
          const { data } = await supabase.from('dhms_store').select('value').eq('key', remoteCandidateKey).maybeSingle();
          if (data && data.value) {
            candList = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
          }
        }
        if (Array.isArray(candList)) {
          for (const cand of candList) {
            await applyCandidateSafely(cand);
          }
        }
      } catch (err) {}
    };

    const pollerInterval = setInterval(syncDbSignals, 800);

    // If patient joins, notify doctor immediately to trigger fresh offer
    if (!isInitiator) {
      this.broadcast({
        type: 'PATIENT_READY_FOR_CALL',
        callId
      });
      setTimeout(() => {
        if (!isRemoteDescSet && pc.connectionState !== 'connected') {
          this.broadcast({ type: 'REQUEST_OFFER', callId });
        }
      }, 800);
      setTimeout(syncDbSignals, 200);
    }

    // If initiator (Doctor), send initial offer and retry on intervals until connected
    if (isInitiator) {
      setTimeout(sendOffer, 300);
      const heartbeat = setInterval(() => {
        if (isCleanedUp || pc.connectionState === 'connected' || pc.signalingState === 'closed') {
          clearInterval(heartbeat);
        } else {
          sendOffer();
        }
      }, 2500);

      setTimeout(() => clearInterval(heartbeat), 40000);
    }

    return {
      pc,
      updateLocalStream: async (newStream) => {
        if (isCleanedUp || !newStream || pc.signalingState === 'closed') return;
        console.log(`[WebRTC - ${isInitiator ? 'Doctor' : 'Patient'}] Updating local stream tracks:`, newStream.getTracks().length);
        const senders = pc.getSenders();
        let addedNewTrack = false;

        for (const track of newStream.getTracks()) {
          const existingSender = senders.find(s => (s.track && s.track.kind === track.kind) || (!s.track && (s.kind === track.kind || !s._assignedKind)));
          if (existingSender) {
            try {
              existingSender._assignedKind = track.kind;
              await existingSender.replaceTrack(track);
              console.log("[WebRTC] Successfully replaced track:", track.kind);
            } catch (err) {
              console.warn("[WebRTC] replaceTrack error:", err);
            }
          } else {
            try {
              pc.addTrack(track, newStream);
              addedNewTrack = true;
              console.log("[WebRTC] Successfully added new track:", track.kind);
            } catch (err) {
              console.warn("[WebRTC] addTrack error:", err);
            }
          }
        }

        if (addedNewTrack) {
          if (isInitiator && pc.signalingState === 'stable') {
            sendOffer();
          } else {
            this.broadcast({ type: 'REQUEST_OFFER', callId });
          }
        }
      },
      cleanup: () => {
        isCleanedUp = true;
        clearInterval(pollerInterval);
        unsubscribe();
        try {
          pc.close();
        } catch (e) {}
        this.peerConnections.delete(callId);
      }
    };
  }
}

export const teleSignaling = new TelemedicineSignaling();
