-- Optional manual SQL seed file.
-- Intentionally left without demo users or sample finance data.
-- Use the application registration flow to create real users.

INSERT INTO categories (user_id, name, type, color, icon)
VALUES
('00000000-0000-0000-0000-000000000001', 'Salary', 'INCOME', '#16a34a', 'BadgeIndianRupee'),
('00000000-0000-0000-0000-000000000001', 'Food', 'EXPENSE', '#f59e0b', 'UtensilsCrossed'),
('00000000-0000-0000-0000-000000000001', 'Transport', 'EXPENSE', '#3b82f6', 'CarFront'),
('00000000-0000-0000-0000-000000000001', 'Rent', 'EXPENSE', '#ef4444', 'House')
ON CONFLICT (user_id, type, name) DO NOTHING;

