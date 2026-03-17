import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

function npr(n) {
  const v = Number(n || 0);
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NPR' }).format(v);
}

export default function Tours() {
  const loc = useLocation();
  const [searchParams] = useSearchParams();
  const prefill = {
    q: loc.state?.prefill?.q || searchParams.get('q') || ''
  };

  const [items, setItems] = useState([]);
  const [allForOptions, setAllForOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    q: prefill.q || '',
    destination: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    sort: 'relevance'
  });

  function set(k, v) {
    setFilters(prev => ({ ...prev, [k]: v }));
  }

  async function loadOptions() {
    try {
      const res = await api.get('/api/tours');
      setAllForOptions(res.data.items || []);
    } catch {
      setAllForOptions([]);
    }
  }

  async function load() {
    setLoading(true);
    try {
      const params = {};
      if (filters.q) params.q = filters.q;
      if (filters.destination) params.destination = filters.destination;
      if (filters.category) params.category = filters.category;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;

      const res = await api.get('/api/tours', { params });
      setItems(res.data.items || []);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const destinations = useMemo(() => {
    const setv = new Set((allForOptions || []).map(t => t.destination).filter(Boolean));
    return Array.from(setv).sort((a, b) => a.localeCompare(b));
  }, [allForOptions]);

  const categories = useMemo(() => {
    const setv = new Set((allForOptions || []).map(t => t.category).filter(Boolean));
    return Array.from(setv).sort((a, b) => a.localeCompare(b));
  }, [allForOptions]);

  const sorted = useMemo(() => {
    const list = [...(items || [])];

    if (filters.sort === 'price_asc') list.sort((a, b) => (a.price_usd || 0) - (b.price_usd || 0));
    if (filters.sort === 'price_desc') list.sort((a, b) => (b.price_usd || 0) - (a.price_usd || 0));
    if (filters.sort === 'rating_desc') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    return list;
  }, [items, filters.sort]);

  function clear() {
    setFilters({ q: '', destination: '', category: '', minPrice: '', maxPrice: '', sort: 'relevance' });
    setTimeout(() => load(), 0);
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0 }}>Browse tours</h2>
            <div className="small">Only approved packages are listed here.</div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <button className="btn secondary" onClick={clear}>Clear</button>
            <button className="btn" onClick={load}>Search</button>
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div className="toolbar">
          <div>
            <div className="label">Search</div>
            <input
              className="input"
              placeholder="Search title, destination, category..."
              value={filters.q}
              onChange={e => set('q', e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') load(); }}
            />
          </div>

          <div>
            <div className="label">Destination</div>
            <select className="input" value={filters.destination} onChange={e => set('destination', e.target.value)}>
              <option value="">All</option>
              {destinations.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <div className="label">Category</div>
            <select className="input" value={filters.category} onChange={e => set('category', e.target.value)}>
              <option value="">All</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <div className="label">Sort</div>
            <select className="input" value={filters.sort} onChange={e => set('sort', e.target.value)}>
              <option value="relevance">Relevance</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="rating_desc">Rating: High → Low</option>
            </select>
          </div>

          <div>
            <div className="label">Min price (USD)</div>
            <input className="input" value={filters.minPrice} onChange={e => set('minPrice', e.target.value)} placeholder="0" />
          </div>

          <div>
            <div className="label">Max price (USD)</div>
            <input className="input" value={filters.maxPrice} onChange={e => set('maxPrice', e.target.value)} placeholder="1000" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid tours">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>No tours found</h3>
          <div className="small">Try changing your filters or clearing the search.</div>
          <div style={{ height: 12 }} />
          <Link className="btn" to="/" state={{}}>Back to Home</Link>
        </div>
      ) : (
        <div className="grid tours">
          {sorted.map(t => (
            <div key={t.id} className="card">
              <img className="cover" src={t.image_url || 'https://picsum.photos/seed/travel' + t.id + '/800/500'} alt={t.title} />
              <div className="tourCardTitle">{t.title}</div>

              <div className="metaRow">
                <span> {t.destination}</span>
                <span> {t.category}</span>
                <span>• {t.duration_days} days</span>
              </div>

              <div className="priceRow">
                <div>
                  <div className="price">{npr(t.price_usd)}</div>
                  <div className="hint">Rating: {t.rating ? Number(t.rating).toFixed(1) : '—'}</div>
                </div>
                <Link className="btn" to={`/tours/${t.id}`}>View</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
