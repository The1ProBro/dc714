
/* Utilities and site logic for DC-714 */
function formatDate(d){
  const opts = { weekday:'short', month:'long', day:'numeric', year:'numeric' };
  return d.toLocaleDateString(undefined, opts);
}
function pad(n){ return n.toString().padStart(2,'0'); }

/**
 * Returns Date objects for second Wednesday of each month for a given year,
 * skipping January and August. Meetings are 6:00–8:00 PM local time.
 */
function dc714Meetings(year){
  const dates = [];
  for(let m=0; m<12; m++){
    if(m === 0 || m === 7) continue; // skip Jan (0) and Aug (7)
    // find first day of month
    const first = new Date(year, m, 1);
    const firstWedOffset = (3 - first.getDay() + 7) % 7; // 3 = Wednesday
    const firstWed = new Date(year, m, 1 + firstWedOffset);
    const secondWed = new Date(year, m, firstWed.getDate() + 7);
    // set meeting start time 18:00
    secondWed.setHours(18,0,0,0);
    dates.push(secondWed);
  }
  return dates;
}

function nextMeeting(){
  const now = new Date();
  const years = [now.getFullYear(), now.getFullYear()+1];
  const all = years.flatMap(dc714Meetings);
  return all.find(d => d.getTime() >= now.getTime()) || null;
}

function populateNextMeeting(){
  const nm = nextMeeting();
  if(!nm){ return; }
  const el = document.getElementById('nextMeeting');
  if(!el) return;
  const end = new Date(nm); end.setHours(20,0,0,0);
  el.innerHTML = `
    <div class="badge">Next Meeting</div>
    <h3 style="margin:.4rem 0 0;">${formatDate(nm)}</h3>
    <div class="small">6:00 PM – 8:00 PM • Room 251 “Storm Center”</div>
    <div class="small">Coastline Garden Grove Center — 12901 S. Euclid St., Garden Grove, CA</div>
    <div style="margin-top:10px;">
      <a class="btn" href="calendar.html">View Full Calendar</a>
      <a class="btn ghost" href="https://discord.com/channels/1241242117552996465/1241242117552996467" target="_blank" rel="noopener">Discord</a>
    </div>
  `;
}

function populateCalendarTable(){
  const target = document.getElementById('calendarTableBody');
  if(!target) return;
  const now = new Date();
  const years = [now.getFullYear(), now.getFullYear()+1];
  const meetings = years.flatMap(dc714Meetings);
  for(const d of meetings){
    const end = new Date(d); end.setHours(20,0,0,0);
    const status = d.getTime() < now.getTime() ? 'Past' : 'Upcoming';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(d)}</td>
      <td>6:00 PM – 8:00 PM</td>
      <td>Room 251 “Storm Center”</td>
      <td>${status}</td>
    `;
    target.appendChild(tr);
  }
}

function speakerStatus(dateStr){
  const now = new Date();
  const d = new Date(dateStr);
  if (d.toDateString() === now.toDateString()) return 'Today';
  return d.getTime() < now.getTime() ? 'Past' : 'Upcoming';
}

function hydrateSpeakers(){
  document.querySelectorAll('[data-speaker-date]').forEach(card => {
    const d = card.getAttribute('data-speaker-date');
    const tag = card.querySelector('.tag');
    if(tag) tag.textContent = speakerStatus(d);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  populateNextMeeting();
  populateCalendarTable();
  hydrateSpeakers();
});
