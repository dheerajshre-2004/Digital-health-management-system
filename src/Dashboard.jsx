import React, { useState } from 'react';
import './Dashboard.css';

const DUMMY_DEPARTMENTS = [
  { id: 1, name: 'Cardiology', head: 'Dr. Smith' },
  { id: 2, name: 'Neurology', head: 'Dr. Adams' },
  { id: 3, name: 'Pediatrics', head: 'Dr. Johnson' },
  { id: 4, name: 'Orthopedics', head: 'Dr. Williams' },
];

const DUMMY_DOCTORS = [
  { id: 1, name: 'Dr. Sarah Smith', department: 'Cardiology', status: 'Available' },
  { id: 2, name: 'Dr. John Adams', department: 'Neurology', status: 'On Leave' },
  { id: 3, name: 'Dr. Emily Johnson', department: 'Pediatrics', status: 'Available' },
  { id: 4, name: 'Dr. Michael Williams', department: 'Orthopedics', status: 'In Surgery' },
];

const DUMMY_PATIENTS = [
  { id: 101, name: 'Michael Brown', age: 45, gender: 'Male', lastVisit: '2026-07-10' },
  { id: 102, name: 'Lisa Ray', age: 32, gender: 'Female', lastVisit: '2026-07-12' },
  { id: 103, name: 'David Kim', age: 28, gender: 'Male', lastVisit: '2026-07-14' },
];

