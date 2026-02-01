# BOZQ BARBERSHOP - Private Management Tools

## 🎯 Project Overview
**BOZQ Barbershop Private Management Tools** adalah sistem manajemen internal untuk Bhaimna CRA Barbershop di Kedungrandu, Patikraja, Banyumas. Tools ini dirancang untuk mengelola booking, customer database, loyalty program, dan analytics secara efisien.

## 🚀 Production URLs
- **Production**: https://bozq-barbershop.pages.dev
- **Latest Deploy**: https://a87bbacf.bozq-barbershop.pages.dev
- **GitHub Repository**: https://github.com/Estes786/private-tools-barbershop

## ✨ Fitur Utama

### 1. **Dashboard Analytics**
- Real-time booking statistics (hari ini & bulan ini)
- Revenue tracking
- Layanan terpopuler
- Visualisasi data untuk decision making

### 2. **Booking Management System**
- Interface booking yang mudah digunakan
- Search customer by phone number
- Auto-create customer jika belum terdaftar
- Pilihan paket layanan (Basic, Clean, Full)
- Multiple add-ons selection
- Status tracking (Pending, Confirmed, Completed, Cancelled)
- Today's booking list dengan update status

### 3. **Customer Database & CRM**
- Customer profiles dengan data lengkap
- Loyalty points tracking otomatis
- Total visits counter
- Unique referral code per customer
- Referral program tracking

### 4. **Service & Pricing Management**
- **Paket Layanan:**
  - Basic: Rp 25.000 (Haircut + Sikat kotor)
  - Clean: Rp 35.000 (Haircut + Hairwash + Sikat)
  - Full: Rp 45.000 (Haircut + Hairwash + Styling + Sikat)

- **Add-ons:**
  - Sauna Wajah: Rp 10.000
  - Scalp Treatment: Rp 15.000
  - Perm Pria: Rp 80.000
  - Hairspa + Massage: Rp 55.000

### 5. **Loyalty Program**
- Automatic points per booking
- Visit counter tracking
- Referral system dengan kode unik
- Ready untuk reward system

## 🗂️ Data Architecture

### Database Schema (Cloudflare D1)
- **customers**: Customer data & loyalty information
- **services**: Service catalog & pricing
- **bookings**: Booking records & scheduling
- **booking_addons**: Many-to-many relationship untuk add-ons
- **reviews**: Customer reviews & ratings
- **loyalty_transactions**: Points transaction history

### Storage Services
- **Cloudflare D1**: Relational database (SQLite)
- **Cloudflare Pages**: Static hosting & edge functions
- **Cloudflare Workers**: API backend runtime

## 📊 API Endpoints

### Services
- `GET /api/services` - Get all active services
- Response: `{ success: true, data: [...] }`

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:phone` - Search by phone
- `POST /api/customers` - Create new customer
  - Body: `{ name, phone, email? }`

### Bookings
- `POST /api/bookings` - Create new booking
  - Body: `{ customer_id, booking_date, booking_time, service_id, addons?, notes? }`
- `GET /api/bookings/:date` - Get bookings by date
- `PUT /api/bookings/:id/status` - Update booking status
  - Body: `{ status: "pending" | "confirmed" | "completed" | "cancelled" }`

### Analytics
- `GET /api/analytics` - Get dashboard statistics
- Response:
  ```json
  {
    "today": { "bookings": 0, "revenue": 0 },
    "month": { "bookings": 0, "revenue": 0 },
    "popularServices": [...]
  }
  ```

## 👥 User Guide

### Untuk Staff Barbershop:

1. **Dashboard Tab**: Lihat statistik harian & bulanan
2. **Booking Tab**: 
   - Input nomor HP pelanggan
   - Klik "Cari Pelanggan" 
   - Jika baru, buat customer baru
   - Pilih tanggal, jam, paket, dan add-ons
   - Klik "Buat Booking"
3. **Pelanggan Tab**: Lihat database semua pelanggan
4. **Layanan Tab**: Lihat daftar layanan & harga

### Workflow Booking:
1. Customer datang/telepon
2. Staff cari by nomor HP
3. Buat booking baru dengan detail
4. Track status booking
5. Update status saat completed
6. Loyalty points otomatis bertambah

## 🔧 Tech Stack
- **Framework**: Hono v4.11.7
- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Frontend**: Vanilla JavaScript + TailwindCSS + Font Awesome
- **Build Tool**: Vite v6.4.1
- **Deployment**: Cloudflare Pages

## 📈 Current Status
- ✅ **Deployed**: Active on Cloudflare Pages
- ✅ **Database**: Production D1 database setup & seeded
- ✅ **GitHub**: Synced with repository
- ✅ **API**: All endpoints tested & working

## 🚀 Next Steps & Recommendations

### Priority 1: Operational Excellence
1. **WhatsApp Integration**
   - Setup WhatsApp Business API
   - Auto-reply untuk booking confirmation
   - Reminder h-1 sebelum appointment

2. **Google Business Profile Integration**
   - Export before-after photos
   - Auto-reminder untuk review
   - Track review metrics

### Priority 2: Enhanced Features
3. **Payment Tracking**
   - Payment status management
   - Cash/transfer tracking
   - Daily closing report

4. **Staff Management**
   - Multi-staff scheduling
   - Staff performance tracking
   - Commission calculation

### Priority 3: Marketing Tools
5. **Promo & Campaign Management**
   - Special day discounts
   - Loyalty rewards redemption
   - Referral bonus automation

6. **Report & Export**
   - PDF invoice generation
   - Monthly revenue reports
   - Customer analytics export

## 🔐 Security Notes
- Private tools - tidak untuk public access
- Database credentials via environment variables
- API token secured in Cloudflare
- GitHub repository: private

## 📱 Mobile Responsive
Interface fully responsive untuk:
- Desktop/Laptop (optimal view)
- Tablet
- Mobile phone (touch-optimized)

## 🛠️ Development

### Local Development
```bash
# Install dependencies
npm install

# Apply migrations
npm run db:migrate:local

# Start dev server
npm run dev:sandbox

# Access at http://localhost:3000
```

### Production Deployment
```bash
# Build project
npm run build

# Deploy to Cloudflare Pages
npm run deploy:prod

# Apply migrations to production
npm run db:migrate:prod
```

## 📝 Database Migrations
- Migration files: `/migrations/`
- Seed data: `seed.sql`
- Local DB: `.wrangler/state/v3/d1/`

## 🎨 UI/UX Features
- Dark theme dengan gradient colors
- Tab-based navigation
- Real-time status updates
- Interactive forms dengan validation
- Responsive card layouts
- Icon-based visual hierarchy

## 📞 Support & Maintenance
Untuk update, bug fixes, atau feature requests:
1. Akses GitHub repository
2. Create issue atau pull request
3. Update via Cloudflare Pages dashboard

---

**Last Updated**: 2026-02-01  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

**Developed for Bhaimna CRA Barbershop, Kedungrandu, Patikraja, Banyumas**
