INSERT INTO users (name, email, password_hash, role, phone)
VALUES
  ('Admin User', 'admin@hospital.com', '$2a$10$NIsBCG6hLp9viVEEHcTksucwAw.fU3kgo4z49yPek7W3.fqZX/Loq', 'admin', '9999999999'),
  ('Dr. Smith', 'doctor@hospital.com', '$2a$10$NIsBCG6hLp9viVEEHcTksucwAw.fU3kgo4z49yPek7W3.fqZX/Loq', 'doctor', '8888888888'),
  ('John Patient', 'patient@hospital.com', '$2a$10$NIsBCG6hLp9viVEEHcTksucwAw.fU3kgo4z49yPek7W3.fqZX/Loq', 'patient', '7777777777')
ON CONFLICT (email) DO NOTHING;

INSERT INTO appointments (patient_id, doctor_id, date, reason, status)
SELECT p.id, d.id, CURRENT_DATE + INTERVAL '1 day', 'General checkup', 'pending'
FROM users p, users d
WHERE p.email = 'patient@hospital.com' AND d.email = 'doctor@hospital.com'
AND NOT EXISTS (
  SELECT 1 FROM appointments a
  WHERE a.patient_id = p.id
    AND a.doctor_id = d.id
    AND a.reason = 'General checkup'
);

INSERT INTO medical_records (patient_id, doctor_id, diagnosis, prescription, notes, date)
SELECT p.id, d.id, 'Seasonal flu', 'Paracetamol twice daily', 'Rest and stay hydrated', CURRENT_DATE - INTERVAL '2 day'
FROM users p, users d
WHERE p.email = 'patient@hospital.com' AND d.email = 'doctor@hospital.com'
AND NOT EXISTS (
  SELECT 1 FROM medical_records mr
  WHERE mr.patient_id = p.id
    AND mr.doctor_id = d.id
    AND mr.diagnosis = 'Seasonal flu'
);

-- Default password for sample users: Password@123
