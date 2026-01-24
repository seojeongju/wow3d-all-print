-- Reset Admin User
DELETE FROM users WHERE email = 'admin@wow3d.com';
INSERT INTO users (email, password_hash, name, role, phone) 
VALUES ('admin@wow3d.com', 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270', '최고관리자', 'admin', '010-0000-0000');
