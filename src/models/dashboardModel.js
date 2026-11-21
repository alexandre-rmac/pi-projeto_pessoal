var database = require("../database/config");
var cardsModel = require("./cardsModel");

// Função auxiliar para calcular geração de mana no texto
function calcularGeracaoMana(text, identidadeDeck) {
    var gera = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
    if (!text) return gera;

    var addMatches = text.match(/Add\s+((?:\{[^}]+\}\s*)+)/gi) || [];
    addMatches.forEach(bloco => {
        var syms = bloco.match(/\{[^}]+\}/g) || [];
        syms.forEach(sym => {
            var c = sym.replace(/[{}]/g, '').toUpperCase();
            if (gera[c] !== undefined) gera[c]++;
        });
    });

    // "Add one mana of any color" conta apenas as cores da identidade
    if (/Add\s+one\s+mana\s+of\s+any\s+color/i.test(text)) {
        var cores = identidadeDeck === "C" ? "WUBRG" : identidadeDeck; 
        for (var i = 0; i < cores.length; i++) {
            if (gera[cores[i]] !== undefined) gera[cores[i]]++;
        }
    }
    return gera;
}

function perfil(fkUsuario) {
    // ADICIONADO O CAMPO commander AQUI
    var sqlDecks = "SELECT id, nome, commander, identidade FROM deck WHERE fk_usuario = ?";
    var sqlMainboard = `
        SELECT dc.fk_deck, COALESCE(SUM(dc.quantidade), 0) AS total
        FROM deck_carta dc
        INNER JOIN board b ON b.id = dc.fk_board
        WHERE b.descricao = 'Mainboard'
          AND dc.fk_deck IN (SELECT id FROM deck WHERE fk_usuario = ?)
        GROUP BY dc.fk_deck
    `;

    return Promise.all([
        database.executar(sqlDecks, [fkUsuario]),
        database.executar(sqlMainboard, [fkUsuario])
    ]).then(function (rs) {
        var decks = rs[0];
        var totalPorDeck = {};
        rs[1].forEach(function (r) { totalPorDeck[r.fk_deck] = Number(r.total); });

        var coresFreq = { W: 0, U: 0, B: 0, R: 0, G: 0 };
        var decksStatus = decks.map(function (d) {
            var identidadeDeck = d.identidade || "C";
            if (identidadeDeck !== "C") {
                for (var i = 0; i < identidadeDeck.length; i++) {
                    if (coresFreq[identidadeDeck[i]] !== undefined) coresFreq[identidadeDeck[i]]++;
                }
            }
            var total = totalPorDeck[d.id] || 0;
            var status = total < 100 ? "incompleto" : (total === 100 ? "completo" : "invalido");
            
            // Retorna os dados do deck junto com os status calculados
            return { 
                id: d.id, 
                nome: d.nome, 
                commander: d.commander,
                identidade: identidadeDeck, 
                status: status, 
                totalMainboard: total 
            };
        });

        var utilizadas = Object.keys(coresFreq).filter(function (c) { return coresFreq[c] > 0; });
        var maxFreq = 0;
        utilizadas.forEach(function (c) { if (coresFreq[c] > maxFreq) maxFreq = coresFreq[c]; });
        var maisUtilizadas = utilizadas.filter(function (c) { return coresFreq[c] === maxFreq; });

        return {
            totalDecks: decks.length,
            coresFreq: coresFreq,
            totalCoresUtilizadas: utilizadas.length,
            coresMaisUtilizadas: maisUtilizadas,
            decks: decksStatus
        };
    });
}

