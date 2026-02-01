import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// ===== API ROUTES =====

// Get all services
app.get('/api/services', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM services WHERE is_active = 1 ORDER BY category, price'
  ).all()
  return c.json({ success: true, data: results })
})

// Get all customers
app.get('/api/customers', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, name, phone, email, loyalty_points, total_visits, created_at FROM customers ORDER BY created_at DESC'
  ).all()
  return c.json({ success: true, data: results })
})

// Get customer by phone
app.get('/api/customers/:phone', async (c) => {
  const phone = c.req.param('phone')
  const customer = await c.env.DB.prepare(
    'SELECT * FROM customers WHERE phone = ?'
  ).bind(phone).first()
  
  if (!customer) {
    return c.json({ success: false, message: 'Customer not found' }, 404)
  }
  return c.json({ success: true, data: customer })
})

// Create new customer
app.post('/api/customers', async (c) => {
  const { name, phone, email } = await c.req.json()
  
  // Generate referral code
  const referralCode = 'CRA' + Math.random().toString(36).substring(2, 8).toUpperCase()
  
  const result = await c.env.DB.prepare(
    'INSERT INTO customers (name, phone, email, referral_code) VALUES (?, ?, ?, ?)'
  ).bind(name, phone, email || null, referralCode).run()
  
  return c.json({ 
    success: true, 
    data: { id: result.meta.last_row_id, referralCode } 
  })
})

