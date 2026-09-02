const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from ./public
app.use(express.static(path.join(__dirname, 'public')));

// Helper for today's date in YYYY-MM-DD format
function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const todayStr = getTodayDateString();

// In-Memory Data Store

// 1. Doctors Directory
const doctors = [
  {
    id: 'DOC-101',
    name: 'Dr. Sarah Jenkins',
    specialty: 'Cardiology',
    qualification: 'MD, FACC - Harvard Medical',
    experience: '14 Years Experience',
    room: 'Room 302 (Cardio Wing)',
    consultationFee: 120,
    avatar: 'SJ',
    color: 'teal',
    rating: 4.9,
    reviewsCount: 128,
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    availableSlots: ['09:00 AM', '10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '04:30 PM']
  },
  {
    id: 'DOC-102',
    name: 'Dr. Marcus Vance',
    specialty: 'Orthopedics',
    qualification: 'MS (Ortho), FACS - Johns Hopkins',
    experience: '11 Years Experience',
    room: 'Room 105 (Ortho Clinic)',
    consultationFee: 95,
    avatar: 'MV',
    color: 'blue',
    rating: 4.8,
    reviewsCount: 94,
    availableDays: ['Mon', 'Wed', 'Thu', 'Sat'],
    availableSlots: ['09:30 AM', '10:30 AM', '11:45 AM', '02:30 PM', '03:45 PM', '05:00 PM']
  },
  {
    id: 'DOC-103',
    name: 'Dr. Elena Rostova',
    specialty: 'Neurology',
    qualification: 'MD, DM (Neuro) - Stanford University',
    experience: '16 Years Experience',
    room: 'Room 410 (Neuro Sciences)',
    consultationFee: 150,
    avatar: 'ER',
    color: 'indigo',
    rating: 4.95,
    reviewsCount: 160,
    availableDays: ['Tue', 'Wed', 'Thu', 'Fri'],
    availableSlots: ['10:00 AM', '11:15 AM', '01:30 PM', '03:00 PM', '04:15 PM']
  },
  {
    id: 'DOC-104',
    name: 'Dr. James Wilson',
    specialty: 'General Medicine',
    qualification: 'MD (Internal Medicine) - Oxford University',
    experience: '9 Years Experience',
    room: 'Room 201 (OPD Center)',
    consultationFee: 70,
    avatar: 'JW',
    color: 'emerald',
    rating: 4.75,
    reviewsCount: 210,
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    availableSlots: ['08:30 AM', '09:30 AM', '11:00 AM', '01:00 PM', '02:30 PM', '04:00 PM']
  },
  {
    id: 'DOC-105',
    name: 'Dr. Priya Sharma',
    specialty: 'Pediatrics',
    qualification: 'MD (Pediatrics), FAAP - AIIMS & Boston Children’s',
    experience: '12 Years Experience',
    room: 'Room 118 (Children Care)',
    consultationFee: 85,
    avatar: 'PS',
    color: 'amber',
    rating: 4.9,
    reviewsCount: 145,
    availableDays: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat'],
    availableSlots: ['09:00 AM', '10:15 AM', '11:30 AM', '02:00 PM', '03:15 PM', '04:30 PM']
  }
];

// 2. Patients Registry
let patients = [
  {
    id: 'PID-1001',
    name: 'Eleanor Vance',
    age: 48,
    gender: 'Female',
    bloodGroup: 'O+',
    contact: '+1 (555) 234-8901',
    email: 'eleanor.vance@example.com',
    medicalHistory: 'Hypertension, Mild Asthma',
    assignedDoctor: 'Dr. Sarah Jenkins',
    registeredDate: '2026-08-15'
  },
  {
    id: 'PID-1002',
    name: 'Robert Sterling',
    age: 62,
    gender: 'Male',
    bloodGroup: 'A+',
    contact: '+1 (555) 876-5432',
    email: 'robert.sterling@example.com',
    medicalHistory: 'Post-op Knee Replacement, Osteoarthritis',
    assignedDoctor: 'Dr. Marcus Vance',
    registeredDate: '2026-08-20'
  },
  {
    id: 'PID-1003',
    name: 'Sophia Martinez',
    age: 34,
    gender: 'Female',
    bloodGroup: 'B-',
    contact: '+1 (555) 432-1098',
    email: 'sophia.m@example.com',
    medicalHistory: 'Chronic Migraine, Occasional Vertigo',
    assignedDoctor: 'Dr. Elena Rostova',
    registeredDate: '2026-08-25'
  },
  {
    id: 'PID-1004',
    name: 'David Chen',
    age: 29,
    gender: 'Male',
    bloodGroup: 'AB+',
    contact: '+1 (555) 345-6789',
    email: 'd.chen@example.com',
    medicalHistory: 'Seasonal Rhinitis, Acid Reflux',
    assignedDoctor: 'Dr. James Wilson',
    registeredDate: '2026-08-28'
  },
  {
    id: 'PID-1005',
    name: 'Maya Patel',
    age: 8,
    gender: 'Female',
    bloodGroup: 'O-',
    contact: '+1 (555) 789-0123',
    email: 'patel.family@example.com',
    medicalHistory: 'Pediatric Bronchitis Checkup, Penicillin Allergy',
    assignedDoctor: 'Dr. Priya Sharma',
    registeredDate: '2026-09-01'
  }
];

// 3. Appointments System
let appointments = [
  {
    id: 'APT-2001',
    patientId: 'PID-1001',
    patientName: 'Eleanor Vance',
    patientAge: 48,
    patientGender: 'Female',
    patientContact: '+1 (555) 234-8901',
    doctorId: 'DOC-101',
    doctorName: 'Dr. Sarah Jenkins',
    department: 'Cardiology',
    consultationFee: 120,
    date: todayStr,
    timeSlot: '09:00 AM',
    reason: 'Routine quarterly ECG & Blood Pressure follow-up',
    status: 'Completed',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'APT-2002',
    patientId: 'PID-1002',
    patientName: 'Robert Sterling',
    patientAge: 62,
    patientGender: 'Male',
    patientContact: '+1 (555) 876-5432',
    doctorId: 'DOC-102',
    doctorName: 'Dr. Marcus Vance',
    department: 'Orthopedics',
    consultationFee: 95,
    date: todayStr,
    timeSlot: '11:45 AM',
    reason: 'Knee joint mobility assessment & physical therapy review',
    status: 'Scheduled',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'APT-2003',
    patientId: 'PID-1003',
    patientName: 'Sophia Martinez',
    patientAge: 34,
    patientGender: 'Female',
    patientContact: '+1 (555) 432-1098',
    doctorId: 'DOC-103',
    doctorName: 'Dr. Elena Rostova',
    department: 'Neurology',
    consultationFee: 150,
    date: todayStr,
    timeSlot: '03:00 PM',
    reason: 'Unresponsive migraine aura episodes with tingling',
    status: 'Scheduled',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'APT-2004',
    patientId: 'PID-1004',
    patientName: 'David Chen',
    patientAge: 29,
    patientGender: 'Male',
    patientContact: '+1 (555) 345-6789',
    doctorId: 'DOC-104',
    doctorName: 'Dr. James Wilson',
    department: 'General Medicine',
    consultationFee: 70,
    date: '2026-09-03',
    timeSlot: '09:30 AM',
    reason: 'General annual health wellness panel and lab prescription',
    status: 'Scheduled',
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'APT-2005',
    patientId: 'PID-1005',
    patientName: 'Maya Patel',
    patientAge: 8,
    patientGender: 'Female',
    patientContact: '+1 (555) 789-0123',
    doctorId: 'DOC-105',
    doctorName: 'Dr. Priya Sharma',
    department: 'Pediatrics',
    consultationFee: 85,
    date: '2026-09-03',
    timeSlot: '10:15 AM',
    reason: 'Follow-up on childhood cough and allergy consultation',
    status: 'Scheduled',
    createdAt: new Date(Date.now() - 10800000).toISOString()
  }
];

// 4. Billing & Invoices
let invoices = [
  {
    id: 'INV-3001',
    appointmentId: 'APT-2001',
    patientId: 'PID-1001',
    patientName: 'Eleanor Vance',
    doctorName: 'Dr. Sarah Jenkins',
    department: 'Cardiology',
    consultationFee: 120,
    serviceTax: 0,
    totalAmount: 120,
    date: todayStr,
    status: 'Paid',
    paymentMethod: 'Credit Card (Visa ending in 4242)',
    paidAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'INV-3002',
    appointmentId: 'APT-2002',
    patientId: 'PID-1002',
    patientName: 'Robert Sterling',
    doctorName: 'Dr. Marcus Vance',
    department: 'Orthopedics',
    consultationFee: 95,
    serviceTax: 0,
    totalAmount: 95,
    date: todayStr,
    status: 'Unpaid',
    paymentMethod: 'Pending at Billing Desk',
    paidAt: null
  },
  {
    id: 'INV-3003',
    appointmentId: 'APT-2003',
    patientId: 'PID-1003',
    patientName: 'Sophia Martinez',
    doctorName: 'Dr. Elena Rostova',
    department: 'Neurology',
    consultationFee: 150,
    serviceTax: 0,
    totalAmount: 150,
    date: todayStr,
    status: 'Unpaid',
    paymentMethod: 'Pending at Billing Desk',
    paidAt: null
  },
  {
    id: 'INV-3004',
    appointmentId: 'APT-2004',
    patientId: 'PID-1004',
    patientName: 'David Chen',
    doctorName: 'Dr. James Wilson',
    department: 'General Medicine',
    consultationFee: 70,
    serviceTax: 0,
    totalAmount: 70,
    date: '2026-09-03',
    status: 'Paid',
    paymentMethod: 'Insurance Co-Pay',
    paidAt: new Date(Date.now() - 7000000).toISOString()
  },
  {
    id: 'INV-3005',
    appointmentId: 'APT-2005',
    patientId: 'PID-1005',
    patientName: 'Maya Patel',
    doctorName: 'Dr. Priya Sharma',
    department: 'Pediatrics',
    consultationFee: 85,
    serviceTax: 0,
    totalAmount: 85,
    date: '2026-09-03',
    status: 'Unpaid',
    paymentMethod: 'Pending at Billing Desk',
    paidAt: null
  }
];

// Helper functions for ID generation
function generatePatientId() {
  const existingNums = patients
    .map(p => parseInt(p.id.replace('PID-', ''), 10))
    .filter(n => !isNaN(n));
  const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1001;
  return `PID-${nextNum}`;
}

function generateAppointmentToken() {
  const existingNums = appointments
    .map(a => parseInt(a.id.replace('APT-', ''), 10))
    .filter(n => !isNaN(n));
  const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 2001;
  return `APT-${nextNum}`;
}

function generateInvoiceId() {
  const existingNums = invoices
    .map(i => parseInt(i.id.replace('INV-', ''), 10))
    .filter(n => !isNaN(n));
  const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 3001;
  return `INV-${nextNum}`;
}

// API Routes

// GET /api/stats: Return hospital summary metrics
app.get('/api/stats', (req, res) => {
  const today = getTodayDateString();
  const todayAppts = appointments.filter(a => a.date === today && a.status !== 'Cancelled');
  const paidInvoices = invoices.filter(i => i.status === 'Paid');
  const unpaidInvoices = invoices.filter(i => i.status === 'Unpaid');

  const totalRevenue = paidInvoices.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
  const pendingRevenue = unpaidInvoices.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);

  res.json({
    success: true,
    data: {
      totalPatients: patients.length,
      activeDoctors: doctors.length,
      todayAppointments: todayAppts.length,
      totalAppointments: appointments.length,
      totalRevenue: totalRevenue,
      pendingRevenue: pendingRevenue,
      totalInvoices: invoices.length,
      bedOccupancy: {
        occupied: 42,
        total: 50,
        percentage: 84
      },
      emergencyBeds: {
        available: 3,
        total: 8
      }
    }
  });
});

