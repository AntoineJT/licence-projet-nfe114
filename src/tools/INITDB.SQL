CREATE DATABASE CAPTCHAT COLLATE 'utf8mb4_general_ci';
CREATE USER 'captchat'@'localhost' IDENTIFIED BY 'LesChatsDominerontLeMonde4everTonight';
GRANT ALL PRIVILEGES ON captchat.* TO 'captchat'@'localhost';
