import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
    <div style={{ background: 'white', borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#f9fafb' }}>
          <tr>
            <th style={{ ...thStyle, color: '#4b5563', width: '35%' }}>Chambre</th>
            <th style={{ ...thStyle, color: '#4b5563', width: '8%', textAlign: 'center' }}>Cap.</th>
            <th style={{ ...thStyle, color: '#4338ca', width: '28%' }}>🌙 Sam → Dim</th>
            <th style={{ ...thStyle, color: '#065f46', width: '29%' }}>🌙 Dim → Lun</th>
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
                <td style={{ ...tdStyle, textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
                  {room.capacity === 999 ? '∞' : room.capacity}
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
  );
}

// ─── Admin : onglet Accueil ───────────────────────────────────────────────────
function AdminAccueilTab({ content, onSave, saving }) {
  const [form, setForm] = useState({
    welcomeTitle: content.welcomeTitle || '',
    welcomeText:  content.welcomeText  || '',
    welcomeImages: content.welcomeImages || [],
  });

  useEffect(() => {
    setForm({
      welcomeTitle: content.welcomeTitle || '',
      welcomeText:  content.welcomeText  || '',
      welcomeImages: content.welcomeImages || [],
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontWeight: 700, color: '#4f46e5', marginBottom: '20px', fontSize: '16px' }}>🏠 Contenu de la page d'accueil</h3>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Titre</label>
          <input type="text" value={form.welcomeTitle}
            onChange={e => setForm(f => ({ ...f, welcomeTitle: e.target.value }))}
            placeholder="Ex : Bienvenue au week-end des 50 ans !"
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            Texte <span style={{ fontWeight: 400, color: '#9ca3af' }}>(les sauts de ligne sont conservés)</span>
          </label>
          <textarea value={form.welcomeText}
            onChange={e => setForm(f => ({ ...f, welcomeText: e.target.value }))}
            rows={8} placeholder={"Chers tous,\n\nNous sommes ravis de vous accueillir..."}
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '10px' }}>Photos à afficher sur la page</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {allPhotos.map(photo => {
              const selected = form.welcomeImages.includes(photo);
              return (
                <div key={photo} onClick={() => togglePhoto(photo)} style={{
                  cursor: 'pointer', borderRadius: '10px', overflow: 'hidden',
                  border: `3px solid ${selected ? '#4f46e5' : 'transparent'}`,
                  boxShadow: selected ? '0 0 0 1px #4f46e5' : '0 1px 4px rgba(0,0,0,0.12)',
                  opacity: selected ? 1 : 0.5, transition: 'all 0.2s',
                }}>
                  <img src={`/photos/${photo}`} alt="" style={{ width: '100%', height: '64px', objectFit: 'cover', display: 'block' }} />
                  {selected && <div style={{ background: '#4f46e5', color: 'white', fontSize: '10px', fontWeight: 700, textAlign: 'center', padding: '2px' }}>✓</div>}
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>Cliquez pour sélectionner / désélectionner</p>
        </div>
        <button onClick={() => onSave({ welcomeTitle: form.welcomeTitle, welcomeText: form.welcomeText, welcomeImages: form.welcomeImages })}
          disabled={saving}
          style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', padding: '11px 28px', fontWeight: 700, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
        </button>
      </div>
    </div>
  );
}

// ─── Admin : onglet Planning ──────────────────────────────────────────────────
function AdminPlanningTab({ content, onSave, saving }) {
  const [planning, setPlanning] = useState(content.planning || []);
  const [newEvent, setNewEvent] = useState({ day: 'sat', time: '12:00', emoji: '🎉', title: '', description: '' });

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

  const inputStyle = { border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box', width: '100%' };

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
                <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', minWidth: '38px' }}>{ev.time}</span>
                    <span style={{ fontSize: '20px' }}>{ev.emoji}</span>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937' }}>{ev.title}</span>
                      {ev.description && <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>{ev.description}</span>}
                    </div>
                  </div>
                  <button onClick={() => setPlanning(p => p.filter(e => e.id !== ev.id))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '16px', padding: '4px 6px' }}>
                    🗑️
                  </button>
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
  const { welcomeTitle, welcomeText, welcomeImages } = content;
  const hasContent = welcomeTitle || welcomeText || (welcomeImages && welcomeImages.length > 0);

  if (!hasContent) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏠</div>
      <p>La page d'accueil n'a pas encore été renseignée.</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {welcomeTitle && <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#1f2937', margin: 0 }}>{welcomeTitle}</h2>}
      {welcomeText && (
        <div style={{ background: 'white', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', whiteSpace: 'pre-wrap', fontSize: '15px', lineHeight: 1.8, color: '#374151' }}>
          {welcomeText}
        </div>
      )}
      {welcomeImages && welcomeImages.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: welcomeImages.length === 1 ? '1fr' : '1fr 1fr', gap: '12px' }}>
          {welcomeImages.map(photo => (
            <img key={photo} src={`/photos/${photo}`} alt=""
              style={{ width: '100%', borderRadius: '14px', objectFit: 'cover', height: welcomeImages.length === 1 ? '320px' : '200px', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', display: 'block' }}
            />
          ))}
        </div>
      )}
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

  const viewerTabs = [
    ['accueil',  '🏠 Accueil'],
    ['planning', '📅 Planning'],
    ['guests',   `👨‍👩‍👧 Invités (${attendingGuests.length})`],
    ['rooms',    '🛏️ Chambres'],
    ['meals',    '🍽️ Repas'],
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

      </main>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function WeekendManager() {
  const [token, setToken] = useState(localStorage.getItem('weekendToken') || null);
  const [role, setRole] = useState(localStorage.getItem('weekendRole') || null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('intro');
  const [content, setContent] = useState({ welcomeTitle: '', welcomeText: '', welcomeImages: [], planning: [] });
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
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
      }}>
      {/* Fond carrousel */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <HeroCarousel />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)' }} />
      </div>
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderRadius: '20px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
          padding: '44px 40px',
          width: '100%',
          maxWidth: '380px',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎉</div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1f2937', margin: '0 0 6px' }}>
              50 ans d'Étienne !
            </h1>
            <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
              Entrez le mot de passe pour accéder au site
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleLogin()}
              style={{
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                padding: '13px 16px',
                fontSize: '15px',
                width: '100%',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
            />
            {loginError && (
              <p style={{ color: '#dc2626', fontSize: '13px', margin: 0, textAlign: 'center' }}>
                {loginError}
              </p>
            )}
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #db2777)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '13px',
                fontWeight: 700,
                fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
              }}
            >
              {loading ? 'Connexion...' : 'Accéder au site'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // VUE VIEWER
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

      </main>
    </div>
  );
}
