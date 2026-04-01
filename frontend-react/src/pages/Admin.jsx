import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../api/client';
import { Toast } from '../components/Toast.jsx';

function getUser() {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
}

export default function Admin() {
  const nav = useNavigate();
  const [msg, setMsg] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [tours, setTours] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [pendingTours, setPendingTours] = useState([]);
  const [pendingAgencies, setPendingAgencies] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeTours: 0,
    totalBookings: 0,
    totalRevenue: 0
  });
  const [newTour, setNewTour] = useState({ title:'', destination:'', category:'', duration_days:3, price_usd:199, rating:4.5, image_url:'', description:'', latitude:'', longitude:'' });
  const [broadcast, setBroadcast] = useState({ category:'offers', title:'', body:'', expires_at:'' });
  const [reply, setReply] = useState({ ticketId:'', text:'' });

  useEffect(() => {
    const user = getUser();
    if (!getToken()) { nav('/admin-login'); return; }
    if (!user) { nav('/admin-login'); return; }
    if (user.role !== 'admin') {
      if (user.role === 'agency') nav('/agency');
      else nav('/dashboard');
      return;
    }
    load();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => { load(); }, 5000);
    return () => clearInterval(interval);
  }, []);

  async function load() {
    setMsg('');
    try {
      const [resTours, resPendingTours, resPendingAgencies, resTickets, resBookings, resUsers] = await Promise.allSettled([
        api.get('/api/admin/tours'),
        api.get('/api/admin/tours/pending'),
        api.get('/api/admin/agencies/pending'),
        api.get('/api/admin/support'),
        api.get('/api/admin/bookings'),
        api.get('/api/admin/users')
      ]);

      const toursData = resTours.status === 'fulfilled' ? (resTours.value.data.items || []) : [];
      const pendingToursData = resPendingTours.status === 'fulfilled' ? (resPendingTours.value.data.items || []) : [];
      const pendingAgenciesData = resPendingAgencies.status === 'fulfilled' ? (resPendingAgencies.value.data.items || []) : [];
      const ticketsData = resTickets.status === 'fulfilled' ? (resTickets.value.data.items || []) : [];
      const bookingsData = resBookings.status === 'fulfilled' ? (resBookings.value.data.items || []) : [];
      const usersData = resUsers.status === 'fulfilled' ? (resUsers.value.data.items || []) : [];

      setTours(toursData);
      setPendingTours(pendingToursData);
      setPendingAgencies(pendingAgenciesData);
      setTickets(ticketsData);
      setBookings(bookingsData);
      setUsers(usersData);

      const totalUsersCount = usersData.length;
      const activeTours = toursData.filter(t => t.approval_status === 'approved').length;
      const totalBookingsCount = bookingsData.length;
      const totalRevenueAmount = bookingsData.reduce((sum, booking) => {
        return sum + (parseFloat(booking.total_price) || parseFloat(booking.amount) || 0);
      }, 0);

      setStats({
        totalUsers: totalUsersCount,
        activeTours: activeTours,
        totalBookings: totalBookingsCount,
        totalRevenue: totalRevenueAmount
      });
    } catch (e) {
      console.error('Load error:', e);
    }
  }

  async function manualRefresh() {
    setMsg('');
    await load();
    setMsg('Data refreshed ✓');
    setTimeout(() => setMsg(''), 3000);
  }

  function setTour(k, v) { setNewTour(p => ({...p, [k]: v})); }
  function setB(k, v) { setBroadcast(p => ({...p, [k]: v})); }

  async function createTour() {
    setMsg('');
    try {
      const res = await api.post('/api/admin/tours', {
        ...newTour,
        duration_days: Number(newTour.duration_days),
        price_usd: Number(newTour.price_usd),
        rating: Number(newTour.rating),
        latitude: newTour.latitude ? Number(newTour.latitude) : null,
        longitude: newTour.longitude ? Number(newTour.longitude) : null,
        itinerary: [{ day: 1, title: 'Day 1', details: 'Edit this itinerary.' }]
      });
      setMsg(`Tour created — ID: ${res.data.id}`);
      setNewTour({ title:'', destination:'', category:'', duration_days:3, price_usd:199, rating:4.5, image_url:'', description:'', latitude:'', longitude:'' });
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Create failed');
    }
  }

  async function deleteTour(id) {
    setMsg('');
    try {
      await api.delete(`/api/admin/tours/${id}`);
      setMsg('Tour deleted ✓');
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Delete failed');
    }
  }

  async function sendBroadcast() {
    setMsg('');
    try {
      await api.post('/api/admin/notifications/broadcast', broadcast);
      setMsg('Broadcast sent ✓');
      setBroadcast({ category:'offers', title:'', body:'', expires_at:'' });
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Broadcast failed');
    }
  }

  async function sendReply(ticketId) {
    setMsg('');
    try {
      await api.post(`/api/admin/support/${ticketId}/reply`, { reply: reply.text });
      setMsg('Reply sent ✓');
      setReply({ ticketId:'', text:'' });
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Reply failed');
    }
  }

  async function verifyAgency(id, status) {
    setMsg('');
    try {
      await api.post(`/api/admin/agencies/${id}/verify`, { status });
      setMsg(`Agency ${status} ✓`);
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Update failed');
    }
  }

  async function decideTour(id, decision) {
    setMsg('');
    const reason = decision === 'rejected' ? prompt('Reason (optional):') : null;
    try {
      await api.post(`/api/admin/tours/${id}/decide`, { decision, reason });
      setMsg(`Tour ${decision} ✓`);
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Update failed');
    }
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    nav('/admin-login');
  }

  const user = getUser();

  // Shared nav button style
  function navBtn(tabName) {
    const active = activeTab === tabName;
    return {
      display:'flex',
      alignItems:'center',
      gap:'10px',
      width:'100%',
      padding:'10px 12px',
      border: active ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
      borderRadius:'10px',
      background: active ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
      color:'#e8eefc',
      cursor:'pointer',
      fontWeight:'600',
      fontSize:'14px',
      marginBottom:'4px',
      transition:'all 0.2s',
      textAlign:'left',
    };
  }

  const badgeStyle = {
    marginLeft:'auto',
    background:'rgba(239, 68, 68, 0.2)',
    color:'#fca5a5',
    padding:'2px 6px',
    borderRadius:'4px',
    fontSize:'12px',
    fontWeight:'700'
  };

  return (
    <div style={{display:'flex', height:'100vh', background:'#0b1220'}}>
      {/* SIDEBAR */}
      <div style={{
        width:'220px',
        background:'linear-gradient(180deg, rgba(11, 18, 32, 0.98), rgba(15, 24, 48, 0.96))',
        borderRight:'1px solid rgba(255,255,255,0.08)',
        padding:'20px 0',
        overflowY:'auto',
        position:'fixed',
        height:'100vh',
        left:0,
        top:0,
        display:'flex',
        flexDirection:'column'
      }}>
        {/* LOGO */}
        <div style={{display:'flex', alignItems:'center', gap:'12px', padding:'0 16px 24px', borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{
            width:'40px', height:'40px', borderRadius:'10px',
            background:'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontWeight:'900', color:'white', fontSize:'14px'
          }}>TA</div>
          <div>
            <div style={{fontWeight:'900', fontSize:'14px', color:'#e8eefc'}}>TourAdmin</div>
            <div style={{fontSize:'10px', opacity:'0.6', letterSpacing:'1px'}}>CONTROL PANEL</div>
          </div>
        </div>

        {/* NAV */}
        <div style={{flex:1, padding:'16px 8px'}}>

          {/* HOME — goes to main site */}
          <div style={{paddingBottom:'16px'}}>
            <div style={{fontSize:'11px', fontWeight:'900', opacity:'0.5', padding:'0 12px 8px', letterSpacing:'1px', textTransform:'uppercase'}}>SITE</div>
            <button onClick={() => nav('/')} style={navBtn('__home__')}>
              Home
            </button>
          </div>

          {/* MAIN */}
          <div style={{paddingBottom:'16px'}}>
            <div style={{fontSize:'11px', fontWeight:'900', opacity:'0.5', padding:'0 12px 8px', letterSpacing:'1px', textTransform:'uppercase'}}>MAIN</div>
            <button onClick={() => setActiveTab('overview')} style={navBtn('overview')}>
              Overview
            </button>
          </div>

          {/* MANAGEMENT */}
          <div style={{paddingBottom:'16px'}}>
            <div style={{fontSize:'11px', fontWeight:'900', opacity:'0.5', padding:'0 12px 8px', letterSpacing:'1px', textTransform:'uppercase'}}>MANAGEMENT</div>
            <button onClick={() => setActiveTab('agencies')} style={navBtn('agencies')}>
              Agencies
              <span style={badgeStyle}>{pendingAgencies.length}</span>
            </button>
            <button onClick={() => setActiveTab('tours')} style={navBtn('tours')}>
              Tours
              <span style={badgeStyle}>{pendingTours.length}</span>
            </button>
            <button onClick={() => setActiveTab('bookings')} style={navBtn('bookings')}>
              Bookings
              <span style={badgeStyle}>{bookings.length}</span>
            </button>
          </div>

          {/* COMMUNICATIONS */}
          <div>
            <div style={{fontSize:'11px', fontWeight:'900', opacity:'0.5', padding:'0 12px 8px', letterSpacing:'1px', textTransform:'uppercase'}}>COMMUNICATIONS</div>
            <button onClick={() => setActiveTab('support')} style={navBtn('support')}>
              Support
              <span style={badgeStyle}>{tickets.length}</span>
            </button>
            <button onClick={() => setActiveTab('broadcast')} style={navBtn('broadcast')}>
              Broadcast
            </button>
          </div>
        </div>

        {/* USER FOOTER */}
        <div style={{borderTop:'1px solid rgba(255,255,255,0.08)', padding:'16px 12px', marginTop:'auto'}}>
          <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px'}}>
            <div style={{
              width:'36px', height:'36px', borderRadius:'50%',
              background:'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'white', fontWeight:'900', fontSize:'12px'
            }}>AD</div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontWeight:'700', fontSize:'12px', color:'#e8eefc'}}>{user?.full_name || 'Admin User'}</div>
              <div style={{fontSize:'11px', opacity:'0.6'}}>Super Admin</div>
            </div>
          </div>
          <button onClick={logout} style={{
            width:'100%', padding:'8px',
            border:'1px solid rgba(255, 255, 255, 0.1)',
            borderRadius:'8px', background:'transparent',
            color:'#e8eefc', cursor:'pointer',
            fontSize:'12px', fontWeight:'600', transition:'all 0.2s'
          }}>Logout</button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{flex:1, marginLeft:'220px', overflowY:'auto', background:'#0b1220'}}>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{padding:'32px'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'32px'}}>
              <div>
                <h1 style={{fontSize:'32px', fontWeight:'900', margin:'0 0 6px', color:'#e8eefc'}}>Dashboard Overview</h1>
                <p style={{fontSize:'14px', opacity:'0.7', margin:0, color:'rgba(232,238,252,0.75)'}}>Welcome back — here's what's happening today</p>
              </div>
              <button onClick={manualRefresh} style={{background:'#3b82f6', border:'none', color:'white', padding:'8px 14px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'12px', transition:'all 0.2s'}}>Refresh Now</button>
            </div>

            {msg && <Toast msg={msg} />}

            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'16px', marginBottom:'32px'}}>
              <div style={{border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'20px', background:'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.02))'}}>
                <div style={{fontSize:'28px', fontWeight:'900', color:'#e8eefc', marginBottom:'4px'}}>{stats.totalUsers.toLocaleString()}</div>
                <div style={{fontSize:'13px', color:'rgba(232,238,252,0.75)', marginBottom:'8px'}}>Total Users</div>
                <div style={{fontSize:'12px', color:'#86efac', fontWeight:'600'}}>+12% this month</div>
              </div>
              <div style={{border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'20px', background:'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.02))'}}>
                <div style={{fontSize:'28px', fontWeight:'900', color:'#e8eefc', marginBottom:'4px'}}>{stats.activeTours}</div>
                <div style={{fontSize:'13px', color:'rgba(232,238,252,0.75)', marginBottom:'8px'}}>Active Tours</div>
                <div style={{fontSize:'12px', color:'#86efac', fontWeight:'600'}}>+8 new this week</div>
              </div>
              <div style={{border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'20px', background:'linear-gradient(135deg, rgba(217, 119, 6, 0.08), rgba(217, 119, 6, 0.02))'}}>
                <div style={{fontSize:'28px', fontWeight:'900', color:'#e8eefc', marginBottom:'4px'}}>{stats.totalBookings.toLocaleString()}</div>
                <div style={{fontSize:'13px', color:'rgba(232,238,252,0.75)', marginBottom:'8px'}}>Total Bookings</div>
                <div style={{fontSize:'12px', color:'#86efac', fontWeight:'600'}}>+23% vs last month</div>
              </div>
              <div style={{border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'20px', background:'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(139, 92, 246, 0.02))'}}>
                <div style={{fontSize:'28px', fontWeight:'900', color:'#e8eefc', marginBottom:'4px'}}>
                  ${(stats.totalRevenue >= 1000 ? (stats.totalRevenue / 1000).toFixed(1) + 'K' : stats.totalRevenue.toFixed(2))}
                </div>
                <div style={{fontSize:'13px', color:'rgba(232,238,252,0.75)', marginBottom:'8px'}}>Total Revenue</div>
                <div style={{fontSize:'12px', color:'#86efac', fontWeight:'600'}}>+18% growth</div>
              </div>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:'20px'}}>
              <div style={{background:'linear-gradient(180deg, rgba(18, 26, 45, 0.98), rgba(11, 18, 32, 0.96))', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'20px'}}>
                <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px'}}>
                  <h3 style={{margin:0, fontSize:'16px', color:'#e8eefc'}}>Pending Approvals</h3>
                  <span style={{background:'rgba(99, 102, 241, 0.2)', color:'#a5b4fc', padding:'4px 8px', borderRadius:'6px', fontSize:'12px', fontWeight:'700'}}>{pendingTours.length}</span>
                </div>
                <table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
                  <thead>
                    <tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                      <th style={{textAlign:'left', padding:'10px', fontWeight:'700', color:'rgba(232,238,252,0.75)', textTransform:'uppercase', fontSize:'11px', letterSpacing:'0.5px'}}>TYPE</th>
                      <th style={{textAlign:'left', padding:'10px', fontWeight:'700', color:'rgba(232,238,252,0.75)', textTransform:'uppercase', fontSize:'11px', letterSpacing:'0.5px'}}>NAME</th>
                      <th style={{textAlign:'left', padding:'10px', fontWeight:'700', color:'rgba(232,238,252,0.75)', textTransform:'uppercase', fontSize:'11px', letterSpacing:'0.5px'}}>DUE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingTours.length === 0 ? (
                      <tr><td colSpan="3" style={{textAlign:'center', padding:'20px', color:'rgba(232,238,252,0.75)'}}>No pending approvals</td></tr>
                    ) : (
                      pendingTours.map(t => (
                        <tr key={t.id} style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                          <td style={{padding:'14px 10px'}}>
                            <span style={{display:'inline-flex', alignItems:'center', gap:'6px', padding:'4px 10px', borderRadius:'6px', fontSize:'12px', fontWeight:'600', background:'rgba(217, 119, 6, 0.15)', color:'#fed7aa'}}>Tour</span>
                          </td>
                          <td style={{padding:'14px 10px', color:'#e8eefc', fontWeight:'600'}}>{t.title}</td>
                          <td style={{padding:'14px 10px', color:'rgba(232,238,252,0.75)'}}>2h ago</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{background:'linear-gradient(180deg, rgba(18, 26, 45, 0.98), rgba(11, 18, 32, 0.96))', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'20px'}}>
                <div style={{marginBottom:'24px'}}>
                  <h3 style={{margin:'0 0 8px', fontSize:'16px', color:'#e8eefc'}}>Monthly Revenue</h3>
                  <div style={{fontSize:'28px', fontWeight:'900', color:'#e8eefc', marginBottom:'4px'}}>
                    ${stats.totalRevenue > 0 ? stats.totalRevenue.toLocaleString('en-US', {maximumFractionDigits: 2}) : '0'}
                  </div>
                  <div style={{fontSize:'12px', color:'#86efac', fontWeight:'600'}}>+18.3% from last month</div>
                </div>
                <div style={{display:'flex', alignItems:'flex-end', gap:'8px', height:'140px'}}>
                  {[40, 35, 60, 45, 70, 55, 80, 75, 100].map((value, idx) => (
                    <div key={idx} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'8px', height:'100%', justifyContent:'flex-end'}}>
                      <div style={{width:'100%', background:'linear-gradient(180deg, #6366f1, #8b5cf6)', borderRadius:'4px 4px 0 0', height:`${value}%`, transition:'all 0.3s'}}></div>
                      <div style={{fontSize:'11px', color:'rgba(232,238,252,0.75)', fontWeight:'600'}}>
                        {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep'][idx]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AGENCIES */}
        {activeTab === 'agencies' && (
          <div style={{padding:'32px'}}>
            <h2 style={{fontSize:'24px', fontWeight:'900', margin:'0 0 24px', color:'#e8eefc'}}>Agency Verification Requests</h2>
            {msg && <Toast msg={msg} />}
            {pendingAgencies.length === 0 ? (
              <div style={{textAlign:'center', padding:'40px 20px', color:'rgba(232,238,252,0.75)'}}>No pending agencies</div>
            ) : (
              pendingAgencies.map(a => (
                <div key={a.id} style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px', padding:'16px', marginBottom:'12px'}}>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px'}}>
                    <h3 style={{margin:0, fontSize:'14px', color:'#e8eefc'}}>{a.business_name || a.full_name}</h3>
                    <span style={{background:'rgba(99, 102, 241, 0.2)', color:'#a5b4fc', padding:'4px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:'700'}}>Pending</span>
                  </div>
                  <p style={{margin:'8px 0', fontSize:'13px', color:'rgba(232,238,252,0.75)'}}>{a.email} {a.phone && `• ${a.phone}`}</p>
                  <p style={{margin:'8px 0', fontSize:'13px', color:'rgba(232,238,252,0.75)'}}>License: <strong style={{color:'white'}}>{a.license_no}</strong></p>
                  <div style={{display:'flex', gap:'8px', marginTop:'12px'}}>
                    <button onClick={()=>verifyAgency(a.id,'verified')} style={{background:'#3b82f6', border:'none', color:'white', padding:'10px 14px', borderRadius:'10px', cursor:'pointer', fontWeight:'700', transition:'all 0.2s'}}>Verify</button>
                    <button onClick={()=>verifyAgency(a.id,'rejected')} style={{background:'#ef4444', border:'none', color:'white', padding:'10px 14px', borderRadius:'10px', cursor:'pointer', fontWeight:'700', transition:'all 0.2s'}}>Reject</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TOURS */}
        {activeTab === 'tours' && (
          <div style={{padding:'32px'}}>
            <h2 style={{fontSize:'24px', fontWeight:'900', margin:'0 0 24px', color:'#e8eefc'}}>Manage Tours</h2>
            {msg && <Toast msg={msg} />}
            <div style={{background:'linear-gradient(180deg, rgba(18, 26, 45, 0.98), rgba(11, 18, 32, 0.96))', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'20px', marginBottom:'24px'}}>
              <h3 style={{marginTop:0, fontSize:'16px', color:'#e8eefc'}}>Create New Tour</h3>
              <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'12px'}}>
                <input style={{width:'100%', padding:'10px 12px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(11, 18, 32, 0.9)', color:'#e8eefc', fontSize:'14px', fontFamily:'inherit'}} placeholder="Title" value={newTour.title} onChange={e=>setTour('title',e.target.value)} />
                <input style={{width:'100%', padding:'10px 12px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(11, 18, 32, 0.9)', color:'#e8eefc', fontSize:'14px', fontFamily:'inherit'}} placeholder="Destination" value={newTour.destination} onChange={e=>setTour('destination',e.target.value)} />
                <input style={{width:'100%', padding:'10px 12px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(11, 18, 32, 0.9)', color:'#e8eefc', fontSize:'14px', fontFamily:'inherit'}} placeholder="Category" value={newTour.category} onChange={e=>setTour('category',e.target.value)} />
                <input style={{width:'100%', padding:'10px 12px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(11, 18, 32, 0.9)', color:'#e8eefc', fontSize:'14px', fontFamily:'inherit'}} placeholder="Duration (days)" value={newTour.duration_days} onChange={e=>setTour('duration_days',e.target.value)} />
                <input style={{width:'100%', padding:'10px 12px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(11, 18, 32, 0.9)', color:'#e8eefc', fontSize:'14px', fontFamily:'inherit'}} placeholder="Price (USD)" value={newTour.price_usd} onChange={e=>setTour('price_usd',e.target.value)} />
                <input style={{width:'100%', padding:'10px 12px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(11, 18, 32, 0.9)', color:'#e8eefc', fontSize:'14px', fontFamily:'inherit'}} placeholder="Rating" value={newTour.rating} onChange={e=>setTour('rating',e.target.value)} />
                <input style={{width:'100%', padding:'10px 12px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(11, 18, 32, 0.9)', color:'#e8eefc', fontSize:'14px', fontFamily:'inherit', gridColumn:'1/-1'}} placeholder="Image URL" value={newTour.image_url} onChange={e=>setTour('image_url',e.target.value)} />
                <textarea style={{width:'100%', padding:'10px 12px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(11, 18, 32, 0.9)', color:'#e8eefc', fontSize:'14px', fontFamily:'inherit', gridColumn:'1/-1', resize:'vertical'}} rows="3" placeholder="Description" value={newTour.description} onChange={e=>setTour('description',e.target.value)} />
                <button onClick={createTour} style={{background:'#3b82f6', border:'none', color:'white', padding:'10px 14px', borderRadius:'10px', cursor:'pointer', fontWeight:'700', gridColumn:'1/-1', fontSize:'14px'}}>Create Tour</button>
              </div>
            </div>
            <div style={{background:'linear-gradient(180deg, rgba(18, 26, 45, 0.98), rgba(11, 18, 32, 0.96))', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'20px'}}>
              <h3 style={{marginTop:0, fontSize:'16px', color:'#e8eefc'}}>All Tours ({tours.length})</h3>
              {tours.length === 0 ? (
                <div style={{textAlign:'center', padding:'40px 20px', color:'rgba(232,238,252,0.75)'}}>No tours</div>
              ) : (
                tours.map(t => (
                  <div key={t.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'10px', marginBottom:'8px'}}>
                    <div style={{flex:1}}>
                      <h4 style={{margin:'0 0 4px', color:'#e8eefc', fontSize:'14px'}}>{t.title}</h4>
                      <p style={{margin:0, fontSize:'13px', color:'rgba(232,238,252,0.75)'}}>
                        {t.destination} • {t.category} • ${Number(t.price_usd).toFixed(2)} •
                        <span style={{marginLeft:'8px', padding:'2px 8px', borderRadius:'4px', fontSize:'11px', fontWeight:'700', background: t.approval_status === 'approved' ? 'rgba(16, 185, 129, 0.2)' : t.approval_status === 'pending' ? 'rgba(217, 119, 6, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: t.approval_status === 'approved' ? '#86efac' : t.approval_status === 'pending' ? '#fed7aa' : '#fca5a5'}}>{t.approval_status}</span>
                      </p>
                    </div>
                    <div style={{display:'flex', gap:'8px'}}>
                      {t.approval_status === 'pending' && (
                        <>
                          <button onClick={()=>decideTour(t.id,'approved')} style={{background:'#10b981', border:'none', color:'white', padding:'8px 12px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'12px', transition:'all 0.2s'}}>Approve</button>
                          <button onClick={()=>decideTour(t.id,'rejected')} style={{background:'#ef4444', border:'none', color:'white', padding:'8px 12px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'12px', transition:'all 0.2s'}}>Reject</button>
                        </>
                      )}
                      <button onClick={()=>deleteTour(t.id)} style={{background:'#ef4444', border:'none', color:'white', padding:'8px 12px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'12px'}}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* BOOKINGS */}
        {activeTab === 'bookings' && (
          <div style={{padding:'32px'}}>
            <h2 style={{fontSize:'24px', fontWeight:'900', margin:'0 0 24px', color:'#e8eefc'}}>Bookings Management ({bookings.length})</h2>
            {msg && <Toast msg={msg} />}
            {bookings.length === 0 ? (
              <div style={{textAlign:'center', padding:'40px 20px', color:'rgba(232,238,252,0.75)'}}>No bookings yet</div>
            ) : (
              <div style={{background:'linear-gradient(180deg, rgba(18, 26, 45, 0.98), rgba(11, 18, 32, 0.96))', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'20px'}}>
                {bookings.map(b => (
                  <div key={b.id} style={{padding:'12px', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'10px', marginBottom:'8px'}}>
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                      <div>
                        <h4 style={{margin:'0 0 4px', color:'#e8eefc', fontSize:'14px'}}>Booking #{b.id}</h4>
                        <p style={{margin:0, fontSize:'13px', color:'rgba(232,238,252,0.75)'}}>Total Price: ${Number(b.total_price || b.amount || 0).toFixed(2)} • Status: {b.status}</p>
                      </div>
                      <span style={{background:'rgba(16, 185, 129, 0.2)', color:'#86efac', padding:'4px 8px', borderRadius:'6px', fontSize:'12px', fontWeight:'700'}}>{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUPPORT */}
        {activeTab === 'support' && (
          <div style={{padding:'32px'}}>
            <h2 style={{fontSize:'24px', fontWeight:'900', margin:'0 0 24px', color:'#e8eefc'}}>Support Tickets ({tickets.length})</h2>
            {msg && <Toast msg={msg} />}
            {tickets.length === 0 ? (
              <div style={{textAlign:'center', padding:'40px 20px', color:'rgba(232,238,252,0.75)'}}>No tickets</div>
            ) : (
              tickets.map(t => (
                <div key={t.id} style={{background:'linear-gradient(180deg, rgba(18, 26, 45, 0.98), rgba(11, 18, 32, 0.96))', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'20px', marginBottom:'16px'}}>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px'}}>
                    <h4 style={{margin:0, color:'#e8eefc'}}>{t.ticket_code}</h4>
                    <span style={{background:'rgba(99, 102, 241, 0.2)', color:'#a5b4fc', padding:'4px 8px', borderRadius:'6px', fontSize:'12px', fontWeight:'700'}}>{t.status}</span>
                  </div>
                  <p style={{margin:'8px 0', fontSize:'13px', color:'rgba(232,238,252,0.75)'}}>{t.message}</p>
                  {t.admin_reply && <p style={{margin:'8px 0', fontSize:'13px', color:'rgba(232,238,252,0.75)'}}><strong>Reply:</strong> {t.admin_reply}</p>}
                  <div style={{display:'flex', gap:'8px', marginTop:'12px'}}>
                    <input style={{flex:1, padding:'10px 12px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(11, 18, 32, 0.9)', color:'#e8eefc', fontSize:'14px', fontFamily:'inherit'}} placeholder="Write reply..." value={reply.ticketId === t.id ? reply.text : ''} onChange={e=>setReply({ ticketId: t.id, text: e.target.value })} />
                    <button onClick={()=>sendReply(t.id)} style={{background:'rgba(31,41,55,0.65)', border:'1px solid rgba(255,255,255,0.1)', color:'white', padding:'10px 14px', borderRadius:'10px', cursor:'pointer', fontWeight:'700', whiteSpace:'nowrap'}}>Send</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* BROADCAST */}
        {activeTab === 'broadcast' && (
          <div style={{padding:'32px'}}>
            <h2 style={{fontSize:'24px', fontWeight:'900', margin:'0 0 24px', color:'#e8eefc'}}>Broadcast Notification</h2>
            {msg && <Toast msg={msg} />}
            <div style={{background:'linear-gradient(180deg, rgba(18, 26, 45, 0.98), rgba(11, 18, 32, 0.96))', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'20px'}}>
              <div style={{display:'grid', gridTemplateColumns:'1fr', gap:'12px'}}>
                <input style={{width:'100%', padding:'10px 12px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(11, 18, 32, 0.9)', color:'#e8eefc', fontSize:'14px', fontFamily:'inherit'}} placeholder="Category" value={broadcast.category} onChange={e=>setB('category',e.target.value)} />
                <input style={{width:'100%', padding:'10px 12px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(11, 18, 32, 0.9)', color:'#e8eefc', fontSize:'14px', fontFamily:'inherit'}} placeholder="Title" value={broadcast.title} onChange={e=>setB('title',e.target.value)} />
                <textarea style={{width:'100%', padding:'10px 12px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(11, 18, 32, 0.9)', color:'#e8eefc', fontSize:'14px', fontFamily:'inherit', resize:'vertical'}} rows="4" placeholder="Message" value={broadcast.body} onChange={e=>setB('body',e.target.value)} />
                <input style={{width:'100%', padding:'10px 12px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(11, 18, 32, 0.9)', color:'#e8eefc', fontSize:'14px', fontFamily:'inherit'}} placeholder="Expires at (yyyy-mm-dd hh:mm:ss)" value={broadcast.expires_at} onChange={e=>setB('expires_at',e.target.value)} />
                <button onClick={sendBroadcast} style={{background:'#3b82f6', border:'none', color:'white', padding:'10px 14px', borderRadius:'10px', cursor:'pointer', fontWeight:'700', fontSize:'14px'}}>Send Broadcast</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}