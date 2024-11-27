CREATE DATABASE IF NOT EXISTS AW_24;

USE AW_24;

-- Table creation
CREATE TABLE IF NOT EXISTS Faculty (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(255) NOT NULL,
    University VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS Rooms (
    RoomID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Capacity INT NOT NULL,
    FacultyID INT,    
    FOREIGN KEY (FacultyID) REFERENCES Faculty(ID)
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
    TimeInit DATETIME NOT NULL,
    TimeEnd DATETIME NOT NULL,
    Location INT,
    EventTypeID INT,
    OrganizerID VARCHAR(255),
    Active TINYINT(1) NOT NULL,
    FOREIGN KEY (OrganizerID) REFERENCES User(Email),
    FOREIGN KEY (EventTypeID) REFERENCES EventType(ID),
    FOREIGN KEY (Location) REFERENCES Rooms(RoomID)
);


CREATE TABLE IF NOT EXISTS Notifications (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    Sender VARCHAR(255) NOT NULL,
    Date DATETIME NOT NULL,
    Message TEXT NOT NULL,
    FOREIGN KEY (Sender) REFERENCES User(Email)
);

CREATE TABLE IF NOT EXISTS UserNotifications (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    UserEmail VARCHAR(255) NOT NULL,
    NotificationID INT NOT NULL,
    Checked TINYINT(1) NOT NULL DEFAULT 0,  
    FOREIGN KEY (UserEmail) REFERENCES User(Email),
    FOREIGN KEY (NotificationID) REFERENCES Notifications(ID),
    UNIQUE(UserEmail, NotificationID)  
);


CREATE TABLE SQL_INJECTIONS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,  
    attempted_query TEXT NOT NULL,
    timestamp DATETIME NOT NULL
);


CREATE TABLE IF NOT EXISTS Enrollment (
    EventID INT,
    UserEmail VARCHAR(255),
    PRIMARY KEY (EventID, UserEmail),
    Status ENUM('confirmed', 'waiting', 'cancelled') DEFAULT 'confirmed',
    DateTime DATETIME DEFAULT NULL,
    FOREIGN KEY (EventID) REFERENCES Event(ID),
    FOREIGN KEY (UserEmail) REFERENCES User(Email)
);

-- Inserción de datos en Facultad
INSERT INTO Faculty (Name, University) VALUES
('Facultad de Ingeniería', 'Universidad Complutense de Madrid'),
('Facultad de Biología', 'Universidad Complutense de Madrid'),
('Facultad de Filosofia', 'Universidad Autonoma de Madrid');

INSERT INTO Rooms (Name, Capacity, FacultyID) VALUES
('Aula Magna', 200, 1), 
('Aula 1', 20, 1), 
('Aula 2', 10, 1), 
('Aula 3', 60, 1), 
('Aula 4', 3, 1), 
('Aula 7', 2, 1), 
('Laboratorio de Biología', 50, 2), 
('Sala Alberto Magno', 20, 2), 
('Laboratorio de las Moscas', 10, 2), 
('Laboratorio de Ciencias Forenses', 60, 2), 
('Sala de Filosofía', 100, 3); 


-- Inserción de roles limitados
INSERT INTO Role (Name) VALUES  
('Organizador'),
('Usuario');

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
INSERT INTO Event (Title, Description, TimeInit, TimeEnd, Location, EventTypeID, OrganizerID, Active) VALUES 
('Taller de Inteligencia Artificial', 'Introducción a la IA y sus aplicaciones.','2024-12-27 09:00:00', '2024-12-27 09:50:00',6, 1, 'luis.sanchez@ucm.es', TRUE),
('Conferencia sobre Robótica', 'Exploración de la robótica moderna.', '2024-12-25 09:00:00', '2024-12-25 12:00:00',6,  2, 'luis.sanchez@ucm.es', TRUE),
('Seminario de Programación en Python', 'Seminario avanzado sobre Python para ingenieros.', '2024-12-01 14:00:00', '2024-12-01 17:00:00', 5, 3, 'ana.martinez@ucm.es', TRUE),
('Taller de Machine Learning', 'Introducción al Machine Learning.', '2024-12-05 10:00:00','2024-12-05 10:50:00', 6, 1, 'ana.martinez@ucm.es', TRUE),
('Conferencia de Big Data', 'Conferencia sobre técnicas avanzadas de Big Data.', '2024-12-08 14:00:00','2024-12-08 16:00:00', 5,  2, 'luis.sanchez@ucm.es', TRUE),
('La ética en las TIC', 'Conferencia sobre cómo hacer discusiones éticas con tu jefe, amigos, profesores...', '2024-12-14 12:30:00', '2024-12-14 13:30:00', 3, 2, 'ana.martinez@ucm.es', TRUE),
('Como no jugar', 'Seminario de cómo se hacen ciertos materiales de semiconductores correctamente sin destruir la facultad', '2024-12-14 20:30:00','2024-12-14 21:35:00', 3, 3, 'ana.martinez@ucm.es', TRUE);

-- Insertar usuarios inscritos en eventos con Status 'confirmed'
-- Evento 1: Taller de Inteligencia Artificial (Sala 6 - Capacidad: 2)
INSERT INTO Enrollment (EventID, UserEmail, Status, DateTime) VALUES
(1, 'ana.martinez@ucm.es', 'waiting', '2024-11-20 14:00:00'),
(1, 'carlos.lopez@ucm.es', 'confirmed', '2024-11-22 12:00:00'),
(1, 'maria.garcia@ucm.es', 'confirmed', '2024-11-23 13:00:00');

