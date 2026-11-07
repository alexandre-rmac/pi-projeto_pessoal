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
	nome VARCHAR(255),
    commander VARCHAR(100),
    cores CHAR(5),
    dt_criacao DATE,
	fk_usuario INT,
	FOREIGN KEY (fk_usuario) REFERENCES usuario(id)
)AUTO_INCREMENT = 1000;

create table carta (
	id INT PRIMARY KEY AUTO_INCREMENT,
	nome VARCHAR(255),
	codigo VARCHAR(20) UNIQUE, -- uuid
    cmc INT,
    tipo VARCHAR(255),
    cores CHAR(5)
);

create table tipo_board (
	id INT PRIMARY KEY AUTO_INCREMENT,
    descricao VARCHAR(50)
);

create table deck_carta (
	fk_deck INT,
    fk_carta INT,
    fk_tipo_board,
    quantidade INT,
    PRIMARY KEY(fk_deck, fk_carta, fk_tipo_board),
    FOREIGN KEY (fk_deck) REFERENCES deck(id),
    FOREIGN KEY (fk_carta) REFERENCES carta(id),
    FOREIGN KEY (fk_tipo_board) REFERENCES tipo_board(id)
);