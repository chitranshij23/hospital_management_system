/**
 * PulseCare Hospital Management System (HMS)
 * Frontend Application Engine (Vanilla JS)
 */

// Application State
const state = {
  activeTab: 'doctors',
  doctors: [],
  patients: [],
  appointments: [],
  invoices: [],
  stats: {},
  selectedDoctorId: null,
  selectedTimeSlot: null,
  activeSpecialtyFilter: 'All',
  activeApptStatusFilter: 'All',
  activeInvoiceStatusFilter: 'All',
  currentConfirmedAppointment: null,
  currentInvoice: null,
  searchDebounceTimer: null
};

// ==========================================
// Initialization & Lifecycle
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initDefaultBookingDate();
  fetchAllData();

  // Set default active tab
  switchTab('doctors');
});

// Real-time Clock in Header
function initClock() {
  const clockEl = document.getElementById('current-datetime');
  function update() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    if (clockEl) {
      clockEl.innerHTML = `<i class="fa-regular fa-clock mr-1 text-teal-400"></i> ${dateStr} • ${timeStr}`;
    }
  }
  update();
  setInterval(update, 1000);
}

// Set Booking Date input to today by default
function initDefaultBookingDate() {
  const dateInput = document.getElementById('book-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.min = today;
  }
}

// Fetch all initial data
async function fetchAllData() {
  await Promise.all([
    loadStats(),
    loadDoctors(),
    loadPatients(),
    loadAppointments(),
    loadInvoices()
  ]);
}

// ==========================================
// API Handlers
// ==========================================

// 1. Hospital Stats
async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const json = await res.json();
    if (json.success) {
      state.stats = json.data;
      renderKPIs();
    }
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

function renderKPIs() {
  const s = state.stats;
  if (!s) return;

  const totalPatientsEl = document.getElementById('stat-total-patients');
  const activeDoctorsEl = document.getElementById('stat-active-doctors');
  const todayApptsEl = document.getElementById('stat-today-appointments');
  const totalApptsEl = document.getElementById('stat-total-appointments');
  const totalRevenueEl = document.getElementById('stat-total-revenue');
  const pendingRevenueEl = document.getElementById('stat-pending-revenue');

  if (totalPatientsEl) totalPatientsEl.textContent = s.totalPatients ?? 0;
  if (activeDoctorsEl) activeDoctorsEl.textContent = s.activeDoctors ?? 0;
  if (todayApptsEl) todayApptsEl.textContent = s.todayAppointments ?? 0;
  if (totalApptsEl) {
    totalApptsEl.innerHTML = `<i class="fa-solid fa-calendar-day mr-1 text-slate-400"></i> Total All-Time: ${s.totalAppointments ?? 0}`;
  }
  if (totalRevenueEl) totalRevenueEl.textContent = `$${(s.totalRevenue ?? 0).toLocaleString()}`;
  if (pendingRevenueEl) {
    pendingRevenueEl.innerHTML = `<i class="fa-solid fa-clock-rotate-left mr-1"></i> Pending: $${(s.pendingRevenue ?? 0).toLocaleString()}`;
  }

  // Update nav pills
  const navApptCount = document.getElementById('nav-appointments-count');
  const navPatientsCount = document.getElementById('nav-patients-count');
  const navUnpaidPill = document.getElementById('nav-unpaid-pill');
  const billingCollectedPill = document.getElementById('billing-collected-pill');
  const billingPendingPill = document.getElementById('billing-pending-pill');

  if (navApptCount) navApptCount.textContent = s.totalAppointments ?? 0;
  if (navPatientsCount) navPatientsCount.textContent = s.totalPatients ?? 0;
  if (billingCollectedPill) billingCollectedPill.textContent = `$${(s.totalRevenue ?? 0).toLocaleString()}`;
  if (billingPendingPill) billingPendingPill.textContent = `$${(s.pendingRevenue ?? 0).toLocaleString()}`;

  const unpaidCount = state.invoices.filter(i => i.status === 'Unpaid').length;
  if (navUnpaidPill) {
    navUnpaidPill.textContent = `${unpaidCount} Due`;
    navUnpaidPill.className = unpaidCount > 0
      ? 'ml-1 text-[11px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-bold'
      : 'ml-1 text-[11px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold';
  }
}

