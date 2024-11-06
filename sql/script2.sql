CREATE DATABASE IF NOT EXISTS AW_24;

USE AW_24;

CREATE TABLE `faculty` (
    `ID` int(11) NOT NULL AUTO_INCREMENT,
    `Name` varchar(255) NOT NULL,
    `University` varchar(255) NOT NULL,
    PRIMARY KEY (`ID`)
);

-- Facultades de ejemplo
INSERT INTO `faculty` (`ID`, `Name`, `University`) VALUES
(1, 'Facultad de Ingeniería', 'Universidad Complutense de Madrid');


CREATE TABLE IF NOT EXISTS Role (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(50) NOT NULL
);

-- Roles de ejemplo
INSERT INTO `role` (`ID`, `Name`) VALUES
(1, 'organizador'), (2, 'usuario');