// GET /api/doctors: Fetch list of all active doctors and specialties
app.get('/api/doctors', (req, res) => {
  const { specialty } = req.query;
  let result = doctors;
  if (specialty && specialty !== 'All') {
    result = doctors.filter(d => d.specialty.toLowerCase() === specialty.toLowerCase());
  }
  res.json({
    success: true,
    data: result
  });
});

// GET /api/patients: Fetch registered patients list
app.get('/api/patients', (req, res) => {
  const { q, bloodGroup } = req.query;
  let result = [...patients];

  if (q && q.trim() !== '') {
    const query = q.toLowerCase().trim();
    result = result.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query) ||
      p.contact.toLowerCase().includes(query) ||
      (p.email && p.email.toLowerCase().includes(query)) ||
      (p.assignedDoctor && p.assignedDoctor.toLowerCase().includes(query))
    );
  }

  if (bloodGroup && bloodGroup !== 'All') {
    result = result.filter(p => p.bloodGroup === bloodGroup);
  }

  res.json({
    success: true,
    data: result.reverse() // show latest first
  });
});

// POST /api/patients/register: Add a new patient record (auto-generates PID-XXXX)
app.post('/api/patients/register', (req, res) => {
  const { name, age, gender, bloodGroup, contact, email, medicalHistory, assignedDoctor } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Patient name is required.' });
  }

  if (!contact || !contact.trim()) {
    return res.status(400).json({ success: false, message: 'Contact number is required.' });
  }

  const newPatientId = generatePatientId();
  const newPatient = {
    id: newPatientId,
    name: name.trim(),
    age: parseInt(age, 10) || 0,
    gender: gender || 'Unspecified',
    bloodGroup: bloodGroup || 'Unknown',
    contact: contact.trim(),
    email: (email && email.trim()) || `${name.trim().toLowerCase().replace(/\s+/g, '.')}@patient.pulse`,
    medicalHistory: (medicalHistory && medicalHistory.trim()) || 'No prior conditions noted',
    assignedDoctor: assignedDoctor || 'General Practitioner',
    registeredDate: getTodayDateString()
  };

  patients.push(newPatient);

  res.status(201).json({
    success: true,
    message: `Patient ${newPatient.name} registered successfully with ID ${newPatient.id}`,
    data: newPatient
  });
});

