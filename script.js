// script.js (ES Module)
import { db, storage } from "./firebase-config.js";
import {
  collection, addDoc, onSnapshot, serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  ref, uploadBytesResumable, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

/* ======= Elements ======= */
const container = document.getElementById('notesContainer');
const search = document.getElementById('search');
const year = document.getElementById('year');
const semester = document.getElementById('semester');
const type = document.getElementById('type');
const sortBy = document.getElementById('sortBy');
const resetFilters = document.getElementById('resetFilters');

const darkToggle = document.getElementById('darkToggle');
const countLabel = document.getElementById('countLabel');
const lastUpdated = document.getElementById('lastUpdated');

const uploadBtn = document.getElementById('uploadBtn');
const modal = document.getElementById('uploadModal');
const closeModalBtn = document.getElementById('closeModal');
const cancelUploadBtn = document.getElementById('cancelUpload');
const submitUploadBtn = document.getElementById('submitUpload');

const noteTitle = document.getElementById('noteTitle');
const noteSubject = document.getElementById('noteSubject');
const noteYear = document.getElementById('noteYear');
const noteSemester = document.getElementById('noteSemester');
const noteType = document.getElementById('noteType');
const noteFile = document.getElementById('noteFile');

const progressWrap = document.getElementById('progressWrap');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

const emptyTemplate = document.getElementById('emptyTemplate');

/* ======= State ======= */
let allNotes = [];    // dữ liệu raw từ Firestore
let unsub = null;     // hủy lắng nghe
let uploadingTask = null;

/* ======= Theme toggle ======= */
const initTheme = () => {
  const saved = localStorage.getItem('iunotehub-theme');
  if (saved === 'light') document.body.classList.add('light');
  darkToggle.textContent = document.body.classList.contains('light') ? '☀️' : '🌙';
};
initTheme();

darkToggle.addEventListener('click', () => {
  document.body.classList.toggle('light');
  const isLight = document.body.classList.contains('light');
  localStorage.setItem('iunotehub-theme', isLight ? 'light' : 'dark');
  darkToggle.textContent = isLight ? '☀️' : '🌙';
});

/* ======= Utilities ======= */
const fmtDate = (ts) => {
  try{
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString();
  }catch{ return '—' }
};

const iconFor = (contentType, name='') => {
  const n = (name||'').toLowerCase();
  if (contentType?.includes('pdf') || n.endsWith('.pdf')) return '📄';
  if (contentType?.startsWith('image/') || /\.(png|jpg|jpeg|webp)$/i.test(n)) return '🖼️';
  if (n.endsWith('.docx')) return '📝';
  return '📦';
};

const sortData = (arr, mode) => {
  const a = [...arr];
  switch(mode){
    case 'uploadDate_asc':   return a.sort((x,y)=>(x.uploadDate?.seconds||0)-(y.uploadDate?.seconds||0));
    case 'uploadDate_desc':  return a.sort((x,y)=>(y.uploadDate?.seconds||0)-(x.uploadDate?.seconds||0));
    case 'views_desc':       return a.sort((x,y)=>(y.views||0)-(x.views||0));
    case 'title_asc':        return a.sort((x,y)=> (x.title||'').localeCompare(y.title||''));
    default: return a;
  }
};

const applyFilters = () => {
  const s = (search.value||'').trim().toLowerCase();
  const y = year.value, se = semester.value, t = type.value;
  let data = allNotes.filter(n => {
    const hay = `${n.title||''} ${n.subject||''}`.toLowerCase();
    const okSearch = !s || hay.includes(s);
    const okYear = !y || n.year === y;
    const okSem = !se || n.semester === se;
    const okType = !t || n.type === t;
    return okSearch && okYear && okSem && okType;
  });
  data = sortData(data, sortBy.value);
  renderNotes(data);
};

const setCountAndTime = () => {
  countLabel.textContent = `${allNotes.length} tài liệu`;
  lastUpdated.textContent = `Cập nhật: ${fmtDate(new Date())}`;
};

/* ======= Render ======= */
function renderNotes(data){
  container.innerHTML = '';
  if (data.length === 0){
    container.appendChild(emptyTemplate.content.cloneNode(true));
    return;
  }

  for(const n of data){
    const card = document.createElement('article');
    card.className = 'card';

    card.innerHTML = `
      <div class="thumb">
        <div class="thumb-icon">${iconFor(n.contentType, n.fileName)}</div>
      </div>
      <div class="card-body">
        <div class="note-title" title="${n.title||''}">${n.title||'(No title)'}</div>
        <div class="note-meta">
          <span class="badge">${n.subject||'—'}</span>
          <span class="badge">${n.year||'—'}</span>
          <span class="badge">${n.semester||'—'}</span>
          <span class="badge">${n.type||'—'}</span>
        </div>
        <div class="note-meta">Tải lên: ${fmtDate(n.uploadDate)}</div>
        <div class="actions">
          <a class="link-btn" href="${n.fileURL}" target="_blank" rel="noopener">Xem</a>
          <a class="download-btn" href="${n.fileURL}" download>Tải</a>
        </div>
      </div>
    `;
    container.appendChild(card);
  }
}

/* ======= Firestore realtime ======= */
const notesRef = collection(db, 'notes');

// Lắng nghe realtime theo thời gian upload (mới nhất trước)
const q = query(notesRef, orderBy('uploadDate', 'desc'));
unsub = onSnapshot(q, (snap) => {
  allNotes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  setCountAndTime();
  applyFilters();
}, (err) => {
  console.error('[Firestore] snapshot error:', err);
});

/* ======= Filters & sorting ======= */
for (const el of [search, year, semester, type, sortBy]) {
  el.addEventListener('input', applyFilters);
  el.addEventListener('change', applyFilters);
}
resetFilters.addEventListener('click', () => {
  search.value = ''; year.value=''; semester.value=''; type.value='';
  sortBy.value='uploadDate_desc';
  applyFilters();
});

/* ======= Modal control ======= */
const openModal = () => { modal.setAttribute('aria-hidden','false'); };
const closeModal = () => {
  modal.setAttribute('aria-hidden','true');
  // reset form
  noteTitle.value=''; noteSubject.value='';
  noteYear.value='2025'; noteSemester.value='Spring'; noteType.value='Note';
  noteFile.value='';
  progressWrap.hidden = true; progressBar.style.width='0%'; progressText.textContent='0%';
};

uploadBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', () => {
  if (uploadingTask) { alert('Đang tải lên, vui lòng đợi hoặc bấm Hủy.'); return; }
  closeModal();
});
cancelUploadBtn.addEventListener('click', () => {
  if (uploadingTask) {
    try { uploadingTask.cancel(); } catch {}
  }
  closeModal();
});

