CREATE DATABASE IF NOT EXISTS AW_24;

USE AW_24;

-- Table creation
CREATE TABLE IF NOT EXISTS Faculty (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(255) NOT NULL,
    University VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS Role (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS User (
    Email VARCHAR(255) PRIMARY KEY,
    FullName VARCHAR(255) NOT NULL,
    Phone VARCHAR(20),
    FacultyID INT,
    FOREIGN KEY (FacultyID) REFERENCES Faculty(ID)
);

CREATE TABLE IF NOT EXISTS UserAuthentication (
    Email VARCHAR(255) PRIMARY KEY,
    Password VARCHAR(255),
    RoleID INT NOT NULL,
    FOREIGN KEY (RoleID) REFERENCES Role(ID),
    FOREIGN KEY (Email) REFERENCES User(Email)
);

CREATE TABLE IF NOT EXISTS EventType (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS Event (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    Title VARCHAR(255) NOT NULL,
    Description TEXT,
    DateTime DATETIME NOT NULL,
    Location VARCHAR(255),
    Capacity INT,
    EventTypeID INT,
    FOREIGN KEY (EventTypeID) REFERENCES EventType(ID)
);

CREATE TABLE IF NOT EXISTS Notifications (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    EventID INT,
    UserEmail VARCHAR(255),
    Message TEXT NOT NULL,
    FOREIGN KEY (EventID) REFERENCES Event(ID),
    FOREIGN KEY (UserEmail) REFERENCES User(Email)
);

CREATE TABLE IF NOT EXISTS Enrollment (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    EventID INT,
    UserEmail VARCHAR(255),
    FOREIGN KEY (EventID) REFERENCES Event(ID),
    FOREIGN KEY (UserEmail) REFERENCES User(Email)
);

-- Inserción de datos en Facultad
INSERT INTO Faculty (Name, University) VALUES 
('Facultad de Ingeniería', 'Universidad Complutense de Madrid');

-- Inserción de roles limitados
INSERT INTO Role (Name) VALUES  
('organizador'),
('usuario');

-- Inserción de tipos de eventos permitidos
INSERT INTO EventType (Name) VALUES 
('taller'),
('conferencia'),
('seminario');

-- Inserción de usuarios (2 organizadores y varios usuarios)
INSERT INTO User (Email, FullName, Phone, FacultyID) VALUES 
('ana.martinez@ucm.es', 'Ana Martínez', '600123456', 1), -- Organizadora
('luis.sanchez@ucm.es', 'Luis Sánchez', '600234567', 1), -- Organizador
('carlos.lopez@ucm.es', 'Carlos López', '600345678', 1), -- Usuario
('maria.garcia@ucm.es', 'María García', '600456789', 1), -- Usuario
('juan.perez@ucm.es', 'Juan Pérez', '600567890', 1), -- Usuario
('laura.ramos@ucm.es', 'Laura Ramos', '600678901', 1); -- Usuario

INSERT INTO UserAuthentication (Email, RoleID, Password) VALUES -- password "user" for all
('ana.martinez@ucm.es', 1, '$2a$12$h0HcS2QDb/7zPASbLa2GoOTSRP6CWK0oX7pCK.dPjkM6L5N4pNovi'), -- Organizadora
('luis.sanchez@ucm.es', 1,'$2a$12$h0HcS2QDb/7zPASbLa2GoOTSRP6CWK0oX7pCK.dPjkM6L5N4pNovi'), -- Organizador
('carlos.lopez@ucm.es', 2, '$2a$12$h0HcS2QDb/7zPASbLa2GoOTSRP6CWK0oX7pCK.dPjkM6L5N4pNovi'), -- Usuario
('maria.garcia@ucm.es', 2, '$2a$12$h0HcS2QDb/7zPASbLa2GoOTSRP6CWK0oX7pCK.dPjkM6L5N4pNovi'), -- Usuario
('juan.perez@ucm.es', 2, '$2a$12$h0HcS2QDb/7zPASbLa2GoOTSRP6CWK0oX7pCK.dPjkM6L5N4pNovi'), -- Usuario
('laura.ramos@ucm.es', 2, '$2a$12$h0HcS2QDb/7zPASbLa2GoOTSRP6CWK0oX7pCK.dPjkM6L5N4pNovi'); -- Usuario

-- Inserción de varios eventos
INSERT INTO Event (Title, Description, DateTime, Location, Capacity, EventTypeID) VALUES 
('Taller de Inteligencia Artificial', 'Introducción a la IA y sus aplicaciones.', '2024-11-20 10:00:00', 'Aula 101, Facultad de Ingeniería', 30, 1),
('Conferencia sobre Robótica', 'Exploración de la robótica moderna.', '2024-11-25 09:00:00', 'Auditorio, Facultad de Ingeniería', 100, 2),
('Seminario de Programación en Python', 'Seminario avanzado sobre Python para ingenieros.', '2024-12-01 15:00:00', 'Sala de Conferencias, Facultad de Ingeniería', 50, 3),
('Taller de Machine Learning', 'Introducción al Machine Learning.', '2024-12-05 10:00:00', 'Aula 102, Facultad de Ingeniería', 30, 1),
('Conferencia de Big Data', 'Conferencia sobre técnicas avanzadas de Big Data.', '2024-12-10 09:00:00', 'Auditorio, Facultad de Ingeniería', 80, 2);

-- Inserción de notificaciones para los eventos
INSERT INTO Notifications (EventID, UserEmail, Message) VALUES 
(1, 'ana.martinez@ucm.es', 'Recordatorio: Taller de Inteligencia Artificial el 20 de noviembre.'),
(2, 'luis.sanchez@ucm.es', 'Recordatorio: Conferencia sobre Robótica el 25 de noviembre.'),
(3, 'carlos.lopez@ucm.es', 'Recordatorio: Seminario de Programación en Python el 1 de diciembre.'),
(4, 'maria.garcia@ucm.es', 'Recordatorio: Taller de Machine Learning el 5 de diciembre.'),
(5, 'juan.perez@ucm.es', 'Recordatorio: Conferencia de Big Data el 10 de diciembre.'),
(3, 'laura.ramos@ucm.es', 'Recordatorio: Seminario de Programación en Python el 1 de diciembre.');

-- Inserción de usuarios apuntados a varios eventos
INSERT INTO Enrollment (EventID, UserEmail) VALUES 
(1, 'carlos.lopez@ucm.es'),
(1, 'maria.garcia@ucm.es'),
(1, 'juan.perez@ucm.es'),
(2, 'carlos.lopez@ucm.es'),
(2, 'maria.garcia@ucm.es'),
(2, 'juan.perez@ucm.es'),
(3, 'carlos.lopez@ucm.es'),
(3, 'maria.garcia@ucm.es'),
(3, 'laura.ramos@ucm.es'),
(4, 'carlos.lopez@ucm.es'),
(4, 'juan.perez@ucm.es'),
(4, 'laura.ramos@ucm.es'),
(5, 'maria.garcia@ucm.es'),
(5, 'juan.perez@ucm.es'),
(5, 'laura.ramos@ucm.es');
