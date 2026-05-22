import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const CLD_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dhiipwnd0';
const CLD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'photos_50';

const rooms = [
  { id: 1, name: 'Chambre Tante Madie (rdc)', capacity: 4 },
  { id: 2, name: 'Chambre Tonton Paul (rdc)', capacity: 4 },
  { id: 3, name: 'Chambre Parc (1er gauche)', capacity: 3 },
  { id: 4, name: 'Chambre Parc (1er droit)', capacity: 3 },
  { id: 5, name: 'Chambre Arrière (1er gauche)', capacity: 2 },
  { id: 6, name: 'Chambre Arrière (1er droit)', capacity: 2 },
  { id: 7, name: 'Dortoir filles', capacity: 5 },
  { id: 8, name: 'Dortoir garçons', capacity: 5 },
  { id: 9, name: 'Cellule', capacity: 1 },
  { id: 10, name: 'Hors de la maison', capacity: 999 },
];

const mealsList = [
  { name: 'Samedi midi', key: 'mealSatMid' },
  { name: 'Samedi soir', key: 'mealSatEvn' },
  { name: 'Dimanche midi', key: 'mealSunMid' },
  { name: 'Dimanche soir', key: 'mealSunEvn' },
  { name: 'Lundi midi', key: 'mealMonMid' },
];

const dayLabels = { sat: 'Samedi', sun: 'Dimanche', mon: 'Lundi' };
const dayOrder  = { sat: 0, sun: 1, mon: 2 };
const allPhotos = ['photo1.jpg', 'photo2.jpg', 'photo3.jpg', 'photo4.jpg', 'photo5.jpg'];

const emptyForm = {
  name: '',
  attending: true,
  adults: 1,
  boys: 0,
  girls: 0,
  nightSatSun: false,
  nightSunMon: false,
  mealSatMid: false,
  mealSatEvn: false,
  mealSunMid: false,
  mealSunEvn: false,
  mealMonMid: false,
};

