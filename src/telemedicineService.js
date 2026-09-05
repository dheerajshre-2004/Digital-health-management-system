// Comprehensive WebRTC and Telemedicine Service for DHMS with Supabase Realtime
import { supabase } from './supabaseClient';

let audioCtx = null;
let ringtoneInterval = null;

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
}

// Clean duplicate Dr. prefixes like "Dr. Dr.Hemavathi Rao" -> "Dr. Hemavathi Rao"
export function cleanDoctorName(name) {
  if (!name) return "Doctor";
  let cleaned = name.replace(/^(Dr\.?\s*)+/gi, '').trim();
  return `Dr. ${cleaned}`;
}

// WebRTC Configuration
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
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
      window.addEventListener('storage', (e) => {
        if (e.key === 'dhms_tele_signal_event' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.notifyListeners(data);
          } catch (err) {}
        }
      });
    }

    this.initSupabaseChannel();
  }

  initSupabaseChannel() {
    try {
      if (supabase && supabase.channel) {
        this.supabaseChannel = supabase.channel('dhms_tele_realtime_broadcast', {
          config: { broadcast: { self: false } }
        });

        this.supabaseChannel
          .on('broadcast', { event: 'tele_signal' }, ({ payload }) => {
            this.notifyListeners(payload);
          })
          .subscribe((status) => {
            console.log('[Telemedicine Supabase Channel status]:', status);
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
    if (this.channel) {
      try { this.channel.postMessage(payload); } catch (e) {}
    }
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('dhms_tele_signal_event', JSON.stringify(payload));
      } catch (e) {}
    }
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
  }

  // Ringing Call Signaling
  initiateCall(callData) {
    const callObj = {
      appointmentId: callData.appointmentId,
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
    this.broadcast(callObj);
    return callObj;
  }

  acceptCall(callData) {
    const callObj = {
      ...callData,
      type: 'CALL_ACCEPTED',
      status: 'connected',
      timestamp: Date.now()
    };
    try {
      localStorage.setItem('dhms_active_tele_call', JSON.stringify(callObj));
    } catch (e) {}
    this.broadcast(callObj);
    return callObj;
  }

  declineCall(callData) {
    const callObj = {
      ...callData,
      type: 'CALL_DECLINED',
      status: 'declined',
      timestamp: Date.now()
    };
    try {
      localStorage.removeItem('dhms_active_tele_call');
    } catch (e) {}
    this.broadcast(callObj);
    return callObj;
  }

  endCall(appointmentId) {
    const endObj = {
      appointmentId,
      type: 'CALL_ENDED',
      status: 'ended',
      timestamp: Date.now()
    };
    try {
      localStorage.removeItem('dhms_active_tele_call');
    } catch (e) {}
    this.broadcast(endObj);
    return endObj;
  }

  // WebRTC Peer Connection Helper
  createPeerConnection(callId, localStream, onRemoteStream, isInitiator = false) {
    const pc = new RTCPeerConnection(rtcConfig);
    this.peerConnections.set(callId, pc);

    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        console.log("[WebRTC] Received remote stream:", event.streams[0].id);
        onRemoteStream(event.streams[0]);
      }
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

    const handleSignal = async (msg) => {
      if (msg.callId !== callId) return;

      try {
        if (msg.type === 'OFFER' && !isInitiator) {
          console.log("[WebRTC] Received OFFER, creating ANSWER...");
          await pc.setRemoteDescription(new RTCSessionDescription(msg.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          this.broadcast({
            type: 'ANSWER',
            callId,
            answer,
            isInitiator: false
          });
        } else if (msg.type === 'ANSWER' && isInitiator) {
          console.log("[WebRTC] Received ANSWER, setting remote description...");
          if (pc.signalingState !== 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
          }
        } else if (msg.type === 'ICE_CANDIDATE' && msg.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          } catch (e) {}
        }
      } catch (err) {
        console.warn("WebRTC Signaling Error:", err);
      }
    };

    const unsubscribe = this.subscribe(handleSignal);

    // If initiator (Doctor) or when call starts, create offer
    if (isInitiator) {
      const sendOffer = async () => {
        try {
          console.log("[WebRTC] Initiator creating offer for call:", callId);
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
          console.warn("Offer creation failed:", e);
        }
      };

      setTimeout(sendOffer, 500);
      // Re-send offer after 2.5s if still disconnected
      setTimeout(() => {
        if (pc.connectionState !== 'connected' && pc.connectionState !== 'connecting') {
          sendOffer();
        }
      }, 2500);
    }

    return {
      pc,
      cleanup: () => {
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