// GET /api/appointments: List all booked appointments
app.get('/api/appointments', (req, res) => {
  const { date, status, doctorId } = req.query;
  let result = [...appointments];

  if (date) {
    result = result.filter(a => a.date === date);
  }
  if (status && status !== 'All') {
    result = result.filter(a => a.status.toLowerCase() === status.toLowerCase());
  }
  if (doctorId && doctorId !== 'All') {
    result = result.filter(a => a.doctorId === doctorId);
  }

  res.json({
    success: true,
    data: result.reverse()
  });
});

// POST /api/appointments/book: Schedule a visit, validate doctor slot availability, auto-generate token and invoice
app.post('/api/appointments/book', (req, res) => {
  const {
    patientId,
    patientName,
    patientAge,
    patientGender,
    patientContact,
    doctorId,
    date,
    timeSlot,
    reason
  } = req.body;

  // Validation
  if (!patientName || !patientName.trim()) {
    return res.status(400).json({ success: false, message: 'Patient name is required.' });
  }
  if (!doctorId) {
    return res.status(400).json({ success: false, message: 'Please select a doctor.' });
  }
  if (!date) {
    return res.status(400).json({ success: false, message: 'Appointment date is required.' });
  }
  if (!timeSlot) {
    return res.status(400).json({ success: false, message: 'Please select an appointment time slot.' });
  }

  // Check doctor exists
  const doctor = doctors.find(d => d.id === doctorId);
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Selected doctor was not found.' });
  }

  // Validate slot availability (prevent duplicate booking for doctor on same date and time slot)
  const isSlotTaken = appointments.some(a =>
    a.doctorId === doctorId &&
    a.date === date &&
    a.timeSlot === timeSlot &&
    a.status !== 'Cancelled'
  );

  if (isSlotTaken) {
    return res.status(409).json({
      success: false,
      message: `Time slot ${timeSlot} on ${date} is already reserved for ${doctor.name}. Please select another slot.`
    });
  }

  // Resolve or Auto-Register Patient
  let resolvedPatient = null;
  if (patientId) {
    resolvedPatient = patients.find(p => p.id === patientId);
  }

  if (!resolvedPatient) {
    // Check if patient with same name and contact exists
    const existing = patients.find(p =>
      p.name.toLowerCase() === patientName.trim().toLowerCase() ||
      (patientContact && p.contact === patientContact.trim())
    );

    if (existing) {
      resolvedPatient = existing;
    } else {
      // Auto-register new patient in registry
      const newPid = generatePatientId();
      resolvedPatient = {
        id: newPid,
        name: patientName.trim(),
        age: parseInt(patientAge, 10) || 30,
        gender: patientGender || 'Unspecified',
        bloodGroup: 'Not Specified',
        contact: (patientContact && patientContact.trim()) || '+1 (555) 000-0000',
        email: `${patientName.trim().toLowerCase().replace(/\s+/g, '.')}@patient.pulse`,
        medicalHistory: reason ? `Visit: ${reason.trim()}` : 'Walk-in / Scheduled consultation',
        assignedDoctor: doctor.name,
        registeredDate: date
      };
      patients.push(resolvedPatient);
    }
  }

  // Generate Appointment Token (APT-XXXX)
  const appointmentToken = generateAppointmentToken();
  const newAppointment = {
    id: appointmentToken,
    patientId: resolvedPatient.id,
    patientName: resolvedPatient.name,
    patientAge: resolvedPatient.age,
    patientGender: resolvedPatient.gender,
    patientContact: resolvedPatient.contact,
    doctorId: doctor.id,
    doctorName: doctor.name,
    department: doctor.specialty,
    consultationFee: doctor.consultationFee,
    date: date,
    timeSlot: timeSlot,
    reason: (reason && reason.trim()) || 'Routine consultation',
    status: 'Scheduled',
    createdAt: new Date().toISOString()
  };

  appointments.push(newAppointment);

  // Auto-generate Matching Invoice (INV-XXXX)
  const invoiceId = generateInvoiceId();
  const newInvoice = {
    id: invoiceId,
    appointmentId: newAppointment.id,
    patientId: resolvedPatient.id,
    patientName: resolvedPatient.name,
    doctorName: doctor.name,
    department: doctor.specialty,
    consultationFee: doctor.consultationFee,
    serviceTax: 0,
    totalAmount: doctor.consultationFee,
    date: date,
    status: 'Unpaid',
    paymentMethod: 'Pending at Billing Desk',
    paidAt: null
  };

  invoices.push(newInvoice);

  res.status(201).json({
    success: true,
    message: `Appointment successfully booked with Token ${appointmentToken}`,
    data: {
      appointment: newAppointment,
      invoice: newInvoice,
      patient: resolvedPatient,
      doctor: doctor
    }
  });
});

