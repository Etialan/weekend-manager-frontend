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
function TeamApp({ token, teamName, onLogout }) {
  const [state, setState] = useState(null);
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
    await loadState();
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

  // ── Bouton photo/vidéo réutilisable ──
  const MediaBtn = () => {
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
            onChange={handleMediaUpload}
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
            onChange={handleMediaUpload}
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
        <p style={{ textAlign: 'center', fontSize: '13px', color: '#dc2626', margin: '6px 0 0', fontWeight: 600 }}>
          ❌ Erreur : {uploadError}
        </p>
      )}
    </div>
    );
  };

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
        <MediaBtn />
        <button style={btn('#6b7280', '8px')} onClick={onLogout}>Déconnexion</button>
      </div>
    </div>
  );

  if (view === 'activite') return (
    <div style={{ ...screenStyle, justifyContent: 'flex-start', paddingTop: '24px', paddingBottom: '24px' }}>
      <div style={{ ...cardStyle, maxWidth: '480px' }}>
        <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '4px' }}>🎯</div>
        <h3 style={{ color: '#065f46', textAlign: 'center', margin: '0 0 16px' }}>Vous êtes arrivés !</h3>
        <Progress />

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
          <MediaBtn />
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
          <div key={h._id} onClick={() => setSelectedHunt(h)}
            style={{ border: '2px solid #e5e7eb', borderRadius: '10px', padding: '14px 18px', marginBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>{h.name}</div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                {new Date(h.createdAt).toLocaleDateString('fr-FR')}
              </div>
            </div>
            <span style={{ background: statusColor(h.status) + '22', color: statusColor(h.status), borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: 700 }}>
              {statusLabel(h.status)}
            </span>
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
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Ordre des étapes
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {resolvedOrder.map((stage, idx) => {
                    const isCurrentOrDone = idx < t.currentStageIndex;
                    const isCurrent = idx === t.currentStageIndex && t.status !== 'finished';
                    return (
                      <div key={idx} style={{
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
              {/* Grouper par équipe */}
              {[...new Set(gallery.map(m => m.teamName))].map(tName => {
                const teamMedia = gallery.filter(m => m.teamName === tName);
                return (
                  <div key={tName} style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontWeight: 700, color: '#4f46e5', marginBottom: '12px', fontSize: '16px' }}>
                      👥 {tName} — {teamMedia.length} média{teamMedia.length > 1 ? 's' : ''}
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

// ─── Composant principal ──────────────────────────────────────────────────────
export default function WeekendManager() {
  const [token, setToken] = useState(localStorage.getItem('weekendToken') || null);
  const [role, setRole] = useState(localStorage.getItem('weekendRole') || null);
  const [teamName, setTeamName] = useState(localStorage.getItem('weekendTeamName') || null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginTab, setLoginTab] = useState('family'); // 'family' | 'team'
  const [teamCode, setTeamCode] = useState('');
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

  // ── Login équipe ──
  const handleTeamLogin = async () => {
    if (!teamCode.trim()) { setLoginError('Entrez un code à 4 chiffres'); return; }
    setLoading(true);
    setLoginError('');
    try {
      const r = await fetch(API_URL + '/hunt/team/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: teamCode.trim() }),
      });
      const d = await r.json();
      if (d.token) {
        setToken(d.token);
        setRole('team');
        setTeamName(d.team.name);
        localStorage.setItem('weekendToken', d.token);
        localStorage.setItem('weekendRole', 'team');
        localStorage.setItem('weekendTeamName', d.team.name);
        setTeamCode('');
      } else {
        setLoginError(d.error || 'Code invalide');
      }
    } catch (e) {
      setLoginError('Erreur de connexion : ' + e.message);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setToken(null);
    setRole(null);
    setTeamName(null);
    localStorage.removeItem('weekendToken');
    localStorage.removeItem('weekendRole');
    localStorage.removeItem('weekendTeamName');
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
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎉</div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1f2937', margin: '0 0 4px' }}>
              50 ans d'Étienne !
            </h1>
          </div>
          {/* Sélecteur famille / équipe */}
          <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden', border: '2px solid #e5e7eb', marginBottom: '20px' }}>
            {[['family', '🏠 Famille'], ['team', '🎯 Équipe']].map(([k, l]) => (
              <button key={k} onClick={() => { setLoginTab(k); setLoginError(''); }}
                style={{ flex: 1, padding: '10px', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer',
                  background: loginTab === k ? '#4f46e5' : 'transparent',
                  color: loginTab === k ? 'white' : '#6b7280' }}>
                {l}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loginTab === 'family' ? (
              <>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0, textAlign: 'center' }}>
                  Entrez le mot de passe pour accéder au site
                </p>
                <input
                  type="password"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleLogin()}
                  style={{ border: '2px solid #e5e7eb', borderRadius: '10px', padding: '13px 16px', fontSize: '15px', width: '100%', outline: 'none', boxSizing: 'border-box' }}
                />
                {loginError && <p style={{ color: '#dc2626', fontSize: '13px', margin: 0, textAlign: 'center' }}>{loginError}</p>}
                <button onClick={handleLogin} disabled={loading}
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', color: 'white', border: 'none', borderRadius: '10px', padding: '13px', fontWeight: 700, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}>
                  {loading ? 'Connexion...' : 'Accéder au site'}
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0, textAlign: 'center' }}>
                  Entrez le code à 4 chiffres de votre équipe
                </p>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="0000"
                  value={teamCode}
                  onChange={e => setTeamCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  onKeyPress={e => e.key === 'Enter' && handleTeamLogin()}
                  style={{ border: '2px solid #e5e7eb', borderRadius: '10px', padding: '13px 16px', fontSize: '32px', fontWeight: 800, width: '100%', outline: 'none', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '12px' }}
                />
                {loginError && <p style={{ color: '#dc2626', fontSize: '13px', margin: 0, textAlign: 'center' }}>{loginError}</p>}
                <button onClick={handleTeamLogin} disabled={loading}
                  style={{ background: 'linear-gradient(135deg, #059669, #0ea5e9)', color: 'white', border: 'none', borderRadius: '10px', padding: '13px', fontWeight: 700, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 14px rgba(5,150,105,0.35)' }}>
                  {loading ? 'Connexion...' : '🎯 Rejoindre la chasse'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // VUE ÉQUIPE (chasse au trésor)
  // ═══════════════════════════════════════════════════════
  if (role === 'team') {
    return <TeamApp token={token} teamName={teamName} onLogout={handleLogout} />;
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
            ['hunt',     '🎯 Chasse'],
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

      </main>
    </div>
  );
}
