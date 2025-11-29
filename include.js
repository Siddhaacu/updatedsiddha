async function includeHTML(){
  const elements = document.querySelectorAll("[include-html]");
  for (let el of elements) {
    const file = el.getAttribute("include-html");
    try {
      const response = await fetch(file);
      if (response.ok) {
        el.innerHTML = await response.text();
      } else {
        el.innerHTML = "<!-- File not found: " + file + " -->";
      }
    } catch(err) {
      el.innerHTML = "<!-- Error loading " + file + " -->";
    }
  }
}
document.addEventListener("DOMContentLoaded", includeHTML);

/* ---------- Astrologer booking helpers ---------- */

// Open the booking modal prefilled from an astro-card element
function openBookingModalForAstro(cardEl) {
  try {
    const data = JSON.parse(cardEl.getAttribute('data-astro'));
    // show inline detail panel (optional)
    fillAstroDetailPanel(data);
    document.getElementById('astroDetail').classList.remove('hidden');
    // scroll to detail
    document.getElementById('astroDetail').scrollIntoView({behavior:'smooth', block:'center'});
  } catch (err) {
    console.error('astro data parse error', err);
    alert('Unable to open booking. Try again.');
  }
}

// Fill the small detail panel and wire Book button
function fillAstroDetailPanel(data) {
  document.getElementById('detailPhoto').src = data.photo || '';
  document.getElementById('detailPhoto').alt = data.name || 'Astrologer';
  document.getElementById('detailName').textContent = data.name || '';
  document.getElementById('detailQual').textContent = data.qualification || '';
  document.getElementById('detailExp').innerHTML = '<strong>Experience:</strong> ' + (data.experience || '—');
  document.getElementById('detailPrice').textContent = '₹' + (data.price || 0);
  document.getElementById('detailDuration').textContent = (data.durationMin || 30);

  // populate mode select
  const modeSel = document.getElementById('detailMode');
  modeSel.innerHTML = '';
  (data.modes || ['Call','In-person']).forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    modeSel.appendChild(opt);
  });

  // wire proceed button to open full modal with prefilled data
  const proceed = document.getElementById('detailBookBtn');
  proceed.onclick = () => {
    openFullBookingModalWithAstro(data, modeSel.value);
  };
}

// Opens full booking modal and pre-fills the fullBookingForm with astrologer + selected mode
function openFullBookingModalWithAstro(data, preMode) {
  // Ensure the modal exists
  if (!window.backdrop) window.backdrop = document.getElementById('modalBackdrop');
  // set select value for astroSelect (we'll attempt to match existing select options; else create a temporary option)
  const select = document.getElementById('astroSelect');
  let matched = false;
  for (let i=0;i<select.options.length;i++){
    try{
      const optData = JSON.parse(select.options[i].value);
      if (optData.name === data.name) { select.selectedIndex = i; matched = true; break; }
    } catch(e){}
  }
  if(!matched){
    // append temporary option
    const o = document.createElement('option');
    o.value = JSON.stringify({name:data.name, price:data.price});
    o.textContent = `${data.name} — ₹${data.price}`;
    select.appendChild(o);
    select.selectedIndex = select.options.length - 1;
  }

  // show mode UI inside modal by injecting a small 'Mode' control (if not present)
  let modeWrapper = document.getElementById('modalModeWrapper');
  if(!modeWrapper){
    modeWrapper = document.createElement('div');
    modeWrapper.id = 'modalModeWrapper';
    modeWrapper.style.marginTop = '10px';
    modeWrapper.innerHTML = `<label>Mode</label><select id="modalMode" style="padding:8px;border-radius:8px"><option>Call</option><option>In-person</option></select>`;
    const form = document.getElementById('fullBookingForm');
    form.insertBefore(modeWrapper, form.querySelector('#fullDate').parentNode.nextSibling);
  }
  const modalMode = document.getElementById('modalMode');
  modalMode.value = preMode || (data.modes?data.modes[0]:'Call');

  // prefill details like price (for display), and open modal
  // try to show price in modal title or payNote
  const payNote = document.getElementById('payNote');
  payNote.textContent = `Fee: ₹${data.price} per ${data.durationMin} min (${modalMode.value}) — You will receive a confirmation email & panchangam PDF (demo).`;

  // open modal
  openModal();
  // focus name field
  document.getElementById('fullName').focus();

  // store the selected astro object on modal for final booking
  window._selectedAstro = data;
  window._selectedMode = modalMode.value;
  modalMode.onchange = () => {
    window._selectedMode = modalMode.value;
    payNote.textContent = `Fee: ₹${data.price} per ${data.durationMin} min (${modalMode.value}) — You will receive a confirmation email & panchangam PDF (demo).`;
  };
}

