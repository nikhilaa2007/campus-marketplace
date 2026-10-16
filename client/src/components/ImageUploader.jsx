import { useEffect, useRef, useState } from 'react';
import { uploadImage } from '../utils/upload';
import { thumb } from '../utils/images';

const MAX = 5;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// `value` is the list of finished photos: [{ url, publicId }]
// `onChange` must be a React state setter (it is called with a function)
export default function ImageUploader({ value, onChange, onBusyChange }) {
  const [pending, setPending] = useState([]);
  const [note, setNote] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    onBusyChange?.(pending.some((p) => !p.error));
  }, [pending, onBusyChange]);

  const patch = (id, changes) => setPending((p) => p.map((x) => (x.id === id ? { ...x, ...changes } : x)));

  const run = async (item) => {
    patch(item.id, { error: '', progress: 0 });
    try {
      const img = await uploadImage(item.file, (progress) => patch(item.id, { progress }));
      onChange((prev) => [...prev, img]);
      setPending((p) => p.filter((x) => x.id !== item.id));
      URL.revokeObjectURL(item.preview);
    } catch (err) {
      patch(item.id, { error: err.message || 'Upload failed' });
    }
  };

  const addFiles = (fileList) => {
    setNote('');
    const room = MAX - value.length - pending.length;
    const files = Array.from(fileList);
    const valid = files.filter((f) => TYPES.includes(f.type));
    if (valid.length < files.length) setNote('Only JPG, PNG or WebP photos are allowed');
    if (valid.length > room) setNote(`You can add up to ${MAX} photos`);

    valid.slice(0, Math.max(0, room)).forEach((file) => {
      const item = { id: Math.random().toString(36).slice(2), file, preview: URL.createObjectURL(file), progress: 0, error: '' };
      setPending((p) => [...p, item]);
      run(item);
    });
  };

  const removeDone = (publicId) => onChange((prev) => prev.filter((i) => i.publicId !== publicId));
  const makeCover = (publicId) =>
    onChange((prev) => {
      const pick = prev.find((i) => i.publicId === publicId);
      return [pick, ...prev.filter((i) => i.publicId !== publicId)];
    });
  const removePending = (item) => {
    URL.revokeObjectURL(item.preview);
    setPending((p) => p.filter((x) => x.id !== item.id));
  };

  const room = MAX - value.length - pending.length;

  return (
    <div>
      <div className="photo-grid">
        {value.map((img, i) => (
          <div className="photo-tile" key={img.publicId}>
            <img src={thumb(img.url, 240, 240)} alt={`Photo ${i + 1}`} />
            {i === 0 ? (
              <span className="photo-badge">Cover</span>
            ) : (
              <button type="button" className="photo-cover" onClick={() => makeCover(img.publicId)}>Make cover</button>
            )}
            <button type="button" className="photo-remove" aria-label="Remove photo" onClick={() => removeDone(img.publicId)}>×</button>
          </div>
        ))}

        {pending.map((p) => (
          <div className="photo-tile" key={p.id}>
            <img src={p.preview} alt="Uploading" style={{ opacity: p.error ? 0.4 : 0.7 }} />
            {p.error ? (
              <div className="photo-state">
                <span>{p.error}</span>
                <button type="button" onClick={() => run(p)}>Retry</button>
              </div>
            ) : (
              <div className="photo-progress"><div style={{ width: `${p.progress}%` }} /></div>
            )}
            <button type="button" className="photo-remove" aria-label="Cancel photo" onClick={() => removePending(p)}>×</button>
          </div>
        ))}

        {room > 0 && (
          <button
            type="button"
            className={`photo-add${dragOver ? ' drag' : ''}`}
            onClick={() => inputRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
          >
            + Add photos
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden
        onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
      <p className="hint">{value.length}/{MAX} photos. The first photo is the cover. {note && <strong>{note}</strong>}</p>
    </div>
  );
}
