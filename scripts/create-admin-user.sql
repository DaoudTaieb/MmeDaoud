-- Créer un utilisateur admin avec mot de passe hashé
-- Mot de passe: admin123

USE construction_management;

-- Supprimer l'utilisateur existant s'il existe
DELETE FROM users WHERE username = 'admin';

-- Insérer le nouvel utilisateur avec le bon hash
INSERT INTO users (username, password) VALUES 
('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBVWEiA/6p2LW6');

-- Vérifier que l'utilisateur a été créé
SELECT * FROM users WHERE username = 'admin';