/* ======= Upload flow (Storage + Firestore) ======= */
submitUploadBtn.addEventListener('click', async () => {
  const title = noteTitle.value.trim();
  const subject = noteSubject.value.trim();
  const f = noteFile.files?.[0];

  if (!title || !subject || !f){
    alert('Vui lòng nhập Tiêu đề, Môn học và chọn File.');
    return;
  }

  // Sửa tên file an toàn
  const safeName = f.name.replace(/[^\w.\-]+/g,'_');
  const path = `notes/${Date.now()}_${safeName}`;
  const sRef = ref(storage, path);

  // Upload resumable
  uploadingTask = uploadBytesResumable(sRef, f, { contentType: f.type || 'application/octet-stream' });

  progressWrap.hidden = false;

  uploadingTask.on('state_changed', (snap) => {
    const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
    progressBar.style.width = pct + '%';
    progressText.textContent = pct + '%';
  }, (err) => {
    console.error('[Upload] error:', err);
    alert('Upload thất bại: ' + (err?.message || err));
    uploadingTask = null;
    progressWrap.hidden = true;
  }, async () => {
    try{
      const url = await getDownloadURL(uploadingTask.snapshot.ref);
      const docData = {
        title,
        subject,
        year: noteYear.value,
        semester: noteSemester.value,
        type: noteType.value,
        fileURL: url,
        fileName: f.name,
        contentType: f.type || '',
        views: 0,
        uploadDate: serverTimestamp()
      };
      await addDoc(notesRef, docData);
      closeModal();
      alert('Tải lên thành công!');
    }catch(e){
      console.error('[Firestore] addDoc error:', e);
      alert('Lưu metadata thất bại: ' + (e?.message || e));
    }finally{
      uploadingTask = null;
    }
  });
});