// 2. Doctors
async function loadDoctors(specialty = 'All') {
  try {
    const url = specialty && specialty !== 'All' ? `/api/doctors?specialty=${encodeURIComponent(specialty)}` : '/api/doctors';
    const res = await fetch(url);
    const json = await res.json();
    if (json.success) {
      if (specialty === 'All') {
        state.doctors = json.data;
      }
      renderDoctorsGrid(json.data);
      populateDoctorSelectOptions();
    }
  } catch (err) {
    showToast('Failed to load doctors.', 'error');
  }
}

// 3. Patients
async function loadPatients(query = '') {
  try {
    const bloodFilter = document.getElementById('patient-blood-filter')?.value || 'All';
    let url = `/api/patients?bloodGroup=${encodeURIComponent(bloodFilter)}`;
    if (query && query.trim()) {
      url += `&q=${encodeURIComponent(query.trim())}`;
    }
    const res = await fetch(url);
    const json = await res.json();
    if (json.success) {
      state.patients = json.data;
      renderPatientsTable(json.data);
      populatePatientSelectOptions();

      const countFooter = document.getElementById('patient-count-footer');
      if (countFooter) {
        countFooter.textContent = `Showing ${json.data.length} registered patients`;
      }
    }
  } catch (err) {
    showToast('Failed to load patient records.', 'error');
  }
}

// 4. Appointments
async function loadAppointments() {
  try {
    const dateInput = document.getElementById('appt-date-filter');
    const selectedDate = dateInput ? dateInput.value : '';
    let url = `/api/appointments?status=${encodeURIComponent(state.activeApptStatusFilter)}`;
    if (selectedDate) {
      url += `&date=${encodeURIComponent(selectedDate)}`;
    }

    const res = await fetch(url);
    const json = await res.json();
    if (json.success) {
      state.appointments = json.data;
      renderAppointmentsTable(json.data);
      const navApptCount = document.getElementById('nav-appointments-count');
      if (navApptCount) navApptCount.textContent = json.data.length;
    }
  } catch (err) {
    showToast('Failed to load appointments.', 'error');
  }
}

// 5. Invoices
async function loadInvoices(query = '') {
  try {
    let url = `/api/invoices?status=${encodeURIComponent(state.activeInvoiceStatusFilter)}`;
    if (query && query.trim()) {
      url += `&q=${encodeURIComponent(query.trim())}`;
    }
    const res = await fetch(url);
    const json = await res.json();
    if (json.success) {
      state.invoices = json.data;
      renderInvoicesTable(json.data);
      renderKPIs();
    }
  } catch (err) {
    showToast('Failed to load billing records.', 'error');
  }
}

// ==========================================
// UI Rendering Functions
// ==========================================

