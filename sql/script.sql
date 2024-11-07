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
    OrganizerID VARCHAR(255),
    Active TINYINT(1) NOT NULL,
    FOREIGN KEY (OrganizerID) REFERENCES User(Email),
    FOREIGN KEY (EventTypeID) REFERENCES EventType(ID)
);


CREATE TABLE IF NOT EXISTS Notifications (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    UserEmail VARCHAR(255),
    Sender VARCHAR(255),
    Date DATETIME NOT NULL,
    Checked TINYINT(1) NOT NULL,
    Message TEXT NOT NULL,
    FOREIGN KEY (UserEmail) REFERENCES User(Email),
    FOREIGN KEY (Sender) REFERENCES User(Email)
);


CREATE TABLE IF NOT EXISTS Enrollment (
    EventID INT,
    UserEmail VARCHAR(255),
    PRIMARY KEY (EventID, UserEmail),
    Status ENUM('confirmed', 'waiting') DEFAULT 'confirmed',
    QueueDateTime DATETIME DEFAULT NULL,
    FOREIGN KEY (EventID) REFERENCES Event(ID),
    FOREIGN KEY (UserEmail) REFERENCES User(Email)
);

-- Inserción de datos en Facultad
INSERT INTO Faculty (Name, University) VALUES
('Facultad de Ingeniería', 'Universidad Complutense de Madrid'),
('Facultad de Biología', 'Universidad Complutense de Madrid'),
('Facultad de Filosofia', 'Universidad Autonoma de Madrid');

-- Inserción de roles limitados
INSERT INTO Role (Name) VALUES  
('organizador'),
('usuario');

-- Inserción de tipos de eventos permitidos
INSERT INTO EventType (Name) VALUES 
('Taller'),
('Conferencia'),
('Seminario');

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
INSERT INTO Event (Title, Description, DateTime, Location, Capacity, EventTypeID, OrganizerID, Active) VALUES 
('Taller de Inteligencia Artificial', 'Introducción a la IA y sus aplicaciones.', '2024-11-20 10:00:00', 'Aula 101, Facultad de Ingeniería', 3, 1, 'luis.sanchez@ucm.es', TRUE),
('Conferencia sobre Robótica', 'Exploración de la robótica moderna.', '2024-11-25 09:00:00', 'Auditorio, Facultad de Ingeniería', 3, 2, 'luis.sanchez@ucm.es', TRUE),
('Seminario de Programación en Python', 'Seminario avanzado sobre Python para ingenieros.', '2024-12-01 14:00:00', 'Sala de Conferencias, Facultad de Ingeniería', 2, 3, 'ana.martinez@ucm.es', TRUE),
('Taller de Machine Learning', 'Introducción al Machine Learning.', '2024-12-05 10:00:00', 'Aula 102, Facultad de Ingeniería', 30, 1, 'ana.martinez@ucm.es', TRUE),
('Conferencia de Big Data', 'Conferencia sobre técnicas avanzadas de Big Data.', '2024-11-08 04:00:00', 'Auditorio, Facultad de Ingeniería', 80, 2, 'luis.sanchez@ucm.es', TRUE),
('La ética en las TIC', 'Conferencia sobre cómo hacer discusiones éticas con tu jefe, amigos, profesores...', '2024-11-14 01:30:00', 'Laboratorio 4, Facultad de Ingeniería', 33, 2, 'ana.martinez@ucm.es', TRUE),
('Como no jugar', 'Seminario de cómo se hacen ciertos materiales de semiconductores correctamente sin destruir la facultad', '2024-11-14 01:30:00', 'Laboratorio 4, Facultad de Ingeniería', 33, 3, 'ana.martinez@ucm.es', TRUE);

-- Insertar usuarios inscritos en eventos con Status 'confirmed'
INSERT INTO Enrollment (EventID, UserEmail, Status) VALUES 
(1, 'carlos.lopez@ucm.es', 'confirmed'),
(1, 'maria.garcia@ucm.es', 'confirmed'),
(1, 'juan.perez@ucm.es', 'confirmed'),
(2, 'carlos.lopez@ucm.es', 'confirmed'),
(2, 'maria.garcia@ucm.es', 'confirmed'),
(2, 'juan.perez@ucm.es', 'confirmed'),
(3, 'carlos.lopez@ucm.es', 'confirmed'),
(3, 'maria.garcia@ucm.es', 'confirmed'),
(3, 'laura.ramos@ucm.es', 'confirmed'),
(4, 'carlos.lopez@ucm.es', 'confirmed'),
(4, 'juan.perez@ucm.es', 'confirmed'),
(4, 'laura.ramos@ucm.es', 'confirmed'),
(5, 'maria.garcia@ucm.es', 'confirmed'),
(5, 'juan.perez@ucm.es', 'confirmed'),
(5, 'laura.ramos@ucm.es', 'confirmed');

-- Insertar a ana.martinez@ucm.es en la cola de espera en varios eventos con Status 'waiting'
INSERT INTO Enrollment (EventID, UserEmail, Status, QueueDateTime) VALUES 
(1, 'ana.martinez@ucm.es', 'waiting', '2024-10-20 10:00:00'),
(1, 'laura.ramos@ucm.es', 'waiting', '2024-10-19 10:00:00'),
(2, 'ana.martinez@ucm.es', 'waiting', NOW());
INSERT INTO Enrollment (EventID, UserEmail, Status, QueueDateTime) VALUES 
(3, 'juan.perez@ucm.es', 'waiting', '2024-10-20 10:20:00'),
(3, 'luis.sanchez@ucm.es', 'waiting', '2024-10-20 10:30:00');


INSERT INTO Notifications (UserEmail,Sender, Date, Checked, Message) VALUES
-- Notificación de recordatorio para el taller de IA
('carlos.lopez@ucm.es','ana.martinez@ucm.es', '2024-11-19 10:00:00', FALSE, 'Recordatorio: Mañana es el Taller de Inteligencia Artificial. ¡No faltes!'),

-- Notificación de cambio de ubicación para la conferencia sobre Robótica
( 'carlos.lopez@ucm.es','ana.martinez@ucm.es', '2024-11-20 12:00:00', FALSE, 'Actualización: La conferencia sobre robótica se trasladó a la sala principal.'),

-- Notificación de cancelación de evento para el seminario de Python
( 'ana.martinez@ucm.es','carlos.lopez@ucm.es', '2024-11-22 15:00:00', FALSE, 'Aviso: El Seminario de Programación en Python ha sido cancelado. Disculpe las molestias.'),

-- Notificación de apertura de nuevas plazas en el Taller de Machine Learning
( 'ana.martinez@ucm.es','carlos.lopez@ucm.es', '2024-12-01 08:00:00', FALSE, 'Notificación: Se han abierto nuevas plazas para el Taller de Machine Learning.'),

-- Notificación de recordatorio para la Conferencia de Big Data
( 'carlos.lopez@ucm.es','ana.martinez@ucm.es', '2024-11-07 08:00:00', FALSE, 'Recordatorio: Mañana es la Conferencia de Big Data. ¡Nos vemos allí!'),

-- Notificación de actualización de horario para evento "exchange 22rreasdasd"
( 'ana.martinez@ucm.es','carlos.lopez@ucm.es', '2024-11-12 09:00:00', FALSE, 'Actualización: El evento "exchange 22rreasdasd" ahora comenzará a las 09:00 en lugar de las 01:30.');
