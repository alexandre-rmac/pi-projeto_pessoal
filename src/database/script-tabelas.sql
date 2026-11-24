CREATE DATABASE IF NOT EXISTS mtg_alramac;
USE mtg_alramac;

CREATE TABLE IF NOT EXISTS cadastro (
	id INT PRIMARY KEY AUTO_INCREMENT,
	email VARCHAR(255) NOT NULL,
	senha VARCHAR(255) NOT NULL,
	dt_cadastro DATE DEFAULT (CURRENT_DATE),
	status_cadastro TINYINT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS usuario (
	id INT PRIMARY KEY AUTO_INCREMENT,
	nome VARCHAR(50) NOT NULL,
	fk_cadastro INT NOT NULL,
	FOREIGN KEY (fk_cadastro) REFERENCES cadastro(id)
);

CREATE TABLE IF NOT EXISTS aviso (
	id INT PRIMARY KEY AUTO_INCREMENT,
	titulo VARCHAR(100),
	descricao VARCHAR(255),
    tipo_aviso TINYINT DEFAULT 0,
	fk_usuario INT,
	FOREIGN KEY (fk_usuario) REFERENCES usuario(id)
);

CREATE TABLE IF NOT EXISTS deck (
	id INT PRIMARY KEY AUTO_INCREMENT,
	nome VARCHAR(255),
    commander VARCHAR(100),
    -- commander_uuid CHAR(36),
    identidade	 VARCHAR(5),
    dt_criacao DATE DEFAULT (CURRENT_DATE),
	fk_usuario INT,
	FOREIGN KEY (fk_usuario) REFERENCES usuario(id)
)AUTO_INCREMENT = 1000;

CREATE TABLE IF NOT EXISTS board (
	id INT PRIMARY KEY AUTO_INCREMENT,
    descricao VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS carta (
	id INT PRIMARY KEY AUTO_INCREMENT,
	nome VARCHAR(255),
	codigo CHAR(36) UNIQUE, -- uuid
    cmc INT,
    cores VARCHAR(5),
    identidade VARCHAR(5),
    edhRank FLOAT4,
	custo_mana VARCHAR(100),
	texto TEXT,
	poder VARCHAR(10),
	resistencia VARCHAR(10),
	layout VARCHAR(30) NOT NULL DEFAULT 'normal'
);

CREATE TABLE IF NOT EXISTS deck_carta (
	fk_deck INT,
    fk_carta INT,
    fk_board INT,
    quantidade INT,
    PRIMARY KEY(fk_deck, fk_carta, fk_board),
    FOREIGN KEY (fk_deck) REFERENCES deck(id) ON DELETE CASCADE,
    FOREIGN KEY (fk_carta) REFERENCES carta(id),
    FOREIGN KEY (fk_board) REFERENCES board(id)
);


CREATE TABLE IF NOT EXISTS tipo (
	id INT PRIMARY KEY AUTO_INCREMENT,
    descricao VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS tipo_carta (
    fk_tipo INT,
    fk_carta INT,
    PRIMARY KEY(fk_tipo, fk_carta),
    FOREIGN KEY (fk_tipo) REFERENCES tipo(id),
    FOREIGN KEY (fk_carta) REFERENCES carta(id)
    
);

CREATE TABLE IF NOT EXISTS carta_face (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fk_carta INT NOT NULL,
    ordem TINYINT NOT NULL,
    side CHAR(1) NULL,
    nome VARCHAR(255) NOT NULL,
    custo_mana VARCHAR(100),
    tipo_linha VARCHAR(150),
    texto TEXT,
    poder VARCHAR(10),
    resistencia VARCHAR(10),
    UNIQUE KEY uq_carta_face_ordem (fk_carta, ordem),
    CONSTRAINT fk_carta_face_carta
        FOREIGN KEY (fk_carta) REFERENCES carta(id) ON DELETE CASCADE
);


INSERT INTO board (descricao) VALUES
('Mainboard'),
('Sideboard'),
('Maybeboard'),
('Wishboard');

INSERT INTO cadastro (email, senha) VALUE ('teste@teste.com', 'Teste@123');
INSERT INTO usuario (nome, fk_cadastro) VALUE ('Meste', 1);