function deck(idDeck, fkUsuario) {
    var sqlDeck = "SELECT id, nome, commander, identidade FROM deck WHERE id = ? AND fk_usuario = ?";
    
    // Busca as cartas da Mainboard com seus tipos agrupados
    var sqlCartas = `
        SELECT c.id, c.nome, c.cmc, c.cores, c.custo_mana, c.texto,
               (SELECT GROUP_CONCAT(t.descricao SEPARATOR ', ') 
                FROM tipo_carta tc 
                INNER JOIN tipo t ON t.id = tc.fk_tipo 
                WHERE tc.fk_carta = c.id) AS tipos,
               dc.quantidade
        FROM deck_carta dc
        INNER JOIN carta c ON c.id = dc.fk_carta
        INNER JOIN board b ON b.id = dc.fk_board
        WHERE dc.fk_deck = ? AND b.descricao = 'Mainboard'
    `;

    return database.executar(sqlDeck, [idDeck, fkUsuario]).then(function (decks) {
        if (!decks || decks.length === 0) return null;
        var deckInfo = decks[0];
        var identidadeDeck = deckInfo.identidade || 'C';

        return database.executar(sqlCartas, [idDeck]).then(function (cartas) {
            let totalCartas = 0;
            let totalTerrenos = 0;
            let cmcTotalSoma = 0;
            let cartasNaoTerrenoQtd = 0;
            let cartasUnicasNaoTerreno = 0;

            let curvaMana = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7+': 0 };
            let devocao = { W: 0, U: 0, B: 0, R: 0, G: 0 };
            let producaoMana = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
            let tiposCount = {};

            cartas.forEach(c => {
                const qtd = Number(c.quantidade);
                const isLand = c.tipos && c.tipos.includes('Land');
                
                totalCartas += qtd;

                if (isLand) {
                    totalTerrenos += qtd;
                } else {
                    // Cálculos de CMC (Apenas não-terrenos)
                    cmcTotalSoma += (c.cmc * qtd);
                    cartasNaoTerrenoQtd += qtd;
                    cartasUnicasNaoTerreno += 1;

                    // Curva de Mana
                    const key = c.cmc >= 7 ? '7+' : c.cmc.toString();
                    curvaMana[key] += qtd;
                }

                // Devoção (Pips no Custo de Mana)
                if (c.custo_mana) {
                    const pips = c.custo_mana.match(/\{([^}]+)\}/g) || [];
                    pips.forEach(pip => {
                        const inner = pip.replace(/[{}]/g, '').toUpperCase();
                        // Conta apenas se for uma cor exata (W, U, B, R, G)
                        if (devocao[inner] !== undefined) {
                            devocao[inner] += qtd;
                        }
                    });
                }

                // Produção de Mana (Parsing do Texto)
                if (c.texto) {
                    const regexAdd = /Add\s+(?:one\s+mana\s+of\s+any\s+color|((?:\{[^}]+\})+))/gi;
                    const matches = c.texto.matchAll(regexAdd);
                    for (const match of matches) {
                        if (match[1]) {
                            const symbols = match[1].match(/\{[^}]+\}/g) || [];
                            symbols.forEach(sym => {
                                const cor = sym.replace(/[{}]/g, '').toUpperCase();
                                if (producaoMana[cor] !== undefined) producaoMana[cor] += qtd;
                            });
                        } else {
                            // "Add one mana of any color" -> Soma 1 para cada cor da identidade do deck
                            if (identidadeDeck !== 'C') {
                                identidadeDeck.split('').forEach(cor => {
                                    if (producaoMana[cor] !== undefined) producaoMana[cor] += qtd;
                                });
                            } else {
                                producaoMana['C'] += qtd; // Se for incolor, conta como incolor
                            }
                        }
                    }
                }

                // Tipos de Carta
                if (c.tipos) {
                    const arrTipos = c.tipos.split(', ');
                    arrTipos.forEach(tipo => {
                        // Ignora subtipos muito específicos para não poluir o gráfico
                        if (['Creature', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Planeswalker', 'Land'].includes(tipo)) {
                            tiposCount[tipo] = (tiposCount[tipo] || 0) + qtd;
                        }
                    });
                }
            });

            // Comandante (Soma ele aos cálculos se não estiver na lista)
            // (Assumindo que o front-end já o inclui na Mainboard e ele veio na query)
            
            const cmcMedioPadrao = cartasUnicasNaoTerreno > 0 ? (cmcTotalSoma / cartasUnicasNaoTerreno) : 0;
            const cmcMedioPonderado = cartasNaoTerrenoQtd > 0 ? (cmcTotalSoma / cartasNaoTerrenoQtd) : 0;

            return {
                deck: deckInfo,
                totalCartas,
                totalTerrenos,
                cmcMedioPadrao: Number(cmcMedioPadrao.toFixed(2)),
                cmcMedioPonderado: Number(cmcMedioPonderado.toFixed(2)),
                curvaMana,
                devocao,
                producaoMana,
                tiposCount
            };
        });
    });
}

module.exports = { perfil, deck };