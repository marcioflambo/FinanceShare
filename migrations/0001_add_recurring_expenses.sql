-- Add recurring transaction fields to expenses table
ALTER TABLE expenses ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE expenses ADD COLUMN recurring_type TEXT;
ALTER TABLE expenses ADD COLUMN recurring_frequency TEXT;
ALTER TABLE expenses ADD COLUMN recurring_interval INTEGER DEFAULT 1;
ALTER TABLE expenses ADD COLUMN installment_total INTEGER;
ALTER TABLE expenses ADD COLUMN installment_current INTEGER;
ALTER TABLE expenses ADD COLUMN recurring_end_date TIMESTAMP;
ALTER TABLE expenses ADD COLUMN parent_expense_id INTEGER;