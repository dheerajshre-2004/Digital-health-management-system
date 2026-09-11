import React, { useState, useEffect } from 'react';
import './PillTracker.css';
import { sendDailyPillReminderWhatsApp } from './whatsappService';
import { t } from './i18nService';

export default function PillTracker({ patientId, patientName, patientPhone }) {
  // Load prescribed and custom pills
  const [pills, setPills] = useState(() => {
    try {
      const saved = localStorage.getItem(`dhms_pill_schedule_${patientId}`);
      if (saved) return JSON.parse(saved);

      // Auto-populate from prescriptions if empty
      const allRx = JSON.parse(localStorage.getItem('dhms_prescriptions') || '[]');
      const patientRx = allRx.filter(r => r.patientId === patientId);
      
      const generated = [];
      patientRx.forEach((rx, rxIdx) => {
        const drug = rx.drugName || rx.medications?.[0]?.name || 'Amoxicillin 500mg';
        const dose = rx.dose || '1 Tablet';
        const freq = (rx.frequency || 'Once Daily').toLowerCase();

        if (freq.includes('twice') || freq.includes('bid')) {
          generated.push({ id: `rx-${rxIdx}-m`, name: drug, dose, slot: 'morning', taken: false, time: '08:00 AM', instructions: 'Take with breakfast' });
          generated.push({ id: `rx-${rxIdx}-n`, name: drug, dose, slot: 'night', taken: false, time: '08:00 PM', instructions: 'Take after dinner' });
        } else if (freq.includes('thrice') || freq.includes('tid')) {
          generated.push({ id: `rx-${rxIdx}-m`, name: drug, dose, slot: 'morning', taken: false, time: '08:00 AM', instructions: 'With breakfast' });
          generated.push({ id: `rx-${rxIdx}-a`, name: drug, dose, slot: 'afternoon', taken: false, time: '01:00 PM', instructions: 'With lunch' });
          generated.push({ id: `rx-${rxIdx}-n`, name: drug, dose, slot: 'night', taken: false, time: '08:00 PM', instructions: 'With dinner' });
        } else {
          generated.push({ id: `rx-${rxIdx}-m`, name: drug, dose, slot: 'morning', taken: false, time: '08:00 AM', instructions: 'Morning dose' });
        }
      });

      // Default baseline supplements if patient has no active Rx
      if (generated.length === 0) {
        generated.push(
          { id: 'def-1', name: 'Multivitamin & Zinc', dose: '1 Capsule', slot: 'morning', taken: true, time: '08:00 AM', instructions: 'Post-breakfast' },
          { id: 'def-2', name: 'Vitamin D3 60,000 IU', dose: '1 Softgel', slot: 'afternoon', taken: false, time: '01:00 PM', instructions: 'With meals' },
          { id: 'def-3', name: 'Calcium + Magnesium', dose: '500mg', slot: 'night', taken: false, time: '08:00 PM', instructions: 'Before bed' }
        );
      }

      return generated;
    } catch (e) {
      return [];
    }
  });

  // Streak Counter & Gamification
  const [streakDays, setStreakDays] = useState(() => {
    return parseInt(localStorage.getItem(`dhms_streak_${patientId}`) || '7', 10);
  });

  // Custom pill input form
  const [customName, setCustomName] = useState('');
  const [customDose, setCustomDose] = useState('1 Tab');
  const [customSlot, setCustomSlot] = useState('morning');

  // Save pills to storage
  useEffect(() => {
    try {
      localStorage.setItem(`dhms_pill_schedule_${patientId}`, JSON.stringify(pills));
    } catch (e) {}
  }, [pills, patientId]);

  // Compute adherence rate
  const totalPills = pills.length;
  const takenPills = pills.filter(p => p.taken).length;
  const scorePct = totalPills > 0 ? Math.round((takenPills / totalPills) * 100) : 100;

  const toggleTakePill = (id) => {
    setPills(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, taken: !p.taken };
      }
      return p;
    }));
  };

  const handleAddCustomPill = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const timeMap = { morning: '08:00 AM', afternoon: '01:00 PM', night: '08:00 PM' };
    const newPill = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      dose: customDose.trim() || '1 Tab',
      slot: customSlot,
      taken: false,
      time: timeMap[customSlot],
      instructions: 'Custom supplement / medication'
    };

    setPills(prev => [...prev, newPill]);
    setCustomName('');
    setCustomDose('1 Tab');
  };

  const handleSendWhatsAppDigest = () => {
    sendDailyPillReminderWhatsApp(pills, patientName || 'Patient', patientPhone || '');
  };

  return (
    <div className="pill-tracker-container">
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

      {/* WhatsApp Daily Reminder Bar */}
      <div className="pill-whatsapp-bar">
        <div>
          <strong>📲 Daily WhatsApp Medication Reminder</strong>
          <span style={{ fontSize: '0.8rem' }}>Receive today's dosage checklist directly on your WhatsApp at 8:00 AM.</span>
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
                    <span className="pill-item-sub">{pill.dose} • {pill.instructions}</span>
                  </div>
                  <button className="pill-take-toggle-btn" onClick={() => toggleTakePill(pill.id)}>
                    {pill.taken ? '✓ Taken' : 'Take Dose'}
                  </button>
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
                    <span className="pill-item-sub">{pill.dose} • {pill.instructions}</span>
                  </div>
                  <button className="pill-take-toggle-btn" onClick={() => toggleTakePill(pill.id)}>
                    {pill.taken ? '✓ Taken' : 'Take Dose'}
                  </button>
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
                    <span className="pill-item-sub">{pill.dose} • {pill.instructions}</span>
                  </div>
                  <button className="pill-take-toggle-btn" onClick={() => toggleTakePill(pill.id)}>
                    {pill.taken ? '✓ Taken' : 'Take Dose'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Custom Medicine / Supplement */}
      <form className="pill-add-form" onSubmit={handleAddCustomPill}>
        <strong style={{ color: '#1e293b', fontSize: '0.9rem' }}>➕ Add Custom Supplement / OTC Medicine:</strong>
        <input 
          type="text" 
          placeholder="Medicine name (e.g. Omega-3 Fish Oil)"
          className="pill-add-input"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          required
        />
        <input 
          type="text" 
          placeholder="Dose (e.g. 1000mg / 1 Capsule)"
          style={{ width: '140px' }}
          className="pill-add-input"
          value={customDose}
          onChange={(e) => setCustomDose(e.target.value)}
        />
        <select 
          value={customSlot} 
          onChange={(e) => setCustomSlot(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
        >
          <option value="morning">🌅 Morning (8 AM)</option>
          <option value="afternoon">☀️ Afternoon (1 PM)</option>
          <option value="night">🌙 Night (8 PM)</option>
        </select>
        <button type="submit" className="pill-add-btn">Add to Schedule</button>
      </form>
    </div>
  );
}
