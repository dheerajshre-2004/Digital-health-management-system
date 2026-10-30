import React, { useState, useEffect, useRef } from 'react';
import './PillTracker.css';
import { sendDailyPillReminderWhatsApp } from './whatsappService';
import { t } from './i18nService';

// Audio chime for medication reminders and taking dose
const playPillChime = (type = 'take') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    gain.connect(ctx.destination);
    osc.connect(gain);

    const now = ctx.currentTime;
    if (type === 'take') {
      // Cheerful success double chime: 523Hz (C5) -> 659Hz (E5)
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      // Alert bell for pill due
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.setValueAtTime(1046.5, now + 0.15); // C6
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (e) {
    // Audio context not allowed or unsupported
  }
};

export default function PillTracker({ patientId, patientName, patientPhone }) {
  // Load prescribed and custom pills
  const [pills, setPills] = useState(() => {
    try {
      const saved = localStorage.getItem(`dhms_pill_schedule_${patientId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }

      // Auto-populate from prescriptions
      const allRx = JSON.parse(localStorage.getItem('dhms_prescriptions') || '[]');
      const patientRx = allRx.filter(r => r.patientId === patientId);
      
      const generated = [];
      patientRx.forEach((rx, rxIdx) => {
        const drug = rx.medication || rx.drugName || rx.medications?.[0]?.name || 'Amoxicillin 500mg';
        const dose = rx.dose || '1 Tablet';
        const freq = (rx.frequency || rx.instructions || 'Once Daily').toLowerCase();

        if (freq.includes('twice') || freq.includes('bid') || freq.includes('2 times') || freq.includes('1-0-1')) {
          generated.push({ id: `rx-${rxIdx}-m`, name: drug, dose, slot: 'morning', taken: false, time: '08:00 AM', instructions: rx.instructions || 'Take with breakfast' });
          generated.push({ id: `rx-${rxIdx}-n`, name: drug, dose, slot: 'night', taken: false, time: '08:00 PM', instructions: rx.instructions || 'Take after dinner' });
        } else if (freq.includes('thrice') || freq.includes('tid') || freq.includes('3 times') || freq.includes('1-1-1')) {
          generated.push({ id: `rx-${rxIdx}-m`, name: drug, dose, slot: 'morning', taken: false, time: '08:00 AM', instructions: rx.instructions || 'With breakfast' });
          generated.push({ id: `rx-${rxIdx}-a`, name: drug, dose, slot: 'afternoon', taken: false, time: '01:00 PM', instructions: rx.instructions || 'With lunch' });
          generated.push({ id: `rx-${rxIdx}-n`, name: drug, dose, slot: 'night', taken: false, time: '08:00 PM', instructions: rx.instructions || 'With dinner' });
        } else if (freq.includes('night') || freq.includes('bed') || freq.includes('0-0-1')) {
          generated.push({ id: `rx-${rxIdx}-n`, name: drug, dose, slot: 'night', taken: false, time: '08:00 PM', instructions: rx.instructions || 'Before bed' });
        } else {
          generated.push({ id: `rx-${rxIdx}-m`, name: drug, dose, slot: 'morning', taken: false, time: '08:00 AM', instructions: rx.instructions || 'Morning dose' });
        }
      });

      // Default baseline supplements if patient has no active Rx
      if (generated.length === 0) {
        generated.push(
          { id: 'def-1', name: 'Multivitamin & Zinc', dose: '1 Capsule', slot: 'morning', taken: false, time: '08:00 AM', instructions: 'Post-breakfast' },
          { id: 'def-2', name: 'Vitamin D3 60,000 IU', dose: '1 Softgel', slot: 'afternoon', taken: false, time: '01:00 PM', instructions: 'With meals' },
          { id: 'def-3', name: 'Calcium + Magnesium', dose: '500mg', slot: 'night', taken: false, time: '08:00 PM', instructions: 'Before bed' }
        );
      }

      return generated;
    } catch (e) {
      return [];
    }
  });

  // Notification state
  const [notificationPermission, setNotificationPermission] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const [notificationAlertActive, setNotificationAlertActive] = useState(() => {
    return localStorage.getItem(`dhms_pill_notif_enabled_${patientId}`) !== 'false';
  });

  const [bannerAlert, setBannerAlert] = useState(null);

  // Streak Counter & Gamification
  const [streakDays, setStreakDays] = useState(() => {
    return parseInt(localStorage.getItem(`dhms_streak_${patientId}`) || '7', 10);
  });

  // Custom pill input form
  const [customName, setCustomName] = useState('');
  const [customDose, setCustomDose] = useState('1 Tab');
  const [customSlot, setCustomSlot] = useState('morning');
  const [customTime, setCustomTime] = useState('08:00');
  const [customInstructions, setCustomInstructions] = useState('Take with water after meals');

  // Save pills to storage
  useEffect(() => {
    try {
      localStorage.setItem(`dhms_pill_schedule_${patientId}`, JSON.stringify(pills));
    } catch (e) {}
  }, [pills, patientId]);

  // Request browser notification permission
  const handleEnableNotifications = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
          setNotificationAlertActive(true);
          localStorage.setItem(`dhms_pill_notif_enabled_${patientId}`, 'true');
          playPillChime('alert');
          new Notification('🔔 DHMS Smart Pill Tracker Active', {
            body: 'You will receive timely reminders when your morning, afternoon, and evening medication is due!',
            icon: '/favicon.svg'
          });
          setBannerAlert({
            type: 'success',
            msg: '✓ Real-time medication reminders activated! You will receive push alerts for upcoming doses.'
          });
          setTimeout(() => setBannerAlert(null), 5000);
        } else {
          setBannerAlert({
            type: 'warn',
            msg: '⚠️ Notification permission was blocked. Please enable notifications in your browser address bar.'
          });
        }
      } catch (err) {
        console.warn('Notification permission error:', err);
      }
    } else {
      alert('Desktop/Browser push notifications are not supported in this browser.');
    }
  };

  // Trigger test notification
  const handleTriggerTestReminder = () => {
    const untakenPills = pills.filter(p => !p.taken);
    const targetPill = untakenPills[0] || pills[0];
    playPillChime('alert');

    if (navigator.vibrate) {
      try { navigator.vibrate([200, 100, 200]); } catch (e) {}
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(`💊 Dose Reminder: ${targetPill ? targetPill.name : 'Medication'} Due Now`, {
        body: `Time for your ${targetPill ? targetPill.slot : 'scheduled'} dose (${targetPill ? targetPill.dose : '1 Tablet'}). Remember: ${targetPill ? targetPill.instructions : 'Take with water'}.`,
        icon: '/favicon.svg'
      });
    }

    setBannerAlert({
      type: 'info',
      msg: `🔔 Alert Triggered: Time to take ${targetPill ? targetPill.name : 'your medication'} (${targetPill ? targetPill.dose : ''})!`
    });
    setTimeout(() => setBannerAlert(null), 6000);
  };

  // Sync with central prescription updates if new ones arrive
  const handleSyncWithDoctorPrescriptions = () => {
    try {
      const allRx = JSON.parse(localStorage.getItem('dhms_prescriptions') || '[]');
      const patientRx = allRx.filter(r => r.patientId === patientId);

      if (patientRx.length === 0) {
        alert('No new prescriptions found from your doctor yet.');
        return;
      }

      const generated = [];
      patientRx.forEach((rx, rxIdx) => {
        const drug = rx.medication || rx.drugName || rx.medications?.[0]?.name || 'Prescribed Medicine';
        const dose = rx.dose || '1 Tablet';
        const freq = (rx.frequency || rx.instructions || 'Once Daily').toLowerCase();

        if (freq.includes('twice') || freq.includes('bid') || freq.includes('2 times') || freq.includes('1-0-1')) {
          generated.push({ id: `rx-${rx.id || rxIdx}-m`, name: drug, dose, slot: 'morning', taken: false, time: '08:00 AM', instructions: rx.instructions || 'With breakfast' });
          generated.push({ id: `rx-${rx.id || rxIdx}-n`, name: drug, dose, slot: 'night', taken: false, time: '08:00 PM', instructions: rx.instructions || 'After dinner' });
        } else if (freq.includes('thrice') || freq.includes('tid') || freq.includes('3 times') || freq.includes('1-1-1')) {
          generated.push({ id: `rx-${rx.id || rxIdx}-m`, name: drug, dose, slot: 'morning', taken: false, time: '08:00 AM', instructions: rx.instructions || 'With breakfast' });
          generated.push({ id: `rx-${rx.id || rxIdx}-a`, name: drug, dose, slot: 'afternoon', taken: false, time: '01:00 PM', instructions: rx.instructions || 'With lunch' });
          generated.push({ id: `rx-${rx.id || rxIdx}-n`, name: drug, dose, slot: 'night', taken: false, time: '08:00 PM', instructions: rx.instructions || 'With dinner' });
        } else if (freq.includes('night') || freq.includes('bed') || freq.includes('0-0-1')) {
          generated.push({ id: `rx-${rx.id || rxIdx}-n`, name: drug, dose, slot: 'night', taken: false, time: '08:00 PM', instructions: rx.instructions || 'Before bed' });
        } else {
          generated.push({ id: `rx-${rx.id || rxIdx}-m`, name: drug, dose, slot: 'morning', taken: false, time: '08:00 AM', instructions: rx.instructions || 'Morning dose' });
        }
      });

      // Preserve custom user pills
      const customOnly = pills.filter(p => String(p.id).startsWith('custom-'));
      const combined = [...generated, ...customOnly];
      setPills(combined);

      setBannerAlert({
        type: 'success',
        msg: `✓ Synced ${generated.length} medication dose schedule(s) from your clinical prescriptions!`
      });
      setTimeout(() => setBannerAlert(null), 5000);
    } catch (e) {
      console.error(e);
    }
  };

  // Compute adherence rate
  const totalPills = pills.length;
  const takenPills = pills.filter(p => p.taken).length;
  const scorePct = totalPills > 0 ? Math.round((takenPills / totalPills) * 100) : 100;

  const toggleTakePill = (id) => {
    let nowTaken = false;
    setPills(prev => prev.map(p => {
      if (p.id === id) {
        nowTaken = !p.taken;
        return { ...p, taken: nowTaken };
      }
      return p;
    }));

    if (nowTaken) {
      playPillChime('take');
      // If all pills completed, increment streak
      const willBeAllTaken = pills.filter(p => p.id !== id && !p.taken).length === 0;
      if (willBeAllTaken) {
        const nextStreak = streakDays + 1;
        setStreakDays(nextStreak);
        localStorage.setItem(`dhms_streak_${patientId}`, String(nextStreak));
        setBannerAlert({
          type: 'success',
          msg: `🎉 Awesome! 100% adherence completed today! Streak increased to ${nextStreak} Days!`
        });
        setTimeout(() => setBannerAlert(null), 5000);
      }
    }
  };

  const handleDeletePill = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Remove this medication from your daily schedule?')) {
      setPills(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleAddCustomPill = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;

    // Convert custom 24h time to 12h AM/PM
    let displayTime = '08:00 AM';
    if (customTime) {
      const [h, m] = customTime.split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      displayTime = `${String(formattedHour).padStart(2, '0')}:${m || '00'} ${ampm}`;
    }

    const newPill = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      dose: customDose.trim() || '1 Tab',
      slot: customSlot,
      taken: false,
      time: displayTime,
      instructions: customInstructions.trim() || 'Take as advised'
    };

    setPills(prev => [...prev, newPill]);
    setCustomName('');
    setCustomDose('1 Tab');
    setCustomInstructions('Take with water after meals');

    setBannerAlert({
      type: 'success',
      msg: `✓ Added "${newPill.name}" to your ${newPill.slot} dosage schedule.`
    });
    setTimeout(() => setBannerAlert(null), 4000);
  };

  const handleSendWhatsAppDigest = () => {
    sendDailyPillReminderWhatsApp(pills, patientName || 'Patient', patientPhone || '');
  };

  return (
    <div className="pill-tracker-container">
      {/* Toast Banner Alert */}
      {bannerAlert && (
        <div 
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            background: bannerAlert.type === 'success' ? '#dcfce7' : bannerAlert.type === 'info' ? '#eff6ff' : '#fef3c7',
            border: bannerAlert.type === 'success' ? '1px solid #86efac' : bannerAlert.type === 'info' ? '1px solid #bfdbfe' : '1px solid #fde68a',
            color: bannerAlert.type === 'success' ? '#15803d' : bannerAlert.type === 'info' ? '#1d4ed8' : '#b45309',
            fontWeight: '600',
            fontSize: '13.5px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}
        >
          <span>{bannerAlert.msg}</span>
          <button 
            type="button" 
            onClick={() => setBannerAlert(null)}
            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'inherit' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Gamification & Adherence Banner */}
      <div className="pill-gamification-banner">
        <div className="pill-score-circle-wrapper">
          <div className="pill-score-circle" style={{ '--score-pct': scorePct }}>
            <div className="pill-score-inner">
              <span className="pill-score-val">{scorePct}%</span>
              <span className="pill-score-label">Adherence</span>
            </div>
          </div>

          <div className="pill-streak-badge">
            <div className="pill-streak-count">🔥 {streakDays} Day Streak!</div>
            <span className="pill-streak-sub">{takenPills} of {totalPills} doses taken today</span>
          </div>
        </div>

        {/* Milestone Badges */}
        <div className="pill-badges-grid">
          <div className={`pill-badge-item ${streakDays >= 3 ? 'unlocked' : 'locked'}`}>
            <span>🥉</span>
            <span>3-Day Starter</span>
          </div>
          <div className={`pill-badge-item ${streakDays >= 7 ? 'unlocked' : 'locked'}`}>
            <span>🥈</span>
            <span>7-Day Pro</span>
          </div>
          <div className={`pill-badge-item ${streakDays >= 14 ? 'unlocked' : 'locked'}`}>
            <span>🥇</span>
            <span>14-Day Champion</span>
          </div>
          <div className={`pill-badge-item ${streakDays >= 30 ? 'unlocked' : 'locked'}`}>
            <span>👑</span>
            <span>Vitality Master</span>
          </div>
        </div>
      </div>

      {/* Smart Alerts & Notifications Toolbar */}
      <div 
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>🔔</span>
          <div>
            <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#1e293b' }}>
              Browser & Push Notification Alerts
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Status: {notificationPermission === 'granted' ? (
                <span style={{ color: '#15803d', fontWeight: '700' }}>✓ Enabled & Active (Sound + Push Alert)</span>
              ) : (
                <span style={{ color: '#b45309', fontWeight: '600' }}>⚠️ Permission Required</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {notificationPermission !== 'granted' ? (
            <button
              type="button"
              onClick={handleEnableNotifications}
              style={{
                background: '#4338ca',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🔔 Enable Push Notifications
            </button>
          ) : (
            <button
              type="button"
              onClick={handleTriggerTestReminder}
              style={{
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🔊 Test Sound & Alert
            </button>
          )}

          <button
            type="button"
            onClick={handleSyncWithDoctorPrescriptions}
            style={{
              background: '#f8fafc',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Import medicines recently prescribed by attending doctor"
          >
            🔄 Sync Doctor Prescriptions
          </button>
        </div>
      </div>

      {/* WhatsApp Daily Reminder Bar */}
      <div className="pill-whatsapp-bar">
        <div>
          <strong>📲 Daily WhatsApp Medication Reminder</strong>
          <span style={{ fontSize: '0.8rem' }}>Receive today's dosage checklist directly on your WhatsApp ({patientPhone || 'Registered Phone'}).</span>
        </div>
        <button className="pill-whatsapp-btn" onClick={handleSendWhatsAppDigest}>
          <span>💬</span>
          <span>Send Schedule to WhatsApp</span>
        </button>
      </div>

      {/* Slot Buckets Grid */}
      <div className="pill-slots-grid">
        {/* Morning */}
        <div className="pill-slot-card">
          <div className="pill-slot-header">
            <div className="pill-slot-title">
              <span>🌅</span>
              <span>Morning Doses</span>
            </div>
            <span className="pill-slot-time">08:00 AM</span>
          </div>

          <div className="pill-items-list">
            {pills.filter(p => p.slot === 'morning').length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '8px 0' }}>No morning doses scheduled.</p>
            ) : (
              pills.filter(p => p.slot === 'morning').map(pill => (
                <div key={pill.id} className={`pill-item-box ${pill.taken ? 'taken' : ''}`}>
                  <div className="pill-item-info">
                    <span className="pill-item-name">
                      {pill.name}
                    </span>
                    <span className="pill-item-sub">
                      ⏰ {pill.time} • {pill.dose} • {pill.instructions}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button className="pill-take-toggle-btn" onClick={() => toggleTakePill(pill.id)}>
                      {pill.taken ? '✓ Taken' : 'Take Dose'}
                    </button>
                    {String(pill.id).startsWith('custom-') && (
                      <button 
                        onClick={(e) => handleDeletePill(pill.id, e)}
                        title="Delete custom medication"
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '15px', padding: '2px 4px' }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Afternoon */}
        <div className="pill-slot-card">
          <div className="pill-slot-header">
            <div className="pill-slot-title">
              <span>☀️</span>
              <span>Afternoon Doses</span>
            </div>
            <span className="pill-slot-time">01:00 PM</span>
          </div>

          <div className="pill-items-list">
            {pills.filter(p => p.slot === 'afternoon').length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '8px 0' }}>No afternoon doses scheduled.</p>
            ) : (
              pills.filter(p => p.slot === 'afternoon').map(pill => (
                <div key={pill.id} className={`pill-item-box ${pill.taken ? 'taken' : ''}`}>
                  <div className="pill-item-info">
                    <span className="pill-item-name">
                      {pill.name}
                    </span>
                    <span className="pill-item-sub">
                      ⏰ {pill.time} • {pill.dose} • {pill.instructions}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button className="pill-take-toggle-btn" onClick={() => toggleTakePill(pill.id)}>
                      {pill.taken ? '✓ Taken' : 'Take Dose'}
                    </button>
                    {String(pill.id).startsWith('custom-') && (
                      <button 
                        onClick={(e) => handleDeletePill(pill.id, e)}
                        title="Delete custom medication"
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '15px', padding: '2px 4px' }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Night */}
        <div className="pill-slot-card">
          <div className="pill-slot-header">
            <div className="pill-slot-title">
              <span>🌙</span>
              <span>Night Doses</span>
            </div>
            <span className="pill-slot-time">08:00 PM</span>
          </div>

          <div className="pill-items-list">
            {pills.filter(p => p.slot === 'night').length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '8px 0' }}>No night doses scheduled.</p>
            ) : (
              pills.filter(p => p.slot === 'night').map(pill => (
                <div key={pill.id} className={`pill-item-box ${pill.taken ? 'taken' : ''}`}>
                  <div className="pill-item-info">
                    <span className="pill-item-name">
                      {pill.name}
                    </span>
                    <span className="pill-item-sub">
                      ⏰ {pill.time} • {pill.dose} • {pill.instructions}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button className="pill-take-toggle-btn" onClick={() => toggleTakePill(pill.id)}>
                      {pill.taken ? '✓ Taken' : 'Take Dose'}
                    </button>
                    {String(pill.id).startsWith('custom-') && (
                      <button 
                        onClick={(e) => handleDeletePill(pill.id, e)}
                        title="Delete custom medication"
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '15px', padding: '2px 4px' }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Custom Medicine / Supplement */}
      <form className="pill-add-form" onSubmit={handleAddCustomPill}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ color: '#1e293b', fontSize: '0.95rem' }}>➕ Add Custom Medicine / Supplement / Vitamin:</strong>
          <span style={{ fontSize: '11.5px', color: '#64748b' }}>Custom entries automatically trigger alerts & WhatsApp schedules</span>
        </div>
        <input 
          type="text" 
          placeholder="Medicine name (e.g. Pantoprazole 40mg)"
          className="pill-add-input"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          required
        />
        <input 
          type="text" 
          placeholder="Dose (e.g. 1 Tablet / 5ml)"
          style={{ width: '150px' }}
          className="pill-add-input"
          value={customDose}
          onChange={(e) => setCustomDose(e.target.value)}
        />
        <input 
          type="text" 
          placeholder="Instructions (e.g. Before breakfast)"
          style={{ minWidth: '180px' }}
          className="pill-add-input"
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
        />
        <select 
          value={customSlot} 
          onChange={(e) => {
            setCustomSlot(e.target.value);
            if (e.target.value === 'morning') setCustomTime('08:00');
            if (e.target.value === 'afternoon') setCustomTime('13:00');
            if (e.target.value === 'night') setCustomTime('20:00');
          }}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
        >
          <option value="morning">🌅 Morning</option>
          <option value="afternoon">☀️ Afternoon</option>
          <option value="night">🌙 Night</option>
        </select>
        <input 
          type="time" 
          value={customTime}
          onChange={(e) => setCustomTime(e.target.value)}
          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
        />
        <button type="submit" className="pill-add-btn">Add to Schedule</button>
      </form>
    </div>
  );
}