// When pay button clicked, include mode & price in the confirmation (replace previous pay handler)
document.getElementById('payNowBtn').addEventListener('click', (ev)=>{
  ev.preventDefault();
  // read astro info either from _selectedAstro (preferred) or from select
  let astro = window._selectedAstro || null;
  if(!astro){
    try { astro = JSON.parse(document.getElementById('astroSelect').value); } catch(e){ astro = {name:'Unknown', price:0, durationMin:30}; }
  }
  const svc = document.getElementById('fullService').value;
  const name = document.getElementById('fullName').value.trim();
  const mode = (document.getElementById('modalMode') && document.getElementById('modalMode').value) || (window._selectedMode || 'Call');
  if(!name) return alert('Please enter your name to continue.');

  // Demo booking payload you would send to backend
  const bookingPayload = {
    astrologer: astro.name,
    price: astro.price,
    durationMin: astro.durationMin || 30,
    mode: mode,
    service: svc,
    customerName: name,
    email: document.getElementById('fullEmail').value.trim(),
    phone: document.getElementById('fullPhone').value.trim(),
    date: document.getElementById('fullDate').value || null,
    notes: document.getElementById('fullNotes').value || ''
  };

  console.log('DEMO booking payload', bookingPayload);
  // Display success UI (demo)
  const success = document.getElementById('bookSuccess');
  success.style.display = 'block';
  success.style.color = 'green';
  success.textContent = `Demo confirmed: ${bookingPayload.astrologer} — ${bookingPayload.service} — ₹${bookingPayload.price} — ${bookingPayload.mode}`;
  document.getElementById('payNote').style.display = 'none';
  setTimeout(()=>closeModal(),2000);

  // PRODUCTION: send `bookingPayload` to your server endpoint (POST /api/bookings)
  // on server: create order, call Razorpay/Stripe, return checkout details to open client checkout.
});
// main.js — site-specific behavior

document.addEventListener('DOMContentLoaded', function(){
  // set panch date
  const pDate = document.getElementById('panchDate');
  if(pDate) pDate.textContent = new Date().toLocaleDateString(undefined, { weekday:'short', year:'numeric', month:'short', day:'numeric' });

  // about read-more toggle
  const aboutBtn = document.getElementById('aboutToggle');
  const aboutExpand = document.getElementById('aboutExpand');
  if(aboutBtn && aboutExpand){
    aboutExpand.setAttribute('aria-hidden','true');
    aboutBtn.setAttribute('aria-expanded','false');

    aboutBtn.addEventListener('click', function(){
      const expanded = aboutBtn.getAttribute('aria-expanded') === 'true';
      if(expanded){
        aboutExpand.classList.remove('open');
        aboutExpand.setAttribute('aria-hidden','true');
        aboutBtn.setAttribute('aria-expanded','false');
        aboutBtn.querySelector('span').textContent = '▾';
        aboutBtn.firstChild.textContent = 'Read more ';
      } else {
        aboutExpand.classList.add('open');
        aboutExpand.setAttribute('aria-hidden','false');
        aboutBtn.setAttribute('aria-expanded','true');
        aboutBtn.querySelector('span').textContent = '▴';
        aboutBtn.firstChild.textContent = 'Show less ';
        if(window.innerWidth < 720){
          setTimeout(()=> aboutExpand.scrollIntoView({behavior:'smooth', block:'center'}), 250);
        }
      }
    });
  }

  // ensure images have fallback alt behavior
  document.querySelectorAll('img').forEach(img=>{
    img.addEventListener('error', ()=> { img.style.opacity = '0.85'; img.style.background = '#f3e8cc'; });
  });
});

// fallback booking function (demo)
window.openBookingModalForAstro = window.openBookingModalForAstro || function(card){
  try{
    const data = JSON.parse(card.getAttribute('data-astro')||'{}');
    alert('Booking demo: ' + (data.name || 'Astrologer'));
  }catch(e){
    alert('Booking demo');
  }
};

// open modal fallback (demo)
function openModal(){
  const booking = document.getElementById('bookingCard');
  if(booking) booking.scrollIntoView({behavior:'smooth', block:'center'});
  else alert('Booking modal not configured — demo only.');
}

/*
  Minimal HTML include loader
  Usage:
      <div include-html="header.html"></div>
      <script src="include.js" defer></script>
*/

(function() {
  window.__INCLUDE_JS_LOADED = true;

  async function loadIncludes() {
    const elements = document.querySelectorAll('[include-html]');
    for (const el of elements) {
      const file = el.getAttribute('include-html');
      if (!file) continue;

      try {
        const response = await fetch(file, { cache: "no-cache" });
        if (!response.ok) {
          el.innerHTML = "<!-- include: file not found -->";
          continue;
        }
        const html = await response.text();
        el.insertAdjacentHTML("afterend", html);
        el.remove();
      } catch (err) {
        console.warn("include.js error loading:", file, err);
      }
    }
  }

  document.addEventListener("DOMContentLoaded", loadIncludes);
})();


