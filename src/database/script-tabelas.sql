-- Arquivo de apoio, caso você queira criar tabelas como as aqui criadas para a API funcionar.
-- Você precisa executar os comandos no banco de dados para criar as tabelas,
-- ter este arquivo aqui não significa que a tabela em seu BD estará como abaixo!

/*
comandos para mysql server
*/

CREATE DATABASE mtg_alramac;

USE mtg_alramac;

CREATE TABLE cadastro (
	id INT PRIMARY KEY AUTO_INCREMENT,
	email VARCHAR(50) NOT NULL,
	senha VARCHAR(50) NOT NULL,
	dt_cadastro DATE DEFAULT DATE(CURRENT_TIMESTAMP),
	codigo_ativacao VARCHAR(50),
	status_cadastro TINYINT NOT NULL DEFAULT 1
);

CREATE TABLE usuario (
	id INT PRIMARY KEY AUTO_INCREMENT,
	nome VARCHAR(50) NOT NULL,

	fk_cadastro INT NOT NULL,
	FOREIGN KEY (fk_cadastro) REFERENCES cadastro(id)
);

CREATE TABLE aviso (
	id INT PRIMARY KEY AUTO_INCREMENT,
	titulo VARCHAR(100),
	descricao VARCHAR(150),
	fk_usuario INT,
	FOREIGN KEY (fk_usuario) REFERENCES usuario(id)
);

create table deck (
	id INT PRIMARY KEY AUTO_INCREMENT,
	descricao VARCHAR(300),
	fk_usuario INT,
	FOREIGN KEY (fk_usuario) REFERENCES usuario(id)
)AUTO_INCREMENT = 1000;

create table card (
	id INT PRIMARY KEY AUTO_INCREMENT,
	nome VARCHAR(100),
	codigo VARCHAR(20),

);

create table mainboard (
	fk_deck INT,
	fk_carta INT,
	PRIMARY KEY (fk_deck, fk_carta),
	FOREIGN KEY (fk_deck) REFERENCES deck(id),
	FOREIGN KEY (fk_carta) REFERENCES carta(id)
);

create table sideboard (
	fk_deck INT,
	fk_carta INT,
	PRIMARY KEY (fk_deck, fk_carta),
	FOREIGN KEY (fk_deck) REFERENCES deck(id),
	FOREIGN KEY (fk_carta) REFERENCES carta(id)
);

create table maybeboard (
	fk_deck INT,
	fk_carta INT,
	PRIMARY KEY (fk_deck, fk_carta),
	FOREIGN KEY (fk_deck) REFERENCES deck(id),
	FOREIGN KEY (fk_carta) REFERENCES carta(id)
);