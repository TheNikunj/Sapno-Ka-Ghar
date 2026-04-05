import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DeviceIcon from '../../components/DeviceIcon';
import HomeChat from '../../components/HomeChat';

const OwnerDashboard = ({ homeInfo, NotificationsUI, toggleDevice, handleLogout, user, latestNotification, socket }) => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const activeRoom = homeInfo?.rooms?.find(r => r._id === currentRoomId);
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // Keep pending requests synced dynamically or via reload
  useEffect(() => {
    setPendingRequestsCount(homeInfo?.members?.filter(m => m.status === 'pending').length || 0);
  }, [homeInfo]);

  // Real-time tracking and WebSockets
  useEffect(() => {
    if (!socket) return;
    const handleChat = (msg) => {
      if (activeTab !== 'chat') {
        const myId = String(user.id || user._id);
        if (String(msg.senderId) !== myId) {
          setUnreadChatCount(prev => prev + 1);
        }
      }
    };
    
    // Clear unread count automatically when the chat gets cleared by owner
    const handleChatCleared = () => {
      setUnreadChatCount(0);
    };

    // Handle incoming join requests dynamically
    const handleNewRequest = () => {
      // Push the count up instantly when anyone requests
      setPendingRequestsCount(prev => prev + 1);
    };

    socket.on('receiveChatMessage', handleChat);
    socket.on('chatCleared', handleChatCleared);
    socket.on('newJoinRequest', handleNewRequest);

    return () => {
      socket.off('receiveChatMessage', handleChat);
      socket.off('chatCleared', handleChatCleared);
      socket.off('newJoinRequest', handleNewRequest);
    };
  }, [socket, activeTab, user]);

  // New Room Creation States
  const [newRoom, setNewRoom] = useState({ name: '', devices: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const addDeviceToNewRoom = (type) => {
    let devName = 'Device';
    if(type === 'light') devName = 'Smart Light';
    if(type === 'fan') devName = 'Ceiling Fan';
    if(type === 'ac') devName = 'A/C Unit';
    if(type === 'tv') devName = 'Smart TV';
    if(type === 'fridge') devName = 'Refrigerator';

    const currentCount = newRoom.devices.filter(d => d.type === type).length;
    setNewRoom(prev => ({ 
      ...prev, 
      devices: [...prev.devices, { name: currentCount === 0 ? devName : `${devName} ${currentCount + 1}`, type }] 
    }));
  };

  const removeDeviceFromNewRoom = (type) => {
    setNewRoom(prev => {
      const devices = [...prev.devices];
      for (let i = devices.length - 1; i >= 0; i--) {
        if (devices[i].type === type) {
          devices.splice(i, 1);
          break;
        }
      }
      return { ...prev, devices };
    });
  };

  const submitNewRoom = async () => {
    if(!newRoom.name.trim()) return;
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const res = await fetch('https://sapno-ka-ghar-backend.onrender.com/api/home/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newRoom)
      });
      if(res.ok) {
        setNewRoom({ name: '', devices: [] });
        setActiveTab('dashboard');
      }
    } catch(err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []); // Note: Might want to depend on socket events natively but simple fetch on mount works to populate historic data

  useEffect(() => {
    if(latestNotification) {
      setHistory(prev => {
        // Prevent duplicate appending if component strict-mode fires
        if(prev.find(n => n._id === latestNotification._id)) return prev;
        return [latestNotification, ...prev];
      });
    }
  }, [latestNotification]);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://sapno-ka-ghar-backend.onrender.com/api/home/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if(res.ok) setHistory(data);
    } catch(err) {
      console.error(err);
    }
  };

  const activeMembers = homeInfo?.members?.filter(m => m.status === 'approved') || [];
  const pendingMembers = homeInfo?.members?.filter(m => m.status === 'pending') || [];

  const handleClearNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://sapno-ka-ghar-backend.onrender.com/api/home/notifications/clear', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if(res.ok) setHistory([]);
    } catch(err) {
      console.error(err);
    }
  };

  const handleApprove = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://sapno-ka-ghar-backend.onrender.com/api/home/approve/${userId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Backend will emit 'homeUpdated' socket event to refresh State
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://sapno-ka-ghar-backend.onrender.com/api/home/reject/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Backend will emit 'homeUpdated' socket event to refresh State
    } catch (err) {
      console.error(err);
    }
  };

  const handlePromote = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://sapno-ka-ghar-backend.onrender.com/api/home/promote/${userId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Backend will emit 'homeUpdated' socket event to refresh State
    } catch (err) {
      console.error(err);
    }
  };

  const handleDemote = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://sapno-ka-ghar-backend.onrender.com/api/home/demote/${userId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Backend will emit 'homeUpdated' socket event to refresh State
    } catch (err) {
      console.error(err);
    }
  };

  const getWattage = (type) => {
    const t = type.toLowerCase();
    if(t.includes('ac')) return 1500;
    if(t.includes('freeze') || t.includes('fridge')) return 250;
    if(t.includes('tv')) return 150;
    if(t.includes('fan')) return 60;
    if(t.includes('light')) return 15;
    return 50; 
  };

  const calculatePower = () => {
    let power = 0;
    homeInfo?.rooms?.forEach(room => {
      room.devices.forEach(dev => {
        if(dev.isOn) power += getWattage(dev.type);
      });
    });
    return power;
  };

  const turnOffAll = () => {
    homeInfo?.rooms?.forEach(room => {
      room.devices.forEach(dev => {
        if(dev.isOn) {
          toggleDevice(room._id, dev._id, true); 
        }
      });
    });
  };

  const getRoomImage = (name) => {
    const n = name.toLowerCase();
    if(n.includes('kitchen')) return 'https://images.unsplash.com/photo-1556910103-1c02745a828?w=500&q=80';
    if(n.includes('bed')) return 'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=500&q=80';
    if(n.includes('living')) return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500&q=80';
    if(n.includes('bath')) return 'https://images.unsplash.com/photo-1584622650111-993d426fbf0a?w=500&q=80';
    return 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&q=80'; // generic modern house
  };

  const mainDevices = [];
  homeInfo?.rooms?.forEach(room => {
    room.devices.forEach(dev => {
      const t = dev.type.toLowerCase();
      if(t.includes('ac') || t.includes('tv') || t.includes('freeze') || t.includes('fridge') || t.includes('washing')) {
        mainDevices.push({ ...dev, roomId: room._id, roomName: room.name });
      }
    });
  });

  return (
    <div className="dashboard-layout fade-in">
      <NotificationsUI />
      
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-brand">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="url(#yellowGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 12px rgba(234, 235, 114, 0.6))', marginTop: '-4px' }}>
              <defs>
                <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#EAEB72" />
                </linearGradient>
              </defs>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span className="brand-text">Sapno Ka Ghar</span>
          </h2>
          <button className="mobile-logout-btn" onClick={handleLogout} title="Log Out">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
        <div className="sidebar-menu">
          <p className="menu-label">Main Menu</p>
          <div className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <span style={{ marginLeft: '10px' }}>Dashboard</span>
          </div>
          <div className={`menu-item ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
            <span style={{ marginLeft: '10px' }}>Household Members</span>
          </div>
          <div className={`menu-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
            <span style={{ marginLeft: '10px' }}>Activity Log</span>
          </div>
          <div className={`menu-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => { setActiveTab('chat'); setUnreadChatCount(0); }}>
            <span style={{ marginLeft: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Home Chat
              {unreadChatCount > 0 && (
                <span style={{ background: '#FF3333', color: '#FFF', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold', boxShadow: '0 0 10px rgba(255,50,50,0.5)' }}>
                  {unreadChatCount}
                </span>
              )}
            </span>
          </div>
          {user.role === 'Owner' && (
            <>
              <div className={`menu-item ${activeTab === 'join_requests' ? 'active' : ''}`} onClick={() => setActiveTab('join_requests')}>
                <span style={{ marginLeft: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Join Requests
                  {pendingRequestsCount > 0 && (
                    <span style={{ background: '#44FF44', color: '#000', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold', boxShadow: '0 0 10px rgba(68,255,68,0.5)' }}>
                      {pendingRequestsCount}
                    </span>
                  )}
                </span>
              </div>
              <div className={`menu-item ${activeTab === 'add_room' ? 'active' : ''}`} onClick={() => setActiveTab('add_room')}>
                <span style={{ marginLeft: '10px' }}>Set Up New Room</span>
              </div>
            </>
          )}
          
          <p className="menu-label" style={{ marginTop: 'auto' }}>System</p>
          <div className="menu-item logout-menu-item" onClick={handleLogout}>
            <span style={{ marginLeft: '10px' }}>Log out</span>
          </div>
        </div>
      </div>

      {/* Main Layout Screen */}
      <div className="main-content">
        <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div className="user-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <h1 style={{ fontWeight: 600, letterSpacing: '-0.5px', margin: 0 }}>Welcome <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{user.email.split('@')[0]}</span></h1>
              <span style={{ 
                background: user.role === 'Owner' ? 'rgba(234, 235, 114, 0.15)' : 'rgba(100, 200, 255, 0.15)', 
                color: user.role === 'Owner' ? 'var(--accent-yellow)' : '#64C8FF', 
                padding: '4px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
                border: user.role === 'Owner' ? '1px solid rgba(234, 235, 114, 0.3)' : '1px solid rgba(100, 200, 255, 0.3)'
              }}>
                {user.role}
              </span>
            </div>
            {user.role === 'Owner' && (
              <div 
                onClick={() => setShowAccessCode(!showAccessCode)}
                title="Click to Reveal Code"
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '6px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', width: 'max-content', marginTop: '12px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)', transition: '0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showAccessCode ? (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </>
                  ) : (
                    <>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </>
                  )}
                </svg>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>Access Code</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', letterSpacing: '2px', fontFamily: 'monospace', fontSize: '1.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '10px' }}>
                  {showAccessCode ? `${homeInfo.uniqueHomeName} - ${homeInfo.homeCode}` : '••••••••••••••••'}
                </span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px', fontWeight: 600, whiteSpace: 'nowrap' }}>Live Power Draw</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', whiteSpace: 'nowrap' }}>
                <h2 style={{ color: 'var(--accent-yellow)', margin: 0, fontSize: '2.4rem', fontWeight: '800', lineHeight: '1', textShadow: '0 0 20px rgba(234, 235, 114, 0.4)' }}>{calculatePower()}</h2>
                <span style={{ color: 'var(--accent-yellow)', fontSize: '1rem', fontWeight: 'bold', opacity: 0.8 }}>W</span>
              </div>
            </div>

            <button 
              onClick={turnOffAll}
              style={{
                background: 'linear-gradient(135deg, rgba(200,30,30,0.15) 0%, rgba(150,0,0,0.2) 100%)',
                color: '#FF5555',
                fontWeight: '600',
                padding: '0.8rem 1.8rem',
                borderRadius: '12px',
                border: '1px solid rgba(255,68,68,0.3)',
                boxShadow: '0 8px 25px rgba(255,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,50,50,0.25) 0%, rgba(200,0,0,0.4) 100%)'; 
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(255,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)';
                e.currentTarget.style.color = '#FFF';
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(200,30,30,0.15) 0%, rgba(150,0,0,0.2) 100%)'; 
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)';
                e.currentTarget.style.color = '#FF5555';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                <line x1="12" y1="2" x2="12" y2="12"></line>
              </svg>
              SYSTEM OFF
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="fade-in">
            {mainDevices.length > 0 && (
              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', fontSize: '1.3rem', fontWeight: 600, letterSpacing: '0.3px' }}>Main Heavy Appliances</h3>
                <div className="devices-grid">
                  {mainDevices.map(device => (
                    <DeviceIcon 
                      key={device._id} 
                      device={device} 
                      onToggle={() => toggleDevice(device.roomId, device._id, device.isOn)} 
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', fontSize: '1.3rem', fontWeight: 600, letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                Rooms <span style={{ background: 'var(--bg-panel)', padding: '2px 10px', borderRadius: '12px', fontSize: '0.9rem', color: 'var(--accent-yellow)', border: '1px solid var(--border-subtle)' }}>{homeInfo?.rooms?.length || 0}</span>
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                {homeInfo?.rooms.map(room => {
                  const activeCount = room.devices.filter(d => d.isOn).length;
                  return (
                    <div 
                      key={room._id} 
                      onClick={() => { setCurrentRoomId(room._id); setActiveTab('room_view'); }}
                      style={{ 
                        borderRadius: '20px', overflow: 'hidden', cursor: 'pointer', position: 'relative', height: '220px',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-6px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0px)'}
                    >
                      <img 
                        src={getRoomImage(room.name)} 
                        alt={room.name} 
                        onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&q=80'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75, transition: 'opacity 0.3s' }} 
                        onMouseEnter={(e) => e.target.style.opacity = 0.9}
                        onMouseLeave={(e) => e.target.style.opacity = 0.75}
                      />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '25px 20px', background: 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0))' }}>
                        <h3 style={{ color: '#FFF', fontSize: '1.5rem', marginBottom: '8px', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{room.name}</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#AAA', fontSize: '0.90rem', fontWeight: 500 }}>{room.devices.length} Connected Devices</span>
                          {activeCount > 0 && (
                            <span style={{ background: 'var(--accent-yellow)', color: '#000', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', boxShadow: '0 0 10px rgba(234, 235, 114, 0.4)' }}>
                              {activeCount} Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'room_view' && activeRoom && (
          <div className="fade-in">
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span 
                onClick={() => setActiveTab('dashboard')} 
                style={{ cursor: 'pointer', color: 'var(--accent-yellow)', fontSize: '1rem', background: 'rgba(255,255,255,0.05)', padding: '5px 12px', borderRadius: '8px' }}
              >
                ← Back
              </span> 
              {activeRoom.name}
            </h3>
            
            <div className="devices-grid">
              {activeRoom.devices.map(device => (
                <DeviceIcon 
                  key={device._id} 
                  device={device} 
                  onToggle={() => toggleDevice(activeRoom._id, device._id, device.isOn)} 
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="fade-in">
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', fontSize: '1.3rem', fontWeight: 600, letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Active Household Members <span style={{ background: 'var(--bg-panel)', padding: '2px 10px', borderRadius: '12px', fontSize: '0.9rem', color: 'var(--accent-yellow)', border: '1px solid var(--border-subtle)' }}>{activeMembers.length}</span>
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Force Render Home Creator (Owner) natively so it reflects in the Members count optically */}
              <div style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                background: 'linear-gradient(135deg, rgba(234, 235, 114, 0.05) 0%, rgba(0,0,0,0.5) 100%)', 
                padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(234, 235, 114, 0.2)', boxShadow: '0 4px 15px rgba(0,0,0,0.4)', transition: 'transform 0.3s' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(234, 235, 114, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--accent-yellow)' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-yellow)' }}>
                      {homeInfo?.owner?.name ? homeInfo.owner.name.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.15rem' }}>
                      {homeInfo?.owner?.name || 'Home Creator'} 
                      {String(user.id || user._id) === String(homeInfo?.owner?._id) && <span style={{fontSize: '0.8rem', opacity: 0.5}}> (You)</span>}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{homeInfo?.owner?.email}</span>
                    <span style={{ color: 'var(--accent-yellow)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                      🌟 Home Creator
                    </span>
                  </div>
                </div>
              </div>

              {activeMembers.filter(m => m.user).map(m => (
                <div key={m.user._id} style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '16px', 
                  border: m.role === 'admin' ? '1px solid rgba(234, 235, 114, 0.3)' : '1px solid var(--border-subtle)', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', transition: 'transform 0.3s' 
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0px)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    
                    {/* Premium Avatar Profile Icon */}
                    <div style={{ 
                      width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(234, 235, 114, 0.1)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(234, 235, 114, 0.3)' 
                    }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-yellow)' }}>
                        {m.user?.name ? m.user.name.charAt(0).toUpperCase() : '?'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.15rem' }}>{m.user?.name || 'Unknown User'}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{m.user?.email}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ color: '#44FF44', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#44FF44' }} /> Active 
                        </span>
                        <span style={{ color: m.role === 'admin' ? 'var(--accent-yellow)' : 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          • {m.role === 'admin' ? 'Admin' : 'Member'}
                        </span>
                      </div>
                    </div>

                  </div>

                  {user.role === 'Owner' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {m.role === 'admin' ? (
                        <button 
                          onClick={() => handleDemote(m.user._id)}
                          title="Demote to standard Member"
                          style={{ background: 'rgba(255,150,50,0.1)', color: '#FFAA33', border: '1px solid rgba(255,150,50,0.3)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.7rem', transition: 'all 0.2s', textTransform: 'uppercase' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#FFAA33'; e.currentTarget.style.color = '#000'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,150,50,0.1)'; e.currentTarget.style.color = '#FFAA33'; }}
                        >
                          Demote
                        </button>
                      ) : (
                        <button 
                          onClick={() => handlePromote(m.user._id)}
                          title="Promote to House Admin"
                          style={{ background: 'rgba(234, 235, 114, 0.1)', color: 'var(--accent-yellow)', border: '1px solid rgba(234, 235, 114, 0.3)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.7rem', transition: 'all 0.2s', textTransform: 'uppercase' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-yellow)'; e.currentTarget.style.color = '#000'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(234, 235, 114, 0.1)'; e.currentTarget.style.color = 'var(--accent-yellow)'; }}
                        >
                          Promote
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleReject(m.user._id) }
                        title="Revoke access & block member"
                        style={{ 
                          background: 'rgba(255,50,50,0.1)', color: '#FF5555', border: '1px solid rgba(255,50,50,0.3)', 
                          padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.7rem', transition: 'all 0.2s', textTransform: 'uppercase'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#FF4444'; e.currentTarget.style.color = '#FFF'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,50,50,0.1)'; e.currentTarget.style.color = '#FF5555'; }}
                      >
                        Block
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="fade-in" style={{ paddingBottom: '2rem' }}>
            <div style={{ 
              display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', 
              marginBottom: '2rem', gap: '1rem', background: 'var(--bg-panel)', padding: '1.5rem', 
              borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'rgba(234, 235, 114, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(234, 235, 114, 0.2)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-yellow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                </div>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 700, letterSpacing: '0.5px', margin: 0 }}>
                  24-Hour Activity Log
                </h3>
              </div>
              
              {user.role === 'Owner' && history.length > 0 && (
                <button 
                  onClick={handleClearNotifications}
                  title="Wipe all history logs"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(200,30,30,0.15) 0%, rgba(150,0,0,0.2) 100%)',
                    color: '#FF5555',
                    border: '1px solid rgba(255,68,68,0.3)',
                    boxShadow: '0 8px 25px rgba(255,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
                    padding: '0.8rem 1.4rem', 
                    borderRadius: '12px', 
                    cursor: 'pointer', 
                    fontWeight: '600', 
                    fontSize: '0.9rem', 
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: 'fit-content',
                    marginLeft: 'auto'
                  }}
                  onMouseEnter={(e) => { 
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,50,50,0.25) 0%, rgba(200,0,0,0.4) 100%)'; 
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(255,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)';
                    e.currentTarget.style.color = '#FFF';
                  }}
                  onMouseLeave={(e) => { 
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(200,30,30,0.15) 0%, rgba(150,0,0,0.2) 100%)'; 
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(255,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = '#FF5555';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                  Delete All Logs
                </button>
              )}
            </div>

            <div className="glass-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)', maxHeight: '650px', overflowY: 'auto', borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.2)' }}>
              {history.length === 0 ? (
                <div style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '3rem', opacity: 0.5 }}>📭</span>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 500, margin: 0 }}>No recent activity within 24 hours.</p>
                </div>
              ) : null}
              {history.map((log, idx) => {
                // Remove the hardcoded bell emoji from the backend
                let finalMessage = log.message.replace('🔔 ', '');
                
                if(log.actorName === user.name) {
                  finalMessage = finalMessage.replace(log.actorName, 'You');
                }
                const isOff = finalMessage.includes('OFF');
                return (
                  <div key={log._id} style={{ 
                    padding: '1.25rem 1.5rem', borderBottom: idx === history.length - 1 ? 'none' : '1px solid var(--border-subtle)', 
                    display: 'flex', alignItems: 'center', gap: '18px', transition: 'background 0.2s', cursor: 'default'
                  }} 
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} 
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ 
                      flexShrink: 0, width: '46px', height: '46px', borderRadius: '50%', 
                      background: isOff ? 'rgba(255,50,50,0.15)' : 'rgba(68,255,68,0.15)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      border: `1px solid ${isOff ? 'rgba(255,50,50,0.3)' : 'rgba(68,255,68,0.3)'}`,
                      boxShadow: `0 0 15px ${isOff ? 'rgba(255,50,50,0.1)' : 'rgba(68,255,68,0.1)'}`
                    }}>
                      <span style={{ fontSize: '1.2rem' }}>{isOff ? '🔌' : '⚡'}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 600, margin: '0 0 6px 0', letterSpacing: '0.2px' }}>{finalMessage}</p>
                      <small style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        {new Date(log.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'join_requests' && (
          <div className="room-section fade-in" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Pending Join Requests</h3>
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-panel)' }}>
              {pendingMembers.length === 0 ? <p style={{color: 'var(--text-secondary)'}}>No pending requests at the moment.</p> : null}
              
              {pendingMembers.map(m => (
                <div key={m.user._id} className="user-item" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)'}}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{m.user.email}</strong>
                    <br/>
                    <small style={{ color: 'var(--text-secondary)' }}>Role: Member</small>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleApprove(m.user._id)}
                      style={{ background: 'var(--accent-yellow)', color: 'var(--text-dark)', padding: '0.4rem 1rem', fontSize: '0.9rem', margin: 0 }}
                    >
                      ✅ Approve
                    </button>
                    <button 
                      onClick={() => handleReject(m.user._id)}
                      style={{ background: 'transparent', border: '1px solid #FF0000', color: '#FF0000', padding: '0.4rem 1rem', fontSize: '0.9rem', margin: 0 }}
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'add_room' && (
          <div className="fade-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 600, letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Deploy New Hardware Zone
            </h3>
            <div className="glass-card" style={{ padding: '2rem', background: 'var(--bg-panel)' }}>
              
              <label style={{ display: 'block', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 600 }}>Zone Designation</label>
              <input 
                type="text" 
                value={newRoom.name} 
                onChange={e => setNewRoom(prev => ({...prev, name: e.target.value}))} 
                placeholder="e.g. Master Bedroom, Garage" 
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', color: '#FFF', fontSize: '1.1rem', marginBottom: '2.5rem', outline: 'none', transition: 'border 0.3s' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-yellow)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />

              <label style={{ display: 'block', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem', marginBottom: '12px', fontWeight: 600 }}>Load Hardware ({newRoom.devices.length} Nodes)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '2rem' }}>
                  {[
                    { type: 'light', label: 'Smart Light', icon: '💡', color: 'var(--accent-yellow)', bg: 'rgba(234, 235, 114, 0.15)' },
                    { type: 'fan', label: 'Ceiling Fan', icon: '🌀', color: '#64C8FF', bg: 'rgba(100, 200, 255, 0.15)' },
                    { type: 'ac', label: 'A/C Unit', icon: '❄️', color: '#FF9696', bg: 'rgba(255, 150, 150, 0.15)' },
                    { type: 'tv', label: 'Smart TV', icon: '📺', color: '#96FF96', bg: 'rgba(150, 255, 150, 0.15)' },
                    { type: 'fridge', label: 'Refrigerator', icon: '🧊', color: '#C896FF', bg: 'rgba(200, 150, 255, 0.15)' },
                  ].map(devConf => {
                     const count = newRoom.devices.filter(d => d.type === devConf.type).length;
                     return (
                        <div key={devConf.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '12px', border: count > 0 ? `1px solid ${devConf.bg}` : '1px solid rgba(255,255,255,0.05)', transition: 'all 0.3s' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                             <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: devConf.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>{devConf.icon}</div>
                             <span style={{ color: count > 0 ? '#FFF' : '#AAA', fontSize: '1.1rem', fontWeight: 600 }}>{devConf.label}</span>
                           </div>
                           
                           <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(0,0,0,0.5)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                             <button onClick={() => removeDeviceFromNewRoom(devConf.type)} disabled={count === 0} style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'transparent', border: 'none', color: count === 0 ? '#555' : '#FFF', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: count === 0 ? 'not-allowed' : 'pointer' }}>−</button>
                             <span style={{ width: '25px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: count > 0 ? devConf.color : '#666' }}>{count}</span>
                             <button onClick={() => addDeviceToNewRoom(devConf.type)} style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>+</button>
                           </div>
                        </div>
                     )
                  })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
                 <button 
                   onClick={submitNewRoom}
                   disabled={!newRoom.name.trim() || isSubmitting}
                   style={{ background: newRoom.name.trim() ? 'var(--accent-yellow)' : 'rgba(255,255,255,0.1)', color: newRoom.name.trim() ? '#000' : '#888', fontWeight: 'bold', padding: '14px 30px', borderRadius: '12px', fontSize: '1.1rem', cursor: newRoom.name.trim() && !isSubmitting ? 'pointer' : 'not-allowed', border: 'none', transition: '0.3s' }}
                 >
                   {isSubmitting ? 'Processing...' : 'Finalize & Boot Hardware Zone'}
                 </button>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="fade-in" style={{ height: 'calc(100vh - 150px)', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
            <HomeChat 
              socket={socket} 
              homeInfo={homeInfo} 
              user={user} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;