// Create new booking
app.post('/api/bookings', async (c) => {
  const { customer_id, booking_date, booking_time, service_id, addons, notes } = await c.req.json()
  
  // Get service price
  const service = await c.env.DB.prepare(
    'SELECT price FROM services WHERE id = ?'
  ).bind(service_id).first()
  
  let totalPrice = service.price
  
  // Calculate total with addons
  if (addons && addons.length > 0) {
    for (const addonId of addons) {
      const addon = await c.env.DB.prepare(
        'SELECT price FROM services WHERE id = ?'
      ).bind(addonId).first()
      totalPrice += addon.price
    }
  }
  
  // Create booking
  const bookingResult = await c.env.DB.prepare(
    'INSERT INTO bookings (customer_id, booking_date, booking_time, service_id, total_price, notes) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(customer_id, booking_date, booking_time, service_id, totalPrice, notes || null).run()
  
  const bookingId = bookingResult.meta.last_row_id
  
  // Add addons if any
  if (addons && addons.length > 0) {
    for (const addonId of addons) {
      const addon = await c.env.DB.prepare(
        'SELECT price FROM services WHERE id = ?'
      ).bind(addonId).first()
      
      await c.env.DB.prepare(
        'INSERT INTO booking_addons (booking_id, service_id, price) VALUES (?, ?, ?)'
      ).bind(bookingId, addonId, addon.price).run()
    }
  }
  
  return c.json({ success: true, data: { id: bookingId, totalPrice } })
})

// Get bookings by date
app.get('/api/bookings/:date', async (c) => {
  const date = c.req.param('date')
  
  const { results } = await c.env.DB.prepare(`
    SELECT 
      b.id, b.booking_date, b.booking_time, b.status, b.total_price, b.notes,
      c.name as customer_name, c.phone as customer_phone,
      s.name as service_name
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    JOIN services s ON b.service_id = s.id
    WHERE b.booking_date = ?
    ORDER BY b.booking_time
  `).bind(date).all()
  
  return c.json({ success: true, data: results })
})

// Update booking status
app.put('/api/bookings/:id/status', async (c) => {
  const id = c.req.param('id')
  const { status } = await c.req.json()
  
  await c.env.DB.prepare(
    'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(status, id).run()
  
  // If completed, update customer stats
  if (status === 'completed') {
    const booking = await c.env.DB.prepare(
      'SELECT customer_id FROM bookings WHERE id = ?'
    ).bind(id).first()
    
    await c.env.DB.prepare(
      'UPDATE customers SET total_visits = total_visits + 1, loyalty_points = loyalty_points + 1 WHERE id = ?'
    ).bind(booking.customer_id).run()
  }
  
  return c.json({ success: true })
})

// Get analytics dashboard data
app.get('/api/analytics', async (c) => {
  // Today's bookings
  const todayBookings = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM bookings WHERE booking_date = date('now', 'localtime')"
  ).first()
  
  // Today's revenue
  const todayRevenue = await c.env.DB.prepare(
    "SELECT SUM(total_price) as total FROM bookings WHERE booking_date = date('now', 'localtime') AND payment_status = 'paid'"
  ).first()
  
  // This month's stats
  const monthStats = await c.env.DB.prepare(
    "SELECT COUNT(*) as bookings, SUM(total_price) as revenue FROM bookings WHERE strftime('%Y-%m', booking_date) = strftime('%Y-%m', 'now', 'localtime')"
  ).first()
  
  // Popular services
  const popularServices = await c.env.DB.prepare(`
    SELECT s.name, COUNT(*) as count
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    GROUP BY s.id
    ORDER BY count DESC
    LIMIT 5
  `).all()
  
  return c.json({
    success: true,
    data: {
      today: {
        bookings: todayBookings.count || 0,
        revenue: todayRevenue.total || 0
      },
      month: {
        bookings: monthStats.bookings || 0,
        revenue: monthStats.revenue || 0
      },
      popularServices: popularServices.results
    }
  })
})

// ===== MAIN PAGE =====
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BOZQ Barbershop - Private Management Tools</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          .tab-content { display: none; }
          .tab-content.active { display: block; }
          .btn-primary { @apply bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition; }
        </style>
    </head>
    <body class="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white min-h-screen">
        <div class="container mx-auto px-4 py-8">
            <!-- Header -->
            <div class="bg-gradient-to-r from-yellow-600 to-yellow-800 rounded-xl shadow-2xl p-6 mb-8">
                <h1 class="text-4xl font-bold mb-2">
                    <i class="fas fa-cut mr-3"></i>
                    BOZQ BARBERSHOP
                </h1>
                <p class="text-yellow-100 text-lg">Private Management Tools - Kedungrandu, Patikraja</p>
            </div>

            <!-- Navigation Tabs -->
            <div class="flex flex-wrap gap-2 mb-6 bg-gray-800 p-2 rounded-lg">
                <button onclick="switchTab('dashboard')" class="tab-btn flex-1 py-3 px-4 rounded-lg bg-blue-600 text-white font-semibold transition">
                    <i class="fas fa-chart-line mr-2"></i>Dashboard
                </button>
                <button onclick="switchTab('booking')" class="tab-btn flex-1 py-3 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition">
                    <i class="fas fa-calendar-plus mr-2"></i>Booking
                </button>
                <button onclick="switchTab('customers')" class="tab-btn flex-1 py-3 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition">
                    <i class="fas fa-users mr-2"></i>Pelanggan
                </button>
                <button onclick="switchTab('services')" class="tab-btn flex-1 py-3 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition">
                    <i class="fas fa-scissors mr-2"></i>Layanan
                </button>
            </div>

            <!-- Dashboard Tab -->
            <div id="dashboard" class="tab-content active">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 shadow-xl">
                        <i class="fas fa-calendar-check text-4xl mb-3 opacity-80"></i>
                        <h3 class="text-lg mb-2">Booking Hari Ini</h3>
                        <p class="text-4xl font-bold" id="todayBookings">0</p>
                    </div>
                    <div class="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-6 shadow-xl">
                        <i class="fas fa-money-bill-wave text-4xl mb-3 opacity-80"></i>
                        <h3 class="text-lg mb-2">Revenue Hari Ini</h3>
                        <p class="text-4xl font-bold" id="todayRevenue">Rp 0</p>
                    </div>
                    <div class="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6 shadow-xl">
                        <i class="fas fa-calendar-alt text-4xl mb-3 opacity-80"></i>
                        <h3 class="text-lg mb-2">Booking Bulan Ini</h3>
                        <p class="text-4xl font-bold" id="monthBookings">0</p>
                    </div>
                    <div class="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-xl p-6 shadow-xl">
                        <i class="fas fa-chart-line text-4xl mb-3 opacity-80"></i>
                        <h3 class="text-lg mb-2">Revenue Bulan Ini</h3>
                        <p class="text-4xl font-bold" id="monthRevenue">Rp 0</p>
                    </div>
                </div>

                <div class="bg-gray-800 rounded-xl p-6 shadow-xl">
                    <h2 class="text-2xl font-bold mb-4">
                        <i class="fas fa-star mr-2 text-yellow-500"></i>
                        Layanan Terpopuler
                    </h2>
                    <div id="popularServices" class="space-y-2">
                        <!-- Popular services will be loaded here -->
                    </div>
                </div>
            </div>

            <!-- Booking Tab -->
            <div id="booking" class="tab-content">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Booking Form -->
                    <div class="bg-gray-800 rounded-xl p-6 shadow-xl">
                        <h2 class="text-2xl font-bold mb-6">
                            <i class="fas fa-calendar-plus mr-2"></i>
                            Buat Booking Baru
                        </h2>
                        <form id="bookingForm" class="space-y-4">
                            <div>
                                <label class="block mb-2 font-semibold">Nomor HP Pelanggan</label>
                                <input type="tel" id="customerPhone" class="w-full bg-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" placeholder="08123456789" required>
                                <button type="button" onclick="searchCustomer()" class="mt-2 text-blue-400 hover:text-blue-300">
                                    <i class="fas fa-search mr-1"></i>Cari Pelanggan
                                </button>
                            </div>
                            <div id="customerInfo" class="hidden bg-gray-700 rounded-lg p-4">
                                <p><strong>Nama:</strong> <span id="customerName"></span></p>
                                <p><strong>Poin Loyalty:</strong> <span id="customerPoints"></span></p>
                                <p><strong>Total Kunjungan:</strong> <span id="customerVisits"></span></p>
                            </div>
                            <div>
                                <label class="block mb-2 font-semibold">Tanggal</label>
                                <input type="date" id="bookingDate" class="w-full bg-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" required>
                            </div>
                            <div>
                                <label class="block mb-2 font-semibold">Jam</label>
                                <input type="time" id="bookingTime" class="w-full bg-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" required>
                            </div>
                            <div>
                                <label class="block mb-2 font-semibold">Paket Layanan</label>
                                <select id="serviceId" class="w-full bg-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" required>
                                    <!-- Services will be loaded here -->
                                </select>
                            </div>
                            <div>
                                <label class="block mb-2 font-semibold">Add-ons (opsional)</label>
                                <div id="addonsList" class="space-y-2">
                                    <!-- Addons will be loaded here -->
                                </div>
                            </div>
                            <div>
                                <label class="block mb-2 font-semibold">Catatan</label>
                                <textarea id="bookingNotes" class="w-full bg-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" rows="3" placeholder="Catatan khusus..."></textarea>
                            </div>
                            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition">
                                <i class="fas fa-check mr-2"></i>Buat Booking
                            </button>
                        </form>
                    </div>

                    <!-- Today's Bookings -->
                    <div class="bg-gray-800 rounded-xl p-6 shadow-xl">
                        <h2 class="text-2xl font-bold mb-6">
                            <i class="fas fa-list mr-2"></i>
                            Booking Hari Ini
                        </h2>
                        <div id="todayBookingsList" class="space-y-3">
                            <!-- Today's bookings will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Customers Tab -->
            <div id="customers" class="tab-content">
                <div class="bg-gray-800 rounded-xl p-6 shadow-xl">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold">
                            <i class="fas fa-users mr-2"></i>
                            Daftar Pelanggan
                        </h2>
                        <button onclick="showNewCustomerForm()" class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                            <i class="fas fa-user-plus mr-2"></i>Tambah Pelanggan
                        </button>
                    </div>
                    <div id="customersList" class="overflow-x-auto">
                        <!-- Customers table will be loaded here -->
                    </div>
                </div>
            </div>

            <!-- Services Tab -->
            <div id="services" class="tab-content">
                <div class="bg-gray-800 rounded-xl p-6 shadow-xl">
                    <h2 class="text-2xl font-bold mb-6">
                        <i class="fas fa-scissors mr-2"></i>
                        Daftar Layanan & Harga
                    </h2>
                    <div id="servicesList" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Services will be loaded here -->
                    </div>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
