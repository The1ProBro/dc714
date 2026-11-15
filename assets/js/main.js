
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
  // Apply one-off reschedules (see dc714Moves below), then keep the list in date order
  return dates.map(d => {
    const to = dc714Moves[meetingDateKey(d)];
    if(!to) return d;
    const p = to.split('-').map(Number);
    return new Date(p[0], p[1]-1, p[2], 18, 0, 0, 0);
  }).sort((a,b) => a - b);
}
// One-off reschedules: 'original YYYY-MM-DD': 'new YYYY-MM-DD'
const dc714Moves = {
  '2026-11-11': '2026-11-18'   // Veterans Day: venue closed
};
// Note shown on the "Next Meeting" card for a rescheduled date (keyed by the NEW date)
const dc714MoveNotes = {
  '2026-11-18': 'Rescheduled from Nov. 11 (Veterans Day, venue closed)'
};
// Optional per-meeting topic, keyed by date as YYYY-MM-DD
const meetingTopics = {
  '2026-07-08': 'Lock Picking, Pi Building, and DEFCON Planning'
};
function meetingDateKey(d){
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
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
    ${meetingTopics[meetingDateKey(nm)] ? `<div style="font-weight:600; margin:.2rem 0;">${meetingTopics[meetingDateKey(nm)]}</div>` : ''}
    ${dc714MoveNotes[meetingDateKey(nm)] ? `<div class="small" style="color:var(--warn);">${dc714MoveNotes[meetingDateKey(nm)]}</div>` : ''}
    <div class="small">6:00 PM – 8:00 PM • Room 251 "Storm Center"</div>
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
      <td>${status}${dc714MoveNotes[meetingDateKey(d)] ? `<div class="small">${dc714MoveNotes[meetingDateKey(d)]}</div>` : ''}</td>
    `;
    target.appendChild(tr);
  }
}

function speakerStatus(dateStr){
  // Parse YYYY-MM-DD as a LOCAL date (new Date('YYYY-MM-DD') is UTC and is off by a day in California)
  const p = dateStr.split('-').map(Number);
  const d = new Date(p[0], p[1]-1, p[2]);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (d.getTime() === today.getTime()) return 'Today';
  return d.getTime() < today.getTime() ? 'Past' : 'Upcoming';
}

function hydrateSpeakers(){
  document.querySelectorAll('[data-speaker-date]').forEach(card => {
    const d = card.getAttribute('data-speaker-date');
    const tag = card.querySelector('.tag');
    if(tag) tag.textContent = speakerStatus(d);
  });
}

/* Site-wide announcement banners, shown in this order at the top of every page.
   Each one hides itself automatically on its `expires` date. */
const dc714Announcements = [
  {
    title: 'Meeting date change',
    text: 'Our November meeting has moved from Wednesday, Nov. 11 to Wednesday, Nov. 18, 2026, because Veterans Day closes our venue. Same time (6\u20138 PM) and place: Room 251 \u201cStorm Center\u201d.',
    expires: '2026-11-19'   // last day it is shown is the 18th; hidden from the 19th on
  },
  {
    title: 'Speaker announced: Knossos',
    text: 'Wednesday, Nov. 18: Man of Gold takes us through Knossos, a free, self-hosted pentest lab for practicing internal enumeration and lateral movement.',
    link: { text: 'Talk details', href: 'speakers.html' },
    expires: '2026-11-19'
  }
];
function renderAnnouncement(){
  const main = document.querySelector('main');
  if(!main) return;
  const now = new Date();
  const today = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const frag = document.createDocumentFragment();
  dc714Announcements.forEach(a => {
    if(!a || !a.text) return;
    if(a.expires && today >= a.expires) return;
    const box = document.createElement('div');
    box.className = 'notice';
    box.setAttribute('role', 'status');
    box.style.cssText = 'margin-top:24px; border:1px solid var(--accent-2);';
    const t = document.createElement('strong');
    t.textContent = a.title;
    box.append(t, document.createElement('br'), document.createTextNode(a.text));
    if(a.link){
      const l = document.createElement('a');
      l.href = a.link.href;
      l.textContent = a.link.text;
      box.append(document.createTextNode(' '), l);
    }
    frag.appendChild(box);
  });
  main.insertBefore(frag, main.firstChild);
}

document.addEventListener('DOMContentLoaded', () => {
  renderAnnouncement();
  populateNextMeeting();
  populateCalendarTable();
  hydrateSpeakers();
});
