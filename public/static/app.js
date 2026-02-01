// Global state
let currentCustomerId = null;
let services = [];
let addons = [];

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await loadServices();
    await loadAnalytics();
    await loadCustomers();
    setTodayDate();
});

// Tab switching
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active state from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600');
        btn.classList.add('bg-gray-700');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Highlight active button
    event.target.classList.remove('bg-gray-700');
    event.target.classList.add('bg-blue-600');
    
    // Reload data for specific tabs
    if (tabName === 'dashboard') {
        loadAnalytics();
    } else if (tabName === 'booking') {
        loadTodayBookings();
    } else if (tabName === 'customers') {
        loadCustomers();
    }
}

// Load services
async function loadServices() {
    try {
        const response = await axios.get('/api/services');
        const allServices = response.data.data;
        
        services = allServices.filter(s => s.category === 'package');
        addons = allServices.filter(s => s.category === 'addon');
        
        // Populate service select
        const serviceSelect = document.getElementById('serviceId');
        serviceSelect.innerHTML = services.map(s => 
            `<option value="${s.id}">${s.name} - Rp ${s.price.toLocaleString('id-ID')}</option>`
        ).join('');
        
        // Populate addons checkboxes
        const addonsList = document.getElementById('addonsList');
        addonsList.innerHTML = addons.map(a => `
            <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-600 p-2 rounded">
                <input type="checkbox" value="${a.id}" class="addon-checkbox w-5 h-5 text-blue-600">
                <span>${a.name} - Rp ${a.price.toLocaleString('id-ID')}</span>
            </label>
        `).join('');
        
        // Load services tab
        const servicesList = document.getElementById('servicesList');
        servicesList.innerHTML = allServices.map(s => `
            <div class="bg-gray-700 rounded-lg p-4 ${s.category === 'package' ? 'border-l-4 border-blue-500' : 'border-l-4 border-green-500'}">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-xl font-bold">${s.name}</h3>
                    <span class="text-2xl font-bold text-yellow-400">Rp ${s.price.toLocaleString('id-ID')}</span>
                </div>
                <p class="text-gray-300 mb-2">${s.description}</p>
                <div class="flex items-center text-sm text-gray-400">
                    <i class="fas fa-clock mr-2"></i>
                    ${s.duration_minutes} menit
                    <span class="ml-4 px-2 py-1 rounded ${s.category === 'package' ? 'bg-blue-900 text-blue-200' : 'bg-green-900 text-green-200'}">
                        ${s.category === 'package' ? 'Paket' : 'Add-on'}
                    </span>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

// Load analytics
async function loadAnalytics() {
    try {
        const response = await axios.get('/api/analytics');
        const data = response.data.data;
        
        document.getElementById('todayBookings').textContent = data.today.bookings;
        document.getElementById('todayRevenue').textContent = `Rp ${data.today.revenue.toLocaleString('id-ID')}`;
        document.getElementById('monthBookings').textContent = data.month.bookings;
        document.getElementById('monthRevenue').textContent = `Rp ${data.month.revenue.toLocaleString('id-ID')}`;
        
        // Popular services
        const popularServices = document.getElementById('popularServices');
        if (data.popularServices.length > 0) {
            popularServices.innerHTML = data.popularServices.map((s, i) => `
                <div class="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                    <div class="flex items-center">
                        <span class="text-2xl font-bold text-yellow-500 mr-3">#${i + 1}</span>
                        <span class="text-lg">${s.name}</span>
                    </div>
                    <span class="bg-blue-600 px-3 py-1 rounded-full font-semibold">${s.count} kali</span>
                </div>
            `).join('');
        } else {
            popularServices.innerHTML = '<p class="text-gray-400">Belum ada data layanan</p>';
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Load customers
async function loadCustomers() {
    try {
        const response = await axios.get('/api/customers');
        const customers = response.data.data;
        
        const customersList = document.getElementById('customersList');
        if (customers.length > 0) {
            customersList.innerHTML = `
                <table class="w-full text-left">
                    <thead class="bg-gray-700">
                        <tr>
                            <th class="p-3">Nama</th>
                            <th class="p-3">HP</th>
                            <th class="p-3">Email</th>
                            <th class="p-3">Poin</th>
                            <th class="p-3">Kunjungan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${customers.map(c => `
                            <tr class="border-t border-gray-700 hover:bg-gray-700">
                                <td class="p-3">${c.name}</td>
                                <td class="p-3">${c.phone}</td>
                                <td class="p-3">${c.email || '-'}</td>
                                <td class="p-3"><span class="bg-yellow-600 px-2 py-1 rounded">${c.loyalty_points}</span></td>
                                <td class="p-3">${c.total_visits}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            customersList.innerHTML = '<p class="text-gray-400">Belum ada pelanggan</p>';
        }
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

// Search customer by phone
async function searchCustomer() {
    const phone = document.getElementById('customerPhone').value.trim();
    
    if (!phone) {
        alert('Masukkan nomor HP');
        return;
    }
    
    try {
        const response = await axios.get(`/api/customers/${phone}`);
        const customer = response.data.data;
        
        currentCustomerId = customer.id;
        document.getElementById('customerInfo').classList.remove('hidden');
        document.getElementById('customerName').textContent = customer.name;
        document.getElementById('customerPoints').textContent = customer.loyalty_points;
        document.getElementById('customerVisits').textContent = customer.total_visits;
        
    } catch (error) {
        if (error.response && error.response.status === 404) {
            // Customer not found, ask to create new
            const create = confirm('Pelanggan tidak ditemukan. Buat pelanggan baru?');
            if (create) {
                const name = prompt('Nama pelanggan:');
                if (name) {
                    await createCustomer(name, phone);
                }
            }
        } else {
            alert('Error: ' + error.message);
        }
    }
}

// Create new customer
async function createCustomer(name, phone) {
    try {
        const response = await axios.post('/api/customers', {
            name,
            phone,
            email: null
        });
        
        currentCustomerId = response.data.data.id;
        alert(`Pelanggan baru berhasil dibuat! Kode referral: ${response.data.data.referralCode}`);
        
        // Reload customer info
        await searchCustomer();
        
    } catch (error) {
        alert('Error membuat pelanggan: ' + error.message);
    }
}

// Show new customer form
function showNewCustomerForm() {
    const name = prompt('Nama pelanggan:');
    if (!name) return;
    
    const phone = prompt('Nomor HP:');
    if (!phone) return;
    
    const email = prompt('Email (opsional):');
    
    createCustomer(name, phone, email);
}

// Handle booking form submission
document.getElementById('bookingForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!currentCustomerId) {
        alert('Cari pelanggan terlebih dahulu atau buat pelanggan baru');
        return;
    }
    
    const bookingDate = document.getElementById('bookingDate').value;
    const bookingTime = document.getElementById('bookingTime').value;
    const serviceId = document.getElementById('serviceId').value;
    const notes = document.getElementById('bookingNotes').value;
    
    // Get selected addons
    const selectedAddons = Array.from(document.querySelectorAll('.addon-checkbox:checked'))
        .map(cb => parseInt(cb.value));
    
    try {
        const response = await axios.post('/api/bookings', {
            customer_id: currentCustomerId,
            booking_date: bookingDate,
            booking_time: bookingTime,
            service_id: parseInt(serviceId),
            addons: selectedAddons,
            notes: notes || null
        });
        
        alert(`Booking berhasil dibuat! Total: Rp ${response.data.data.totalPrice.toLocaleString('id-ID')}`);
        
        // Reset form
        document.getElementById('bookingForm').reset();
        document.getElementById('customerInfo').classList.add('hidden');
        currentCustomerId = null;
        setTodayDate();
        
        // Reload bookings
        await loadTodayBookings();
        await loadAnalytics();
        
    } catch (error) {
        alert('Error membuat booking: ' + error.message);
    }
});

// Load today's bookings
async function loadTodayBookings() {
    const today = new Date().toISOString().split('T')[0];
    
    try {
        const response = await axios.get(`/api/bookings/${today}`);
        const bookings = response.data.data;
        
        const bookingsList = document.getElementById('todayBookingsList');
        if (bookings.length > 0) {
            bookingsList.innerHTML = bookings.map(b => `
                <div class="bg-gray-700 rounded-lg p-4 ${b.status === 'completed' ? 'opacity-60' : ''}">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h3 class="font-bold text-lg">${b.customer_name}</h3>
                            <p class="text-sm text-gray-300">${b.customer_phone}</p>
                        </div>
                        <span class="text-xl font-bold">${b.booking_time}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-yellow-400 font-semibold">${b.service_name}</p>
                            <p class="text-green-400 font-bold">Rp ${b.total_price.toLocaleString('id-ID')}</p>
                        </div>
                        <select onchange="updateBookingStatus(${b.id}, this.value)" class="bg-gray-600 rounded px-3 py-1">
                            <option value="pending" ${b.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="completed" ${b.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                    ${b.notes ? `<p class="mt-2 text-sm text-gray-400 italic">${b.notes}</p>` : ''}
                </div>
            `).join('');
        } else {
            bookingsList.innerHTML = '<p class="text-gray-400">Belum ada booking hari ini</p>';
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

// Update booking status
async function updateBookingStatus(bookingId, status) {
    try {
        await axios.put(`/api/bookings/${bookingId}/status`, { status });
        await loadTodayBookings();
        await loadAnalytics();
    } catch (error) {
        alert('Error updating status: ' + error.message);
    }
}

// Set today's date as default
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
        dateInput.value = today;
    }
}
