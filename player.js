// player.js
const fileInput = document.getElementById('fileInput');
const subsInput = document.getElementById('subsInput');
const publicUrl = document.getElementById('publicUrl');
const applyBtn = document.getElementById('applyBtn');
const player = document.getElementById('player');
const subsList = document.getElementById('subsList');
const subtitleSelect = document.getElementById('subtitleSelect');
const embedCode = document.getElementById('embedCode');
const downloadBtn = document.getElementById('downloadBtn');
const downloadOption = document.getElementById('downloadOption');

let subsFiles = []; // {name, url, label}
let localBlob = null;

// handle local file preview
fileInput.addEventListener('change', e=>{
  const f = e.target.files[0];
  if(!f) return;
  if(localBlob) URL.revokeObjectURL(localBlob);
  localBlob = URL.createObjectURL(f);
  loadPlayerSource(localBlob);
  // set download link to local file
  downloadBtn.href = localBlob;
  downloadBtn.download = f.name;
});

// handle subtitle files selected (local)
subsInput.addEventListener('change', e=>{
  subsFiles = [];
  subsList.innerHTML = '';
  const files = Array.from(e.target.files || []);
  files.forEach((f, i)=>{
    const url = URL.createObjectURL(f);
    const label = f.name.replace(/\.[^/.]+$/, "");
    subsFiles.push({label, url, name: f.name});
    const div = document.createElement('div');
    div.className = 'sub-row';
    div.innerHTML = `<span>${f.name}</span> <button data-i="${i}">Remove</button>`;
    subsList.appendChild(div);
    div.querySelector('button').onclick = ()=>{
      // remove
      subsFiles.splice(i,1);
      div.remove();
      updateSubtitleOptions();
    };
  });
  updateSubtitleOptions();
});

// update subtitle select list in player
function updateSubtitleOptions(){
  subtitleSelect.innerHTML = '<option value="">No subtitles</option>';
  subsFiles.forEach((s, idx)=>{
    const opt = document.createElement('option');
    opt.value = s.url;
    opt.textContent = s.label;
    subtitleSelect.appendChild(opt);
  });
  // also add if there are external subtitle links in publicUrl? not here
}

// load player with given source (url)
function loadPlayerSource(srcUrl){
  // remove existing tracks
  Array.from(player.querySelectorAll('track')).forEach(t=>t.remove());
  player.pause();
  player.removeAttribute('src');
  player.src = srcUrl;
  player.load();
}

// when subtitle selected, attach track
subtitleSelect.addEventListener('change', ()=>{
  const val = subtitleSelect.value;
  // remove existing tracks
  Array.from(player.querySelectorAll('track')).forEach(t=>t.remove());
  if(!val) return;
  const track = document.createElement('track');
  track.kind = 'subtitles';
  track.label = subtitleSelect.options[subtitleSelect.selectedIndex].text;
  track.srclang = 'en';
  track.src = val;
  track.default = true;
  player.appendChild(track);
});

// Apply button: compose embed-code using public URL and subtitle links
applyBtn.addEventListener('click', ()=>{
  const url = publicUrl.value.trim();
  if(!url){
    alert('Public video URL প্রয়োজন (যেটা visitor-ও access করতে পারবে). আপনি InfinityFree বা GitHub এ আপলোড করে এখানে দিন।');
    return;
  }

  // compose subtitle params: sub1=label|url & sub2...
  const params = new URLSearchParams();
  params.set('v', url);

  subsFiles.forEach((s, i)=>{
    // for public use, user should upload vtt to same public host and paste the public link in page? but we support attaching public subtitle later
    // here we will add the blob url if user used local subtitles — but blob URLs are not accessible externally, so embed will only work if subs are public too.
    params.set(`sub${i+1}`, s.url);
    params.set(`lab${i+1}`, s.label);
  });

  params.set('dl', downloadOption.value); // on/off

  // generate an iframe embed code pointing to this page with query params
  // To make iframe load this player page, we need the published site origin:
  const base = window.location.origin + window.location.pathname; // e.g. https://user.github.io/repo/
  const iframeSrc = `${base}?${params.toString()}`;
  const code = `<iframe src="${iframeSrc}" width="100%" height="480" frameborder="0" allowfullscreen></iframe>`;
  embedCode.value = code;

  // Also set the player on this page to use public URL (for preview)
  loadPlayerSource(url);
  // If there are provided subtitle links that are public (not blob), attach them
  Array.from(player.querySelectorAll('track')).forEach(t=>t.remove());
  subsFiles.forEach((s)=>{
    const t = document.createElement('track');
    t.kind = 'subtitles';
    t.label = s.label;
    t.srclang = 'en';
    t.src = s.url;
    player.appendChild(t);
  });

  // set download button depending on option
  if(downloadOption.value === 'on'){
    downloadBtn.style.display = 'inline-block';
    downloadBtn.href = url;
    downloadBtn.download = '';
  } else {
    downloadBtn.style.display = 'none';
  }

  alert('Embed code generated. Copy & paste that iframe to your site. Remember: visitor must be able to access the Public URL and subtitle URLs.');
});

// On page load: if URL contains params (?v=...), auto-load in player (used by iframe on visitor site)
(function initFromQuery(){
  const q = new URLSearchParams(location.search);
  const v = q.get('v');
  if(!v) return;
  // load main video
  loadPlayerSource(v);

  // load subtitle params sub1, sub2...
  const tracks = [];
  for(let i=1;i<6;i++){
    const s = q.get('sub'+i);
    const lab = q.get('lab'+i) || `sub${i}`;
    if(s){
      const t = document.createElement('track');
      t.kind = 'subtitles';
      t.label = decodeURIComponent(lab);
      t.src = s;
      t.default = (i===1);
      player.appendChild(t);
    }
  }

  // download option
  const dl = q.get('dl');
  if(dl === 'on'){
    downloadBtn.style.display = 'inline-block';
    downloadBtn.href = v;
    downloadBtn.download = '';
  } else {
    downloadBtn.style.display = 'none';
  }
})();
