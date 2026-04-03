import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Owner');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await fetch(`https://sapno-ka-ghar-backend.onrender.com${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isLogin ? { email, password } : { name, email, password, role }
        )
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Let Dashboard handle routing logic based on Home presence
        if (data.user.role === 'Admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setMsg(data.message);
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', background: '#080808'
    }}>
      {/* Immersive Background Structure */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundImage: 'url(https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=1600&q=80)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(10px) saturate(0.5)', opacity: 0.2 }}></div>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'linear-gradient(135deg, rgba(8,8,8,0.7) 0%, rgba(8,8,8,1) 100%)' }}></div>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(234, 235, 114, 0.08) 0%, rgba(0,0,0,0) 60%)', zIndex: 1, pointerEvents: 'none' }}></div>

      {/* Main Glass Card */}
      <div className="fade-in" style={{ 
        position: 'relative', zIndex: 10, width: '100%', maxWidth: '460px', background: 'rgba(20, 20, 20, 0.65)', backdropFilter: 'blur(25px)', WebkitBackdropFilter: 'blur(25px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '3.5rem 3rem', boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255,255,255,0.1)'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--accent-yellow)', borderRadius: '12px', margin: '0 auto 1.5rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(234, 235, 114, 0.3)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1rem', lineHeight: 1.4 }}>
            {isLogin ? 'Enter your credentials to securely access your home ecosystem.' : 'Join the household and connect your devices instantly.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          {error && (
            <div className="fade-in" style={{ background: 'rgba(255, 50, 50, 0.1)', border: '1px solid rgba(255, 50, 50, 0.2)', padding: '1rem', borderRadius: '12px', color: '#FF5555', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink: 0}}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              {error}
            </div>
          )}

          {msg && (
            <div className="fade-in" style={{ background: 'rgba(68, 255, 68, 0.1)', border: '1px solid rgba(68, 255, 68, 0.2)', padding: '1rem', borderRadius: '12px', color: '#44FF44', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink: 0}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              {msg}
            </div>
          )}

          {!isLogin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Full Name</label>
              <input type="text" placeholder="e.g. John Doe" value={name} onChange={(e) => setName(e.target.value)} required style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 18px', borderRadius: '12px', fontSize: '1rem', color: '#FFF', transition: '0.3s', outline: 'none' }} onFocus={e => e.target.style.borderColor = 'var(--accent-yellow)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}/>
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Email Address</label>
            <input type="email" placeholder="you@domain.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 18px', borderRadius: '12px', fontSize: '1rem', color: '#FFF', transition: '0.3s', outline: 'none' }} onFocus={e => e.target.style.borderColor = 'var(--accent-yellow)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}/>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 18px', borderRadius: '12px', fontSize: '1rem', color: '#FFF', transition: '0.3s', outline: 'none', letterSpacing: '2px' }} onFocus={e => e.target.style.borderColor = 'var(--accent-yellow)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}/>
          </div>
          
          {!isLogin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>System Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 18px', borderRadius: '12px', fontSize: '1rem', color: '#FFF', transition: '0.3s', cursor: 'pointer', outline: 'none' }} onFocus={e => e.target.style.borderColor = 'var(--accent-yellow)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}>
                <option value="Owner">Owner (Full Access)</option>
                <option value="Member">Member (Limited Access)</option>
                <option value="Admin">System Admin</option>
              </select>
            </div>
          )}

          <button type="submit" style={{ 
            marginTop: '1rem', background: 'var(--accent-yellow)', color: '#000', padding: '18px', borderRadius: '12px', fontSize: '1.05rem', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 8px 25px rgba(234, 235, 114, 0.2)' 
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(234, 235, 114, 0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(234, 235, 114, 0.2)'; }}>
            {isLogin ? 'Secure Login' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <span 
            style={{ color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, display: 'inline-block', transition: '0.2s', borderBottom: '1px solid var(--text-primary)', paddingBottom: '2px', marginLeft: '6px' }}
            onClick={() => setIsLogin(!isLogin)}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-yellow)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}
          >
            {isLogin ? 'Register Here' : 'Login Here'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