export default function Dashboard({ onLogout, role }) {
  const [activeView, setActiveView] = useState('overview');

  // Navigation config based on role
  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return [
          { id: 'overview', label: 'Overview' },
          { id: 'departments', label: 'Departments' },
          { id: 'doctors', label: 'Doctors' },
          { id: 'patients', label: 'Patients' }
        ];
      case 'doctor':
        return [
          { id: 'overview', label: 'My Dashboard' },
          { id: 'mypatients', label: 'My Patients' },
          { id: 'appointments', label: 'Appointments' }
        ];
      case 'patient':
        return [
          { id: 'overview', label: 'Patient Portal' },
          { id: 'doctors', label: 'Find a Doctor' },
          { id: 'records', label: 'My Records' }
        ];
      case 'laboratory':
        return [
          { id: 'overview', label: 'Lab Dashboard' },
          { id: 'requests', label: 'Lab Requests' }
        ];
      case 'pharmacist':
        return [
          { id: 'overview', label: 'Pharmacy Dashboard' },
          { id: 'prescriptions', label: 'Prescriptions' }
        ];
      default:
        return [{ id: 'overview', label: 'Overview' }];
    }
  };

  const navItems = getNavItems();

  const renderRoleOverview = () => {
    if (role === 'admin') {
      return (
        <>
          <p>Welcome Admin. You can manage foundational entities (Departments, Doctors, Patients) across the hospital.</p>
          <div className="stats-grid">
            <div className="stat-card" onClick={() => setActiveView('departments')}>
              <h3>Departments</h3>
              <div className="stat-value">{DUMMY_DEPARTMENTS.length}</div>
            </div>
            <div className="stat-card" onClick={() => setActiveView('doctors')}>
              <h3>Doctors</h3>
              <div className="stat-value">{DUMMY_DOCTORS.length}</div>
            </div>
            <div className="stat-card" onClick={() => setActiveView('patients')}>
              <h3>Patients</h3>
              <div className="stat-value">{DUMMY_PATIENTS.length}</div>
            </div>
          </div>
        </>
      );
    } else if (role === 'doctor') {
      return (
        <>
          <p>Welcome Dr. You can view your assigned patients and manage your appointments here.</p>
          <div className="stats-grid">
            <div className="stat-card" onClick={() => setActiveView('mypatients')}>
              <h3>My Patients</h3>
              <div className="stat-value">12</div>
            </div>
            <div className="stat-card">
              <h3>Today's Appointments</h3>
              <div className="stat-value">5</div>
            </div>
          </div>
        </>
      );
    } else if (role === 'patient') {
      return (
        <>
          <p>Welcome to your personal health portal. Find doctors and view your medical records.</p>
          <div className="stats-grid">
            <div className="stat-card" onClick={() => setActiveView('doctors')}>
              <h3>Available Doctors</h3>
              <div className="stat-value">{DUMMY_DOCTORS.filter(d => d.status === 'Available').length}</div>
            </div>
            <div className="stat-card">
              <h3>Upcoming Visits</h3>
              <div className="stat-value">1</div>
            </div>
          </div>
        </>
      );
    } else if (role === 'laboratory') {
      return (
        <>
          <p>Welcome to the Laboratory portal. Manage test requests and results.</p>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Pending Requests</h3>
              <div className="stat-value">8</div>
            </div>
          </div>
        </>
      );
    } else if (role === 'pharmacist') {
      return (
        <>
          <p>Welcome to the Pharmacy portal. Manage prescriptions and inventory.</p>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>New Prescriptions</h3>
              <div className="stat-value">14</div>
            </div>
          </div>
        </>
      );
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'departments':
        return (
          <div className="module-content">
            <h2>Departments (Module 2)</h2>
            <table className="data-table">
              <thead><tr><th>ID</th><th>Department Name</th><th>Head of Department</th></tr></thead>
              <tbody>
                {DUMMY_DEPARTMENTS.map(d => (
                  <tr key={d.id}><td>{d.id}</td><td>{d.name}</td><td>{d.head}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'doctors':
        return (
          <div className="module-content">
            <h2>Doctors (Module 2)</h2>
            <table className="data-table">
              <thead><tr><th>ID</th><th>Doctor Name</th><th>Department</th><th>Status</th></tr></thead>
              <tbody>
                {DUMMY_DOCTORS.map(d => (
                  <tr key={d.id}><td>{d.id}</td><td>{d.name}</td><td>{d.department}</td>
                    <td><span className={`status-badge ${d.status === 'Available' ? 'available' : d.status === 'On Leave' ? 'leave' : 'surgery'}`}>{d.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'patients':
      case 'mypatients':
        return (
          <div className="module-content">
            <h2>{role === 'doctor' ? 'My Patients' : 'All Patients'} (Module 2)</h2>
            <table className="data-table">
              <thead><tr><th>ID</th><th>Patient Name</th><th>Age</th><th>Gender</th><th>Last Visit</th></tr></thead>
              <tbody>
                {DUMMY_PATIENTS.map(p => (
                  <tr key={p.id}><td>{p.id}</td><td>{p.name}</td><td>{p.age}</td><td>{p.gender}</td><td>{p.lastVisit}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'records':
      case 'appointments':
      case 'requests':
      case 'prescriptions':
        return (
          <div className="module-content">
            <h2>{navItems.find(n => n.id === activeView)?.label}</h2>
            <div className="upcoming-module-notice">
              <h4>Module 3 & Beyond Feature</h4>
              <p>This section is scheduled for Phase 3. Core entities (Doctors, Patients, Departments) are established in Phase 2.</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="module-content overview">
            <h2>{navItems[0].label}</h2>
            {renderRoleOverview()}
            
            <div className="upcoming-module-notice" style={{ marginTop: '30px' }}>
              <h4>Module 3 & Beyond (Coming Soon)</h4>
              <p>Appointments, EHR, Prescriptions, and Billing features are scheduled for Phase 3 and will reference the core Patient and Doctor entities.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>DHMS</h2>
        </div>
        <ul className="sidebar-nav">
          {navItems.map(item => (
            <li 
              key={item.id}
              className={activeView === item.id ? 'active' : ''} 
              onClick={() => setActiveView(item.id)}
            >
              {item.label}
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout}>Sign Out</button>
        </div>
      </aside>
      <main className="dashboard-main">
        <header className="topbar">
          <div className="topbar-title">Role: <span style={{ textTransform: 'capitalize' }}>{role}</span></div>
          <div className="user-profile">Current User</div>
        </header>
        <div className="content-area">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
