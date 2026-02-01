-- Insert default service packages
INSERT INTO services (name, category, price, description, duration_minutes) VALUES
  ('Basic', 'package', 25000, 'Haircut + Sikat kotor', 30),
  ('Clean', 'package', 35000, 'Haircut + Hairwash + Sikat', 40),
  ('Full', 'package', 45000, 'Haircut + Hairwash + Styling + Sikat', 50);

-- Insert add-on services
INSERT INTO services (name, category, price, description, duration_minutes) VALUES
  ('Sauna Wajah', 'addon', 10000, 'Sauna wajah uap', 10),
  ('Scalp Treatment', 'addon', 15000, 'Scalp treatment quick (5 menit)', 5),
  ('Perm Pria', 'addon', 80000, 'Keriting lembut', 60),
  ('Hairspa + Massage', 'addon', 55000, 'Hairspa + massage 20 menit', 20);

-- Insert sample customer for testing
INSERT INTO customers (name, phone, email, loyalty_points, total_visits, referral_code) VALUES
  ('Test Customer', '081234567890', 'test@example.com', 0, 0, 'TEST001');