// Tab Switching
function switchTab(tabId) {
  state.activeTab = tabId;

  // Toggle Tab Navigation Buttons
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.classList.remove('active', 'text-teal-700', 'bg-teal-50/80', 'border-b-2', 'border-teal-600', 'font-semibold');
    btn.classList.add('text-slate-600', 'font-medium');
  });

  const activeBtn = document.getElementById(`tab-btn-${tabId}`);
  if (activeBtn) {
    activeBtn.classList.remove('text-slate-600', 'font-medium');
    activeBtn.classList.add('active', 'text-teal-700', 'bg-teal-50/80', 'border-b-2', 'border-teal-600', 'font-semibold');
  }

  // Toggle Content Panels
  const contentPanels = document.querySelectorAll('.tab-content');
  contentPanels.forEach(panel => {
    panel.classList.add('hidden');
    panel.classList.remove('block');
  });

  const activePanel = document.getElementById(`tab-${tabId}`);
  if (activePanel) {
    activePanel.classList.remove('hidden');
    activePanel.classList.add('block');
  }

  // Window scroll to top for smoother feeling
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Render Doctor Cards
function renderDoctorsGrid(doctorsList) {
  const container = document.getElementById('doctors-grid');
  if (!container) return;

  if (doctorsList.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
        <i class="fa-solid fa-user-doctor text-4xl mb-3 text-slate-300"></i>
        <p class="font-semibold text-slate-700">No doctors found for this specialty</p>
        <p class="text-xs text-slate-400 mt-1">Please choose another category or check back later.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = doctorsList.map(doc => {
    const colorMap = {
      teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', gradient: 'from-teal-600 to-teal-800' },
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', gradient: 'from-blue-600 to-blue-800' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', gradient: 'from-indigo-600 to-indigo-800' },
      emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', gradient: 'from-emerald-600 to-emerald-800' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', gradient: 'from-amber-600 to-amber-800' }
    };

    const c = colorMap[doc.color] || colorMap.teal;

    return `
      <div class="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group">
        <div class="p-6">
          <!-- Doctor Header -->
          <div class="flex items-start justify-between gap-3 mb-4">
            <div class="flex items-center space-x-3.5">
              <div class="w-13 h-13 rounded-2xl bg-gradient-to-br ${c.gradient} text-white flex items-center justify-center font-bold text-lg shadow-sm">
                ${doc.avatar}
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-base group-hover:text-teal-700 transition-colors">${doc.name}</h3>
                <span class="inline-block mt-0.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${c.bg} ${c.text} border ${c.border}">
                  ${doc.specialty}
                </span>
              </div>
            </div>
            <div class="text-right">
              <div class="flex items-center text-amber-400 text-xs font-bold">
                <i class="fa-solid fa-star mr-1"></i>
                <span class="text-slate-800">${doc.rating}</span>
              </div>
              <span class="text-[11px] text-slate-400">(${doc.reviewsCount})</span>
            </div>
          </div>

          <!-- Doctor Details -->
          <div class="space-y-2 text-xs text-slate-600 mb-5">
            <div class="flex items-center">
              <i class="fa-solid fa-graduation-cap w-4 text-teal-600 mr-2"></i>
              <span class="truncate">${doc.qualification}</span>
            </div>
            <div class="flex items-center">
              <i class="fa-solid fa-briefcase-medical w-4 text-teal-600 mr-2"></i>
              <span>${doc.experience}</span>
            </div>
            <div class="flex items-center">
              <i class="fa-solid fa-location-dot w-4 text-teal-600 mr-2"></i>
              <span>${doc.room}</span>
            </div>
          </div>

          <!-- Available Daily Slots Chips -->
          <div>
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Available Daily Slots:</p>
            <div class="flex flex-wrap gap-1.5">
              ${doc.availableSlots.slice(0, 4).map(slot => `
                <span class="text-[11px] bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md font-medium">
                  ${slot}
                </span>
              `).join('')}
              ${doc.availableSlots.length > 4 ? `
                <span class="text-[11px] text-slate-400 self-center">+${doc.availableSlots.length - 4} more</span>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Card Footer with Fee and Action -->
        <div class="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span class="text-[11px] text-slate-500 uppercase font-semibold block">Consultation Fee</span>
            <span class="text-lg font-black text-slate-900">$${doc.consultationFee}</span>
          </div>
          <button onclick="bookDoctor('${doc.id}')" class="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-teal-600/20 transition-all flex items-center space-x-1.5 hover:scale-[1.02]">
            <i class="fa-solid fa-calendar-check"></i>
            <span>Book Appointment</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Filter Doctors by Specialty
function filterDoctorsBySpecialty(specialty) {
  state.activeSpecialtyFilter = specialty;
  const buttons = document.querySelectorAll('.spec-filter');
  buttons.forEach(btn => {
    btn.classList.remove('bg-slate-900', 'text-white');
    btn.classList.add('bg-white', 'text-slate-700');
  });

  event.currentTarget.classList.remove('bg-white', 'text-slate-700');
  event.currentTarget.classList.add('bg-slate-900', 'text-white');

  loadDoctors(specialty);
}

// Quick action from doctor card
function bookDoctor(doctorId) {
  state.selectedDoctorId = doctorId;
  switchTab('appointments');

  const docSelect = document.getElementById('book-doctor-select');
  if (docSelect) {
    docSelect.value = doctorId;
    onDoctorChangedForBooking(doctorId);
  }

  showToast('Specialist selected. Fill visit details to proceed.', 'info');
}

// Populate Doctor select dropdowns
function populateDoctorSelectOptions() {
  const selectBooking = document.getElementById('book-doctor-select');
  const selectPatientModal = document.getElementById('reg-patient-doctor');

  if (selectBooking) {
    selectBooking.innerHTML = `
      <option value="">-- Choose a consulting specialist --</option>
      ${state.doctors.map(d => `
        <option value="${d.id}" ${d.id === state.selectedDoctorId ? 'selected' : ''}>
          ${d.name} (${d.specialty}) • $${d.consultationFee}
        </option>
      `).join('')}
    `;
  }

  if (selectPatientModal) {
    selectPatientModal.innerHTML = `
      <option value="General Practitioner">General Practitioner / OPD</option>
      ${state.doctors.map(d => `
        <option value="${d.name}">${d.name} (${d.specialty})</option>
      `).join('')}
    `;
  }
}

// Populate Patient Select in Booking Form
function populatePatientSelectOptions() {
  const select = document.getElementById('book-patient-select');
  if (!select) return;

  select.innerHTML = `
    <option value="">-- Or enter new patient details below --</option>
    ${state.patients.map(p => `
      <option value="${p.id}">${p.id}: ${p.name} (${p.gender}, Age ${p.age})</option>
    `).join('')}
  `;
}

// Handle Patient Selection in Booking form
function onExistingPatientSelected(patientId) {
  if (!patientId) return;

  const patient = state.patients.find(p => p.id === patientId);
  if (!patient) return;

  document.getElementById('book-patient-name').value = patient.name;
  document.getElementById('book-patient-contact').value = patient.contact;
  document.getElementById('book-patient-age').value = patient.age;
  document.getElementById('book-patient-gender').value = patient.gender;
  if (document.getElementById('book-patient-blood')) {
    document.getElementById('book-patient-blood').value = patient.bloodGroup || 'O+';
  }

  showToast(`Autofilled details for ${patient.name}`, 'info');
}

// Handle Doctor change in Booking form
function onDoctorChangedForBooking(doctorId) {
  state.selectedDoctorId = doctorId;
  const doctor = state.doctors.find(d => d.id === doctorId);

  const feeDisplay = document.getElementById('selected-doctor-fee');
  if (doctor) {
    if (feeDisplay) feeDisplay.textContent = `$${doctor.consultationFee}.00`;
  } else {
    if (feeDisplay) feeDisplay.textContent = `$0.00`;
  }

  refreshTimeSlots();
}

// Render dynamic Time Slot chips with slot conflict detection
function refreshTimeSlots() {
  const container = document.getElementById('time-slots-container');
  const doctorId = document.getElementById('book-doctor-select')?.value;
  const dateVal = document.getElementById('book-date')?.value;
  const hiddenSlotInput = document.getElementById('selected-time-slot');

  if (!container) return;

  if (!doctorId || !dateVal) {
    container.innerHTML = `
      <p class="text-xs text-slate-400 col-span-full py-2 italic">Select a doctor and date to preview available consultation slots.</p>
    `;
    if (hiddenSlotInput) hiddenSlotInput.value = '';
    return;
  }

  const doctor = state.doctors.find(d => d.id === doctorId);
  if (!doctor) return;

  // Find already reserved slots for this doctor on this date
  const bookedSlots = state.appointments
    .filter(a => a.doctorId === doctorId && a.date === dateVal && a.status !== 'Cancelled')
    .map(a => a.timeSlot);

  container.innerHTML = doctor.availableSlots.map(slot => {
    const isBooked = bookedSlots.includes(slot);
    const isSelected = state.selectedTimeSlot === slot && !isBooked;

    if (isBooked) {
      return `
        <div class="opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200 text-xs rounded-xl py-2 px-2.5 flex items-center justify-between font-medium">
          <span>${slot}</span>
          <span class="text-[10px] font-bold text-rose-500 uppercase">Booked</span>
        </div>
      `;
    }

    return `
      <button type="button" onclick="selectSlot('${slot}')" class="slot-chip transition-all text-xs rounded-xl py-2 px-2.5 border font-semibold flex items-center justify-between ${isSelected
        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
        : 'bg-white text-slate-700 border-slate-200 hover:border-teal-500 hover:bg-teal-50/50'
      }">
        <span>${slot}</span>
        <i class="fa-solid ${isSelected ? 'fa-circle-check text-white' : 'fa-clock text-slate-300'} text-xs"></i>
      </button>
    `;
  }).join('');
}

// Select a specific time slot
function selectSlot(slot) {
  state.selectedTimeSlot = slot;
  const hiddenInput = document.getElementById('selected-time-slot');
  if (hiddenInput) hiddenInput.value = slot;
  refreshTimeSlots();
}

// Handle Form Submission: Book Appointment
async function handleAppointmentBooking(e) {
  e.preventDefault();

  const patientId = document.getElementById('book-patient-select').value;
  const patientName = document.getElementById('book-patient-name').value.trim();
  const patientContact = document.getElementById('book-patient-contact').value.trim();
  const patientAge = document.getElementById('book-patient-age').value;
  const patientGender = document.getElementById('book-patient-gender').value;
  const doctorId = document.getElementById('book-doctor-select').value;
  const date = document.getElementById('book-date').value;
  const timeSlot = document.getElementById('selected-time-slot').value;
  const reason = document.getElementById('book-reason').value.trim();

  if (!timeSlot) {
    showToast('Please select an available time slot.', 'error');
    return;
  }

  const submitBtn = document.getElementById('submit-booking-btn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Generating Token...`;

  try {
    const res = await fetch('/api/appointments/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId,
        patientName,
        patientAge,
        patientGender,
        patientContact,
        doctorId,
        date,
        timeSlot,
        reason
      })
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to book appointment');
    }

    showToast(`Appointment Token ${json.data.appointment.id} generated!`, 'success');
    state.currentConfirmedAppointment = json.data.appointment;
    state.currentInvoice = json.data.invoice;

    // Update Confirmed Slip UI
    renderConfirmedSlip(json.data.appointment, json.data.doctor);

    // Refresh state data in background
    await Promise.all([
      loadStats(),
      loadPatients(),
      loadAppointments(),
      loadInvoices()
    ]);

    // Reset selected slot
    state.selectedTimeSlot = null;
    document.getElementById('selected-time-slot').value = '';
    refreshTimeSlots();

  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `
      <i class="fa-solid fa-check-to-slot"></i>
      <span>Confirm & Generate Appointment Token</span>
    `;
  }
}

// Render Confirmed Appointment Slip
function renderConfirmedSlip(appt, doctor) {
  const tokenEl = document.getElementById('slip-token-id');
  const nameEl = document.getElementById('slip-patient-name');
  const pidEl = document.getElementById('slip-patient-id');
  const docEl = document.getElementById('slip-doctor-name');
  const roomEl = document.getElementById('slip-department-room');
  const dateEl = document.getElementById('slip-date');
  const timeEl = document.getElementById('slip-timeslot');
  const feeEl = document.getElementById('slip-fee');
  const badgeEl = document.getElementById('slip-status-badge');
  const invoiceStatusEl = document.getElementById('slip-invoice-status');

  if (tokenEl) tokenEl.textContent = appt.id;
  if (nameEl) nameEl.textContent = appt.patientName;
  if (pidEl) pidEl.textContent = appt.patientId;
  if (docEl) docEl.textContent = appt.doctorName;
  if (roomEl) roomEl.textContent = `${appt.department} • ${doctor?.room || 'OPD'}`;
  if (dateEl) dateEl.textContent = appt.date;
  if (timeEl) timeEl.textContent = appt.timeSlot;
  if (feeEl) feeEl.textContent = `$${appt.consultationFee}.00`;

  if (badgeEl) {
    badgeEl.textContent = 'CONFIRMED';
    badgeEl.className = 'text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full animate-pulse';
  }

  if (invoiceStatusEl) {
    invoiceStatusEl.textContent = 'Invoice Generated (Unpaid)';
    invoiceStatusEl.className = 'text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200';
  }

  // Highlight card with subtle flash
  const card = document.getElementById('appointment-slip-card');
  if (card) {
    card.classList.add('ring-4', 'ring-teal-400/50');
    setTimeout(() => card.classList.remove('ring-4', 'ring-teal-400/50'), 2000);
  }
}

// Print Current Confirmed Slip
function printCurrentSlip() {
  if (!state.currentConfirmedAppointment) {
    showToast('Please book an appointment first to print the token slip.', 'info');
    return;
  }
  window.print();
}

// View Invoice from live slip
function viewInvoiceFromSlip() {
  if (!state.currentInvoice) {
    showToast('No recent invoice generated in this session. Visit Billing tab to view all invoices.', 'info');
    switchTab('billing');
    return;
  }
  openReceiptModal(state.currentInvoice);
}

// ==========================================
// Patient Registry
// ==========================================

function debouncePatientSearch() {
  clearTimeout(state.searchDebounceTimer);
  state.searchDebounceTimer = setTimeout(() => {
    const q = document.getElementById('patient-search-input')?.value;
    loadPatients(q);
  }, 300);
}

function renderPatientsTable(patientList) {
  const tbody = document.getElementById('patients-table-body');
  if (!tbody) return;

  if (patientList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-12 text-slate-400">
          <i class="fa-solid fa-address-book text-3xl mb-2 text-slate-300"></i>
          <p class="font-medium text-slate-700">No patient records found</p>
          <p class="text-xs text-slate-400">Try adjusting your search criteria or register a new patient.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = patientList.map(p => {
    const bloodBg = {
      'O+': 'bg-rose-50 text-rose-700 border-rose-200',
      'A+': 'bg-blue-50 text-blue-700 border-blue-200',
      'B+': 'bg-purple-50 text-purple-700 border-purple-200',
      'AB+': 'bg-amber-50 text-amber-700 border-amber-200',
      'O-': 'bg-red-50 text-red-800 border-red-200',
      'A-': 'bg-indigo-50 text-indigo-800 border-indigo-200',
      'B-': 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200',
      'AB-': 'bg-orange-50 text-orange-800 border-orange-200'
    }[p.bloodGroup] || 'bg-slate-100 text-slate-700 border-slate-200';

    return `
      <tr class="hover:bg-slate-50/80 transition-colors">
        <td class="px-6 py-4 font-mono font-bold text-teal-700 text-xs">${p.id}</td>
        <td class="px-6 py-4">
          <div class="font-bold text-slate-900">${p.name}</div>
          <div class="text-[11px] text-slate-400">${p.email || 'No email registered'}</div>
        </td>
        <td class="px-6 py-4 text-xs">
          <span class="font-semibold text-slate-800">${p.age} yrs</span>
          <span class="text-slate-400">• ${p.gender}</span>
        </td>
        <td class="px-6 py-4">
          <span class="text-xs font-bold px-2 py-0.5 rounded-md border ${bloodBg}">
            ${p.bloodGroup}
          </span>
        </td>
        <td class="px-6 py-4 text-xs font-medium text-slate-700">${p.contact}</td>
        <td class="px-6 py-4 text-xs text-slate-600 max-w-xs truncate" title="${p.medicalHistory}">
          ${p.medicalHistory}
        </td>
        <td class="px-6 py-4 text-xs font-medium text-slate-800">
          <span class="inline-flex items-center">
            <i class="fa-solid fa-user-doctor text-teal-600 mr-1.5 text-xs"></i>
            ${p.assignedDoctor || 'General Practitioner'}
          </span>
        </td>
        <td class="px-6 py-4 text-right">
          <button onclick="quickBookPatient('${p.id}')" class="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs rounded-lg border border-teal-200 transition-colors">
            <i class="fa-solid fa-calendar-plus mr-1"></i> Book Visit
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Quick book patient from table
function quickBookPatient(patientId) {
  switchTab('appointments');
  const select = document.getElementById('book-patient-select');
  if (select) {
    select.value = patientId;
    onExistingPatientSelected(patientId);
  }
}

// Open / Close Patient Registration Modal
function openPatientModal() {
  const modal = document.getElementById('patient-modal');
  if (modal) modal.classList.remove('hidden');
}

function closePatientModal() {
  const modal = document.getElementById('patient-modal');
  if (modal) modal.classList.add('hidden');
  document.getElementById('register-patient-form')?.reset();
}

// Handle Patient Registration Submit
async function handlePatientRegistration(e) {
  e.preventDefault();

  const name = document.getElementById('reg-patient-name').value.trim();
  const age = document.getElementById('reg-patient-age').value;
  const gender = document.getElementById('reg-patient-gender').value;
  const bloodGroup = document.getElementById('reg-patient-blood').value;
  const contact = document.getElementById('reg-patient-contact').value.trim();
  const email = document.getElementById('reg-patient-email').value.trim();
  const assignedDoctor = document.getElementById('reg-patient-doctor').value;
  const medicalHistory = document.getElementById('reg-patient-history').value.trim();

  try {
    const res = await fetch('/api/patients/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        age,
        gender,
        bloodGroup,
        contact,
        email,
        assignedDoctor,
        medicalHistory
      })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to register patient');
    }

    showToast(`Patient registered successfully! Assigned ID: ${json.data.id}`, 'success');
    closePatientModal();

    // Reload patients and stats
    await Promise.all([
      loadPatients(),
      loadStats()
    ]);

    // Switch to patient registry tab to highlight new row
    switchTab('patients');

  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==========================================
// Appointments Schedule Queue
// ==========================================

function filterAppointmentsStatus(status) {
  state.activeApptStatusFilter = status;
  const buttons = document.querySelectorAll('.appt-status-btn');
  buttons.forEach(btn => {
    btn.classList.remove('bg-slate-900', 'text-white');
    btn.classList.add('bg-slate-100', 'text-slate-700');
  });

  event.currentTarget.classList.remove('bg-slate-100', 'text-slate-700');
  event.currentTarget.classList.add('bg-slate-900', 'text-white');

  loadAppointments();
}

function clearApptDateFilter() {
  const dateInput = document.getElementById('appt-date-filter');
  if (dateInput) {
    dateInput.value = '';
    loadAppointments();
  }
}

function renderAppointmentsTable(apptList) {
  const tbody = document.getElementById('appointments-table-body');
  if (!tbody) return;

  if (apptList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-12 text-slate-400">
          <i class="fa-solid fa-calendar-xmark text-3xl mb-2 text-slate-300"></i>
          <p class="font-medium text-slate-700">No appointments found</p>
          <p class="text-xs text-slate-400">No scheduled visits match the chosen filters.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = apptList.map(a => {
    const statusMap = {
      Scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
      Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      Cancelled: 'bg-rose-100 text-rose-800 border-rose-200'
    };
    const badgeClass = statusMap[a.status] || 'bg-slate-100 text-slate-800';

    return `
      <tr class="hover:bg-slate-50/80 transition-colors">
        <td class="px-6 py-4 font-mono font-bold text-teal-700 text-xs">${a.id}</td>
        <td class="px-6 py-4">
          <div class="font-bold text-slate-900">${a.patientName}</div>
          <div class="text-[11px] text-slate-400">${a.patientId} • ${a.patientContact}</div>
        </td>
        <td class="px-6 py-4 text-xs">
          <div class="font-semibold text-slate-900">${a.doctorName}</div>
          <div class="text-teal-700 font-medium">${a.department}</div>
        </td>
        <td class="px-6 py-4 text-xs">
          <div class="font-semibold text-slate-800">${a.date}</div>
          <div class="text-slate-500 font-medium"><i class="fa-regular fa-clock mr-1 text-slate-400"></i>${a.timeSlot}</div>
        </td>
        <td class="px-6 py-4 text-xs text-slate-600 max-w-xs truncate" title="${a.reason}">
          ${a.reason}
        </td>
        <td class="px-6 py-4">
          <span class="text-xs font-bold px-2.5 py-1 rounded-full border ${badgeClass}">
            ${a.status}
          </span>
        </td>
        <td class="px-6 py-4 text-right space-x-1.5">
          ${a.status === 'Scheduled' ? `
            <button onclick="updateAppointmentStatus('${a.id}', 'Completed')" title="Mark Completed" class="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 text-xs transition-colors">
              <i class="fa-solid fa-check"></i>
            </button>
            <button onclick="updateAppointmentStatus('${a.id}', 'Cancelled')" title="Cancel Appointment" class="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 text-xs transition-colors">
              <i class="fa-solid fa-xmark"></i>
            </button>
          ` : `
            <span class="text-xs text-slate-400 font-medium italic">Archived</span>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

// Update Appointment Status
async function updateAppointmentStatus(apptId, newStatus) {
  try {
    const res = await fetch(`/api/appointments/${apptId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to update appointment status');
    }

    showToast(`Appointment ${apptId} marked as ${newStatus}`, 'info');
    await Promise.all([
      loadAppointments(),
      loadStats()
    ]);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==========================================
// Billing & Invoicing Desk
// ==========================================

function debounceInvoiceSearch() {
  clearTimeout(state.searchDebounceTimer);
  state.searchDebounceTimer = setTimeout(() => {
    const q = document.getElementById('invoice-search-input')?.value;
    loadInvoices(q);
  }, 300);
}

function filterInvoicesByStatus(status) {
  state.activeInvoiceStatusFilter = status;
  const buttons = document.querySelectorAll('.inv-filter');
  buttons.forEach(btn => {
    btn.classList.remove('bg-slate-900', 'text-white');
    btn.classList.add('bg-slate-100', 'text-slate-700');
  });

  event.currentTarget.classList.remove('bg-slate-100', 'text-slate-700');
  event.currentTarget.classList.add('bg-slate-900', 'text-white');

  loadInvoices();
}

function renderInvoicesTable(invoiceList) {
  const tbody = document.getElementById('invoices-table-body');
  if (!tbody) return;

  if (invoiceList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-12 text-slate-400">
          <i class="fa-solid fa-file-invoice text-3xl mb-2 text-slate-300"></i>
          <p class="font-medium text-slate-700">No invoices found</p>
          <p class="text-xs text-slate-400">No receipts correspond to current filters.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = invoiceList.map(inv => {
    const isPaid = inv.status === 'Paid';

    return `
      <tr class="hover:bg-slate-50/80 transition-colors">
        <td class="px-6 py-4 font-mono font-bold text-slate-800 text-xs">${inv.id}</td>
        <td class="px-6 py-4 font-mono font-semibold text-teal-700 text-xs">${inv.appointmentId}</td>
        <td class="px-6 py-4">
          <div class="font-bold text-slate-900">${inv.patientName}</div>
          <div class="text-[11px] text-slate-400">${inv.patientId}</div>
        </td>
        <td class="px-6 py-4 text-xs text-slate-700">
          <div class="font-semibold">${inv.doctorName}</div>
          <div class="text-slate-400">${inv.department}</div>
        </td>
        <td class="px-6 py-4 text-sm font-black text-slate-900">$${inv.totalAmount}</td>
        <td class="px-6 py-4 text-xs text-slate-600 font-medium">${inv.date}</td>
        <td class="px-6 py-4">
          <span class="text-xs font-bold px-2.5 py-1 rounded-full ${isPaid
        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
        : 'bg-amber-100 text-amber-800 border border-amber-200'
      }">
            ${inv.status}
          </span>
        </td>
        <td class="px-6 py-4 text-right space-x-2">
          ${!isPaid ? `
            <button onclick="markInvoicePaid('${inv.id}')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors">
              <i class="fa-solid fa-check mr-1"></i> Mark as Paid
            </button>
          ` : `
            <span class="inline-flex items-center text-xs font-semibold text-emerald-600 mr-2">
              <i class="fa-solid fa-circle-check mr-1"></i> Settled
            </span>
          `}
          <button onclick='openReceiptModal(${JSON.stringify(inv)})' class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors">
            <i class="fa-solid fa-print"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Mark Invoice as Paid
async function markInvoicePaid(invoiceId) {
  try {
    const res = await fetch(`/api/invoices/${invoiceId}/pay`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethod: 'Counter Card / Cash' })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to update payment');
    }

    showToast(`Invoice ${invoiceId} marked as Paid!`, 'success');
    await Promise.all([
      loadInvoices(),
      loadStats()
    ]);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Open Printable Receipt Modal
function openReceiptModal(inv) {
  state.currentInvoice = inv;
  const modal = document.getElementById('receipt-modal');
  if (!modal) return;

  document.getElementById('rcpt-invoice-id').textContent = inv.id;
  document.getElementById('rcpt-token-id').textContent = inv.appointmentId;
  document.getElementById('rcpt-date').textContent = inv.date;
  document.getElementById('rcpt-patient-name').textContent = inv.patientName;
  document.getElementById('rcpt-doctor').textContent = `${inv.doctorName} (${inv.department})`;
  document.getElementById('rcpt-fee').textContent = `$${inv.consultationFee}.00`;
  document.getElementById('rcpt-total').textContent = `$${inv.totalAmount}.00`;

  const badge = document.getElementById('rcpt-status-badge');
  const method = document.getElementById('rcpt-payment-method');

  if (inv.status === 'Paid') {
    badge.textContent = 'PAID IN FULL';
    badge.className = 'inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-800';
    method.textContent = inv.paymentMethod || 'Official Hospital Counter Payment';
  } else {
    badge.textContent = 'OUTSTANDING / UNPAID';
    badge.className = 'inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-800';
    method.textContent = 'Awaiting payment at hospital cashier desk';
  }

  modal.classList.remove('hidden');
}

function closeReceiptModal() {
  const modal = document.getElementById('receipt-modal');
  if (modal) modal.classList.add('hidden');
}

// ==========================================
// Toast Notifications
// ==========================================

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const typeStyles = {
    success: 'bg-slate-900 text-white border-l-4 border-emerald-400',
    error: 'bg-rose-900 text-white border-l-4 border-rose-400',
    info: 'bg-teal-900 text-white border-l-4 border-teal-400'
  };

  const icons = {
    success: 'fa-circle-check text-emerald-400',
    error: 'fa-triangle-exclamation text-rose-400',
    info: 'fa-circle-info text-teal-400'
  };

  const toast = document.createElement('div');
  toast.className = `pointer-events-auto flex items-center p-3.5 rounded-xl shadow-xl text-xs font-semibold space-x-2.5 transform transition-all duration-300 translate-y-4 opacity-0 max-w-sm ${typeStyles[type] || typeStyles.info}`;
  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info} text-base"></i>
    <span class="flex-1">${message}</span>
  `;

  container.appendChild(toast);

  // Trigger animation in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  });

  // Remove after 3.5 seconds
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-x-4');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