// ─── Panneau chambres (admin + viewer) ───────────────────────────────────────
function RoomsPanel({ period, guests, onAssignAdults, onAssignChildren, readOnly = false }) {
  const isGreen = period === 'sunMon';
  const nk = period === 'satSun' ? 'nightSatSun' : 'nightSunMon';
  const adultsKey = period === 'satSun' ? 'roomAdultsSatSun' : 'roomAdultsSunMon';
  const childrenKey = period === 'satSun' ? 'roomChildrenSatSun' : 'roomChildrenSunMon';
  const title = period === 'satSun' ? 'Samedi → Dimanche' : 'Dimanche → Lundi';
  const accentColor = isGreen ? '#065f46' : '#4338ca';
  const accentBg = isGreen ? '#ecfdf5' : '#eef2ff';
  const accentBorder = isGreen ? '#a7f3d0' : '#c7d2fe';

  const getAdultsInRoom = (roomId) =>
    guests.filter(g => g.attending && g[nk] && g[adultsKey] === roomId);

  const getChildrenInRoom = (roomId) =>
    guests.filter(
      g =>
        g.attending &&
        g[nk] &&
        ((g[childrenKey] || {})[`${roomId}-boys`] > 0 ||
          (g[childrenKey] || {})[`${roomId}-girls`] > 0)
    );

  const hasOccupants = (roomId) =>
    getAdultsInRoom(roomId).length > 0 || getChildrenInRoom(roomId).length > 0;

  return (
    <div className="card">
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: accentColor, marginBottom: '16px' }}>
        {title}
      </h2>

      {/* Plan visuel des chambres */}
      <div className="room-grid">
        {rooms.map(room => {
          const adults = getAdultsInRoom(room.id);
          const children = getChildrenInRoom(room.id);
          const occupied = adults.length > 0 || children.length > 0;
          return (
            <div
              key={room.id}
              style={{
                border: `2px solid ${occupied ? accentColor : accentBorder}`,
                borderRadius: '10px',
                padding: '10px',
                background: occupied ? accentBg : '#fafafa',
                fontSize: '12px',
                opacity: readOnly && !occupied ? 0.5 : 1,
              }}
            >
              <div style={{ fontWeight: 700, color: accentColor, fontSize: '11px', marginBottom: '4px' }}>
                {room.name}
              </div>
              <div style={{ color: '#9ca3af', fontSize: '10px', marginBottom: '4px' }}>
                Cap: {room.capacity === 999 ? '∞' : room.capacity}
              </div>
              {adults.map(g => (
                <div
                  key={g._id}
                  style={{
                    background: '#fed7aa',
                    color: '#9a3412',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    marginBottom: '2px',
                    fontSize: '10px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {g.name}
                </div>
              ))}
              {children.map(g => {
                const b = (g[childrenKey] || {})[`${room.id}-boys`];
                const f = (g[childrenKey] || {})[`${room.id}-girls`];
                return (
                  <div key={g._id}>
                    {b > 0 && (
                      <div style={{ background: '#bfdbfe', color: '#1e40af', borderRadius: '4px', padding: '2px 6px', marginBottom: '2px', fontSize: '10px' }}>
                        {g.name}: {b}♂
                      </div>
                    )}
                    {f > 0 && (
                      <div style={{ background: '#fbcfe8', color: '#9d174d', borderRadius: '4px', padding: '2px 6px', marginBottom: '2px', fontSize: '10px' }}>
                        {g.name}: {f}♀
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Assignation — admin uniquement */}
      {!readOnly && (
        <>
          {/* Adultes */}
          <div className="sub-section">
            <div className="section-title">👨‍👩‍👧 Adultes</div>
            {guests.filter(g => g.attending && g[nk] && g.adults > 0).length === 0 && (
              <p style={{ color: '#9ca3af', fontSize: '13px' }}>Aucun adulte cette nuit</p>
            )}
            {guests
              .filter(g => g.attending && g[nk] && g.adults > 0)
              .map(g => (
                <div key={g._id} className="assign-row">
                  <p style={{ fontWeight: 700, marginBottom: '8px', fontSize: '14px' }}>
                    {g.name}{' '}
                    <span style={{ fontWeight: 400, color: '#6b7280' }}>
                      ({g.adults} adulte{g.adults > 1 ? 's' : ''})
                    </span>
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {rooms.map(room => (
                      <button
                        key={room.id}
                        onClick={() => onAssignAdults(g._id, room.id, period)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: g[adultsKey] === room.id ? accentColor : '#e5e7eb',
                          color: g[adultsKey] === room.id ? 'white' : '#374151',
                        }}
                      >
                        {room.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          {/* Enfants */}
          <div className="sub-section" style={{ marginTop: '12px' }}>
            <div className="section-title">👧👦 Enfants</div>
            {guests.filter(g => g.attending && g[nk] && (g.boys > 0 || g.girls > 0)).length === 0 && (
              <p style={{ color: '#9ca3af', fontSize: '13px' }}>Aucun enfant cette nuit</p>
            )}
            {guests
              .filter(g => g.attending && g[nk] && (g.boys > 0 || g.girls > 0))
              .map(g => (
                <div key={g._id} className="assign-row">
                  <p style={{ fontWeight: 700, marginBottom: '8px', fontSize: '14px' }}>
                    {g.name}{' '}
                    <span style={{ fontWeight: 400, color: '#6b7280' }}>({g.boys}♂ + {g.girls}♀)</span>
                  </p>
                  {g[adultsKey] && (
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                      Parents : {rooms.find(r => r.id === g[adultsKey])?.name}
                    </p>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>🚹 Dortoir garçons</label>
                      <input type="number" min="0" max={g.boys} className="num-input"
                        value={(g[childrenKey] || {})['8-boys'] || 0}
                        onChange={e => onAssignChildren(g._id, 8, period, 'boys', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>🚺 Dortoir filles</label>
                      <input type="number" min="0" max={g.girls} className="num-input"
                        value={(g[childrenKey] || {})['7-girls'] || 0}
                        onChange={e => onAssignChildren(g._id, 7, period, 'girls', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    {g[adultsKey] && g[adultsKey] !== 10 && (
                      <>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>🏠 Avec parents (♂)</label>
                          <input type="number" min="0" max={g.boys} className="num-input"
                            value={(g[childrenKey] || {})[`${g[adultsKey]}-boys`] || 0}
                            onChange={e => onAssignChildren(g._id, g[adultsKey], period, 'boys', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>🏠 Avec parents (♀)</label>
                          <input type="number" min="0" max={g.girls} className="num-input"
                            value={(g[childrenKey] || {})[`${g[adultsKey]}-girls`] || 0}
                            onChange={e => onAssignChildren(g._id, g[adultsKey], period, 'girls', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </>
                    )}
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>🏡 Hors maison (♂)</label>
                      <input type="number" min="0" max={g.boys} className="num-input"
                        value={(g[childrenKey] || {})['10-boys'] || 0}
                        onChange={e => onAssignChildren(g._id, 10, period, 'boys', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>🏡 Hors maison (♀)</label>
                      <input type="number" min="0" max={g.girls} className="num-input"
                        value={(g[childrenKey] || {})['10-girls'] || 0}
                        onChange={e => onAssignChildren(g._id, 10, period, 'girls', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tableau chambres (viewer) ───────────────────────────────────────────────
function RoomsTableViewer({ guests }) {
  const getCell = (room, adultsKey, childrenKey, nightKey) => {
    const adults = guests.filter(g => g.attending && g[nightKey] && g[adultsKey] === room.id);
    const children = guests.filter(g =>
      g.attending && g[nightKey] &&
      ((g[childrenKey] || {})[`${room.id}-boys`] > 0 ||
       (g[childrenKey] || {})[`${room.id}-girls`] > 0)
    );
    if (adults.length === 0 && children.length === 0) return null;
    return { adults, children };
  };

  const CellContent = ({ cell, roomId, childrenKey }) => {
    if (!cell) return <span style={{ color: '#d1d5db', fontSize: '12px' }}>—</span>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {cell.adults.map(g => (
          <span key={g._id} style={{
            background: '#fed7aa', color: '#9a3412',
            borderRadius: '4px', padding: '1px 7px', fontSize: '11px', fontWeight: 600,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px',
          }}>
            {g.name}
          </span>
        ))}
        {cell.children.map(g => {
          const b = (g[childrenKey] || {})[`${roomId}-boys`] || 0;
          const f = (g[childrenKey] || {})[`${roomId}-girls`] || 0;
          return (
            <span key={g._id} style={{
              background: '#e0e7ff', color: '#3730a3',
              borderRadius: '4px', padding: '1px 7px', fontSize: '11px',
            }}>
              {g.name}{b > 0 ? ` ${b}♂` : ''}{f > 0 ? ` ${f}♀` : ''}
            </span>
          );
        })}
      </div>
    );
  };

  const thStyle = {
    padding: '10px 12px', fontSize: '12px', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.05em',
    borderBottom: '2px solid #e5e7eb', textAlign: 'left',
  };
  const tdStyle = {
    padding: '8px 12px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle',
  };

  return (
    <div>
      {/* Légende */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ background: '#fed7aa', color: '#9a3412', borderRadius: '4px', padding: '2px 10px', fontSize: '12px', fontWeight: 600 }}>Famille</span>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Adultes</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ background: '#e0e7ff', color: '#3730a3', borderRadius: '4px', padding: '2px 10px', fontSize: '12px', fontWeight: 600 }}>Famille 2♂ 1♀</span>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Enfants</span>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#f9fafb' }}>
          <tr>
            <th style={{ ...thStyle, color: '#4b5563', width: '38%' }}>Chambre</th>
            <th style={{ ...thStyle, color: '#4338ca', width: '31%' }}>🌙 Sam → Dim</th>
            <th style={{ ...thStyle, color: '#065f46', width: '31%' }}>🌙 Dim → Lun</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room, i) => {
            const satCell = getCell(room, 'roomAdultsSatSun', 'roomChildrenSatSun', 'nightSatSun');
            const sunCell = getCell(room, 'roomAdultsSunMon', 'roomChildrenSunMon', 'nightSunMon');
            const empty = !satCell && !sunCell;
            return (
              <tr key={room.id} style={{ background: empty ? '#fafafa' : 'white' }}>
                <td style={{ ...tdStyle, fontWeight: 600, fontSize: '13px', color: empty ? '#9ca3af' : '#1f2937' }}>
                  {room.name}
                </td>
                <td style={{ ...tdStyle }}>
                  <CellContent cell={satCell} roomId={room.id} childrenKey="roomChildrenSatSun" />
                </td>
                <td style={{ ...tdStyle }}>
                  <CellContent cell={sunCell} roomId={room.id} childrenKey="roomChildrenSunMon" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </div>
  );
}

// ─── Éditeur rich text (contenteditable + toolbar) ───────────────────────────
function RichTextEditor({ value, onChange }) {
  const ref = React.useRef(null);
  const skipSync = React.useRef(false);

  // Init uniquement au montage ou quand la valeur change depuis l'extérieur
  useEffect(() => {
    if (ref.current && !skipSync.current) {
      ref.current.innerHTML = value || '';
    }
    skipSync.current = false;
  }, [value]);

  const exec = (cmd, val = null) => {
    ref.current.focus();
    document.execCommand(cmd, false, val);
    skipSync.current = true;
    onChange(ref.current.innerHTML);
  };

  const btnStyle = (active) => ({
    padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: '6px',
    background: active ? '#4f46e5' : 'white', color: active ? 'white' : '#374151',
    cursor: 'pointer', fontSize: '13px', fontWeight: 700, lineHeight: 1,
  });

  const COLORS = ['#1f2937','#dc2626','#d97706','#059669','#2563eb','#7c3aed','#db2777','#9ca3af'];
  const SIZES  = [['Petit','1'],['Normal','3'],['Grand','5'],['Très grand','7']];

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px', padding: '8px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px 8px 0 0' }}>
        <button onMouseDown={e => { e.preventDefault(); exec('bold'); }} style={btnStyle(false)} title="Gras"><b>G</b></button>
        <button onMouseDown={e => { e.preventDefault(); exec('italic'); }} style={btnStyle(false)} title="Italique"><i>I</i></button>
        <button onMouseDown={e => { e.preventDefault(); exec('underline'); }} style={btnStyle(false)} title="Souligné"><u>S</u></button>
        <div style={{ width: '1px', background: '#e5e7eb', margin: '0 4px' }} />
        <select onMouseDown={e => e.stopPropagation()}
          onChange={e => { exec('fontSize', e.target.value); e.target.value = ''; }}
          style={{ border: '1px solid #d1d5db', borderRadius: '6px', padding: '4px 6px', fontSize: '12px', cursor: 'pointer' }}>
          <option value="">Taille…</option>
          {SIZES.map(([label, val]) => <option key={val} value={val}>{label}</option>)}
        </select>
        <div style={{ width: '1px', background: '#e5e7eb', margin: '0 4px' }} />
        <span style={{ fontSize: '12px', color: '#6b7280', alignSelf: 'center' }}>Couleur :</span>
        {COLORS.map(c => (
          <button key={c} onMouseDown={e => { e.preventDefault(); exec('foreColor', c); }}
            style={{ width: '22px', height: '22px', background: c, border: '2px solid white', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 0 0 1px #d1d5db', padding: 0 }} />
        ))}
        <div style={{ width: '1px', background: '#e5e7eb', margin: '0 4px' }} />
        <button onMouseDown={e => { e.preventDefault(); exec('justifyLeft'); }} style={btnStyle(false)} title="Gauche">⬅</button>
        <button onMouseDown={e => { e.preventDefault(); exec('justifyCenter'); }} style={btnStyle(false)} title="Centrer">≡</button>
        <button onMouseDown={e => { e.preventDefault(); exec('justifyRight'); }} style={btnStyle(false)} title="Droite">➡</button>
        <button onMouseDown={e => { e.preventDefault(); exec('removeFormat'); }} style={{ ...btnStyle(false), color: '#dc2626' }} title="Supprimer le formatage">✕</button>
      </div>
      {/* Zone d'édition */}
      <div ref={ref} contentEditable suppressContentEditableWarning
        onInput={() => { skipSync.current = true; onChange(ref.current.innerHTML); }}
        style={{ border: '1px solid #d1d5db', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '12px 14px', minHeight: '140px', fontSize: '14px', lineHeight: 1.7, outline: 'none', background: 'white' }}
        data-placeholder="Chers tous, nous sommes ravis de vous accueillir…"
      />
    </div>
  );
}

// ─── Compteur jusqu'à l'événement ─────────────────────────────────────────────
function Countdown({ eventDate }) {
  const [left, setLeft] = useState(null);

  useEffect(() => {
    if (!eventDate) return;
    const tick = () => {
      const diff = new Date(eventDate).getTime() - Date.now();
      if (diff <= 0) { setLeft(null); return; }
      setLeft({
        j: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [eventDate]);

  if (!eventDate || !left) return null;

  const unit = (val, label) => (
    <div style={{ textAlign: 'center', minWidth: '64px' }}>
      <div style={{ fontSize: '36px', fontWeight: 800, color: '#7c3aed', lineHeight: 1 }}>{String(val).padStart(2, '0')}</div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>{label}</div>
    </div>
  );

  return (
    <div style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '2px solid #c4b5fd', borderRadius: '16px', padding: '20px 24px', textAlign: 'center' }}>
      <p style={{ margin: '0 0 14px', fontWeight: 700, color: '#6d28d9', fontSize: '14px' }}>🎉 Plus que…</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
        {unit(left.j, 'jours')}
        <span style={{ fontSize: '28px', color: '#c4b5fd', fontWeight: 300, marginBottom: '18px' }}>:</span>
        {unit(left.h, 'heures')}
        <span style={{ fontSize: '28px', color: '#c4b5fd', fontWeight: 300, marginBottom: '18px' }}>:</span>
        {unit(left.m, 'min')}
        <span style={{ fontSize: '28px', color: '#c4b5fd', fontWeight: 300, marginBottom: '18px' }}>:</span>
        {unit(left.s, 'sec')}
      </div>
    </div>
  );
}

// ─── Widget météo (Open-Meteo, sans clé) ──────────────────────────────────────
const WMO_ICON = (code) => {
  if (code === 0) return '☀️';
  if (code <= 2)  return '🌤️';
  if (code === 3) return '☁️';
  if (code <= 49) return '🌫️';
  if (code <= 55) return '🌦️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '🌨️';
  if (code <= 82) return '🌧️';
  if (code <= 86) return '🌨️';
  return '⛈️';
};
const WMO_LABEL = (code) => {
  if (code === 0) return 'Ensoleillé';
  if (code <= 2)  return 'Peu nuageux';
  if (code === 3) return 'Couvert';
  if (code <= 49) return 'Brouillard';
  if (code <= 55) return 'Bruine';
  if (code <= 67) return 'Pluie';
  if (code <= 77) return 'Neige';
  if (code <= 82) return 'Averses';
  if (code <= 86) return 'Neige';
  return 'Orage';
};
const FR_DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function WeatherWidget({ lat, lng, label }) {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!lat || !lng) return;
    setError(false);
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Europe%2FParis&forecast_days=7`)
      .then(r => r.json())
      .then(d => setWeather(d.daily))
      .catch(() => setError(true));
  }, [lat, lng]);

  if (!lat || !lng) return null;
  if (error) return <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center' }}>⚠️ Météo indisponible</p>;
  if (!weather) return <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center' }}>⏳ Chargement météo…</p>;

  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '20px' }}>🌤️</span>
        <span style={{ fontWeight: 700, fontSize: '15px', color: '#1f2937' }}>Météo{label ? ` — ${label}` : ''}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
        {weather.time.map((date, i) => {
          const d = new Date(date);
          return (
            <div key={date} style={{ textAlign: 'center', padding: '8px 4px', background: '#f9fafb', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', marginBottom: '4px' }}>{FR_DAYS[d.getDay()]}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>{d.getDate()}/{d.getMonth()+1}</div>
              <div style={{ fontSize: '22px', marginBottom: '6px' }}>{WMO_ICON(weather.weathercode[i])}</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626' }}>{Math.round(weather.temperature_2m_max[i])}°</div>
              <div style={{ fontSize: '11px', color: '#2563eb' }}>{Math.round(weather.temperature_2m_min[i])}°</div>
              {weather.precipitation_sum[i] > 0 && (
                <div style={{ fontSize: '10px', color: '#0891b2', marginTop: '2px' }}>💧{weather.precipitation_sum[i]}mm</div>
              )}
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: '10px', color: '#d1d5db', textAlign: 'right', margin: '8px 0 0' }}>Source : Open-Meteo</p>
    </div>
  );
}

// ─── Admin : onglet Accueil ───────────────────────────────────────────────────
function AdminAccueilTab({ content, onSave, saving }) {
  const [form, setForm] = useState({
    welcomeTitle:  content.welcomeTitle  || '',
    welcomeText:   content.welcomeText   || '',
    welcomeImages: content.welcomeImages || [],
    eventDate:     content.eventDate     || '',
    venueLat:      content.venueLat      || '',
    venueLng:      content.venueLng      || '',
    venueLabel:    content.venueLabel    || '',
  });

  useEffect(() => {
    setForm({
      welcomeTitle:  content.welcomeTitle  || '',
      welcomeText:   content.welcomeText   || '',
      welcomeImages: content.welcomeImages || [],
      eventDate:     content.eventDate     || '',
      venueLat:      content.venueLat      || '',
      venueLng:      content.venueLng      || '',
      venueLabel:    content.venueLabel    || '',
    });
  }, [content]);

  const togglePhoto = (photo) => {
    setForm(f => ({
      ...f,
      welcomeImages: f.welcomeImages.includes(photo)
        ? f.welcomeImages.filter(p => p !== photo)
        : [...f.welcomeImages, photo],
    }));
  };

  const inp = { width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ── Texte d'accueil ── */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontWeight: 700, color: '#4f46e5', marginBottom: '20px', fontSize: '16px' }}>🏠 Contenu de la page d'accueil</h3>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Titre</label>
          <input type="text" value={form.welcomeTitle}
            onChange={e => setForm(f => ({ ...f, welcomeTitle: e.target.value }))}
            placeholder="Ex : Bienvenue au week-end des 50 ans !"
            style={inp} />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Texte</label>
          <RichTextEditor value={form.welcomeText} onChange={v => setForm(f => ({ ...f, welcomeText: v }))} />
        </div>
        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '10px' }}>Photos à afficher sur la page</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {allPhotos.map(photo => {
              const selected = form.welcomeImages.includes(photo);
              return (
                <div key={photo} onClick={() => togglePhoto(photo)} style={{ cursor: 'pointer', borderRadius: '10px', overflow: 'hidden', border: `3px solid ${selected ? '#4f46e5' : 'transparent'}`, boxShadow: selected ? '0 0 0 1px #4f46e5' : '0 1px 4px rgba(0,0,0,0.12)', opacity: selected ? 1 : 0.5, transition: 'all 0.2s' }}>
                  <img src={`/photos/${photo}`} alt="" style={{ width: '100%', height: '64px', objectFit: 'cover', display: 'block' }} />
                  {selected && <div style={{ background: '#4f46e5', color: 'white', fontSize: '10px', fontWeight: 700, textAlign: 'center', padding: '2px' }}>✓</div>}
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>Cliquez pour sélectionner / désélectionner</p>
        </div>
      </div>

      {/* ── Date & compteur ── */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontWeight: 700, color: '#7c3aed', marginBottom: '16px', fontSize: '16px' }}>⏳ Compteur jusqu'à l'événement</h3>
        <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Date et heure de l'événement</label>
        <input type="datetime-local" value={form.eventDate}
          onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))}
          style={{ ...inp, width: 'auto' }} />
        {form.eventDate && (
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Aperçu :</p>
            <Countdown eventDate={form.eventDate} />
          </div>
        )}
      </div>

      {/* ── Météo ── */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontWeight: 700, color: '#0891b2', marginBottom: '16px', fontSize: '16px' }}>🌤️ Météo du lieu</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Latitude</label>
            <input type="text" value={form.venueLat} onChange={e => setForm(f => ({ ...f, venueLat: e.target.value }))}
              placeholder="ex : 47.3220" style={inp} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Longitude</label>
            <input type="text" value={form.venueLng} onChange={e => setForm(f => ({ ...f, venueLng: e.target.value }))}
              placeholder="ex : 5.0415" style={inp} />
          </div>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Nom du lieu (affiché)</label>
          <input type="text" value={form.venueLabel} onChange={e => setForm(f => ({ ...f, venueLabel: e.target.value }))}
            placeholder="ex : Domaine de Bel Air, Beaune" style={inp} />
        </div>
        <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 12px' }}>💡 Retrouvez les coordonnées GPS sur <strong>maps.google.com</strong> → clic droit sur le lieu → copier les coordonnées</p>
        {form.venueLat && form.venueLng && <WeatherWidget lat={form.venueLat} lng={form.venueLng} label={form.venueLabel} />}
      </div>

      <button onClick={() => onSave({ welcomeTitle: form.welcomeTitle, welcomeText: form.welcomeText, welcomeImages: form.welcomeImages, eventDate: form.eventDate, venueLat: form.venueLat, venueLng: form.venueLng, venueLabel: form.venueLabel })}
        disabled={saving}
        style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', padding: '13px 32px', fontWeight: 700, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, alignSelf: 'flex-start' }}>
        {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
      </button>
    </div>
  );
}

// ─── Admin : onglet Planning ──────────────────────────────────────────────────
function AdminPlanningTab({ content, onSave, saving }) {
  const [planning, setPlanning] = useState(content.planning || []);
  const [newEvent, setNewEvent] = useState({ day: 'sat', time: '12:00', emoji: '🎉', title: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  useEffect(() => { setPlanning(content.planning || []); }, [content]);

  const sorted = [...planning].sort((a, b) => {
    const d = dayOrder[a.day] - dayOrder[b.day];
    return d !== 0 ? d : a.time.localeCompare(b.time);
  });

  const addEvent = () => {
    if (!newEvent.title.trim()) return;
    setPlanning(p => [...p, { ...newEvent, id: `${Date.now()}` }]);
    setNewEvent(n => ({ ...n, title: '', description: '' }));
  };

  const startEdit = (ev) => {
    setEditingId(ev.id);
    setEditForm({ ...ev });
  };

  const saveEdit = () => {
    if (!editForm.title.trim()) return;
    setPlanning(p => p.map(e => e.id === editingId ? { ...editForm } : e));
    setEditingId(null);
    setEditForm(null);
  };

  const cancelEdit = () => { setEditingId(null); setEditForm(null); };

  const inputStyle = { border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box', width: '100%' };
  const editInputStyle = { border: '1.5px solid #4f46e5', borderRadius: '6px', padding: '6px 10px', fontSize: '13px', boxSizing: 'border-box', width: '100%', outline: 'none' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #4f46e5' }}>
        <h3 style={{ fontWeight: 700, color: '#4f46e5', marginBottom: '16px', fontSize: '16px' }}>➕ Ajouter un événement</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 64px', gap: '10px', marginBottom: '10px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Jour</label>
            <select value={newEvent.day} onChange={e => setNewEvent(n => ({ ...n, day: e.target.value }))} style={inputStyle}>
              <option value="sat">Samedi</option>
              <option value="sun">Dimanche</option>
              <option value="mon">Lundi</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Heure</label>
            <input type="time" value={newEvent.time} onChange={e => setNewEvent(n => ({ ...n, time: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Emoji</label>
            <input type="text" value={newEvent.emoji} onChange={e => setNewEvent(n => ({ ...n, emoji: e.target.value }))}
              style={{ ...inputStyle, textAlign: 'center', fontSize: '22px', padding: '4px' }} />
          </div>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Titre *</label>
          <input type="text" value={newEvent.title} onChange={e => setNewEvent(n => ({ ...n, title: e.target.value }))}
            onKeyPress={e => e.key === 'Enter' && addEvent()}
            placeholder="Ex : Apéritif de bienvenue" style={inputStyle} />
        </div>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Description <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optionnel)</span></label>
          <input type="text" value={newEvent.description} onChange={e => setNewEvent(n => ({ ...n, description: e.target.value }))}
            placeholder="Ex : Dans le jardin près de l'étang" style={inputStyle} />
        </div>
        <button onClick={addEvent}
          style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 20px', fontWeight: 600, cursor: 'pointer' }}>
          + Ajouter
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontWeight: 700, color: '#1f2937', marginBottom: '16px', fontSize: '16px' }}>
          📅 Programme <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: '14px' }}>({planning.length} événement{planning.length > 1 ? 's' : ''})</span>
        </h3>
        {sorted.length === 0 && <p style={{ color: '#9ca3af', fontSize: '13px' }}>Aucun événement — ajoutez-en ci-dessus.</p>}
        {['sat', 'sun', 'mon'].map(day => {
          const events = sorted.filter(e => e.day === day);
          if (!events.length) return null;
          return (
            <div key={day} style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #f3f4f6', paddingBottom: '6px', marginBottom: '8px' }}>
                {dayLabels[day]}
              </div>
              {events.map(ev => (
                <div key={ev.id} style={{ marginBottom: '6px' }}>
                  {editingId === ev.id ? (
                    /* ── Formulaire d'édition inline ── */
                    <div style={{ border: '2px solid #4f46e5', borderRadius: '10px', padding: '12px', background: '#f5f3ff' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 56px', gap: '8px', marginBottom: '8px' }}>
                        <select value={editForm.day} onChange={e => setEditForm(f => ({ ...f, day: e.target.value }))} style={editInputStyle}>
                          <option value="sat">Samedi</option>
                          <option value="sun">Dimanche</option>
                          <option value="mon">Lundi</option>
                        </select>
                        <input type="time" value={editForm.time} onChange={e => setEditForm(f => ({ ...f, time: e.target.value }))} style={editInputStyle} />
                        <input type="text" value={editForm.emoji} onChange={e => setEditForm(f => ({ ...f, emoji: e.target.value }))}
                          style={{ ...editInputStyle, textAlign: 'center', fontSize: '20px', padding: '4px' }} />
                      </div>
                      <input type="text" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="Titre *" style={{ ...editInputStyle, marginBottom: '6px' }} />
                      <input type="text" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Description (optionnel)" style={{ ...editInputStyle, marginBottom: '10px' }} />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={saveEdit}
                          style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', padding: '7px 16px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                          ✅ Valider
                        </button>
                        <button onClick={cancelEdit}
                          style={{ background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '6px', padding: '7px 14px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Ligne normale ── */
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f9fafb', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', minWidth: '38px' }}>{ev.time}</span>
                        <span style={{ fontSize: '20px' }}>{ev.emoji}</span>
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937' }}>{ev.title}</span>
                          {ev.description && <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>{ev.description}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => startEdit(ev)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4f46e5', fontSize: '15px', padding: '4px 6px' }}
                          title="Modifier">✏️</button>
                        <button onClick={() => setPlanning(p => p.filter(e => e.id !== ev.id))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '15px', padding: '4px 6px' }}
                          title="Supprimer">🗑️</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
        <button onClick={() => onSave({ planning })} disabled={saving}
          style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', padding: '11px 28px', fontWeight: 700, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, marginTop: '8px' }}>
          {saving ? 'Sauvegarde...' : '💾 Sauvegarder le planning'}
        </button>
      </div>
    </div>
  );
}

// ─── Viewer : onglet Accueil ──────────────────────────────────────────────────
function ViewerAccueilTab({ content }) {
  const { welcomeTitle, welcomeText, welcomeImages, eventDate, venueLat, venueLng, venueLabel } = content;
  const hasContent = welcomeTitle || welcomeText || (welcomeImages && welcomeImages.length > 0);

  if (!hasContent && !eventDate && !venueLat) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏠</div>
      <p>La page d'accueil n'a pas encore été renseignée.</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {welcomeTitle && <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#1f2937', margin: 0 }}>{welcomeTitle}</h2>}

      {/* Compteur */}
      {eventDate && <Countdown eventDate={eventDate} />}

      {/* Texte formaté (HTML) */}
      {welcomeText && (
        <div style={{ background: 'white', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', fontSize: '15px', lineHeight: 1.8, color: '#374151' }}
          dangerouslySetInnerHTML={{ __html: welcomeText }} />
      )}

      {/* Photos */}
      {welcomeImages && welcomeImages.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: welcomeImages.length === 1 ? '1fr' : '1fr 1fr', gap: '12px' }}>
          {welcomeImages.map(photo => (
            <img key={photo} src={`/photos/${photo}`} alt=""
              style={{ width: '100%', borderRadius: '14px', objectFit: 'cover', height: welcomeImages.length === 1 ? '320px' : '200px', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', display: 'block' }} />
          ))}
        </div>
      )}

      {/* Météo */}
      {venueLat && venueLng && <WeatherWidget lat={venueLat} lng={venueLng} label={venueLabel} />}
    </div>
  );
}

// ─── Viewer : onglet Planning ─────────────────────────────────────────────────
function ViewerPlanningTab({ content }) {
  const planning = content.planning || [];
  const sorted = [...planning].sort((a, b) => {
    const d = dayOrder[a.day] - dayOrder[b.day];
    return d !== 0 ? d : a.time.localeCompare(b.time);
  });

  if (!sorted.length) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
      <p>Le planning n'a pas encore été renseigné.</p>
    </div>
  );

  const dayColors = {
    sat: { bg: '#eff6ff', border: '#bfdbfe', title: '#1d4ed8' },
    sun: { bg: '#f0fdf4', border: '#bbf7d0', title: '#15803d' },
    mon: { bg: '#fff7ed', border: '#fed7aa', title: '#c2410c' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {['sat', 'sun', 'mon'].map(day => {
        const events = sorted.filter(e => e.day === day);
        if (!events.length) return null;
        const c = dayColors[day];
        return (
          <div key={day} style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
            <div style={{ background: c.bg, borderBottom: `2px solid ${c.border}`, padding: '14px 20px' }}>
              <h3 style={{ fontWeight: 800, color: c.title, fontSize: '16px', margin: 0 }}>{dayLabels[day]}</h3>
            </div>
            <div style={{ padding: '8px 0' }}>
              {events.map((ev, i) => (
                <div key={ev.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '12px 20px',
                  borderBottom: i < events.length - 1 ? '1px solid #f3f4f6' : 'none',
                }}>
                  <div style={{ minWidth: '44px', fontSize: '12px', fontWeight: 700, color: '#9ca3af', paddingTop: '3px' }}>{ev.time}</div>
                  <div style={{ fontSize: '24px', lineHeight: 1.2 }}>{ev.emoji}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#1f2937' }}>{ev.title}</div>
                    {ev.description && <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '3px' }}>{ev.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Carrousel hero ──────────────────────────────────────────────────────────
const heroPhotos = ['/photos/photo1.jpg', '/photos/photo2.jpg', '/photos/photo3.jpg', '/photos/photo4.jpg', '/photos/photo5.jpg'];

function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent(c => (c + 1) % heroPhotos.length);
        setFading(false);
      }, 600);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '320px', overflow: 'hidden' }}>
      {/* Photo de fond */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${heroPhotos[current]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transition: 'opacity 0.6s ease',
        opacity: fading ? 0 : 1,
      }} />
      {/* Overlay dégradé */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.55) 100%)',
      }} />
      {/* Texte centré */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color: 'white', textAlign: 'center', padding: '0 20px',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '8px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}>🎉</div>
        <h1 style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 8px', color: 'white', textShadow: '0 2px 12px rgba(0,0,0,0.6)', letterSpacing: '-0.5px' }}>
          50 ans d'Étienne !
        </h1>
        <p style={{ fontSize: '15px', opacity: 0.9, margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
          Week-end en famille · Mai 2026
        </p>
      </div>
      {/* Pastilles de navigation */}
      <div style={{
        position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: '8px',
      }}>
        {heroPhotos.map((_, i) => (
          <button
            key={i}
            onClick={() => { setFading(true); setTimeout(() => { setCurrent(i); setFading(false); }, 300); }}
            style={{
              width: i === current ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              border: 'none',
              background: i === current ? 'white' : 'rgba(255,255,255,0.45)',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Vue VIEWER (lecture seule, UX soignée) ───────────────────────────────────
function ViewerApp({ guests, content, onLogout }) {
  const [activeTab, setActiveTab] = useState('accueil');
  const attendingGuests = guests.filter(g => g.attending);

  const totalAdults = attendingGuests.reduce((s, g) => s + (g.adults || 0), 0);
  const totalChildren = attendingGuests.reduce((s, g) => s + (g.boys || 0) + (g.girls || 0), 0);

  const getMealStats = (key) => {
    const g = attendingGuests.filter(x => x[key]);
    return {
      adults: g.reduce((s, x) => s + (x.adults || 0), 0),
      children: g.reduce((s, x) => s + (x.boys || 0) + (x.girls || 0), 0),
      list: g,
    };
  };

  // ── Sous-auth Chasse ──
  const [teamToken, setTeamToken] = useState(localStorage.getItem('weekendTeamToken') || null);
  const [teamNameLocal, setTeamNameLocal] = useState(localStorage.getItem('weekendTeamName') || null);
  const [teamCodeInput, setTeamCodeInput] = useState('');
  const [teamLoginError, setTeamLoginError] = useState('');
  const [teamLoginLoading, setTeamLoginLoading] = useState(false);

  const handleTeamJoin = async () => {
    if (!teamCodeInput.trim()) { setTeamLoginError('Entrez un code à 4 chiffres'); return; }
    setTeamLoginLoading(true); setTeamLoginError('');
    try {
      const r = await fetch(API_URL + '/hunt/team/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: teamCodeInput.trim() }),
      });
      const d = await r.json();
      if (d.token) {
        setTeamToken(d.token);
        setTeamNameLocal(d.team.name);
        localStorage.setItem('weekendTeamToken', d.token);
        localStorage.setItem('weekendTeamName', d.team.name);
        setTeamCodeInput('');
      } else { setTeamLoginError(d.error || 'Code invalide'); }
    } catch (e) { setTeamLoginError('Erreur réseau'); }
    setTeamLoginLoading(false);
  };

  const handleTeamLeave = () => {
    setTeamToken(null); setTeamNameLocal(null);
    localStorage.removeItem('weekendTeamToken');
    localStorage.removeItem('weekendTeamName');
    setActiveTab('accueil');
  };

  // ── Sous-auth Quiz ──
  const [quizToken, setQuizToken] = useState(localStorage.getItem('weekendQuizToken') || null);
  const [quizNameLocal, setQuizNameLocal] = useState(localStorage.getItem('weekendQuizName') || null);
  const [quizNameInput, setQuizNameInput] = useState('');
  const [quizListLocal, setQuizListLocal] = useState([]);
  const [selectedQuizIdLocal, setSelectedQuizIdLocal] = useState('');
  const [quizLoginError, setQuizLoginError] = useState('');
  const [quizLoginLoading, setQuizLoginLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== 'quiz' || quizToken) return;
    fetch(API_URL + '/quiz/public/list')
      .then(r => r.ok ? r.json() : [])
      .then(list => {
        setQuizListLocal(list);
        if (list.length === 1) setSelectedQuizIdLocal(list[0]._id);
        else setSelectedQuizIdLocal('');
      })
      .catch(() => setQuizListLocal([]));
  }, [activeTab, quizToken]);

  const handleQuizJoin = async () => {
    if (!quizNameInput.trim()) { setQuizLoginError('Entrez votre prénom'); return; }
    if (quizListLocal.length > 1 && !selectedQuizIdLocal) { setQuizLoginError('Choisissez un quiz'); return; }
    setQuizLoginLoading(true); setQuizLoginError('');
    try {
      const r = await fetch(API_URL + '/quiz/participant/join', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: quizNameInput.trim(), quizId: selectedQuizIdLocal || undefined }),
      });
      const d = await r.json();
      if (d.token) {
        setQuizToken(d.token);
        setQuizNameLocal(d.participant.name);
        localStorage.setItem('weekendQuizToken', d.token);
        localStorage.setItem('weekendQuizName', d.participant.name);
        setQuizNameInput('');
      } else { setQuizLoginError(d.error || 'Impossible de rejoindre'); }
    } catch (e) { setQuizLoginError('Erreur réseau'); }
    setQuizLoginLoading(false);
  };

  const handleQuizLeave = () => {
    setQuizToken(null); setQuizNameLocal(null);
    localStorage.removeItem('weekendQuizToken');
    localStorage.removeItem('weekendQuizName');
    setActiveTab('accueil');
  };

  // ── Suggestions publiques ──
  const [suggestName, setSuggestName] = useState('');
  const [suggestForm, setSuggestForm] = useState({ ...EMPTY_Q_FORM });
  const [suggestStatus, setSuggestStatus] = useState(null);
  const [suggestLoading, setSuggestLoading] = useState(false);

  const handleSuggest = async () => {
    if (!suggestName.trim() || !suggestForm.text.trim() || suggestForm.choices.some(c => !c.text.trim())) {
      setSuggestStatus('error'); return;
    }
    setSuggestLoading(true); setSuggestStatus(null);
    try {
      const r = await fetch(API_URL + '/quiz/public/suggest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: suggestName.trim(), ...suggestForm }),
      });
      if (r.ok) { setSuggestStatus('ok'); setSuggestForm({ ...EMPTY_Q_FORM }); setSuggestName(''); }
      else setSuggestStatus('error');
    } catch (e) { setSuggestStatus('error'); }
    setSuggestLoading(false);
  };

  // ── Rendu plein écran si sous-app active ──
  if (activeTab === 'hunt' && teamToken) {
    return <TeamApp token={teamToken} teamName={teamNameLocal} onLogout={handleTeamLeave} />;
  }
  if (activeTab === 'quiz' && quizToken) {
    return <QuizParticipantApp token={quizToken} participantName={quizNameLocal} onLogout={handleQuizLeave} />;
  }

  const viewerTabs = [
    ['accueil',  '🏠 Accueil'],
    ['planning', '📅 Planning'],
    ['guests',   `👨‍👩‍👧 Invités (${attendingGuests.length})`],
    ['rooms',    '🛏️ Chambres'],
    ['meals',    '🍽️ Repas'],
    ['hunt',     '🎯 Chasse'],
    ['galerie',  '📸 Galerie'],
    ['quiz',     '🎮 Quiz'],
    ['suggest',  '💡 Suggestions'],
  ];

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", position: 'relative' }}>
      {/* Fond photo fixe floutée */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'url(/photos/photo5.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(6px)',
        transform: 'scale(1.05)',
        opacity: 0.18,
      }} />
      {/* Voile blanc pour lisibilité */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'rgba(255,255,255,0.82)' }} />

      {/* Carrousel hero */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <HeroCarousel />
        {/* Bouton déconnexion en overlay */}
        <button
          onClick={onLogout}
          style={{
            position: 'absolute', top: '14px', right: '16px',
            background: 'rgba(0,0,0,0.35)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            padding: '7px 14px',
            fontWeight: 600,
            fontSize: '12px',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
          }}
        >
          Déconnexion
        </button>
      </div>

      {/* Nav */}
      <nav style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', gap: '4px', padding: '0 24px', overflowX: 'auto' }}>
          {viewerTabs.map(([t, l]) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                padding: '14px 20px',
                fontWeight: 600,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                borderBottom: activeTab === t ? '3px solid #7c3aed' : '3px solid transparent',
                color: activeTab === t ? '#7c3aed' : '#6b7280',
                whiteSpace: 'nowrap',
                fontSize: '14px',
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </nav>

      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 16px', position: 'relative', zIndex: 1 }}>

        {/* ── ACCUEIL ── */}
        {activeTab === 'accueil' && <ViewerAccueilTab content={content} />}

        {/* ── PLANNING ── */}
        {activeTab === 'planning' && <ViewerPlanningTab content={content} />}

        {/* ── INVITÉS ── */}
        {activeTab === 'guests' && (
          <div>
            {/* Compteurs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
              {[
                { icon: '👨‍👩‍👧', label: 'Familles', value: attendingGuests.length, color: '#7c3aed', bg: '#f3e8ff' },
                { icon: '🧑', label: 'Adultes', value: totalAdults, color: '#059669', bg: '#d1fae5' },
                { icon: '🧒', label: 'Enfants', value: totalChildren, color: '#d97706', bg: '#fef3c7' },
              ].map(({ icon, label, value, color, bg }) => (
                <div key={label} style={{
                  background: 'white',
                  borderRadius: '14px',
                  padding: '20px 16px',
                  textAlign: 'center',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '6px' }}>{icon}</div>
                  <div style={{ fontSize: '36px', fontWeight: 800, color }}>{value}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Liste des familles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {attendingGuests.map(g => {
                const children = (g.boys || 0) + (g.girls || 0);
                return (
                  <div key={g._id} style={{
                    background: 'white',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    borderLeft: '4px solid #7c3aed',
                  }}>
                    {/* Nom + composition */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937' }}>{g.name}</div>
                        <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                          {g.adults > 0 && `${g.adults} adulte${g.adults > 1 ? 's' : ''}`}
                          {children > 0 && ` · ${children} enfant${children > 1 ? 's' : ''}`}
                          {g.boys > 0 && ` (${g.boys}♂`}
                          {g.boys > 0 && g.girls > 0 && ' '}
                          {g.girls > 0 && `${g.boys > 0 ? '' : '('}${g.girls}♀`}
                          {children > 0 && ')'}
                        </div>
                      </div>
                      {/* Badges nuits */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {g.nightSatSun && (
                          <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, background: '#dbeafe', color: '#1d4ed8' }}>
                            🌙 Sam→Dim
                          </span>
                        )}
                        {g.nightSunMon && (
                          <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, background: '#d1fae5', color: '#065f46' }}>
                            🌙 Dim→Lun
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Badges repas */}
                    {mealsList.some(m => g[m.key]) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {mealsList.filter(m => g[m.key]).map(m => (
                          <span key={m.key} style={{
                            padding: '3px 9px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: '#ffedd5',
                            color: '#9a3412',
                          }}>
                            🍽️ {m.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {attendingGuests.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>👨‍👩‍👧</div>
                <p>Les invités n'ont pas encore été renseignés.</p>
              </div>
            )}
          </div>
        )}

        {/* ── CHAMBRES ── */}
        {activeTab === 'rooms' && (
          <div>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
              Les chambres sans occupant sont grisées
            </p>
            <RoomsTableViewer guests={guests} />
          </div>
        )}

        {/* ── REPAS ── */}
        {activeTab === 'meals' && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#7c3aed', marginBottom: '20px' }}>
              🍽️ Récapitulatif des repas
            </h2>
            {mealsList.map(meal => {
              const { adults, children, list } = getMealStats(meal.key);
              const total = adults + children;
              return (
                <div key={meal.key} style={{
                  background: 'white',
                  borderRadius: '14px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
                  padding: '20px',
                  marginBottom: '14px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1f2937', margin: 0 }}>{meal.name}</h3>
                    <span style={{
                      background: '#f3e8ff',
                      color: '#7c3aed',
                      fontWeight: 800,
                      fontSize: '15px',
                      padding: '4px 14px',
                      borderRadius: '9999px',
                    }}>
                      {total} pers.
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: total > 0 ? '14px' : 0 }}>
                    {[
                      { label: 'Adultes', value: adults, color: '#4f46e5', bg: '#eef2ff' },
                      { label: 'Enfants', value: children, color: '#d97706', bg: '#fef3c7' },
                    ].map(({ label, value, color, bg }) => (
                      <div key={label} style={{ background: bg, borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '26px', fontWeight: 800, color }}>{value}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                  {list.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {list.map(g => (
                        <span key={g._id} style={{
                          background: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '12px',
                          color: '#374151',
                          fontWeight: 500,
                        }}>
                          {g.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {total === 0 && (
                    <p style={{ color: '#d1d5db', fontSize: '13px', margin: 0 }}>Aucun invité pour ce repas</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── CHASSE ── */}
        {activeTab === 'hunt' && (
          <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '12px' }}>🎯</div>
            <h2 style={{ fontWeight: 800, color: '#059669', marginBottom: '8px' }}>Chasse au trésor</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>Entrez le code à 4 chiffres de votre équipe</p>
            <input type="tel" inputMode="numeric" maxLength={4} placeholder="0000" value={teamCodeInput}
              onChange={e => setTeamCodeInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
              onKeyPress={e => e.key === 'Enter' && handleTeamJoin()}
              style={{ border: '2px solid #d1fae5', borderRadius: '12px', padding: '14px 20px', fontSize: '36px', fontWeight: 800, width: '100%', outline: 'none', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '14px', marginBottom: '12px' }} />
            {teamLoginError && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '8px' }}>{teamLoginError}</p>}
            <button onClick={handleTeamJoin} disabled={teamLoginLoading}
              style={{ width: '100%', background: 'linear-gradient(135deg, #059669, #0ea5e9)', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 700, fontSize: '16px', cursor: teamLoginLoading ? 'not-allowed' : 'pointer', opacity: teamLoginLoading ? 0.7 : 1 }}>
              {teamLoginLoading ? 'Connexion...' : '🎯 Rejoindre mon équipe'}
            </button>
          </div>
        )}

        {/* ── QUIZ ── */}
        {activeTab === 'quiz' && (
          <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '12px' }}>🎮</div>
            <h2 style={{ fontWeight: 800, color: '#7c3aed', marginBottom: '8px' }}>Quiz</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>Entrez votre prénom pour participer</p>
            {quizListLocal.length > 1 && (
              <select value={selectedQuizIdLocal} onChange={e => setSelectedQuizIdLocal(e.target.value)}
                style={{ width: '100%', border: '2px solid #c4b5fd', borderRadius: '10px', padding: '12px 14px', fontSize: '15px', fontWeight: 600, outline: 'none', boxSizing: 'border-box', background: 'white', marginBottom: '12px', cursor: 'pointer' }}>
                <option value="">— Choisir un quiz —</option>
                {quizListLocal.map(q => <option key={q._id} value={q._id}>{q.name}{q.status === 'active' ? ' 🟢' : ' ⏳'}</option>)}
              </select>
            )}
            {quizListLocal.length === 0 && (
              <p style={{ color: '#f97316', fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>⚠️ Aucun quiz disponible pour le moment</p>
            )}
            <input type="text" placeholder="Votre prénom…" value={quizNameInput}
              onChange={e => setQuizNameInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleQuizJoin()}
              style={{ border: '2px solid #e5e7eb', borderRadius: '12px', padding: '14px 20px', fontSize: '20px', fontWeight: 700, width: '100%', outline: 'none', boxSizing: 'border-box', textAlign: 'center', marginBottom: '12px' }} />
            {quizLoginError && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '8px' }}>{quizLoginError}</p>}
            <button onClick={handleQuizJoin}
              disabled={quizLoginLoading || quizListLocal.length === 0 || (quizListLocal.length > 1 && !selectedQuizIdLocal)}
              style={{ width: '100%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', opacity: (quizLoginLoading || quizListLocal.length === 0) ? 0.5 : 1 }}>
              {quizLoginLoading ? 'Connexion...' : '🎮 Rejoindre le quiz'}
            </button>
          </div>
        )}

        {/* ── SUGGESTIONS ── */}
        {/* ── GALERIE ── */}
        {activeTab === 'galerie' && <ViewerGalleryTab />}

        {activeTab === 'suggest' && (
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '56px', marginBottom: '8px' }}>💡</div>
              <h2 style={{ fontWeight: 800, color: '#d97706', marginBottom: '4px' }}>Vos Suggestions pour le Quiz</h2>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>Proposez une question — l'admin l'ajoutera au bon quiz</p>
            </div>
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder="Votre prénom…" value={suggestName}
                onChange={e => setSuggestName(e.target.value)}
                style={{ border: '2px solid #fcd34d', borderRadius: '10px', padding: '12px 14px', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', textAlign: 'center' }} />
              <textarea value={suggestForm.text} onChange={e => setSuggestForm(f => ({ ...f, text: e.target.value }))}
                placeholder="Votre question…" rows={2}
                style={{ border: '2px solid #fcd34d', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
              {suggestForm.choices.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ background: CHOICE_COLORS[c.id], color: 'white', borderRadius: '7px', padding: '7px 10px', fontWeight: 800, fontSize: '14px', minWidth: '32px', textAlign: 'center', flexShrink: 0 }}>{CHOICE_ICONS[c.id]}</div>
                  <input value={c.text} onChange={e => setSuggestForm(f => ({ ...f, choices: f.choices.map(ch => ch.id === c.id ? { ...ch, text: e.target.value } : ch) }))}
                    placeholder={`Choix ${c.id}…`}
                    style={{ flex: 1, border: '1.5px solid #fcd34d', borderRadius: '7px', padding: '8px 10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                  <input type="radio" name="viewerSuggestCorrect" checked={suggestForm.correctChoiceId === c.id}
                    onChange={() => setSuggestForm(f => ({ ...f, correctChoiceId: c.id }))}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }} title="Bonne réponse" />
                </div>
              ))}
              <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>✓ = sélectionnez la bonne réponse</p>
              {suggestStatus === 'ok' && <p style={{ color: '#059669', fontWeight: 700, textAlign: 'center', margin: 0 }}>✅ Question envoyée ! Merci 🎉</p>}
              {suggestStatus === 'error' && <p style={{ color: '#dc2626', fontWeight: 700, textAlign: 'center', margin: 0 }}>❌ Remplissez tous les champs</p>}
              <button onClick={handleSuggest} disabled={suggestLoading}
                style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: 'white', border: 'none', borderRadius: '10px', padding: '13px', fontWeight: 700, fontSize: '15px', cursor: suggestLoading ? 'not-allowed' : 'pointer', opacity: suggestLoading ? 0.7 : 1 }}>
                {suggestLoading ? 'Envoi…' : '💡 Envoyer ma suggestion'}
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// ─── Galerie famille (viewer) ────────────────────────────────────────────────
function ViewerGalleryTab() {
  const viewerToken = localStorage.getItem('weekendToken');
  const authH = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + viewerToken };

  const [gallery, setGallery] = React.useState([]);
  const [loadingGal, setLoadingGal] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState('');
  const [uploadStatus, setUploadStatus] = React.useState(null); // 'ok' | 'error' | null
  const [uploaderName, setUploaderName] = React.useState(
    localStorage.getItem('galleryUploaderName') || ''
  );
  const fileRef = React.useRef(null);

  const loadGallery = async () => {
    try {
      const r = await fetch(API_URL + '/hunt/viewer/gallery', { headers: authH });
      if (r.ok) setGallery(await r.json());
    } catch {}
    setLoadingGal(false);
  };

  React.useEffect(() => { loadGallery(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!uploaderName.trim()) { setUploadError('Entrez votre prénom'); return; }
    if (file.size > 50 * 1024 * 1024) { setUploadError('Fichier trop volumineux (max 50 MB)'); return; }
    setUploading(true); setUploadError(''); setUploadStatus(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', CLD_PRESET);
      const cldRes = await fetch(
        'https://api.cloudinary.com/v1_1/' + CLD_CLOUD + '/auto/upload',
        { method: 'POST', body: fd }
      );
      if (!cldRes.ok) throw new Error('Échec upload Cloudinary');
      const cld = await cldRes.json();
      const r = await fetch(API_URL + '/hunt/viewer/media', {
        method: 'POST',
        headers: authH,
        body: JSON.stringify({
          url: cld.secure_url,
          publicId: cld.public_id,
          resourceType: cld.resource_type,
          uploaderName: uploaderName.trim(),
        }),
      });
      if (r.ok) {
        setUploadStatus('ok');
        localStorage.setItem('galleryUploaderName', uploaderName.trim());
        await loadGallery();
      } else { throw new Error('Erreur serveur'); }
    } catch (err) {
      setUploadError(err.message);
      setUploadStatus('error');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  // Grouper : uploads équipe par teamName, uploads famille par uploaderName
  const groups = {};
  gallery.forEach(m => {
    const key = m.uploadedBy === 'viewer'
      ? '📸 ' + (m.uploaderName || 'Famille')
      : '👥 ' + (m.teamName || 'Équipe');
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });

  return (
    <div>
      {/* ── Upload section ── */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontWeight: 700, margin: '0 0 14px', color: '#1f2937' }}>📤 Ajouter vos photos</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Votre prénom…"
            value={uploaderName}
            onChange={e => { setUploaderName(e.target.value); setUploadError(''); }}
            style={{ flex: 1, minWidth: '130px', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
          />
          <button
            onClick={() => { setUploadStatus(null); setUploadError(''); fileRef.current && fileRef.current.click(); }}
            disabled={uploading || !uploaderName.trim()}
            style={{
              padding: '10px 18px',
              background: uploading || !uploaderName.trim() ? '#e5e7eb' : '#7c3aed',
              color: uploading || !uploaderName.trim() ? '#9ca3af' : 'white',
              border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px',
              cursor: uploading || !uploaderName.trim() ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {uploading ? '⏳ Envoi…' : '📷 Ajouter une photo / vidéo'}
          </button>
          <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleUpload} />
        </div>
        {uploadError && <p style={{ color: '#dc2626', margin: '0 0 6px', fontSize: '13px' }}>❌ {uploadError}</p>}
        {uploadStatus === 'ok' && <p style={{ color: '#059669', margin: '0 0 6px', fontSize: '13px' }}>✅ Photo ajoutée à la galerie !</p>}
        <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>Vos photos seront visibles par toute la famille 🎉</p>
      </div>

      {/* ── Galerie ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontWeight: 700, margin: 0, color: '#1f2937' }}>🖼️ Galerie de la chasse</h3>
        <button onClick={() => { setLoadingGal(true); loadGallery(); }}
          style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', padding: '6px 12px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
          ↻ Actualiser
        </button>
      </div>

      {loadingGal ? (
        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '30px 0' }}>Chargement…</p>
      ) : gallery.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#9ca3af', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>📷</div>
          <p style={{ margin: 0, fontWeight: 600 }}>Aucune photo pour l'instant</p>
          <p style={{ margin: '6px 0 0', fontSize: '13px' }}>Soyez les premiers à partager !</p>
        </div>
      ) : (
        <div>
          {Object.entries(groups).map(([groupName, items]) => (
            <div key={groupName} style={{ marginBottom: '24px' }}>
              <h4 style={{ fontWeight: 700, color: '#4f46e5', marginBottom: '12px', fontSize: '15px' }}>
                {groupName}
                <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: '13px', marginLeft: '8px' }}>
                  — {items.length} média{items.length > 1 ? 's' : ''}
                </span>
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '10px' }}>
                {items.map(m => (
                  <div key={m._id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    {m.resourceType === 'video' ? (
                      <video src={m.url} controls style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <a href={m.url} target="_blank" rel="noreferrer">
                        <img
                          src={m.url.replace('/upload/', '/upload/w_400,q_auto/')}
                          alt=""
                          style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }}
                        />
                      </a>
                    )}
                    <div style={{ padding: '6px 10px' }}>
                      {m.stageLabel && (
                        <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 2px', fontWeight: 600 }}>📍 {m.stageLabel}</p>
                      )}
                      <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                        {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Helper GPS ──────────────────────────────────────────────────────────────
function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDuration(ms) {
  if (!ms || ms < 0) return '-';
  const s = Math.round(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return h + 'h' + String(m).padStart(2, '0');
  if (m > 0) return m + 'min' + String(sec).padStart(2, '0') + 's';
  return sec + 's';
}

// ─── Interface Joueur (role=team) ─────────────────────────────────────────────
// ── Composant MediaBtn — défini EN DEHORS de TeamApp pour éviter le remontage à chaque re-render GPS ──
function MediaBtn({ uploading, uploadStatus, uploadError, uploadedMedia, onUpload }) {
  const btnBase = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '13px 8px', fontSize: '15px', fontWeight: 700,
    background: uploading ? '#e5e7eb' : '#f59e0b',
    color: uploading ? '#9ca3af' : 'white',
    borderRadius: '12px', minHeight: '50px', userSelect: 'none',
  };
  const inputOverlay = {
    position: 'absolute', inset: 0, opacity: 0,
    width: '100%', height: '100%', cursor: 'pointer',
  };
  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {/* Bouton Caméra — input superposé, le doigt touche directement le natif */}
        <div style={{ position: 'relative', ...btnBase }}>
          📷 Caméra
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onUpload}
            disabled={uploading}
            style={inputOverlay}
          />
        </div>
        {/* Bouton Galerie — input superposé sans capture */}
        <div style={{ position: 'relative', ...btnBase }}>
          🖼️ Galerie
          <input
            type="file"
            accept="image/*,video/*"
            onChange={onUpload}
            disabled={uploading}
            style={inputOverlay}
          />
        </div>
      </div>
      {uploading && (
        <p style={{ textAlign: 'center', fontSize: '13px', color: '#6b7280', margin: '6px 0 0' }}>
          ⏳ Envoi en cours…
        </p>
      )}
      {uploadStatus === 'ok' && (
        <p style={{ textAlign: 'center', fontSize: '13px', color: '#059669', margin: '6px 0 0', fontWeight: 600 }}>
          ✅ Envoyé ! ({uploadedMedia.length} média{uploadedMedia.length > 1 ? 's' : ''} cette session)
        </p>
      )}
      {uploadStatus === 'error' && (
        <p style={{ textAlign: 'center', fontSize: '14px', color: '#dc2626', margin: '8px 0 0', fontWeight: 600, background: '#fef2f2', borderRadius: '8px', padding: '10px' }}>
          ❌ Erreur : {uploadError}
        </p>
      )}
    </div>
  );
}

function TeamApp({ token, teamName, onLogout }) {
  const [state, setState] = useState(null);
  const [hintData, setHintData] = useState(null);       // { label, gpsLat, gpsLng } une fois révélé
  const [hintConfirm, setHintConfirm] = useState(false); // affiche la confirmation avant d'appeler
  const [view, setView] = useState('loading');
  const [gpsError, setGpsError] = useState(null);
  const [position, setPosition] = useState(null);
  const [answer, setAnswer] = useState('');
  const [answerResult, setAnswerResult] = useState(null);
  const [networkError, setNetworkError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [uploadStatus, setUploadStatus] = useState(null); // null | 'ok' | 'error'
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = React.useRef(null);
  const cameraInputRef = React.useRef(null);

  const th = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };

  // ── Upload Cloudinary + sauvegarde backend ──
  const handleMediaUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('Fichier trop volumineux (max 50 MB)');
      setUploadStatus('error');
      return;
    }
    setUploading(true);
    setUploadStatus(null);
    setUploadError('');
    try {
      // 1. Upload vers Cloudinary
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', CLD_PRESET);
      const cldRes = await fetch(
        'https://api.cloudinary.com/v1_1/' + CLD_CLOUD + '/auto/upload',
        { method: 'POST', body: fd }
      );
      if (!cldRes.ok) {
        const errBody = await cldRes.json().catch(() => ({}));
        throw new Error(errBody.error ? errBody.error.message : 'Échec upload Cloudinary (' + cldRes.status + ')');
      }
      const cld = await cldRes.json();

      // 2. Enregistrer l'URL dans notre backend
      const stageId = state && state.currentStage ? state.currentStage._id : null;
      const stageLabel = state && state.currentStage ? state.currentStage.label : null;
      await fetch(API_URL + '/hunt/team/media', {
        method: 'POST',
        headers: th,
        body: JSON.stringify({
          url: cld.secure_url,
          publicId: cld.public_id,
          resourceType: cld.resource_type,
          stageId,
          stageLabel,
        }),
      });
      setUploadedMedia(m => [...m, { url: cld.secure_url, type: cld.resource_type }]);
      setUploadStatus('ok');
    } catch (err) {
      setUploadError(err.message);
      setUploadStatus('error');
    }
    setUploading(false);
    // Reset pour permettre le même fichier
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadState = async () => {
    try {
      setNetworkError(null);
      const r = await fetch(API_URL + '/hunt/team/me', { headers: th });
      if (!r.ok) { setView('error'); return; }
      const data = await r.json();
      setState(data);
      if (data.hunt.status === 'idle') { setView('waiting'); return; }
      if (data.team.status === 'finished') { setView('finished'); return; }
      if (!data.currentStage) { setView('finished'); return; }
      setView(data.currentStage.hasArrived ? 'activite' : 'enroute');
    } catch (e) {
      setNetworkError(e.message);
    }
  };

  useEffect(() => {
    loadState();
    const iv = setInterval(loadState, 10000);
    return () => clearInterval(iv);
  }, []);

  // Watch GPS uniquement sur l'écran "En route"
  useEffect(() => {
    if (view !== 'enroute' || !state || !state.currentStage) return;
    if (!navigator.geolocation) {
      setGpsError("La géolocalisation n'est pas supportée par ce navigateur.");
      return;
    }
    let sent = false;
    const watcher = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setPosition({ lat, lng });
        setGpsError(null);
        if (!sent && state.currentStage) {
          const dist = getDistanceMeters(lat, lng, state.currentStage.gpsLat, state.currentStage.gpsLng);
          if (dist <= state.currentStage.radiusMeters) {
            sent = true;
            try {
              const r = await fetch(API_URL + '/hunt/team/arrive', {
                method: 'POST', headers: th,
                body: JSON.stringify({ lat, lng }),
              });
              if (r.ok) {
                const data = await r.json();
                setState(s => ({
                  ...s,
                  currentStage: {
                    ...s.currentStage,
                    hasArrived: true,
                    activityInstructions: data.activityInstructions,
                    question: data.question,
                  },
                }));
                setView('activite');
              } else { sent = false; }
            } catch (_) { sent = false; }
          }
        }
      },
      (err) => {
        setGpsError(
          err.code === err.PERMISSION_DENIED
            ? 'Permission GPS refusée. Autorisez la géolocalisation dans les paramètres.'
            : 'Impossible d\'obtenir votre position GPS. Vérifiez que le GPS est activé.'
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watcher);
  }, [view, state && state.currentStage && state.currentStage._id]);

  const handleAnswer = async () => {
    if (!answer.trim()) return;
    setSubmitting(true);
    try {
      const r = await fetch(API_URL + '/hunt/team/answer', {
        method: 'POST', headers: th,
        body: JSON.stringify({ answer }),
      });
      const data = await r.json();
      setAnswerResult(data);
      if (data.correct) {
        setView(data.finished ? 'finished' : 'nextclue');
      }
    } catch (e) { setNetworkError(e.message); }
    setSubmitting(false);
  };

  const handleContinue = async () => {
    setAnswer('');
    setAnswerResult(null);
    setHintData(null);
    setHintConfirm(false);
    await loadState();
  };

  const handleHint = async () => {
    setHintConfirm(false);
    try {
      const r = await fetch(API_URL + '/hunt/team/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      });
      if (r.ok) setHintData(await r.json());
    } catch (e) {}
  };

  const screenStyle = {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: '24px 16px',
    background: 'linear-gradient(135deg, #1e3a5f 0%, #2d6a4f 100%)',
    color: 'white', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  };
  const cardStyle = {
    background: 'rgba(255,255,255,0.97)', color: '#1f2937',
    borderRadius: '20px', padding: '28px 24px',
    width: '100%', maxWidth: '420px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  };
  const btn = (bg, mt = '12px') => ({
    width: '100%', padding: '16px', fontSize: '17px', fontWeight: 700,
    background: bg, color: 'white', border: 'none', borderRadius: '12px',
    cursor: 'pointer', marginTop: mt, minHeight: '54px',
  });


  const Progress = () => state ? (
    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px', textAlign: 'center' }}>
      Étape {state.team.currentStageIndex} / {state.team.totalStages} — {state.team.name}
    </div>
  ) : null;

  // ── Écrans ──

  if (networkError) return (
    <div style={screenStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '12px' }}>📡</div>
        <h2 style={{ textAlign: 'center', color: '#dc2626' }}>Connexion perdue</h2>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>{networkError}</p>
        <button style={btn('#2563eb')} onClick={loadState}>Réessayer</button>
        <button style={btn('#6b7280', '8px')} onClick={onLogout}>Déconnexion</button>
      </div>
    </div>
  );

  if (view === 'loading') return (
    <div style={screenStyle}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
      <p style={{ fontSize: '18px' }}>Chargement...</p>
    </div>
  );

  if (view === 'waiting') return (
    <div style={screenStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: '60px', textAlign: 'center', marginBottom: '16px' }}>🏁</div>
        <h2 style={{ textAlign: 'center', margin: '0 0 8px' }}>{teamName}</h2>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '18px', margin: '0 0 8px' }}>
          La chasse commence bientôt…
        </p>
        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
          Attendez le signal de l'organisateur.
        </p>
        <button style={btn('#6b7280')} onClick={onLogout}>Déconnexion</button>
      </div>
    </div>
  );

  if (view === 'enroute') return (
    <div style={screenStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: '50px', textAlign: 'center', marginBottom: '12px' }}>🧭</div>
        <Progress />
        <h3 style={{ color: '#1e40af', textAlign: 'center', margin: '0 0 16px' }}>En route !</h3>
        {state && state.currentClue && (
          <div style={{ background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#92400e', marginBottom: '6px', textTransform: 'uppercase' }}>🗺️ Votre indice</div>
            <p style={{ margin: 0, fontSize: '16px', color: '#78350f', lineHeight: 1.5 }}>{state.currentClue}</p>
          </div>
        )}
        {gpsError ? (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '14px', marginBottom: '12px' }}>
            <p style={{ color: '#dc2626', margin: '0 0 8px', fontSize: '14px' }}>📍 {gpsError}</p>
            <button style={btn('#dc2626', '0')} onClick={() => setGpsError(null)}>Réessayer le GPS</button>
          </div>
        ) : (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>📍</div>
            <p style={{ color: '#166534', margin: 0, fontSize: '14px', fontWeight: 600 }}>GPS actif — déclenchement automatique</p>
            {position && (
              <p style={{ color: '#4b5563', margin: '4px 0 0', fontSize: '12px' }}>
                {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
              </p>
            )}
          </div>
        )}
        <MediaBtn uploading={uploading} uploadStatus={uploadStatus} uploadError={uploadError} uploadedMedia={uploadedMedia} onUpload={handleMediaUpload} />
        <button style={btn('#6b7280', '8px')} onClick={onLogout}>Déconnexion</button>
      </div>
    </div>
  );

  if (view === 'activite') return (
    <div style={{ ...screenStyle, justifyContent: 'flex-start', paddingTop: '24px', paddingBottom: '24px' }}>
      <div style={{ ...cardStyle, maxWidth: '480px' }}>
        <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '4px' }}>🎯</div>
        <h3 style={{ color: '#065f46', textAlign: 'center', margin: '0 0 8px' }}>Vous êtes arrivés !</h3>
        <Progress />

        {/* ── Bandeau d'explication ── */}
        <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#166534', lineHeight: 1.6 }}>
          <strong>🎬 Comment ça marche :</strong> réalisez le challenge et <strong>filmez-le</strong>, déposez votre vidéo/photo, puis répondez à la question pour découvrir la prochaine étape !
        </div>

        {/* ── Section 1 : Activité ── */}
        <div style={{ background: '#ecfdf5', border: '2px solid #6ee7b7', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ background: '#059669', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px', flexShrink: 0 }}>1</span>
            <span style={{ fontWeight: 800, fontSize: '15px', color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activité</span>
          </div>
          <p style={{ margin: 0, fontSize: '16px', color: '#1f2937', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {state && state.currentStage && state.currentStage.activityInstructions}
          </p>
        </div>

        {/* ── Section 2 : Photos ── */}
        <div style={{ background: '#fffbeb', border: '2px solid #fcd34d', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ background: '#f59e0b', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px', flexShrink: 0 }}>2</span>
            <span style={{ fontWeight: 800, fontSize: '15px', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Déposer les photos</span>
          </div>
          <MediaBtn uploading={uploading} uploadStatus={uploadStatus} uploadError={uploadError} uploadedMedia={uploadedMedia} onUpload={handleMediaUpload} />
        </div>

        {/* ── Section 3 : Question ── */}
        <div style={{ background: '#eff6ff', border: '2px solid #93c5fd', borderRadius: '14px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ background: '#2563eb', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px', flexShrink: 0 }}>3</span>
            <span style={{ fontWeight: 800, fontSize: '15px', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>La question !</span>
          </div>
          <p style={{ margin: '0 0 12px', fontSize: '16px', color: '#1f2937', lineHeight: 1.6 }}>
            {state && state.currentStage && state.currentStage.question}
          </p>
          {answerResult && !answerResult.correct && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '10px', marginBottom: '10px' }}>
              <p style={{ color: '#dc2626', margin: 0, fontWeight: 600, fontSize: '14px' }}>
                ❌ Mauvaise réponse ({answerResult.attempts} tentative{answerResult.attempts > 1 ? 's' : ''})
              </p>
            </div>
          )}
          <input
            type="text"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAnswer()}
            placeholder="Votre réponse…"
            style={{
              width: '100%', padding: '14px', fontSize: '18px',
              border: '2px solid #bfdbfe', borderRadius: '10px',
              outline: 'none', boxSizing: 'border-box', marginBottom: '8px',
            }}
          />
          <button
            onClick={handleAnswer}
            disabled={submitting}
            style={{
              width: '100%', padding: '14px', fontSize: '17px', fontWeight: 700,
              background: submitting ? '#e5e7eb' : '#2563eb', color: 'white',
              border: 'none', borderRadius: '10px', cursor: submitting ? 'not-allowed' : 'pointer',
              minHeight: '50px',
            }}
          >
            {submitting ? '…' : 'Valider ✓'}
          </button>

          {/* ── Hint / solution avec pénalité ── */}
          {!hintData && !hintConfirm && (
            <button onClick={() => setHintConfirm(true)}
              style={{ width: '100%', marginTop: '10px', padding: '11px', fontSize: '14px', fontWeight: 600, background: 'transparent', color: '#9ca3af', border: '1.5px dashed #d1d5db', borderRadius: '10px', cursor: 'pointer' }}>
              🆘 Je suis bloqué(e) — voir la solution
            </button>
          )}

          {hintConfirm && !hintData && (
            <div style={{ background: '#fef2f2', border: '2px solid #fca5a5', borderRadius: '10px', padding: '14px', marginTop: '10px' }}>
              <p style={{ margin: '0 0 10px', fontSize: '14px', color: '#991b1b', fontWeight: 600, textAlign: 'center' }}>
                ⚠️ Cette action révèle le nom et les coordonnées GPS de l'étape.<br />
                <span style={{ fontWeight: 400 }}>Une pénalité sera enregistrée pour votre équipe.</span>
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleHint}
                  style={{ flex: 1, padding: '10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                  Oui, révéler 🔓
                </button>
                <button onClick={() => setHintConfirm(false)}
                  style={{ flex: 1, padding: '10px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                  Annuler
                </button>
              </div>
            </div>
          )}

          {hintData && (
            <div style={{ background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '10px', padding: '14px', marginTop: '10px' }}>
              <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>🆘 Solution dévoilée — pénalité enregistrée</p>
              <p style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#78350f' }}>📍 {hintData.label}</p>
              {hintData.gpsLat && hintData.gpsLng && (
                <a href={`https://maps.google.com/?q=${hintData.gpsLat},${hintData.gpsLng}`} target="_blank" rel="noreferrer"
                  style={{ display: 'block', background: '#f59e0b', color: 'white', borderRadius: '8px', padding: '10px', textAlign: 'center', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
                  🗺️ Ouvrir dans Google Maps
                </a>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );

  if (view === 'nextclue') return (
    <div style={screenStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: '50px', textAlign: 'center', marginBottom: '12px' }}>✅</div>
        <h2 style={{ textAlign: 'center', color: '#059669', margin: '0 0 4px' }}>Bonne réponse !</h2>
        <Progress />
        {answerResult && answerResult.nextClue && (
          <div style={{ background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '12px', padding: '20px', margin: '16px 0' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#92400e', marginBottom: '10px', textTransform: 'uppercase' }}>🗺️ Votre prochain indice</div>
            <p style={{ margin: 0, fontSize: '18px', color: '#78350f', lineHeight: 1.6, fontStyle: 'italic' }}>
              "{answerResult.nextClue}"
            </p>
          </div>
        )}
        <button style={btn('#059669')} onClick={handleContinue}>C'est parti ! 🚀</button>
      </div>
    </div>
  );

  if (view === 'finished') return (
    <div style={{ ...screenStyle, background: 'linear-gradient(135deg, #065f46 0%, #1e3a5f 100%)' }}>
      <div style={cardStyle}>
        <div style={{ fontSize: '70px', textAlign: 'center', marginBottom: '8px' }}>🏆</div>
        <h1 style={{ textAlign: 'center', color: '#059669', margin: '0 0 8px' }}>Félicitations !</h1>
        <h2 style={{ textAlign: 'center', margin: '0 0 16px' }}>{teamName}</h2>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '18px' }}>
          Vous avez terminé la chasse au trésor ! 🎉
        </p>
        <button style={btn('#6b7280', '24px')} onClick={onLogout}>Déconnexion</button>
      </div>
    </div>
  );

  return null;
}

// ─── Admin : onglet Chasse au Trésor ─────────────────────────────────────────
function AdminHuntTab({ token }) {
  const th = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };
  const [hunts, setHunts] = useState([]);
  const [selectedHunt, setSelectedHunt] = useState(null);
  const [stages, setStages] = useState([]);
  const [teams, setTeams] = useState([]);
  const [scoreboard, setScoreboard] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [section, setSection] = useState('hunts'); // hunts | stages | teams | score
  const [newHuntName, setNewHuntName] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [stageForm, setStageForm] = useState(null); // null | {} | {_id,...}
  const [loading, setLoading] = useState(false);

  const emptyStageForm = {
    label: '', gpsLat: '', gpsLng: '', radiusMeters: 15,
    activityInstructions: '', question: '', answerExpected: '', clueToReach: '', order: 1,
  };

  const loadHunts = async () => {
    const r = await fetch(API_URL + '/hunt', { headers: th });
    if (r.ok) setHunts(await r.json());
  };

  const loadHuntData = async (huntId) => {
    const [rs, rt] = await Promise.all([
      fetch(API_URL + '/hunt/' + huntId + '/stages', { headers: th }),
      fetch(API_URL + '/hunt/' + huntId + '/teams', { headers: th }),
    ]);
    if (rs.ok) setStages(await rs.json());
    if (rt.ok) setTeams(await rt.json());
  };

  const loadScoreboard = async (huntId) => {
    const r = await fetch(API_URL + '/hunt/' + huntId + '/scoreboard', { headers: th });
    if (r.ok) setScoreboard(await r.json());
  };

  const loadGallery = async (huntId) => {
    const r = await fetch(API_URL + '/hunt/' + huntId + '/media', { headers: th });
    if (r.ok) setGallery(await r.json());
  };

  const deleteMedia = async (id) => {
    if (!window.confirm('Supprimer ce média ?')) return;
    await fetch(API_URL + '/hunt/' + selectedHunt._id + '/media/' + id, { method: 'DELETE', headers: th });
    setGallery(g => g.filter(m => m._id !== id));
  };

  useEffect(() => { loadHunts(); }, []);

  useEffect(() => {
    if (selectedHunt) {
      loadHuntData(selectedHunt._id);
      if (section === 'score') loadScoreboard(selectedHunt._id);
      if (section === 'gallery') loadGallery(selectedHunt._id);
    }
  }, [selectedHunt, section]);

  // Polling toutes les 10s sur les sections dynamiques
  useEffect(() => {
    if (!selectedHunt || (section !== 'teams' && section !== 'score' && section !== 'gallery')) return;
    const iv = setInterval(() => {
      loadHuntData(selectedHunt._id);
      if (section === 'score') loadScoreboard(selectedHunt._id);
      if (section === 'gallery') loadGallery(selectedHunt._id);
    }, 10000);
    return () => clearInterval(iv);
  }, [selectedHunt, section]);

  const createHunt = async () => {
    if (!newHuntName.trim()) return;
    setLoading(true);
    const r = await fetch(API_URL + '/hunt', { method: 'POST', headers: th, body: JSON.stringify({ name: newHuntName }) });
    if (r.ok) { await loadHunts(); setNewHuntName(''); }
    setLoading(false);
  };

  const huntAction = async (action) => {
    if (!selectedHunt) return;
    if (action === 'reset' && !window.confirm('Réinitialiser la partie ? Toutes les progressions seront effacées.')) return;
    setLoading(true);
    const r = await fetch(API_URL + '/hunt/' + selectedHunt._id + '/' + action, { method: 'POST', headers: th });
    if (r.ok) {
      const updated = await r.json();
      setSelectedHunt(updated.status ? updated : selectedHunt);
      await loadHunts();
      if (action === 'reset') { setTeams([]); setScoreboard(null); await loadHuntData(selectedHunt._id); }
    }
    setLoading(false);
  };

  const saveStage = async () => {
    if (!stageForm || !stageForm.label) return;
    setLoading(true);
    const body = {
      ...stageForm,
      gpsLat: parseFloat(stageForm.gpsLat) || 0,
      gpsLng: parseFloat(stageForm.gpsLng) || 0,
      radiusMeters: parseInt(stageForm.radiusMeters) || 15,
      order: parseInt(stageForm.order) || 1,
    };
    const url = stageForm._id
      ? API_URL + '/hunt/' + selectedHunt._id + '/stages/' + stageForm._id
      : API_URL + '/hunt/' + selectedHunt._id + '/stages';
    const method = stageForm._id ? 'PUT' : 'POST';
    const r = await fetch(url, { method, headers: th, body: JSON.stringify(body) });
    if (r.ok) { setStageForm(null); await loadHuntData(selectedHunt._id); }
    setLoading(false);
  };

  const deleteStage = async (id) => {
    if (!window.confirm('Supprimer cette étape ?')) return;
    await fetch(API_URL + '/hunt/' + selectedHunt._id + '/stages/' + id, { method: 'DELETE', headers: th });
    await loadHuntData(selectedHunt._id);
  };

  const createTeam = async () => {
    if (!newTeamName.trim()) return;
    if (stages.length === 0) { alert('Ajoutez d\'abord des étapes avant de créer des équipes.'); return; }
    setLoading(true);
    const r = await fetch(API_URL + '/hunt/' + selectedHunt._id + '/teams', {
      method: 'POST', headers: th, body: JSON.stringify({ name: newTeamName }),
    });
    if (r.ok) { setNewTeamName(''); await loadHuntData(selectedHunt._id); }
    setLoading(false);
  };

  const deleteTeam = async (id) => {
    if (!window.confirm('Supprimer cette équipe ?')) return;
    await fetch(API_URL + '/hunt/' + selectedHunt._id + '/teams/' + id, { method: 'DELETE', headers: th });
    await loadHuntData(selectedHunt._id);
  };

  const useMyGPS = () => {
    if (!navigator.geolocation) { alert('GPS non disponible'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setStageForm(f => ({ ...f, gpsLat: pos.coords.latitude, gpsLng: pos.coords.longitude })),
      () => alert('Impossible d\'obtenir la position GPS')
    );
  };

  const statusColor = (s) => s === 'active' ? '#059669' : s === 'finished' ? '#6b7280' : '#d97706';
  const statusLabel = (s) => s === 'active' ? '▶ En cours' : s === 'finished' ? '✓ Terminée' : '○ En attente';

  const card = { background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '20px', marginBottom: '16px' };
  const inputStyle = { border: '1px solid #d1d5db', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', width: '100%', boxSizing: 'border-box' };
  const btnPrimary = { background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 18px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' };

  // ── Sélection de la partie ──
  if (!selectedHunt) return (
    <div>
      <div style={card}>
        <h2 style={{ fontWeight: 800, color: '#4f46e5', margin: '0 0 16px' }}>🎯 Chasse au Trésor GPS</h2>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <input value={newHuntName} onChange={e => setNewHuntName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createHunt()}
            placeholder="Nom de la partie…" style={{ ...inputStyle, flex: 1 }} />
          <button onClick={createHunt} disabled={loading} style={btnPrimary}>Créer</button>
        </div>
        {hunts.length === 0 && <p style={{ color: '#9ca3af', textAlign: 'center' }}>Aucune partie créée</p>}
        {hunts.map(h => (
          <div key={h._id}
            style={{ border: '2px solid #e5e7eb', borderRadius: '10px', padding: '14px 18px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setSelectedHunt(h)}>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>{h.name}</div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                {new Date(h.createdAt).toLocaleDateString('fr-FR')}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ background: statusColor(h.status) + '22', color: statusColor(h.status), borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }} onClick={() => setSelectedHunt(h)}>
                {statusLabel(h.status)}
              </span>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!window.confirm('Supprimer la partie "' + h.name + '" et tout ce qui lui est lié (étapes, équipes, scores) ?\n\nAttention : les photos Cloudinary ne seront PAS supprimées.')) return;
                  setLoading(true);
                  await fetch(API_URL + '/hunt/' + h._id, { method: 'DELETE', headers: th });
                  await loadHunts();
                  setLoading(false);
                }}
                style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}
                title="Supprimer cette partie"
              >🗑</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Vue détail d'une partie ──
  const hunt = hunts.find(h => h._id === selectedHunt._id) || selectedHunt;
  const subTabs = [['stages', '📍 Étapes'], ['teams', '👥 Équipes'], ['score', '🏆 Scores'], ['gallery', '📸 Galerie']];

  return (
    <div>
      {/* Header partie */}
      <div style={{ ...card, borderLeft: '4px solid ' + statusColor(hunt.status) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <button onClick={() => setSelectedHunt(null)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '13px', padding: 0, marginBottom: '4px' }}>
              ← Toutes les parties
            </button>
            <h2 style={{ fontWeight: 800, color: '#1f2937', margin: '0 0 4px', fontSize: '20px' }}>{hunt.name}</h2>
            <span style={{ fontSize: '13px', fontWeight: 700, color: statusColor(hunt.status) }}>{statusLabel(hunt.status)}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {hunt.status === 'idle' && (
              <button onClick={() => huntAction('start')} disabled={loading}
                style={{ ...btnPrimary, background: '#059669' }}>▶ Démarrer</button>
            )}
            {hunt.status === 'active' && (
              <button onClick={() => huntAction('finish')} disabled={loading}
                style={{ ...btnPrimary, background: '#6b7280' }}>■ Clore</button>
            )}
            <button onClick={() => huntAction('reset')} disabled={loading}
              style={{ ...btnPrimary, background: '#dc2626' }}>↺ Reset</button>
          </div>
        </div>
      </div>

      {/* Sous-navigation */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '2px solid #e5e7eb', paddingBottom: '0' }}>
        {subTabs.map(([k, l]) => (
          <button key={k} onClick={() => setSection(k)}
            style={{ padding: '10px 18px', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', borderBottom: section === k ? '3px solid #4f46e5' : '3px solid transparent', color: section === k ? '#4f46e5' : '#6b7280' }}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Étapes ── */}
      {section === 'stages' && (
        <div>
          {stages.map((s, i) => (
            <div key={s._id} style={{ ...card, borderLeft: '4px solid #818cf8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '15px' }}>{s.order}. {s.label}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setStageForm({ ...s })} style={{ ...btnPrimary, background: '#f3f4f6', color: '#374151', padding: '6px 12px', fontSize: '12px' }}>✏️ Éditer</button>
                  <button onClick={() => deleteStage(s._id)} style={{ ...btnPrimary, background: '#fee2e2', color: '#dc2626', padding: '6px 12px', fontSize: '12px' }}>🗑</button>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>📍 {s.gpsLat}, {s.gpsLng} · rayon {s.radiusMeters}m</div>
              {s.question && <div style={{ fontSize: '12px', color: '#374151', marginTop: '4px' }}>❓ {s.question}</div>}
            </div>
          ))}
          {!stageForm && (
            <button onClick={() => setStageForm({ ...emptyStageForm, order: stages.length + 1 })}
              style={{ ...btnPrimary, width: '100%', padding: '12px', fontSize: '15px' }}>
              + Ajouter une étape
            </button>
          )}
          {stageForm && (
            <div style={{ ...card, border: '2px solid #818cf8' }}>
              <h3 style={{ fontWeight: 700, color: '#4f46e5', margin: '0 0 16px' }}>
                {stageForm._id ? 'Modifier l\'étape' : 'Nouvelle étape'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '3px' }}>Ordre</label>
                    <input type="number" value={stageForm.order} onChange={e => setStageForm(f => ({ ...f, order: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '3px' }}>Nom de la station</label>
                    <input value={stageForm.label} onChange={e => setStageForm(f => ({ ...f, label: e.target.value }))} placeholder="ex: Le vieux chêne" style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '3px' }}>Latitude</label>
                    <input type="number" step="any" value={stageForm.gpsLat} onChange={e => setStageForm(f => ({ ...f, gpsLat: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '3px' }}>Longitude</label>
                    <input type="number" step="any" value={stageForm.gpsLng} onChange={e => setStageForm(f => ({ ...f, gpsLng: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '3px' }}>Rayon (m)</label>
                    <input type="number" value={stageForm.radiusMeters} onChange={e => setStageForm(f => ({ ...f, radiusMeters: e.target.value }))} style={inputStyle} />
                  </div>
                </div>
                <button onClick={useMyGPS} style={{ ...btnPrimary, background: '#0ea5e9', width: 'auto', alignSelf: 'flex-start' }}>
                  📍 Utiliser ma position actuelle
                </button>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '3px' }}>Instructions d'activité</label>
                  <textarea value={stageForm.activityInstructions} onChange={e => setStageForm(f => ({ ...f, activityInstructions: e.target.value }))}
                    rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Ce que les équipes doivent faire sur place…" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '3px' }}>Question</label>
                  <input value={stageForm.question} onChange={e => setStageForm(f => ({ ...f, question: e.target.value }))} style={inputStyle} placeholder="Question posée à l'équipe…" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '3px' }}>Réponse attendue</label>
                  <input value={stageForm.answerExpected} onChange={e => setStageForm(f => ({ ...f, answerExpected: e.target.value }))} style={inputStyle} placeholder="Réponse correcte (insensible à la casse et aux accents)" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '3px' }}>🗺️ Indice pour trouver CETTE étape</label>
                  <textarea value={stageForm.clueToReach} onChange={e => setStageForm(f => ({ ...f, clueToReach: e.target.value }))}
                    rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Comment les équipes doivent trouver cette station… (affiché dès le départ pour l'étape 1)" />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={saveStage} disabled={loading} style={btnPrimary}>
                    {stageForm._id ? 'Sauvegarder' : 'Créer l\'étape'}
                  </button>
                  <button onClick={() => setStageForm(null)} style={{ ...btnPrimary, background: '#e5e7eb', color: '#374151' }}>Annuler</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Équipes ── */}
      {section === 'teams' && (
        <div>
          {/* Créer une équipe */}
          <div style={card}>
            <h3 style={{ fontWeight: 700, margin: '0 0 12px', color: '#1f2937' }}>Créer une équipe</h3>
            {stages.length === 0 && (
              <p style={{ color: '#f59e0b', fontSize: '13px', marginBottom: '10px' }}>
                ⚠️ Ajoutez d'abord des étapes (onglet Étapes) avant de créer des équipes.
              </p>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input value={newTeamName} onChange={e => setNewTeamName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createTeam()}
                placeholder="Nom de l'équipe…" style={{ ...inputStyle, flex: 1 }} />
              <button onClick={createTeam} disabled={loading || stages.length === 0} style={btnPrimary}>Créer</button>
            </div>
          </div>

          {/* Vue Live — position actuelle de chaque équipe */}
          {teams.length > 0 && (
            <div style={{ ...card, borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontWeight: 700, margin: 0, color: '#6d28d9' }}>🔴 Suivi en temps réel</h3>
                <button onClick={() => loadHuntData(selectedHunt._id)}
                  style={{ ...btnPrimary, padding: '5px 12px', fontSize: '12px', background: '#f3f4f6', color: '#374151' }}>↻</button>
              </div>
              <div style={{ display: 'grid', gap: '8px' }}>
                {teams.map(t => {
                  const currentStageId = t.stageOrder && t.stageOrder[t.currentStageIndex];
                  const currentStageName = stages.find(s => s._id === currentStageId || String(s._id) === String(currentStageId));
                  return (
                    <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#faf5ff', borderRadius: '8px', padding: '10px 12px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', minWidth: '100px' }}>{t.name}</span>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        {t.status === 'finished'
                          ? <span style={{ color: '#059669', fontWeight: 700 }}>✓ Terminé !</span>
                          : currentStageName
                            ? <>📍 <strong>{currentStageName.label}</strong> <span style={{ color: '#9ca3af' }}>({t.currentStageIndex + 1}/{t.stageOrder.length})</span></>
                            : <span style={{ color: '#9ca3af' }}>En attente…</span>
                        }
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cartes équipes avec ordre + contrôles */}
          {teams.length === 0 && (
            <p style={{ color: '#9ca3af', textAlign: 'center' }}>Aucune équipe créée</p>
          )}
          {teams.map(t => {
            const resolvedOrder = (t.stageOrder || []).map(id =>
              stages.find(s => String(s._id) === String(id))
            );
            // Hint badges: cross-ref with scoreboard data if loaded
            const teamScore = scoreboard && scoreboard.teams.find(st => String(st.teamId) === String(t._id));
            const stageHintUsed = (stageId) => teamScore && teamScore.completions.some(c => String(c.stageId) === String(stageId) && c.hintUsed);
            // Calcul des distances entre étapes consécutives
            const segmentDistances = resolvedOrder.map((stage, idx) => {
              if (idx === 0 || !stage || !resolvedOrder[idx - 1]) return null;
              const prev = resolvedOrder[idx - 1];
              if (!prev.gpsLat || !prev.gpsLng || !stage.gpsLat || !stage.gpsLng) return null;
              return getDistanceMeters(prev.gpsLat, prev.gpsLng, stage.gpsLat, stage.gpsLng);
            });
            const totalDistance = segmentDistances.reduce((sum, d) => sum + (d || 0), 0);
            const fmtDist = (m) => m >= 1000 ? (m / 1000).toFixed(2).replace('.', ',') + ' km' : Math.round(m) + ' m';
            return (
              <div key={t._id} style={{ ...card, borderLeft: '4px solid ' + statusColor(t.status) }}>
                {/* Header équipe */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '6px' }}>{t.name}</div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ background: '#1f2937', color: 'white', borderRadius: '8px', padding: '4px 14px', fontSize: '20px', fontWeight: 800, letterSpacing: '4px' }}>
                        {t.accessCode}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: statusColor(t.status) }}>
                        {t.status === 'finished' ? '✓ Terminé' : `▶ Étape ${t.currentStageIndex + 1}/${t.stageOrder ? t.stageOrder.length : 0}`}
                      </span>
                      {teamScore && teamScore.hintsUsed > 0 && (
                        <span title="Indices utilisés (pénalités)" style={{ fontSize: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '20px', padding: '3px 10px', fontWeight: 700 }}>
                          🆘 ×{teamScore.hintsUsed} indice{teamScore.hintsUsed > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={async () => {
                        if (!window.confirm('Régénérer un ordre aléatoire pour ' + t.name + ' ?')) return;
                        setLoading(true);
                        await fetch(API_URL + '/hunt/' + selectedHunt._id + '/teams/' + t._id + '/shuffle', { method: 'POST', headers: th });
                        await loadHuntData(selectedHunt._id);
                        setLoading(false);
                      }}
                      style={{ ...btnPrimary, background: '#8b5cf6', padding: '7px 12px', fontSize: '13px' }}
                      title="Régénérer l'ordre aléatoire"
                    >🔀</button>
                    <button onClick={() => deleteTeam(t._id)}
                      style={{ ...btnPrimary, background: '#fee2e2', color: '#dc2626', padding: '7px 12px', fontSize: '13px' }}>🗑</button>
                  </div>
                </div>

                {/* Ordre des étapes avec flèches */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Ordre des étapes</span>
                  {totalDistance > 0 && (
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#4f46e5', background: '#ede9fe', borderRadius: '20px', padding: '3px 10px' }}>
                      🗺️ {fmtDist(totalDistance)} au total
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {resolvedOrder.map((stage, idx) => {
                    const isCurrentOrDone = idx < t.currentStageIndex;
                    const isCurrent = idx === t.currentStageIndex && t.status !== 'finished';
                    const segDist = segmentDistances[idx];
                    return (
                      <React.Fragment key={idx}>
                        {/* Connecteur distance entre étapes */}
                        {idx > 0 && segDist !== null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 10px' }}>
                            <div style={{ width: '2px', height: '12px', background: '#e5e7eb', marginLeft: '9px', flexShrink: 0 }} />
                            <span style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>
                              ↕ {fmtDist(segDist)}
                            </span>
                          </div>
                        )}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: isCurrent ? '#fef3c7' : isCurrentOrDone ? '#f0fdf4' : '#f9fafb',
                        borderRadius: '8px', padding: '7px 10px',
                        border: isCurrent ? '1px solid #f59e0b' : '1px solid transparent',
                      }}>
                        <span style={{ fontWeight: 800, fontSize: '13px', color: isCurrent ? '#d97706' : isCurrentOrDone ? '#059669' : '#9ca3af', minWidth: '20px' }}>
                          {isCurrentOrDone ? '✓' : isCurrent ? '▶' : idx + 1}
                        </span>
                        <span style={{ flex: 1, fontSize: '13px', fontWeight: isCurrent ? 700 : 400, color: '#1f2937' }}>
                          {stage ? stage.label : <span style={{ color: '#dc2626' }}>Étape introuvable</span>}
                        </span>
                        {/* Badge indice utilisé */}
                        {stage && stageHintUsed(stage._id) && (
                          <span title="Indice utilisé (pénalité)" style={{ fontSize: '11px', background: '#fee2e2', color: '#dc2626', borderRadius: '10px', padding: '2px 6px', fontWeight: 700, flexShrink: 0 }}>🆘</span>
                        )}
                        {/* Flèches de réordonnancement (seulement si partie pas encore démarrée) */}
                        {hunt.status === 'idle' && (
                          <div style={{ display: 'flex', gap: '2px' }}>
                            <button
                              disabled={idx === 0}
                              onClick={async () => {
                                const newOrder = [...(t.stageOrder || [])];
                                [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
                                setLoading(true);
                                await fetch(API_URL + '/hunt/' + selectedHunt._id + '/teams/' + t._id + '/order', {
                                  method: 'PUT', headers: th, body: JSON.stringify({ stageOrder: newOrder }),
                                });
                                await loadHuntData(selectedHunt._id);
                                setLoading(false);
                              }}
                              style={{ background: idx === 0 ? '#f3f4f6' : '#e0e7ff', color: idx === 0 ? '#d1d5db' : '#4338ca', border: 'none', borderRadius: '4px', width: '24px', height: '24px', cursor: idx === 0 ? 'default' : 'pointer', fontWeight: 700, fontSize: '13px' }}
                            >↑</button>
                            <button
                              disabled={idx === resolvedOrder.length - 1}
                              onClick={async () => {
                                const newOrder = [...(t.stageOrder || [])];
                                [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
                                setLoading(true);
                                await fetch(API_URL + '/hunt/' + selectedHunt._id + '/teams/' + t._id + '/order', {
                                  method: 'PUT', headers: th, body: JSON.stringify({ stageOrder: newOrder }),
                                });
                                await loadHuntData(selectedHunt._id);
                                setLoading(false);
                              }}
                              style={{ background: idx === resolvedOrder.length - 1 ? '#f3f4f6' : '#e0e7ff', color: idx === resolvedOrder.length - 1 ? '#d1d5db' : '#4338ca', border: 'none', borderRadius: '4px', width: '24px', height: '24px', cursor: idx === resolvedOrder.length - 1 ? 'default' : 'pointer', fontWeight: 700, fontSize: '13px' }}
                            >↓</button>
                          </div>
                        )}
                      </div>
                      </React.Fragment>
                    );
                  })}
                </div>
                {hunt.status !== 'idle' && (
                  <p style={{ fontSize: '11px', color: '#9ca3af', margin: '8px 0 0' }}>
                    ℹ️ Réordonnancement disponible uniquement avant le démarrage de la partie.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Scores ── */}
      {section === 'score' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontWeight: 700, margin: 0 }}>Classement</h3>
            <button onClick={() => loadScoreboard(selectedHunt._id)} style={{ ...btnPrimary, padding: '7px 14px', fontSize: '13px' }}>↻ Actualiser</button>
          </div>
          {!scoreboard || scoreboard.teams.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center' }}>Aucune équipe</p>
          ) : (
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>#</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Équipe</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Étapes</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Temps total</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>🆘 Indices</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {scoreboard.teams.map((t, i) => (
                    <tr key={t.teamId} style={{ borderTop: '1px solid #f3f4f6', background: i === 0 && t.status === 'finished' ? '#fefce8' : 'white' }}>
                      <td style={{ padding: '12px', fontWeight: 800, color: i === 0 ? '#d97706' : '#9ca3af', fontSize: '18px' }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700 }}>{t.name}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {t.stagesCompleted} / {scoreboard.stages.length}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 600 }}>
                        {fmtDuration(t.totalTime)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {t.hintsUsed > 0
                          ? <span style={{ background: '#fee2e2', color: '#dc2626', borderRadius: '20px', padding: '3px 10px', fontSize: '13px', fontWeight: 700 }}>🆘 ×{t.hintsUsed}</span>
                          : <span style={{ color: '#d1d5db', fontSize: '12px' }}>—</span>
                        }
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ background: statusColor(t.status) + '22', color: statusColor(t.status), borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: 700 }}>
                          {t.status === 'finished' ? 'Terminé' : 'En jeu'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Galerie ── */}
      {section === 'gallery' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontWeight: 700, margin: 0 }}>📸 Photos & Vidéos</h3>
            <button onClick={() => loadGallery(selectedHunt._id)}
              style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', padding: '7px 14px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
              ↻ Actualiser
            </button>
          </div>
          {gallery.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#9ca3af', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>📷</div>
              <p>Aucun média envoyé pour l'instant</p>
              <p style={{ fontSize: '13px' }}>Les équipes peuvent envoyer des photos/vidéos depuis leur interface de jeu.</p>
            </div>
          ) : (
            <div>
              {/* Grouper : équipes par teamName, famille par uploaderName */}
              {(() => {
                const groups = {};
                gallery.forEach(m => {
                  const key = m.uploadedBy === 'viewer'
                    ? '📸 ' + (m.uploaderName || 'Famille')
                    : '👥 ' + (m.teamName || 'Équipe');
                  if (!groups[key]) groups[key] = [];
                  groups[key].push(m);
                });
                return Object.entries(groups);
              })().map(([groupName, teamMedia]) => {
                return (
                  <div key={groupName} style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontWeight: 700, color: '#4f46e5', marginBottom: '12px', fontSize: '16px' }}>
                      {groupName} — {teamMedia.length} média{teamMedia.length > 1 ? 's' : ''}
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                      {teamMedia.map(m => (
                        <div key={m._id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', position: 'relative' }}>
                          {m.resourceType === 'video' ? (
                            <video
                              src={m.url}
                              controls
                              style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }}
                            />
                          ) : (
                            <a href={m.url} target="_blank" rel="noreferrer">
                              <img
                                src={m.url.replace('/upload/', '/upload/w_400,q_auto/')}
                                alt={m.stageLabel || ''}
                                style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }}
                              />
                            </a>
                          )}
                          <div style={{ padding: '8px 10px' }}>
                            {m.stageLabel && (
                              <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 2px', fontWeight: 600 }}>
                                📍 {m.stageLabel}
                              </p>
                            )}
                            <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                              {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteMedia(m._id)}
                            style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '6px', width: '26px', height: '26px', cursor: 'pointer', fontSize: '13px', lineHeight: 1 }}
                            title="Supprimer"
                          >✕</button>
                          <a
                            href={m.url}
                            download
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'block', textAlign: 'center', padding: '6px', fontSize: '12px', color: '#4f46e5', fontWeight: 600, textDecoration: 'none', borderTop: '1px solid #f3f4f6' }}
                          >
                            ⬇ Télécharger
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// ─── Helpers Quiz ─────────────────────────────────────────────────────────────

const CHOICE_COLORS = { A: '#f97316', B: '#0891b2', C: '#7c3aed', D: '#db2777' };
const CHOICE_ICONS  = { A: '⭐', B: '🌙', C: '⚡', D: '🌸' };
const EMPTY_Q_FORM  = {
  text: '', timerSeconds: 30, correctChoiceId: 'A',
  choices: [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }],
  mediaUrl: '', mediaType: '',
};

function fmtTime(ms) {
  if (ms == null) return '–';
  const s = Math.floor(ms / 1000);
  return s < 60 ? s + 's' : Math.floor(s / 60) + 'm' + String(s % 60).padStart(2, '0') + 's';
}

// ─── AdminQuizTab ─────────────────────────────────────────────────────────────

function AdminQuizTab({ token }) {
  const th = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };
  const [quizzes, setQuizzes]       = useState([]);
  const [selected, setSelected]     = useState(null); // QuizSession object
  const [questions, setQuestions]   = useState([]);
  const [liveData, setLiveData]     = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [section, setSection]       = useState('questions');
  const [newName, setNewName]       = useState('');
  const [qForm, setQForm]           = useState(null);
  const [loading, setLoading]       = useState(false);
  const [presentation, setPresentation] = useState(false);
  const [timeLeft, setTimeLeft]     = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const pauseOffsetRef = React.useRef(0); // ms accumulés en pause
  const pauseStartRef  = React.useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [assignTargets, setAssignTargets] = useState({}); // { [qid]: quizId }

  const loadQuizzes = async () => {
    const r = await fetch(API_URL + '/quiz', { headers: th });
    if (r.ok) setQuizzes(await r.json());
  };
  const loadSuggestions = async () => {
    const r = await fetch(API_URL + '/quiz/admin/suggestions', { headers: th });
    if (r.ok) setSuggestions(await r.json());
  };
  const assignSuggestion = async (qid) => {
    const targetQuizId = assignTargets[qid];
    if (!targetQuizId) return;
    const r = await fetch(API_URL + '/quiz/admin/suggestions/' + qid + '/assign', {
      method: 'POST', headers: th, body: JSON.stringify({ targetQuizId }),
    });
    if (r.ok) { loadSuggestions(); loadQs(selected?._id); }
  };
  const rejectSuggestion = async (qid) => {
    if (!window.confirm('Supprimer cette suggestion ?')) return;
    await fetch(API_URL + '/quiz/admin/suggestions/' + qid, { method: 'DELETE', headers: th });
    loadSuggestions();
  };
  const loadQs = async (id) => {
    const r = await fetch(API_URL + '/quiz/' + id + '/questions', { headers: th });
    if (r.ok) setQuestions(await r.json());
  };
  const loadLive = async (id) => {
    const r = await fetch(API_URL + '/quiz/' + id + '/live', { headers: th });
    if (r.ok) {
      const data = await r.json();
      setLiveData(data);
      // Charger automatiquement le classement dès que le quiz se termine
      if (data.quiz?.status === 'finished') loadLeaderboard(id);
    }
  };
  const loadLeaderboard = async (id) => {
    const r = await fetch(API_URL + '/quiz/' + id + '/leaderboard', { headers: th });
    if (r.ok) setLeaderboard(await r.json());
  };

  useEffect(() => { loadQuizzes(); loadSuggestions(); }, []);
  useEffect(() => {
    if (selected) { loadQs(selected._id); loadLive(selected._id); }
  }, [selected]);
  useEffect(() => {
    if (!selected || section !== 'leaderboard') return;
    loadLeaderboard(selected._id);
  }, [selected, section]);

  // Polling live toutes les 3s
  useEffect(() => {
    if (!selected) return;
    const iv = setInterval(() => {
      loadLive(selected._id);
      // Rafraîchir aussi les questions pour voir les statuts à jour
      loadQs(selected._id);
    }, 3000);
    return () => clearInterval(iv);
  }, [selected]);

  // Reset pause quand une nouvelle question est lancée
  useEffect(() => {
    setTimerPaused(false);
    pauseOffsetRef.current = 0;
    pauseStartRef.current = null;
  }, [liveData?.currentQuestion?._id]);

  // Timer countdown (tient compte de la pause)
  useEffect(() => {
    const q = liveData?.currentQuestion;
    if (!q || q.status !== 'active' || !q.startedAt || !q.timerSeconds) { setTimeLeft(0); return; }
    const update = () => {
      if (timerPaused) return; // gelé
      const offset = pauseOffsetRef.current;
      const elapsed = (Date.now() - new Date(q.startedAt).getTime() - offset) / 1000;
      setTimeLeft(Math.max(0, q.timerSeconds - Math.floor(elapsed)));
    };
    update();
    const iv = setInterval(update, 500);
    return () => clearInterval(iv);
  }, [liveData?.currentQuestion?._id, liveData?.currentQuestion?.status, timerPaused]);

  // Auto-révélation quand le timer atteint 0 (sauf si en pause)
  useEffect(() => {
    if (timeLeft === 0 && !timerPaused) {
      const q = liveData?.currentQuestion;
      if (q && q.status === 'active' && q.timerSeconds > 0) {
        revealQuestion(q._id);
      }
    }
  }, [timeLeft]);

  const togglePause = () => {
    if (!timerPaused) {
      // On met en pause : mémoriser le début de la pause
      pauseStartRef.current = Date.now();
      setTimerPaused(true);
    } else {
      // On reprend : accumuler le temps passé en pause
      if (pauseStartRef.current) {
        pauseOffsetRef.current += Date.now() - pauseStartRef.current;
        pauseStartRef.current = null;
      }
      setTimerPaused(false);
    }
  };

  const quizAction = async (action) => {
    setLoading(true);
    await fetch(API_URL + '/quiz/' + selected._id + '/' + action, { method: 'POST', headers: th });
    await loadQuizzes();
    const updated = quizzes.find(q => q._id === selected._id);
    if (updated) setSelected(updated);
    await loadLive(selected._id);
    setLoading(false);
  };

  const saveQuestion = async () => {
    if (!qForm.text.trim() || qForm.choices.some(c => !c.text.trim())) return;
    setLoading(true);
    if (qForm._id) {
      await fetch(API_URL + '/quiz/' + selected._id + '/questions/' + qForm._id, { method: 'PUT', headers: th, body: JSON.stringify(qForm) });
    } else {
      await fetch(API_URL + '/quiz/' + selected._id + '/questions', { method: 'POST', headers: th, body: JSON.stringify(qForm) });
    }
    await loadQs(selected._id);
    setQForm(null);
    setLoading(false);
  };

  const deleteQuestion = async (qid) => {
    if (!window.confirm('Supprimer cette question ?')) return;
    setLoading(true);
    await fetch(API_URL + '/quiz/' + selected._id + '/questions/' + qid, { method: 'DELETE', headers: th });
    await loadQs(selected._id);
    setLoading(false);
  };

  const approveQ = async (qid) => {
    setLoading(true);
    await fetch(API_URL + '/quiz/' + selected._id + '/questions/' + qid + '/approve', { method: 'PATCH', headers: th });
    await loadQs(selected._id);
    setLoading(false);
  };
  const rejectQ = async (qid) => {
    setLoading(true);
    await fetch(API_URL + '/quiz/' + selected._id + '/questions/' + qid + '/reject', { method: 'PATCH', headers: th });
    await loadQs(selected._id);
    setLoading(false);
  };

  const launchQuestion = async (qid) => {
    setLoading(true);
    await fetch(API_URL + '/quiz/' + selected._id + '/launch/' + qid, { method: 'POST', headers: th });
    await Promise.all([loadLive(selected._id), loadQs(selected._id)]);
    setLoading(false);
  };
  const revealQuestion = async (qid) => {
    setLoading(true);
    await fetch(API_URL + '/quiz/' + selected._id + '/reveal/' + qid, { method: 'POST', headers: th });
    await Promise.all([loadLive(selected._id), loadQs(selected._id)]);
    setLoading(false);
  };

  // ── Styles partagés ──
  const card = { background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '20px', marginBottom: '16px' };
  const btnPrimary = { background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' };
  const inputStyle = { border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', width: '100%', outline: 'none', boxSizing: 'border-box' };

  // ── Liste des quizzes ──
  if (!selected) return (
    <div>
      <div style={card}>
        <h2 style={{ fontWeight: 800, color: '#7c3aed', margin: '0 0 16px' }}>🎮 Quiz</h2>

        {/* ── Suggestions en attente ── */}
        {suggestions.length > 0 && (
          <div style={{ background: '#fffbeb', border: '2px solid #fcd34d', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#92400e', fontWeight: 800, fontSize: '15px' }}>💡 Suggestions en attente ({suggestions.length})</h3>
              <button onClick={loadSuggestions} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} title="Rafraîchir">🔄</button>
            </div>
            {suggestions.map(s => (
              <div key={s._id} style={{ background: 'white', border: '1.5px solid #fde68a', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#1f2937', marginBottom: '4px' }}>{s.text}</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {s.choices.map(c => (
                    <span key={c.id} style={{ background: CHOICE_COLORS[c.id], color: 'white', borderRadius: '5px', padding: '2px 8px', fontSize: '12px', fontWeight: 700, border: s.correctChoiceId === c.id ? '2px solid #1f2937' : '2px solid transparent' }}>
                      {CHOICE_ICONS[c.id]} {c.text}{s.correctChoiceId === c.id ? ' ✓' : ''}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>proposé par <strong>{s.proposedBy}</strong> · {s.timerSeconds}s</div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select value={assignTargets[s._id] || ''} onChange={e => setAssignTargets(t => ({ ...t, [s._id]: e.target.value }))}
                    style={{ flex: 1, minWidth: '140px', border: '1.5px solid #fcd34d', borderRadius: '6px', padding: '6px 8px', fontSize: '13px', background: 'white' }}>
                    <option value="">— Choisir un quiz —</option>
                    {quizzes.map(q => <option key={q._id} value={q._id}>{q.name}</option>)}
                  </select>
                  <button onClick={() => assignSuggestion(s._id)} disabled={!assignTargets[s._id]}
                    style={{ background: assignTargets[s._id] ? '#059669' : '#d1fae5', color: assignTargets[s._id] ? 'white' : '#6b7280', border: 'none', borderRadius: '6px', padding: '6px 12px', fontWeight: 700, fontSize: '13px', cursor: assignTargets[s._id] ? 'pointer' : 'not-allowed' }}>
                    ✅ Assigner
                  </button>
                  <button onClick={() => rejectSuggestion(s._id)}
                    style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '6px 10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && newName.trim() && (async () => { setLoading(true); await fetch(API_URL + '/quiz', { method: 'POST', headers: th, body: JSON.stringify({ name: newName }) }); setNewName(''); await loadQuizzes(); setLoading(false); })()}
            placeholder="Nom du quiz…" style={{ ...inputStyle, flex: 1 }} />
          <button disabled={loading || !newName.trim()} style={btnPrimary} onClick={async () => { setLoading(true); await fetch(API_URL + '/quiz', { method: 'POST', headers: th, body: JSON.stringify({ name: newName }) }); setNewName(''); await loadQuizzes(); setLoading(false); }}>Créer</button>
        </div>
        {quizzes.length === 0 && <p style={{ color: '#9ca3af', textAlign: 'center' }}>Aucun quiz créé</p>}
        {quizzes.map(q => (
          <div key={q._id} style={{ border: '2px solid #e5e7eb', borderRadius: '10px', padding: '14px 18px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setSelected(q)}>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>{q.name}</div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{new Date(q.createdAt).toLocaleDateString('fr-FR')}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: q.status === 'active' ? '#059669' : q.status === 'finished' ? '#6b7280' : '#f59e0b', cursor: 'pointer' }} onClick={() => setSelected(q)}>
                {q.status === 'idle' ? '⏸ En attente' : q.status === 'active' ? '▶ En cours' : '✓ Terminé'}
              </span>
              <button onClick={async (e) => { e.stopPropagation(); if (!window.confirm('Supprimer ce quiz et toutes ses données ?')) return; setLoading(true); await fetch(API_URL + '/quiz/' + q._id, { method: 'DELETE', headers: th }); await loadQuizzes(); setLoading(false); }}
                style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '14px' }}>🗑</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Détail quiz ──
  const quiz = quizzes.find(q => q._id === selected._id) || selected;
  const approvedQs = questions.filter(q => q.approved);
  const pendingQs  = questions.filter(q => !q.approved);
  const currentQ   = liveData?.currentQuestion;

  return (
    <div>
      {/* Header */}
      <div style={{ ...card, borderLeft: '4px solid #7c3aed' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '13px', padding: 0, marginBottom: '4px' }}>← Tous les quiz</button>
            <h2 style={{ fontWeight: 800, margin: '0 0 4px', fontSize: '20px' }}>{quiz.name}</h2>
            <span style={{ fontSize: '13px', fontWeight: 700, color: quiz.status === 'active' ? '#059669' : quiz.status === 'finished' ? '#6b7280' : '#f59e0b' }}>
              {quiz.status === 'idle' ? '⏸ En attente' : quiz.status === 'active' ? '▶ En cours' : '✓ Terminé'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {quiz.status === 'idle' && <button onClick={() => quizAction('start')} disabled={loading} style={{ ...btnPrimary, background: '#059669' }}>▶ Démarrer</button>}
            {quiz.status === 'active' && <button onClick={() => quizAction('finish')} disabled={loading} style={{ ...btnPrimary, background: '#6b7280' }}>■ Terminer</button>}
            <button onClick={() => quizAction('reset')} disabled={loading} style={{ ...btnPrimary, background: '#dc2626' }}>↺ Reset</button>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', overflowX: 'auto' }}>
        {[['questions', '📝 Questions'], ['live', '🔴 Live'], ['leaderboard', '🏆 Scores']].map(([k, l]) => (
          <button key={k} onClick={() => setSection(k)}
            style={{ padding: '10px 18px', fontWeight: 600, fontSize: '14px', border: 'none', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap',
              background: section === k ? '#7c3aed' : '#f3f4f6', color: section === k ? 'white' : '#6b7280' }}>
            {l}{k === 'live' && liveData ? ` (${liveData.participantCount})` : ''}
          </button>
        ))}
      </div>

      {/* ── Section Questions ── */}
      {section === 'questions' && (
        <div>
          {/* Suggestions en attente */}
          {pendingQs.length > 0 && (
            <div style={{ ...card, borderLeft: '4px solid #f59e0b' }}>
              <h3 style={{ fontWeight: 700, color: '#92400e', margin: '0 0 12px' }}>💡 Suggestions à valider ({pendingQs.length})</h3>
              {pendingQs.map(q => (
                <div key={q._id} style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '12px', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, marginBottom: '6px' }}>{q.text}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Par : {q.proposedBy}</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {q.choices.map(c => (
                      <span key={c.id} style={{ background: c.id === q.correctChoiceId ? '#dcfce7' : '#f9fafb', border: '1px solid ' + (c.id === q.correctChoiceId ? '#86efac' : '#e5e7eb'), borderRadius: '6px', padding: '4px 10px', fontSize: '13px', fontWeight: c.id === q.correctChoiceId ? 700 : 400 }}>
                        {c.id}. {c.text} {c.id === q.correctChoiceId ? '✓' : ''}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => approveQ(q._id)} style={{ ...btnPrimary, background: '#059669', padding: '6px 14px', fontSize: '13px' }}>✓ Approuver</button>
                    <button onClick={() => rejectQ(q._id)} style={{ ...btnPrimary, background: '#dc2626', padding: '6px 14px', fontSize: '13px' }}>✗ Rejeter</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Formulaire ajout/édition */}
          {qForm && (
            <div style={{ ...card, borderLeft: '4px solid #7c3aed' }}>
              <h3 style={{ fontWeight: 700, margin: '0 0 14px' }}>{qForm._id ? 'Modifier la question' : 'Nouvelle question'}</h3>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Question</label>
                <textarea value={qForm.text} onChange={e => setQForm(f => ({ ...f, text: e.target.value }))}
                  placeholder="Tapez la question ici…" rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Choix de réponses</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {qForm.choices.map(c => (
                    <div key={c.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ background: CHOICE_COLORS[c.id], color: 'white', borderRadius: '6px', padding: '8px 10px', fontWeight: 800, fontSize: '14px', minWidth: '34px', textAlign: 'center', flexShrink: 0 }}>
                        {CHOICE_ICONS[c.id]}
                      </div>
                      <input value={c.text} onChange={e => setQForm(f => ({ ...f, choices: f.choices.map(ch => ch.id === c.id ? { ...ch, text: e.target.value } : ch) }))}
                        placeholder={`Choix ${c.id}…`} style={{ ...inputStyle, flex: 1 }} />
                      <input type="radio" name="correct" checked={qForm.correctChoiceId === c.id} onChange={() => setQForm(f => ({ ...f, correctChoiceId: c.id }))}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }} title="Bonne réponse" />
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>✓</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '8px 0 0' }}>Sélectionnez ✓ pour marquer la bonne réponse</p>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Timer (secondes) — 0 = sans timer</label>
                <input type="number" min={0} max={120} value={qForm.timerSeconds} onChange={e => setQForm(f => ({ ...f, timerSeconds: parseInt(e.target.value) || 0 }))}
                  style={{ ...inputStyle, width: '100px' }} />
              </div>
              {/* Upload média */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Photo / Vidéo (optionnel)</label>
                {qForm.mediaUrl ? (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {qForm.mediaType === 'video'
                      ? <video src={qForm.mediaUrl} style={{ maxHeight: '80px', borderRadius: '8px' }} controls />
                      : <img src={qForm.mediaUrl} alt="" style={{ maxHeight: '80px', borderRadius: '8px', objectFit: 'cover' }} />}
                    <button onClick={() => setQForm(f => ({ ...f, mediaUrl: '', mediaType: '' }))}
                      style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontWeight: 700 }}>✕ Supprimer</button>
                  </div>
                ) : (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <div style={{ background: '#ede9fe', color: '#7c3aed', borderRadius: '8px', padding: '9px 16px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      📎 Ajouter une image/vidéo
                      <input type="file" accept="image/*,video/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const fd = new FormData();
                          fd.append('file', file);
                          fd.append('upload_preset', CLD_PRESET);
                          setLoading(true);
                          try {
                            const r = await fetch('https://api.cloudinary.com/v1_1/' + CLD_CLOUD + '/auto/upload', { method: 'POST', body: fd });
                            const data = await r.json();
                            setQForm(f => ({ ...f, mediaUrl: data.secure_url, mediaType: data.resource_type }));
                          } catch (err) { alert('Erreur upload : ' + err.message); }
                          setLoading(false);
                        }}
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={saveQuestion} disabled={loading || !qForm.text.trim() || qForm.choices.some(c => !c.text.trim())} style={btnPrimary}>
                  {qForm._id ? 'Enregistrer' : 'Ajouter'}
                </button>
                <button onClick={() => setQForm(null)} style={{ ...btnPrimary, background: '#f3f4f6', color: '#374151' }}>Annuler</button>
              </div>
            </div>
          )}

          {/* Liste questions approuvées */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontWeight: 700, margin: 0 }}>Questions ({approvedQs.length})</h3>
              <button onClick={() => setQForm({ ...EMPTY_Q_FORM })} style={{ ...btnPrimary, padding: '7px 14px', fontSize: '13px' }}>+ Ajouter</button>
            </div>
            {approvedQs.length === 0 && <p style={{ color: '#9ca3af', textAlign: 'center' }}>Aucune question — ajoutez-en ou approuvez des suggestions</p>}
            {approvedQs.map((q, idx) => (
              <div key={q._id} style={{ border: '2px solid ' + (q.status === 'active' ? '#fcd34d' : q.status === 'revealed' || q.status === 'done' ? '#d1fae5' : '#e5e7eb'), borderRadius: '10px', padding: '12px', marginBottom: '8px', background: q.status === 'active' ? '#fffbeb' : 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 800, color: '#6b7280', fontSize: '13px' }}>Q{idx + 1}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px',
                        background: q.status === 'active' ? '#fef3c7' : q.status === 'revealed' || q.status === 'done' ? '#dcfce7' : '#f3f4f6',
                        color: q.status === 'active' ? '#92400e' : q.status === 'revealed' || q.status === 'done' ? '#166534' : '#6b7280' }}>
                        {q.status === 'active' ? '▶ Active' : q.status === 'revealed' ? '👁 Révélée' : q.status === 'done' ? '✓ Passée' : '⏸ En attente'}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>{q.text}</div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {q.choices.map(c => (
                        <span key={c.id} style={{ background: c.id === q.correctChoiceId ? '#dcfce7' : '#f9fafb', border: '1px solid ' + (c.id === q.correctChoiceId ? '#86efac' : '#e5e7eb'), borderRadius: '6px', padding: '3px 8px', fontSize: '12px', fontWeight: c.id === q.correctChoiceId ? 700 : 400 }}>
                          {c.id}. {c.text}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button onClick={() => setQForm({ ...q })} style={{ ...btnPrimary, background: '#e0e7ff', color: '#4338ca', padding: '6px 10px', fontSize: '13px' }}>✎</button>
                    <button onClick={() => deleteQuestion(q._id)} style={{ ...btnPrimary, background: '#fee2e2', color: '#dc2626', padding: '6px 10px', fontSize: '13px' }}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Section Live ── */}
      {section === 'live' && (
        <div>
          {/* Panneau participants + état */}
          <div style={{ ...card, borderLeft: '4px solid #7c3aed' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontWeight: 700, margin: 0, color: '#6d28d9' }}>🔴 En direct</h3>
              <button onClick={() => setPresentation(true)} style={{ ...btnPrimary, background: '#1f2937', padding: '7px 14px', fontSize: '13px' }}>
                📺 Mode présentation
              </button>
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '10px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#059669' }}>{liveData?.participantCount || 0}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>participants</div>
              </div>
              {currentQ && (
                <div style={{ background: '#fef3c7', borderRadius: '8px', padding: '10px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#d97706' }}>{liveData?.answerCount || 0}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>réponses reçues</div>
                </div>
              )}
              {currentQ?.status === 'active' && currentQ.timerSeconds > 0 && (
                <div style={{ background: timeLeft <= 5 ? '#fef2f2' : '#eff6ff', borderRadius: '8px', padding: '10px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: timeLeft <= 5 ? '#dc2626' : '#2563eb' }}>{timeLeft}s</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>restantes</div>
                </div>
              )}
            </div>
            {/* Participants */}
            {liveData?.participants && liveData.participants.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {liveData.participants.map(p => (
                  <span key={p._id} style={{ background: '#ede9fe', color: '#6d28d9', borderRadius: '20px', padding: '4px 12px', fontSize: '13px', fontWeight: 600 }}>{p.name}</span>
                ))}
              </div>
            )}
          </div>

          {/* Contrôle des questions */}
          <div style={card}>
            <h3 style={{ fontWeight: 700, margin: '0 0 12px' }}>Contrôle des questions</h3>
            {approvedQs.length === 0 && <p style={{ color: '#9ca3af', textAlign: 'center' }}>Ajoutez des questions dans l'onglet Questions</p>}
            {approvedQs.map((q, idx) => (
              <div key={q._id} style={{ border: '2px solid ' + (q.status === 'active' ? '#fcd34d' : q.status === 'revealed' ? '#86efac' : q.status === 'done' ? '#d1d5db' : '#e5e7eb'), borderRadius: '10px', padding: '12px 16px', marginBottom: '8px', opacity: q.status === 'done' ? 0.5 : 1, background: q.status === 'active' ? '#fffbeb' : 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', marginRight: '8px' }}>Q{idx + 1}</span>
                    <span style={{ fontSize: '14px', fontWeight: q.status === 'active' ? 700 : 400 }}>{q.text.length > 60 ? q.text.slice(0, 60) + '…' : q.text}</span>
                    {q.timerSeconds > 0 && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#6b7280' }}>⏱ {q.timerSeconds}s</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {q.status === 'pending' && (
                      <button onClick={() => launchQuestion(q._id)} disabled={loading || quiz.status !== 'active'} style={{ ...btnPrimary, background: '#059669', padding: '6px 12px', fontSize: '13px' }}>▶ Lancer</button>
                    )}
                    {q.status === 'active' && (
                      <button onClick={() => revealQuestion(q._id)} disabled={loading} style={{ ...btnPrimary, background: '#7c3aed', padding: '6px 12px', fontSize: '13px' }}>👁 Révéler</button>
                    )}
                    {q.status === 'revealed' && (
                      <>
                        <span style={{ fontSize: '12px', color: '#059669', fontWeight: 700, alignSelf: 'center' }}>Réponse affichée</span>
                        {approvedQs.findIndex(aq => aq.status === 'pending') !== -1 && (
                          <button onClick={() => launchQuestion(approvedQs.find(aq => aq.status === 'pending')._id)} disabled={loading} style={{ ...btnPrimary, background: '#2563eb', padding: '6px 12px', fontSize: '13px' }}>→ Suivante</button>
                        )}
                      </>
                    )}
                    {(q.status === 'done') && <span style={{ fontSize: '12px', color: '#9ca3af' }}>✓</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Section Leaderboard ── */}
      {section === 'leaderboard' && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontWeight: 700, margin: 0 }}>🏆 Classement</h3>
            <button onClick={() => loadLeaderboard(selected._id)} style={{ ...btnPrimary, padding: '7px 14px', fontSize: '13px' }}>↻ Actualiser</button>
          </div>
          {leaderboard.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center' }}>Aucun participant encore</p>
          ) : (
            <div>
              {leaderboard.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: i === 0 ? '#fefce8' : '#f9fafb', borderRadius: '10px', marginBottom: '8px', border: i === 0 ? '2px solid #fcd34d' : '2px solid transparent' }}>
                  <span style={{ fontWeight: 800, fontSize: '20px', minWidth: '32px', textAlign: 'center' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </span>
                  <span style={{ flex: 1, fontWeight: 700, fontSize: '15px' }}>{p.name}</span>
                  <span style={{ fontWeight: 800, fontSize: '18px', color: '#7c3aed' }}>{p.correct}</span>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>bonne{p.correct > 1 ? 's' : ''}</span>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>⏱ {fmtTime(p.totalTimeMs)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Mode Présentation (overlay fullscreen) ── */}
      {presentation && (() => {
        const q = currentQ;
        const timerPct = q?.timerSeconds > 0 && q?.startedAt
          ? Math.max(0, timeLeft / q.timerSeconds * 100) : 100;
        const nextPending = approvedQs.find(aq => aq.status === 'pending');
        const currentIdx  = q ? approvedQs.findIndex(aq => aq._id === q._id) : -1;
        const ctrlBtn = (label, onClick, bg = '#4f46e5', disabled = false) => (
          <button onClick={onClick} disabled={disabled || loading}
            style={{ background: disabled ? '#374151' : bg, color: 'white', border: 'none', borderRadius: '10px', padding: '12px 22px', fontWeight: 700, fontSize: '16px', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap' }}>
            {label}
          </button>
        );
        return (
          <div style={{ position: 'fixed', inset: 0, background: '#1e1b4b', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>

            {/* ① Timer bar */}
            <div style={{ height: '8px', background: '#3730a3', flexShrink: 0, overflow: 'hidden' }}>
              {q?.status === 'active' && q.timerSeconds > 0 && (
                <div style={{ height: '100%', width: (timerPaused ? timerPct : timerPct) + '%', background: timerPct > 50 ? '#22c55e' : timerPct > 20 ? '#f59e0b' : '#ef4444', transition: timerPaused ? 'none' : 'width 0.5s linear, background 0.5s' }} />
              )}
            </div>

            {/* ② Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', flexShrink: 0 }}>
              <span style={{ color: '#a5b4fc', fontSize: '15px', fontWeight: 700 }}>🎮 {quiz.name}</span>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {liveData && (
                  <span style={{ color: '#a5b4fc', fontSize: '14px' }}>
                    👥 {liveData.participantCount} participants
                    {q?.status === 'active' && <> &nbsp;•&nbsp; 💬 {liveData.answerCount || 0} / {liveData.participantCount} réponses</>}
                  </span>
                )}
                {q?.status === 'active' && q.timerSeconds > 0 && (
                  <span style={{ color: timerPaused ? '#f59e0b' : timeLeft <= 5 ? '#ef4444' : '#fbbf24', fontSize: '26px', fontWeight: 800 }}>
                    {timerPaused ? '⏸ ' : ''}{timeLeft}s
                  </span>
                )}
                <button onClick={() => setPresentation(false)}
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#a5b4fc', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                  ✕ Quitter
                </button>
              </div>
            </div>

            {/* ③ Contenu principal */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '0 24px' }}>
              {quiz.status === 'finished' ? (
                /* ── Classement final ── */
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
                  <div style={{ fontSize: '60px', marginBottom: '8px' }}>🏆</div>
                  <h1 style={{ color: 'white', fontSize: '32px', fontWeight: 800, margin: '0 0 24px', textAlign: 'center' }}>Classement final</h1>
                  {leaderboard.length === 0 ? (
                    <p style={{ color: '#a5b4fc' }}>Chargement…</p>
                  ) : (
                    <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {leaderboard.map((p, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: '16px',
                          background: i === 0 ? 'rgba(251,191,36,0.25)' : i === 1 ? 'rgba(156,163,175,0.2)' : i === 2 ? 'rgba(180,83,9,0.2)' : 'rgba(255,255,255,0.08)',
                          border: i === 0 ? '2px solid #fbbf24' : i === 1 ? '2px solid #9ca3af' : i === 2 ? '2px solid #b45309' : '2px solid transparent',
                          borderRadius: '14px', padding: '14px 20px',
                        }}>
                          <span style={{ fontSize: i < 3 ? '32px' : '22px', minWidth: '40px', textAlign: 'center' }}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                          </span>
                          <span style={{ flex: 1, color: 'white', fontWeight: 800, fontSize: i === 0 ? '24px' : '20px' }}>{p.name}</span>
                          <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: '22px' }}>{p.correct}</span>
                          <span style={{ color: '#a5b4fc', fontSize: '14px', minWidth: '60px', textAlign: 'right' }}>✓ {p.correct > 1 ? 'bonnes' : 'bonne'}</span>
                          <span style={{ color: '#6b7280', fontSize: '14px', minWidth: '60px', textAlign: 'right' }}>⏱ {fmtTime(p.totalTimeMs)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : !q ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '80px', marginBottom: '20px' }}>🎮</div>
                  <h1 style={{ color: 'white', fontSize: '36px', textAlign: 'center', margin: '0 0 12px' }}>{quiz.name}</h1>
                  <p style={{ color: '#a5b4fc', fontSize: '20px' }}>
                    {quiz.status === 'idle' ? 'En attente de démarrage…' : 'Prêt à lancer la prochaine question…'}
                  </p>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  {q.mediaUrl && (
                    <div style={{ textAlign: 'center', marginBottom: '10px', flexShrink: 0 }}>
                      {q.mediaType === 'video'
                        ? <video src={q.mediaUrl} autoPlay loop muted style={{ maxHeight: '22vh', maxWidth: '100%', borderRadius: '12px' }} />
                        : <img src={q.mediaUrl} alt="" style={{ maxHeight: '22vh', maxWidth: '100%', borderRadius: '12px', objectFit: 'contain' }} />}
                    </div>
                  )}
                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '18px 32px', marginBottom: '12px', textAlign: 'center', flexShrink: 0 }}>
                    {currentIdx >= 0 && <div style={{ color: '#a5b4fc', fontSize: '13px', marginBottom: '4px' }}>Question {currentIdx + 1} / {approvedQs.length}</div>}
                    <p style={{ color: 'white', fontSize: 'clamp(18px, 3vw, 28px)', fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{q.text}</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flex: 1, minHeight: 0 }}>
                    {q.choices.map(c => {
                      const isCorrect = q.status === 'revealed' && c.id === q.correctChoiceId;
                      return (
                        <div key={c.id} style={{ background: isCorrect ? '#22c55e' : CHOICE_COLORS[c.id], borderRadius: '14px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '14px', opacity: q.status === 'revealed' && !isCorrect ? 0.3 : 1, transition: 'opacity 0.4s' }}>
                          <span style={{ fontSize: '26px', flexShrink: 0 }}>{CHOICE_ICONS[c.id]}</span>
                          <span style={{ color: 'white', fontSize: 'clamp(15px, 2vw, 22px)', fontWeight: 700 }}>{c.text}</span>
                          {isCorrect && <span style={{ marginLeft: 'auto', fontSize: '28px' }}>✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ④ Barre de contrôle admin (bas de l'écran) */}
            <div style={{ background: 'rgba(0,0,0,0.6)', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '14px 24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', flexShrink: 0, flexWrap: 'wrap' }}>
              {/* Quiz pas encore démarré */}
              {quiz.status === 'idle' && ctrlBtn('▶ Démarrer le quiz', () => quizAction('start'), '#059669')}

              {/* Aucune question active → proposer la prochaine */}
              {quiz.status === 'active' && !q && nextPending &&
                ctrlBtn(`▶ Lancer Q${approvedQs.indexOf(nextPending) + 1}`, () => launchQuestion(nextPending._id), '#059669')
              }
              {quiz.status === 'active' && !q && !nextPending && approvedQs.length > 0 &&
                ctrlBtn('🏁 Terminer le quiz', () => quizAction('finish'), '#dc2626')
              }

              {/* Question active */}
              {q?.status === 'active' && (
                <>
                  {q.timerSeconds > 0 && ctrlBtn(timerPaused ? '▶ Reprendre' : '⏸ Pause', togglePause, timerPaused ? '#f59e0b' : '#374151')}
                  {ctrlBtn('👁 Révéler la réponse', () => revealQuestion(q._id), '#7c3aed')}
                </>
              )}

              {/* Réponse révélée */}
              {q?.status === 'revealed' && (
                nextPending
                  ? ctrlBtn(`→ Question suivante (Q${approvedQs.indexOf(nextPending) + 1})`, () => launchQuestion(nextPending._id), '#059669')
                  : ctrlBtn('🏁 Terminer le quiz', () => quizAction('finish'), '#dc2626')
              )}

              {/* Quiz terminé */}
              {quiz.status === 'finished' && (
                <span style={{ color: '#a5b4fc', fontWeight: 700, fontSize: '16px' }}>🏆 Quiz terminé — voir le classement</span>
              )}
            </div>

          </div>
        );
      })()}
    </div>
  );
}

// ─── QuizParticipantApp ────────────────────────────────────────────────────────

function QuizParticipantApp({ token, participantName, onLogout }) {
  const th = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };
  const [quizState, setQuizState] = useState(null);
  const [view, setView] = useState('loading');
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestForm, setSuggestForm] = useState({ ...EMPTY_Q_FORM });
  const [suggestStatus, setSuggestStatus] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [networkError, setNetworkError] = useState(null);

  const pollState = async () => {
    try {
      setNetworkError(null);
      const r = await fetch(API_URL + '/quiz/participant/state', { headers: th });
      if (!r.ok) return;
      const data = await r.json();
      setQuizState(data);
      const q = data.currentQuestion;
      if (data.quiz.status === 'finished') {
        setView('finished');
      } else if (!q || q.status === 'pending' || q.status === 'done') {
        setView('waiting');
      } else if (q.status === 'active') {
        setView(data.myAnswer ? 'answered' : 'question');
      } else if (q.status === 'revealed') {
        setView('reveal');
      }
    } catch (e) { setNetworkError('Connexion perdue'); }
  };

  useEffect(() => {
    pollState();
    const iv = setInterval(pollState, 2000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (view === 'finished') {
      fetch(API_URL + '/quiz/participant/leaderboard', { headers: th })
        .then(r => r.ok ? r.json() : []).then(setLeaderboard);
    }
  }, [view]);

  // Timer countdown
  useEffect(() => {
    const q = quizState?.currentQuestion;
    if (!q || q.status !== 'active' || !q.timerSeconds || !q.startedAt) { setTimeLeft(0); return; }
    const update = () => {
      const elapsed = (Date.now() - new Date(q.startedAt).getTime()) / 1000;
      setTimeLeft(Math.max(0, q.timerSeconds - Math.floor(elapsed)));
    };
    update();
    const iv = setInterval(update, 500);
    return () => clearInterval(iv);
  }, [quizState?.currentQuestion?._id, quizState?.currentQuestion?.status]);

  const submitAnswer = async (choiceId) => {
    if (submitting || !quizState?.currentQuestion) return;
    setSelectedChoice(choiceId);
    setSubmitting(true);
    try {
      await fetch(API_URL + '/quiz/participant/answer', {
        method: 'POST', headers: th,
        body: JSON.stringify({ questionId: quizState.currentQuestion._id, choiceId }),
      });
    } catch (e) { /* silently handled by polling */ }
    setSubmitting(false);
    await pollState();
  };

  const submitSuggestion = async () => {
    if (!suggestForm.text.trim() || suggestForm.choices.some(c => !c.text.trim())) return;
    setSubmitting(true);
    // Utilise l'endpoint public : les suggestions vont dans le pot commun, l'admin allouera
    const r = await fetch(API_URL + '/quiz/public/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...suggestForm, name: participantName }),
    });
    setSuggestStatus(r.ok ? 'ok' : 'error');
    if (r.ok) { setSuggestForm({ ...EMPTY_Q_FORM }); setTimeout(() => { setShowSuggest(false); setSuggestStatus(null); }, 2000); }
    setSubmitting(false);
  };

  const screenStyle = { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)', color: 'white', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' };
  const cardStyle = { background: 'rgba(255,255,255,0.97)', color: '#1f2937', borderRadius: '20px', padding: '28px 24px', width: '100%', maxWidth: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' };
  const btn = (bg, mt = '12px') => ({ width: '100%', padding: '16px', fontSize: '17px', fontWeight: 700, background: bg, color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', marginTop: mt, minHeight: '54px' });

  if (networkError) return (
    <div style={screenStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>📡</div>
          <p style={{ color: '#dc2626', fontWeight: 700 }}>{networkError}</p>
          <button style={btn('#7c3aed')} onClick={pollState}>Réessayer</button>
          <button style={btn('#6b7280', '8px')} onClick={onLogout}>Déconnexion</button>
        </div>
      </div>
    </div>
  );

  if (view === 'loading') return (
    <div style={screenStyle}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
      <p style={{ fontSize: '18px' }}>Connexion…</p>
    </div>
  );

  // ── Écran attente ──
  if (view === 'waiting') return (
    <div style={screenStyle}>
      <div style={{ ...cardStyle, textAlign: 'center' }}>
        <div style={{ fontSize: '60px', marginBottom: '12px' }}>🎮</div>
        <h2 style={{ margin: '0 0 4px', fontWeight: 800 }}>{participantName}</h2>
        <p style={{ color: '#7c3aed', fontWeight: 700, fontSize: '16px', margin: '0 0 16px' }}>{quizState?.quiz?.name}</p>
        <p style={{ color: '#6b7280', fontSize: '15px' }}>
          {quizState?.quiz?.status === 'idle' ? '⏸ Le quiz commence bientôt…' : '⏳ Prochaine question en approche…'}
        </p>
        {quizState?.quiz?.status === 'idle' && (
          <div style={{ marginTop: '20px' }}>
            {!showSuggest ? (
              <button style={{ ...btn('#f59e0b'), width: 'auto', padding: '12px 24px', fontSize: '15px' }} onClick={() => setShowSuggest(true)}>
                💡 Proposer une question
              </button>
            ) : (
              <div style={{ textAlign: 'left', marginTop: '12px', background: '#fffbeb', border: '2px solid #fcd34d', borderRadius: '14px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 12px', color: '#92400e' }}>💡 Proposer une question</h4>
                <textarea value={suggestForm.text} onChange={e => setSuggestForm(f => ({ ...f, text: e.target.value }))}
                  placeholder="Votre question…" rows={2} style={{ width: '100%', border: '1.5px solid #fcd34d', borderRadius: '8px', padding: '8px', fontSize: '14px', boxSizing: 'border-box', marginBottom: '8px', resize: 'vertical' }} />
                {suggestForm.choices.map(c => (
                  <div key={c.id} style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ background: CHOICE_COLORS[c.id], color: 'white', borderRadius: '6px', padding: '6px 10px', fontWeight: 800, fontSize: '13px', minWidth: '30px', textAlign: 'center', flexShrink: 0 }}>{CHOICE_ICONS[c.id]}</div>
                    <input value={c.text} onChange={e => setSuggestForm(f => ({ ...f, choices: f.choices.map(ch => ch.id === c.id ? { ...ch, text: e.target.value } : ch) }))}
                      placeholder={`Choix ${c.id}…`} style={{ flex: 1, border: '1.5px solid #fcd34d', borderRadius: '6px', padding: '6px 8px', fontSize: '13px', boxSizing: 'border-box' }} />
                    <input type="radio" name="suggestCorrect" checked={suggestForm.correctChoiceId === c.id} onChange={() => setSuggestForm(f => ({ ...f, correctChoiceId: c.id }))} style={{ width: '16px', height: '16px' }} />
                  </div>
                ))}
                <p style={{ fontSize: '11px', color: '#92400e', margin: '4px 0 12px' }}>Sélectionnez ✓ pour la bonne réponse</p>
                {suggestStatus === 'ok' && <p style={{ color: '#059669', fontWeight: 700, textAlign: 'center' }}>✅ Proposition envoyée !</p>}
                {suggestStatus === 'error' && <p style={{ color: '#dc2626', fontWeight: 700, textAlign: 'center' }}>❌ Erreur — réessayez</p>}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button disabled={submitting || !suggestForm.text.trim() || suggestForm.choices.some(c => !c.text.trim())} onClick={submitSuggestion}
                    style={{ flex: 1, padding: '10px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                    Envoyer
                  </button>
                  <button onClick={() => { setShowSuggest(false); setSuggestStatus(null); }}
                    style={{ flex: 1, padding: '10px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        <button style={{ ...btn('#6b7280'), marginTop: '20px', width: 'auto', padding: '10px 20px', fontSize: '14px' }} onClick={onLogout}>Déconnexion</button>
      </div>
    </div>
  );

  // ── Écran question ──
  if (view === 'question') {
    const q = quizState.currentQuestion;
    const timerPct = q.timerSeconds > 0 && q.startedAt ? Math.max(0, timeLeft / q.timerSeconds * 100) : 100;
    return (
      <div style={{ ...screenStyle, justifyContent: 'flex-start', paddingTop: '16px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          {/* Timer bar */}
          {q.timerSeconds > 0 && (
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', marginBottom: '12px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: timerPct + '%', background: timerPct > 50 ? '#22c55e' : timerPct > 20 ? '#f59e0b' : '#ef4444', transition: 'width 0.5s linear, background 0.5s' }} />
            </div>
          )}
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>👤 {participantName}</span>
            {q.timerSeconds > 0 && <span style={{ fontWeight: 800, fontSize: '22px', color: timeLeft <= 5 ? '#ef4444' : 'white' }}>{timeLeft}s</span>}
          </div>
          {/* Média si présent */}
          {q.mediaUrl && (
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              {q.mediaType === 'video'
                ? <video src={q.mediaUrl} autoPlay loop muted controls style={{ maxHeight: '25vh', maxWidth: '100%', borderRadius: '12px', objectFit: 'contain' }} />
                : <img src={q.mediaUrl} alt="" style={{ maxHeight: '25vh', maxWidth: '100%', borderRadius: '12px', objectFit: 'contain' }} />}
            </div>
          )}
          {/* Question */}
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px 20px', marginBottom: '16px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, lineHeight: 1.4 }}>{q.text}</p>
          </div>
          {/* Choix */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {q.choices.map(c => (
              <button key={c.id} onClick={() => (timeLeft > 0 || !q.timerSeconds) && submitAnswer(c.id)}
                disabled={submitting || (q.timerSeconds > 0 && timeLeft === 0)}
                style={{ background: selectedChoice === c.id ? 'white' : CHOICE_COLORS[c.id], color: selectedChoice === c.id ? CHOICE_COLORS[c.id] : 'white', border: selectedChoice === c.id ? '3px solid white' : '3px solid transparent', borderRadius: '14px', padding: '18px 12px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', minHeight: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: (q.timerSeconds > 0 && timeLeft === 0) ? 0.5 : 1 }}>
                <span style={{ fontSize: '22px' }}>{CHOICE_ICONS[c.id]}</span>
                <span>{c.text}</span>
              </button>
            ))}
          </div>
          {q.timerSeconds > 0 && timeLeft === 0 && (
            <p style={{ textAlign: 'center', marginTop: '16px', color: '#fbbf24', fontWeight: 700 }}>⏰ Temps écoulé !</p>
          )}
        </div>
      </div>
    );
  }

  // ── Écran en attente après réponse ──
  if (view === 'answered') {
    const q = quizState.currentQuestion;
    return (
      <div style={screenStyle}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '12px' }}>⏳</div>
          <h2 style={{ margin: '0 0 8px' }}>Réponse envoyée !</h2>
          <p style={{ color: '#6b7280', margin: '0 0 16px' }}>En attente de la révélation…</p>
          <div style={{ background: CHOICE_COLORS[quizState.myAnswer?.choiceId] + '22', border: '2px solid ' + CHOICE_COLORS[quizState.myAnswer?.choiceId], borderRadius: '12px', padding: '12px 20px', display: 'inline-block', fontSize: '16px', fontWeight: 700, color: CHOICE_COLORS[quizState.myAnswer?.choiceId] }}>
            {CHOICE_ICONS[quizState.myAnswer?.choiceId]} {q?.choices?.find(c => c.id === quizState.myAnswer?.choiceId)?.text}
          </div>
        </div>
      </div>
    );
  }

  // ── Écran révélation ──
  if (view === 'reveal') {
    const q = quizState.currentQuestion;
    const myAns = quizState.myAnswer;
    const correct = myAns?.isCorrect;
    const correctChoice = q?.choices?.find(c => c.id === q.correctChoiceId);
    return (
      <div style={screenStyle}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '8px' }}>{!myAns ? '😶' : correct ? '🎉' : '😬'}</div>
          <h2 style={{ margin: '0 0 4px', color: !myAns ? '#6b7280' : correct ? '#059669' : '#dc2626', fontWeight: 800, fontSize: '22px' }}>
            {!myAns ? 'Pas de réponse' : correct ? 'Bonne réponse !' : 'Raté !'}
          </h2>
          {myAns && <p style={{ color: '#6b7280', margin: '0 0 16px', fontSize: '14px' }}>Temps : {fmtTime(myAns.responseTimeMs ?? quizState.myAnswer?.responseTimeMs)}</p>}
          <div style={{ background: '#dcfce7', border: '2px solid #86efac', borderRadius: '12px', padding: '14px 20px', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Bonne réponse</p>
            <p style={{ margin: 0, fontWeight: 800, fontSize: '18px', color: '#166534' }}>
              {CHOICE_ICONS[q?.correctChoiceId]} {correctChoice?.text}
            </p>
          </div>
          <p style={{ color: '#9ca3af', fontSize: '13px' }}>En attente de la prochaine question…</p>
        </div>
      </div>
    );
  }

  // ── Écran fin ──
  if (view === 'finished') {
    const myRank = leaderboard.findIndex(p => p.name === participantName) + 1;
    return (
      <div style={{ ...screenStyle, justifyContent: 'flex-start', paddingTop: '24px' }}>
        <div style={{ ...cardStyle, maxWidth: '460px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '60px', marginBottom: '8px' }}>🏆</div>
            <h2 style={{ margin: '0 0 4px', fontWeight: 800 }}>Quiz terminé !</h2>
            {myRank > 0 && <p style={{ color: '#7c3aed', fontWeight: 700, fontSize: '18px' }}>
              {myRank === 1 ? '🥇' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : `#${myRank}`} — {participantName}
            </p>}
          </div>
          {leaderboard.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: p.name === participantName ? '#ede9fe' : i === 0 ? '#fefce8' : '#f9fafb', borderRadius: '10px', marginBottom: '6px', border: p.name === participantName ? '2px solid #7c3aed' : '2px solid transparent' }}>
              <span style={{ fontWeight: 800, fontSize: '18px', minWidth: '28px' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
              <span style={{ flex: 1, fontWeight: 700 }}>{p.name}</span>
              <span style={{ fontWeight: 800, color: '#7c3aed' }}>{p.correct} ✓</span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>{fmtTime(p.totalTimeMs)}</span>
            </div>
          ))}
          <button style={{ ...btn('#6b7280'), marginTop: '16px' }} onClick={onLogout}>Déconnexion</button>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function WeekendManager() {
  const [token, setToken] = useState(localStorage.getItem('weekendToken') || null);
  const [role, setRole] = useState(localStorage.getItem('weekendRole') || null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('intro');
  const [content, setContent] = useState({ welcomeTitle: '', welcomeText: '', welcomeImages: [], planning: [], eventDate: '', venueLat: '', venueLng: '', venueLabel: '' });
  const [contentSaving, setContentSaving] = useState(false);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showCsvForm, setShowCsvForm] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // ── Chargement des invités ──
  const loadGuests = async (t) => {
    try {
      const r = await fetch(`${API_URL}/guests`, {
        headers: { Authorization: `Bearer ${t || token}` },
      });
      if (r.ok) setGuests(await r.json());
    } catch (e) {
      console.error('Erreur chargement invités:', e);
    }
  };

  // ── Chargement du contenu (accueil + planning) ──
  const loadContent = async (t) => {
    try {
      const r = await fetch(`${API_URL}/content`, {
        headers: { Authorization: `Bearer ${t || token}` },
      });
      if (r.ok) setContent(await r.json());
    } catch (e) {
      console.error('Erreur chargement contenu:', e);
    }
  };

  // ── Sauvegarde du contenu ──
  const saveContent = async (updates) => {
    setContentSaving(true);
    try {
      const merged = { ...content, ...updates };
      const r = await fetch(`${API_URL}/content`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(merged),
      });
      if (r.ok) {
        setContent(await r.json());
      } else {
        const err = await r.json().catch(() => ({}));
        alert(`Erreur ${r.status} : ${err.error || 'La sauvegarde a échoué'}\n\nSi le problème persiste, déconnectez-vous et reconnectez-vous.`);
      }
    } catch (e) {
      alert('Erreur réseau : ' + e.message);
    }
    setContentSaving(false);
  };

  useEffect(() => {
    if (token) { loadGuests(token); loadContent(token); }
  }, [token]);

  // ── Auth ──
  const handleLogin = async () => {
    if (!password) { setLoginError('Veuillez entrer un mot de passe'); return; }
    setLoading(true);
    setLoginError('');
    try {
      const r = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const d = await r.json();
      if (d.token) {
        setToken(d.token);
        setRole(d.role);
        localStorage.setItem('weekendToken', d.token);
        localStorage.setItem('weekendRole', d.role);
        setPassword('');
        loadGuests(d.token);
      } else {
        setLoginError('Mot de passe incorrect');
      }
    } catch (e) {
      setLoginError('Erreur de connexion : ' + e.message);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setToken(null);
    setRole(null);
    localStorage.removeItem('weekendToken');
    localStorage.removeItem('weekendRole');
    // Nettoyer aussi les tokens de sous-apps
    localStorage.removeItem('weekendTeamToken');
    localStorage.removeItem('weekendTeamName');
    localStorage.removeItem('weekendQuizToken');
    localStorage.removeItem('weekendQuizName');
    setGuests([]);
  };

  // ── Formulaire invité ──
  const resetForm = () => {
    setFormData({ ...emptyForm });
    setEditingId(null);
    setShowForm(false);
  };

  const handleAddGuest = async () => {
    if (!formData.name.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/guests`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(formData),
      });
      if (r.ok) { await loadGuests(); resetForm(); }
    } catch (e) {
      alert('Erreur : ' + e.message);
    }
    setLoading(false);
  };

  const handleSaveGuest = async () => {
    if (!formData.name.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/guests/${editingId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(formData),
      });
      if (r.ok) { await loadGuests(); resetForm(); }
    } catch (e) {
      alert('Erreur : ' + e.message);
    }
    setLoading(false);
  };

  const handleDeleteGuest = async (id) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    setLoading(true);
    try {
      await fetch(`${API_URL}/guests/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setGuests(guests.filter(g => g._id !== id));
    } catch (e) {
      alert('Erreur : ' + e.message);
    }
    setLoading(false);
  };

  const handleEditGuest = (g) => {
    setFormData({ ...g });
    setEditingId(g._id);
    setShowForm(true);
    setActiveTab('guests');
  };

  // ── Import CSV ──
  const handleCsvImport = () => {
    if (!csvText.trim()) { alert('Collez vos données CSV'); return; }
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) { alert('Format CSV invalide'); return; }
      const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
      const headers = lines[0].split(',').map(norm);
      const nameIdx   = headers.findIndex(h => h.includes('nom'));
      const adultsIdx = headers.findIndex(h => h.includes('adulte'));
      const boysIdx   = headers.findIndex(h => h.includes('garcon'));
      const girlsIdx  = headers.findIndex(h => h.includes('fille'));
      const nightSatIdx = headers.findIndex(h => h.includes('sam') && h.includes('dim'));
      const nightSunIdx = headers.findIndex(h => h.includes('dim') && h.includes('lun'));
      const samMidIdx = headers.findIndex(h => h.includes('sam') && h.includes('midi'));
      const samEvnIdx = headers.findIndex(h => h.includes('sam') && h.includes('soir'));
      const sunMidIdx = headers.findIndex(h => h.includes('dim') && h.includes('midi'));
      const sunEvnIdx = headers.findIndex(h => h.includes('dim') && h.includes('soir'));
      const monMidIdx = headers.findIndex(h => h.includes('lun') && h.includes('midi'));
      if (nameIdx === -1) { alert('Colonne "Nom" non trouvée'); return; }
      const isYes = v => v && ['oui', 'yes', '1'].includes(v.trim().toLowerCase());
      const newGuests = lines.slice(1).map(line => {
        const c = line.split(',').map(x => x.trim());
        const name = c[nameIdx];
        if (!name) return null;
        return {
          name, attending: true,
          adults: parseInt(c[adultsIdx]) || 0,
          boys:   parseInt(c[boysIdx])   || 0,
          girls:  parseInt(c[girlsIdx])  || 0,
          nightSatSun: isYes(c[nightSatIdx]),
          nightSunMon: isYes(c[nightSunIdx]),
          mealSatMid:  isYes(c[samMidIdx]),
          mealSatEvn:  isYes(c[samEvnIdx]),
          mealSunMid:  isYes(c[sunMidIdx]),
          mealSunEvn:  isYes(c[sunEvnIdx]),
          mealMonMid:  isYes(c[monMidIdx]),
          roomAdultsSatSun: null, roomChildrenSatSun: {},
          roomAdultsSunMon: null, roomChildrenSunMon: {},
        };
      }).filter(Boolean);
      setLoading(true);
      Promise.all(
        newGuests.map(g =>
          fetch(`${API_URL}/guests`, { method: 'POST', headers: authHeaders, body: JSON.stringify(g) })
        )
      ).then(() => {
        loadGuests();
        setCsvText('');
        setShowCsvForm(false);
        alert(`${newGuests.length} invité(s) importé(s) avec succès !`);
        setLoading(false);
      });
    } catch (e) {
      alert('Erreur CSV : ' + e.message);
      setLoading(false);
    }
  };

  // ── Chambres ──
  const updateGuest = async (id, updates) => {
    const guest = guests.find(g => g._id === id);
    if (!guest) return;
    const updated = { ...guest, ...updates };
    await fetch(`${API_URL}/guests/${id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(updated),
    });
    await loadGuests();
  };

  const handleAssignAdults = (guestId, roomId, period) => {
    const key = period === 'satSun' ? 'roomAdultsSatSun' : 'roomAdultsSunMon';
    const guest = guests.find(g => g._id === guestId);
    const newVal = guest[key] === roomId ? null : roomId;
    updateGuest(guestId, { [key]: newVal });
  };

  const handleAssignChildren = (guestId, roomId, period, gender, count) => {
    const key = period === 'satSun' ? 'roomChildrenSatSun' : 'roomChildrenSunMon';
    const guest = guests.find(g => g._id === guestId);
    const current = guest[key] || {};
    // Conserver uniquement les entrées de l'autre genre, puis ajouter la nouvelle
    const newAssign = {};
    Object.entries(current).forEach(([k, v]) => {
      if (!k.endsWith(`-${gender}`)) newAssign[k] = v;
    });
    if (count > 0) newAssign[`${roomId}-${gender}`] = count;
    updateGuest(guestId, { [key]: newAssign });
  };

  // ── Repas ──
  const getMealStats = (key) => {
    const g = guests.filter(x => x.attending && x[key]);
    return {
      adults:   g.reduce((s, x) => s + x.adults, 0),
      children: g.reduce((s, x) => s + x.boys + x.girls, 0),
      list: g,
    };
  };

  const attendingGuests = guests.filter(g => g.attending);

  // ═══════════════════════════════════════════════════════
  // ÉCRAN DE LOGIN
  // ═══════════════════════════════════════════════════════
  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
        <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
          <HeroCarousel />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)' }} />
        </div>
        <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderRadius: '20px', boxShadow: '0 16px 48px rgba(0,0,0,0.3)', padding: '44px 40px', width: '100%', maxWidth: '380px', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '56px', marginBottom: '10px' }}>🎉</div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1f2937', margin: '0 0 6px' }}>50 ans d'Étienne !</h1>
            <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>Entrez le mot de passe pour accéder au site</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="password" placeholder="Mot de passe" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleLogin()}
              style={{ border: '2px solid #e5e7eb', borderRadius: '10px', padding: '13px 16px', fontSize: '15px', width: '100%', outline: 'none', boxSizing: 'border-box' }} />
            {loginError && <p style={{ color: '#dc2626', fontSize: '13px', margin: 0, textAlign: 'center' }}>{loginError}</p>}
            <button onClick={handleLogin} disabled={loading}
              style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', color: 'white', border: 'none', borderRadius: '10px', padding: '13px', fontWeight: 700, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}>
              {loading ? 'Connexion...' : '🎉 Accéder au site'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // VUE VIEWER (famille + chasse + quiz + suggestions)
  // ═══════════════════════════════════════════════════════
  if (role === 'viewer') {
    return <ViewerApp guests={guests} content={content} onLogout={handleLogout} />;
  }

  // ═══════════════════════════════════════════════════════
  // VUE ADMIN
  // ═══════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Header */}
      <header style={{
        background: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#4f46e5', margin: 0 }}>🏡 Week-end en Famille</h1>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            background: '#dc2626',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '9999px',
            marginTop: '4px',
            display: 'inline-block',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            Admin
          </span>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Déconnexion
        </button>
      </header>

      {/* Nav */}
      <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', gap: '4px', padding: '0 24px', overflowX: 'auto' }}>
          {[
            ['intro',    'ℹ️ Info'],
            ['accueil',  '🏠 Accueil'],
            ['planning', '📅 Planning'],
            ['guests',   `👨‍👩‍👧 Invités (${attendingGuests.length})`],
            ['rooms',    '🛏️ Chambres'],
            ['meals',    '🍽️ Repas'],
            ['hunt',     '🎯 Chasse'],
            ['quiz',     '🎮 Quiz'],
          ].map(([t, l]) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                padding: '14px 20px',
                fontWeight: 600,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                borderBottom: activeTab === t ? '3px solid #4f46e5' : '3px solid transparent',
                color: activeTab === t ? '#4f46e5' : '#6b7280',
                whiteSpace: 'nowrap',
                fontSize: '14px',
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </nav>

      {/* Contenu */}
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>

        {/* ── INTRO ── */}
        {activeTab === 'intro' && (
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#4f46e5', marginBottom: '12px' }}>Tableau de bord 🛠️</h2>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>
              Interface administrateur — gestion complète des invités, chambres et repas.
            </p>
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <p style={{ fontWeight: 700, color: '#065f46', marginBottom: '4px' }}>✅ Backend connecté</p>
              <p style={{ fontSize: '13px', color: '#047857' }}>{API_URL.replace('/api', '')} — MongoDB</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Familles', value: attendingGuests.length, color: '#4f46e5' },
                { label: 'Adultes', value: attendingGuests.reduce((s, g) => s + g.adults, 0), color: '#059669' },
                { label: 'Enfants', value: attendingGuests.reduce((s, g) => s + g.boys + g.girls, 0), color: '#d97706' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: '#f9fafb', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 800, color }}>{value}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ACCUEIL admin ── */}
        {activeTab === 'accueil' && (
          <AdminAccueilTab content={content} onSave={saveContent} saving={contentSaving} />
        )}

        {/* ── PLANNING admin ── */}
        {activeTab === 'planning' && (
          <AdminPlanningTab content={content} onSave={saveContent} saving={contentSaving} />
        )}

        {/* ── INVITÉS ── */}
        {activeTab === 'guests' && (
          <div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <button
                onClick={() => { setShowForm(true); setEditingId(null); setFormData({ ...emptyForm }); }}
                style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}
              >
                + Ajouter
              </button>
              <button
                onClick={() => setShowCsvForm(!showCsvForm)}
                style={{ background: '#059669', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}
              >
                📋 Importer CSV
              </button>
            </div>

            {/* Formulaire CSV */}
            {showCsvForm && (
              <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '20px', borderLeft: '4px solid #059669', marginBottom: '16px' }}>
                <h3 style={{ fontWeight: 700, color: '#059669', marginBottom: '8px' }}>Importer via CSV</h3>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  Format : <code>Nom,Adultes,Garcons,Filles,Nuit Sam-Dim,Nuit Dim-Lun,Sam Midi,Sam Soir,Dim Midi,Dim Soir,Lun Midi</code>
                </p>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                  Valeurs booléennes : <code>oui</code> ou laisser vide
                </p>
                <textarea
                  value={csvText}
                  onChange={e => setCsvText(e.target.value)}
                  style={{ width: '100%', height: '120px', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px', fontFamily: 'monospace', fontSize: '12px', boxSizing: 'border-box' }}
                  placeholder={"Nom,Adultes,Garcons,Filles,Nuit Sam-Dim,Nuit Dim-Lun,Sam Midi,Sam Soir,Dim Midi,Dim Soir,Lun Midi\nFamille Dupont,2,1,1,oui,oui,oui,oui,oui,oui,oui"}
                />
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button onClick={handleCsvImport} disabled={loading} style={{ background: '#059669', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 18px', fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
                    Importer
                  </button>
                  <button onClick={() => { setShowCsvForm(false); setCsvText(''); }} style={{ background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}>
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {/* Formulaire ajout/édition */}
            {showForm && (
              <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '20px', borderLeft: '4px solid #4f46e5', marginBottom: '16px' }}>
                <h3 style={{ fontWeight: 700, color: '#4f46e5', marginBottom: '16px' }}>
                  {editingId ? '✏️ Modifier' : '➕ Ajouter un invité'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="Nom / Famille"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 14px', fontSize: '14px' }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    {[
                      { label: 'Adultes', key: 'adults' },
                      { label: 'Garçons', key: 'boys' },
                      { label: 'Filles', key: 'girls' },
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>{label}</label>
                        <input
                          type="number"
                          min="0"
                          value={formData[key]}
                          onChange={e => setFormData({ ...formData, [key]: parseInt(e.target.value) || 0 })}
                          style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px' }}>
                    <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>🌙 Nuits</p>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={formData.nightSatSun} onChange={e => setFormData({ ...formData, nightSatSun: e.target.checked })} />
                        Sam → Dim
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={formData.nightSunMon} onChange={e => setFormData({ ...formData, nightSunMon: e.target.checked })} />
                        Dim → Lun
                      </label>
                    </div>
                  </div>
                  <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px' }}>
                    <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>🍽️ Repas</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {mealsList.map(m => (
                        <label key={m.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={formData[m.key]} onChange={e => setFormData({ ...formData, [m.key]: e.target.checked })} />
                          {m.name}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={editingId ? handleSaveGuest : handleAddGuest}
                      disabled={loading}
                      style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
                    >
                      {editingId ? 'Sauvegarder' : 'Valider'}
                    </button>
                    <button onClick={resetForm} style={{ background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}>
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Liste des invités */}
            {attendingGuests.length === 0 && !showForm && !showCsvForm && (
              <div style={{ background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                <p style={{ fontSize: '32px', marginBottom: '8px' }}>👨‍👩‍👧</p>
                <p>Aucun invité pour l'instant</p>
              </div>
            )}
            {attendingGuests.map(g => (
              <div
                key={g._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  background: 'white',
                  borderRadius: '10px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                  marginBottom: '8px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#4f46e5' }}>{g.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    {g.adults}A · {g.boys}♂ · {g.girls}♀
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    {g.nightSatSun && (
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: '#dbeafe', color: '#1d4ed8', margin: '2px' }}>
                        🌙 Sam-Dim
                      </span>
                    )}
                    {g.nightSunMon && (
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: '#d1fae5', color: '#065f46', margin: '2px' }}>
                        🌙 Dim-Lun
                      </span>
                    )}
                    {mealsList.filter(m => g[m.key]).map(m => (
                      <span key={m.key} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: '#ffedd5', color: '#9a3412', margin: '2px' }}>
                        {m.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleEditGuest(g)}
                    disabled={loading}
                    style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteGuest(g._id)}
                    disabled={loading}
                    style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── CHAMBRES ── */}
        {activeTab === 'rooms' && (
          <div>
            <RoomsPanel period="satSun" guests={guests} onAssignAdults={handleAssignAdults} onAssignChildren={handleAssignChildren} />
            <RoomsPanel period="sunMon" guests={guests} onAssignAdults={handleAssignAdults} onAssignChildren={handleAssignChildren} />
          </div>
        )}

        {/* ── REPAS ── */}
        {activeTab === 'meals' && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#4f46e5', marginBottom: '16px' }}>🍽️ Récapitulatif des repas</h2>
            {mealsList.map(meal => {
              const { adults, children, list } = getMealStats(meal.key);
              return (
                <div key={meal.key} style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '20px', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1f2937', marginBottom: '12px' }}>{meal.name}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    {[
                      { label: 'Adultes', value: adults, color: '#4f46e5' },
                      { label: 'Enfants', value: children, color: '#d97706' },
                      { label: 'Total', value: adults + children, color: '#059669' },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ background: '#f9fafb', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: 800, color }}>{value}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                  {list.length > 0 && (
                    <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px' }}>
                      {list.map(g => (
                        <p key={g._id} style={{ fontSize: '13px', color: '#374151', padding: '2px 0' }}>
                          {g.name} · {g.adults}A + {g.boys + g.girls}E
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── CHASSE admin ── */}
        {activeTab === 'hunt' && (
          <AdminHuntTab token={token} />
        )}

        {activeTab === 'quiz' && (
          <AdminQuizTab token={token} />
        )}

      </main>
    </div>
  );
}