-- Evento 2: Conferencia sobre Robótica (Sala 6 - Capacidad: 2)
INSERT INTO Enrollment (EventID, UserEmail, Status, DateTime) VALUES
(2, 'ana.martinez@ucm.es', 'confirmed', '2024-11-15 09:00:00'),
(2, 'carlos.lopez@ucm.es', 'confirmed', '2024-11-17 11:00:00'),
(2, 'maria.garcia@ucm.es', 'waiting', '2024-11-18 12:00:00');

-- Evento 3: Seminario de Programación en Python (Sala 5 - Capacidad: 3)
INSERT INTO Enrollment (EventID, UserEmail, Status, DateTime) VALUES
(3, 'luis.sanchez@ucm.es', 'confirmed', '2024-11-25 15:00:00'),
(3, 'carlos.lopez@ucm.es', 'confirmed', '2024-11-25 15:30:00'),
(3, 'maria.garcia@ucm.es', 'confirmed', '2024-11-25 16:00:00');

-- Evento 4: Taller de Machine Learning (Sala 6 - Capacidad: 2)
INSERT INTO Enrollment (EventID, UserEmail, Status, DateTime) VALUES
(4, 'luis.sanchez@ucm.es', 'confirmed', '2024-12-01 09:30:00'),
(4, 'carlos.lopez@ucm.es', 'confirmed', '2024-12-01 10:00:00'),
(4, 'maria.garcia@ucm.es', 'waiting', '2024-12-01 10:30:00');

-- Evento 5: Conferencia de Big Data (Sala 5 - Capacidad: 3)
INSERT INTO Enrollment (EventID, UserEmail, Status, DateTime) VALUES
(5, 'ana.martinez@ucm.es', 'confirmed', '2024-11-28 14:00:00'),
(5, 'carlos.lopez@ucm.es', 'confirmed', '2024-11-28 15:00:00'),
(5, 'maria.garcia@ucm.es', 'confirmed', '2024-11-28 15:30:00');

-- Evento 6: La ética en las TIC (Sala 3 - Capacidad: 60)
INSERT INTO Enrollment (EventID, UserEmail, Status, DateTime) VALUES
(6, 'luis.sanchez@ucm.es', 'confirmed', '2024-11-22 11:00:00'),
(6, 'carlos.lopez@ucm.es', 'confirmed', '2024-11-22 12:00:00'),
(6, 'maria.garcia@ucm.es', 'confirmed', '2024-11-22 13:00:00'),
(6, 'juan.perez@ucm.es', 'confirmed', '2024-11-22 14:00:00'),
(6, 'laura.ramos@ucm.es', 'confirmed', '2024-11-22 15:00:00');

-- Evento 7: Como no jugar (Sala 3 - Capacidad: 60)
INSERT INTO Enrollment (EventID, UserEmail, Status, DateTime) VALUES
(7, 'luis.sanchez@ucm.es', 'confirmed', '2024-11-29 09:30:00'),
(7, 'carlos.lopez@ucm.es', 'confirmed', '2024-11-29 10:00:00'),
(7, 'maria.garcia@ucm.es', 'confirmed', '2024-11-29 10:30:00'),
(7, 'juan.perez@ucm.es', 'confirmed', '2024-11-29 11:00:00'),
(7, 'laura.ramos@ucm.es', 'confirmed', '2024-11-29 11:30:00');


INSERT INTO notifications (Sender, Date, Message) VALUES
('carlos.lopez@ucm.es', '2024-10-20 10:10:00', 'Se ha inscrito carlos.lopez@ucm.es a tu evento Seminario de Programación en Python'),
('maria.garcia@ucm.es', '2024-10-10 10:10:00', 'Se ha inscrito maria.garcia@ucm.es a tu evento Seminario de Programación en Python'),
( 'laura.ramos@ucm.es', '2024-10-10 10:20:00', 'Se ha inscrito laura.ramos@ucm.es a tu evento Seminario de Programación en Python'),
( 'juan.perez@ucm.es', '2024-10-20 10:20:00', 'El usuario juan.perez@ucm.es ha entrado a la cola de tu evento Seminario de Programación en Python'),
( 'luis.sanchez@ucm.es', '2024-10-20 10:30:00', 'El usuario luis.sanchez@ucm.es ha entrado a la cola de tu evento Seminario de Programación en Python'),
( 'ana.martinez@ucm.es', '2024-11-20 09:33:05', 'El usuario ana.martinez@ucm.es se ha inscrito a tu evento: Conferencia de Big Data'),
( 'ana.martinez@ucm.es', '2024-11-20 09:33:09', 'El usuario ana.martinez@ucm.es se ha desapuntado del evento Conferencia de Big Data.'),
( 'ana.martinez@ucm.es', '2024-11-20 09:33:11', 'El usuario ana.martinez@ucm.es se ha inscrito de nuevo a tu evento: Conferencia de Big Data');

INSERT INTO usernotifications (UserEmail, NotificationID, Checked) VALUES
('ana.martinez@ucm.es', 1, 0),
( 'ana.martinez@ucm.es', 2, 0),
( 'ana.martinez@ucm.es', 3, 0),
('ana.martinez@ucm.es', 4, 0),
('ana.martinez@ucm.es', 5, 0),
('luis.sanchez@ucm.es', 6, 0),
('luis.sanchez@ucm.es', 7, 0),
('luis.sanchez@ucm.es', 8, 0);