// PATCH /api/appointments/:id/status: Update appointment status
app.patch('/api/appointments/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Scheduled', 'Completed', 'Cancelled'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  const appointment = appointments.find(a => a.id === id);
  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found.' });
  }

  appointment.status = status;

  res.json({
    success: true,
    message: `Appointment ${id} status updated to ${status}`,
    data: appointment
  });
});

// GET /api/invoices: List all billing receipts
app.get('/api/invoices', (req, res) => {
  const { status, q } = req.query;
  let result = [...invoices];

  if (status && status !== 'All') {
    result = result.filter(i => i.status.toLowerCase() === status.toLowerCase());
  }

  if (q && q.trim() !== '') {
    const query = q.toLowerCase().trim();
    result = result.filter(i =>
      i.id.toLowerCase().includes(query) ||
      i.appointmentId.toLowerCase().includes(query) ||
      i.patientName.toLowerCase().includes(query) ||
      i.doctorName.toLowerCase().includes(query)
    );
  }

  res.json({
    success: true,
    data: result.reverse()
  });
});

// PATCH /api/invoices/:id/pay: Mark invoice as Paid
app.patch('/api/invoices/:id/pay', (req, res) => {
  const { id } = req.params;
  const { paymentMethod } = req.body;

  const invoice = invoices.find(i => i.id === id);
  if (!invoice) {
    return res.status(404).json({ success: false, message: 'Invoice not found.' });
  }

  invoice.status = 'Paid';
  invoice.paymentMethod = paymentMethod || 'Cash / Counter Payment';
  invoice.paidAt = new Date().toISOString();

  res.json({
    success: true,
    message: `Invoice ${id} marked as Paid`,
    data: invoice
  });
});

// Fallback to serve index.html for Single-Page Application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  🏥 Hospital Management System (HMS) is running!`);
  console.log(`  📡 Server URL: http://localhost:${PORT}`);
  console.log(`  📁 Serving static files from ./public`);
  console.log(`====================================================`);
});
