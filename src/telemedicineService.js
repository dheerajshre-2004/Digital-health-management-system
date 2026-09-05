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
          config: { broadcast: { self: true } }
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
    setTimeout(() => this.broadcast(callObj), 800);
    setTimeout(() => this.broadcast(callObj), 2000);
    setTimeout(() => this.broadcast(callObj), 4000);

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
    if (supabase && supabase.from) {
      try {
        supabase.from('dhms_store')
          .upsert({ key: 'dhms_active_tele_call', value: callObj, updated_at: new Date().toISOString() })
          .then(() => {});
      } catch (e) {}
    }
    this.broadcast(callObj);
    setTimeout(() => this.broadcast(callObj), 600);
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
    if (supabase && supabase.from) {
      try {
        supabase.from('dhms_store')
          .delete()
          .eq('key', 'dhms_active_tele_call')
          .then(() => {});
      } catch (e) {}
    }
    this.broadcast(endObj);
    return endObj;
  }

  // WebRTC Peer Connection Helper with Robust Candidate Queueing and Re-negotiation
  createPeerConnection(callId, localStream, onRemoteStream, isInitiator = false) {
    const pc = new RTCPeerConnection(rtcConfig);
    this.peerConnections.set(callId, pc);
    const pendingCandidates = [];
    let isRemoteDescSet = false;

    if (localStream) {
      localStream.getTracks().forEach(track => {
        try {
          pc.addTrack(track, localStream);
        } catch (err) {
          console.warn("[WebRTC] addTrack error:", err);
        }
      });
    }

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        console.log("[WebRTC] Received remote stream:", event.streams[0].id);
        onRemoteStream(event.streams[0]);
      } else if (event.track) {
        const inboundStream = new MediaStream([event.track]);
        onRemoteStream(inboundStream);
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

    const flushPendingCandidates = async () => {
      while (pendingCandidates.length > 0) {
        const candidate = pendingCandidates.shift();
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn("[WebRTC] Error adding queued ICE candidate:", e);
        }
      }
    };

    const sendOffer = async () => {
      try {
        if (pc.signalingState === 'closed') return;
        console.log("[WebRTC] Sending offer for call:", callId);
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
      if (msg.callId !== callId) return;

      try {
        if (msg.type === 'OFFER' && !isInitiator) {
          console.log("[WebRTC] Received OFFER, creating ANSWER...");
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
          console.log("[WebRTC] Received ANSWER, setting remote description...");
          if (pc.signalingState !== 'stable' && pc.signalingState !== 'closed') {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
            isRemoteDescSet = true;
            await flushPendingCandidates();
          }
        } else if (msg.type === 'ICE_CANDIDATE' && msg.candidate) {
          if (isRemoteDescSet && pc.remoteDescription) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
            } catch (e) {
              console.warn("[WebRTC] Add ICE candidate error:", e);
            }
          } else {
            pendingCandidates.push(msg.candidate);
          }
        } else if ((msg.type === 'CALL_ACCEPTED' || msg.type === 'PATIENT_READY_FOR_CALL' || msg.type === 'REQUEST_OFFER') && isInitiator) {
          console.log("[WebRTC] Peer is ready, sending fresh OFFER...");
          setTimeout(sendOffer, 300);
        }
      } catch (err) {
        console.warn("[WebRTC] Signaling Error:", err);
      }
    };

    const unsubscribe = this.subscribe(handleSignal);

    // If patient joins, notify doctor immediately to trigger fresh offer
    if (!isInitiator) {
      this.broadcast({
        type: 'PATIENT_READY_FOR_CALL',
        callId
      });
      // Also request offer after 1.5s if not connected yet
      setTimeout(() => {
        if (!isRemoteDescSet && pc.connectionState !== 'connected') {
          this.broadcast({ type: 'REQUEST_OFFER', callId });
        }
      }, 1500);
    }

    // If initiator (Doctor), send initial offer and retry on intervals until connected
    if (isInitiator) {
      setTimeout(sendOffer, 400);
      const heartbeat = setInterval(() => {
        if (pc.connectionState === 'connected' || pc.signalingState === 'closed') {
          clearInterval(heartbeat);
        } else {
          sendOffer();
        }
      }, 3000);

      // Clean up heartbeat after 30s
      setTimeout(() => clearInterval(heartbeat), 30000);
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
