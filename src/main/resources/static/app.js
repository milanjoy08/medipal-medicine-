// Check Auth
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));
if (!token || !user) {
    window.location.href = '/index.html';
}

document.getElementById('userInfo').innerText = `Hello, ${user.name}`;

// Generic Fetch Wrapper
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
    if (body) options.body = JSON.stringify(body);
    
    try {
        const res = await fetch(endpoint, options);
        if (res.status === 401 || res.status === 403) {
            logout();
        }
        return await res.json();
    } catch (e) {
        console.error(e);
        return null;
    }
}

function logout() {
    localStorage.clear();
    window.location.href = '/index.html';
}

// Router
function navigate(view) {
    document.getElementById('pageTitle').innerText = view.charAt(0).toUpperCase() + view.slice(1);
    const container = document.getElementById('app-view');
    container.innerHTML = '<div class="text-center text-gray-500">Loading...</div>';
    
    if (view === 'dashboard') renderDashboard();
    else if (view === 'medicines') renderMedicines();
    else if (view === 'calendar') renderCalendar();
    else if (view === 'appointments') renderAppointments();
    else if (view === 'reports') renderReports();
}

// Views
async function renderDashboard() {
    const data = await apiCall('/api/dashboard');
    if (!data) return;

    let lowStockHtml = data.lowStock.length === 0 ? '<p class="text-gray-500 text-sm">All stocks are normal.</p>' : 
        data.lowStock.map(m => `<div class="p-3 bg-red-100 text-red-800 rounded mb-2">⚠️ ${m.name} is running low (${m.stock} left)</div>`).join('');

    const html = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-6 rounded-xl shadow border-l-4 border-blue-500">
                <div class="text-sm text-gray-500">Scheduled Today</div>
                <div class="text-3xl font-bold">${data.total}</div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow border-l-4 border-green-500">
                <div class="text-sm text-gray-500">Taken</div>
                <div class="text-3xl font-bold">${data.taken}</div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow border-l-4 border-red-500">
                <div class="text-sm text-gray-500">Missed</div>
                <div class="text-3xl font-bold">${data.missed}</div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow border-l-4 border-purple-500">
                <div class="text-sm text-gray-500">Adherence</div>
                <div class="text-3xl font-bold">${data.adherence}%</div>
                <div class="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div class="bg-purple-600 h-2.5 rounded-full" style="width: ${data.adherence}%"></div>
                </div>
            </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white p-6 rounded-xl shadow">
                <h3 class="text-lg font-bold mb-4">Stock Alerts</h3>
                ${lowStockHtml}
            </div>
            <div class="bg-white p-6 rounded-xl shadow">
                <h3 class="text-lg font-bold mb-4">Quick Actions</h3>
                <button onclick="navigate('medicines')" class="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 block w-full mb-2">Add New Medicine</button>
                <button onclick="navigate('appointments')" class="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 block w-full">Book Appointment</button>
            </div>
        </div>
    `;
    document.getElementById('app-view').innerHTML = html;
}

async function renderMedicines() {
    const meds = await apiCall('/api/medicines');
    let listHtml = meds.map(m => `
        <div class="bg-white p-4 rounded shadow border-l-4 ${m.stock <= m.minStock ? 'border-red-500' : 'border-green-500'} flex justify-between items-center mb-4">
            <div>
                <h4 class="font-bold text-lg">${m.name} <span class="text-sm font-normal text-gray-500">(${m.type})</span></h4>
                <p class="text-sm text-gray-600">Dosage: ${m.dosage} | Reminders: ${m.reminderTimes}</p>
                <p class="text-sm text-gray-600">Stock: ${m.stock} ${m.stock <= m.minStock ? '<span class="text-red-500 font-bold">(Low)</span>' : ''}</p>
            </div>
            <div>
                <button class="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200" onclick="markTaken(${m.id})">Mark Taken Now</button>
            </div>
        </div>
    `).join('');

    if (listHtml === '') listHtml = '<p class="text-gray-500 text-center py-4">No medicines added yet.</p>';

    const html = `
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-bold">Your Medicines</h3>
            <button onclick="showAddMedicineForm()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow">+ Add Medicine</button>
        </div>
        <div id="addMedFormContainer" class="hidden bg-white p-6 rounded shadow mb-6">
            <h4 class="font-bold mb-4 border-b pb-2">Add New Medicine</h4>
            <form onsubmit="addMedicine(event)" class="grid grid-cols-2 gap-4">
                <input type="text" id="m_name" placeholder="Medicine Name" required class="border p-2 rounded">
                <input type="text" id="m_dosage" placeholder="Dosage (e.g., 500mg)" required class="border p-2 rounded">
                <select id="m_type" class="border p-2 rounded">
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                </select>
                <input type="text" id="m_frequency" placeholder="Frequency (e.g., Once a day)" class="border p-2 rounded">
                <input type="number" id="m_stock" placeholder="Current Stock" required class="border p-2 rounded">
                <input type="number" id="m_minStock" placeholder="Min Stock Alert Level" required class="border p-2 rounded">
                <input type="time" id="m_reminder" required class="border p-2 rounded">
                <input type="date" id="m_expiry" required class="border p-2 rounded">
                <div class="col-span-2">
                    <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded">Save</button>
                    <button type="button" onclick="hideAddMedicineForm()" class="bg-gray-400 text-white px-4 py-2 rounded ml-2">Cancel</button>
                </div>
            </form>
        </div>
        <div>${listHtml}</div>
    `;
    document.getElementById('app-view').innerHTML = html;
}

function showAddMedicineForm() { document.getElementById('addMedFormContainer').classList.remove('hidden'); }
function hideAddMedicineForm() { document.getElementById('addMedFormContainer').classList.add('hidden'); }

async function addMedicine(e) {
    e.preventDefault();
    const payload = {
        name: document.getElementById('m_name').value,
        dosage: document.getElementById('m_dosage').value,
        type: document.getElementById('m_type').value,
        frequency: document.getElementById('m_frequency').value,
        stock: parseInt(document.getElementById('m_stock').value),
        minStock: parseInt(document.getElementById('m_minStock').value),
        reminderTimes: document.getElementById('m_reminder').value,
        expiryDate: document.getElementById('m_expiry').value
    };
    await apiCall('/api/medicines', 'POST', payload);
    renderMedicines();
}

async function markTaken(medicineId) {
    const payload = { medicineId, scheduledTime: new Date().toISOString(), status: 'taken' };
    await apiCall('/api/history', 'POST', payload);
    alert('Dose recorded and stock updated!');
    renderMedicines();
}

async function renderCalendar() {
    const history = await apiCall('/api/history');
    let hList = history.map(h => `
        <li class="p-3 border-b border-gray-100 flex justify-between">
            <span><strong>${h.name}</strong> (${h.dosage})</span>
            <span class="text-sm ${h.status === 'taken' ? 'text-green-600' : 'text-red-600'} font-bold uppercase">${h.status}</span>
        </li>
    `).join('');
    
    document.getElementById('app-view').innerHTML = `
        <div class="bg-white p-6 rounded shadow max-w-2xl mx-auto">
            <h3 class="text-xl font-bold mb-4">Medication History</h3>
            <ul class="space-y-2">${hList || '<p class="text-gray-500">No history found.</p>'}</ul>
        </div>
    `;
}

async function renderAppointments() {
    const appts = await apiCall('/api/appointments');
    let listHtml = appts.map(a => `
        <div class="bg-white p-4 rounded shadow border-l-4 border-indigo-500 mb-4">
            <h4 class="font-bold text-lg">${a.doctorName} <span class="text-sm font-normal text-gray-500">@ ${a.hospital}</span></h4>
            <p class="text-sm text-gray-600">Date: ${a.appointmentDate} | Time: ${a.appointmentTime}</p>
            <p class="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">${a.reason}</p>
        </div>
    `).join('');

    const html = `
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-bold">Appointments</h3>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>${listHtml || '<p class="text-gray-500">No upcoming appointments.</p>'}</div>
            <div class="bg-white p-6 rounded shadow h-fit">
                <h4 class="font-bold mb-4 border-b pb-2">Book New</h4>
                <form onsubmit="addAppointment(event)" class="space-y-4">
                    <input type="text" id="a_doc" placeholder="Doctor Name" required class="w-full border p-2 rounded">
                    <input type="text" id="a_hosp" placeholder="Hospital/Clinic" required class="w-full border p-2 rounded">
                    <input type="date" id="a_date" required class="w-full border p-2 rounded">
                    <input type="time" id="a_time" required class="w-full border p-2 rounded">
                    <textarea id="a_reason" placeholder="Reason for visit" class="w-full border p-2 rounded"></textarea>
                    <button type="submit" class="w-full bg-indigo-600 text-white px-4 py-2 rounded">Save Appointment</button>
                </form>
            </div>
        </div>
    `;
    document.getElementById('app-view').innerHTML = html;
}

async function addAppointment(e) {
    e.preventDefault();
    const payload = {
        doctorName: document.getElementById('a_doc').value,
        hospital: document.getElementById('a_hosp').value,
        appointmentDate: document.getElementById('a_date').value,
        appointmentTime: document.getElementById('a_time').value,
        reason: document.getElementById('a_reason').value
    };
    await apiCall('/api/appointments', 'POST', payload);
    renderAppointments();
}

function renderReports() {
    document.getElementById('app-view').innerHTML = `
        <div class="text-center py-20">
            <h2 class="text-3xl font-bold mb-4">Health Reports</h2>
            <p class="text-gray-600 mb-8 max-w-md mx-auto">Generate a comprehensive PDF report containing your medication adherence, history, and upcoming appointments. Ideal for sharing with your doctor.</p>
            <a href="/api/report/pdf" download="health_report.pdf" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg shadow inline-flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Download PDF Report
            </a>
        </div>
    `;
}

// Init
navigate('dashboard');
