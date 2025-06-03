document.addEventListener('DOMContentLoaded', async function () {
  const API_BASE = 'https://scented-hickory-rule.glitch.me';

  const container = document.getElementById('calendar-container');
  if (!container) return; // prevent error if div missing

  container.innerHTML = '<h3>Select a date:</h3><div id="calendar"></div><div id="slots"></div>';

  const availability = await fetch(`${API_BASE}/availability`).then(r => r.json());
  const bookings = await fetch(`${API_BASE}/bookings`).then(r => r.json());

  const availByDate = {};
  const bookedByDateSlot = {};
  availability.forEach(a => {
    if (!availByDate[a.date]) availByDate[a.date] = [];
    availByDate[a.date].push(a);
  });
  bookings.forEach(b => {
    if (!bookedByDateSlot[b.booked_date]) bookedByDateSlot[b.booked_date] = new Set();
    bookedByDateSlot[b.booked_date].add(b.booked_slot);
  });

  function getDayColor(dateStr) {
    const a = availByDate[dateStr];
    if (!a) return 'gray';
    const booked = bookedByDateSlot[dateStr] || new Set();
    if (a.length === booked.size) return 'yellow';
    return 'green';
  }

  const cal = document.getElementById('calendar');
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const btn = document.createElement('button');
    btn.innerText = dateStr;
    btn.style.margin = '4px';
    btn.style.padding = '8px';
    btn.style.border = '1px solid #ccc';
    btn.style.background = getDayColor(dateStr);
    btn.style.color = '#000';
    btn.onclick = () => showSlotsForDate(dateStr);
    cal.appendChild(btn);
  }

  function showSlotsForDate(dateStr) {
    const slotDiv = document.getElementById('slots');
    slotDiv.innerHTML = `<h4>Available slots for ${dateStr}</h4>`;
    const slots = availByDate[dateStr] || [];
    const booked = bookedByDateSlot[dateStr] || new Set();

    if (slots.length === 0) {
      slotDiv.innerHTML += '<p>No availability for this date.</p>';
      return;
    }

    slots.forEach(slot => {
      const btn = document.createElement('button');
      const isBooked = booked.has(slot.slot);
      btn.innerText = slot.slot + (isBooked ? ' (Booked)' : '');
      btn.disabled = isBooked;
      btn.style.margin = '4px';
      btn.style.padding = '6px';
      btn.style.background = isBooked ? 'yellow' : 'lightgreen';
      btn.onclick = () => bookSlot(dateStr, slot.slot);
      slotDiv.appendChild(btn);
    });
  }

  function bookSlot(date, slot) {
    const first_name = prompt('First Name');
    const last_name = prompt('Last Name');
    const email = prompt('Email');
    const phone = prompt('Phone');
    const note = prompt('Note (optional)');

    fetch(`${API_BASE}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name, last_name, email, phone, booked_date: date, booked_slot: slot, note })
    })
      .then(res => res.json())
      .then(res => {
        if (res.status === 'success') {
          alert('Booking confirmed!');
          location.reload();
        } else {
          alert('Error: ' + res.error);
        }
      });
  }
});
