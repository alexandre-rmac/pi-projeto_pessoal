var ambiente_processo = 'desenvolvimento';
var caminho_env = ambiente_processo === 'producao' ? '.env' : '.env.dev';
require("dotenv").config({ path: caminho_env });

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const console = require("console");


const INDEX_FILE = path.join(__dirname, '..', 'data', 'cards-index.json');
const BATCH_SIZE = 100;

if (!fs.existsSync(INDEX_FILE)) {
    console.error('cards-index.json não encontrado. Rode `npm run build-index` antes de continuar.');
    process.exit(1);
}

(async () => {
    console.log('Lendo cards-index.json...');
    const cartas = JSON.parse(fs.readFileSync(INDEX_FILE), 'utf8')

    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        port: Number(process.env.DB_PORT)
    });


    await conn.beginTransaction();
    console.log('Transação iniciada.');

    try {
        console.log('Coletando tipos únicos...');
        const tiposSet = new Set();
        cartas.forEach(c => {
            (c.types || []).forEach(t => tiposSet.add(t));
            (c.subtypes || []).forEach(t => tiposSet.add(t));
            (c.supertypes || []).forEach(t => tiposSet.add(t));
        });
        const tiposArray = Array.from(tiposSet).filter(t => t.trim() !== '');

        if (tiposArray.length > 0) {
            const placeholders = tiposArray.map(() => '(?)').join(', ');
            await conn.query(`INSERT IGNORE INTO tipo (descricao) VALUES ${placeholders}`, tiposArray);
            console.log(`Tipos inseridos/verificados: ${tiposArray.length}`);
        }

        const [tiposDb] = await conn.query('SELECT id, descricao FROM tipo');
        const tipoMap = new Map();
        tiposDb.forEach(t => tipoMap.set(t.descricao, t.id));

        console.log('Importando cartas em lotes...');        
        for (let i = 0; i < cartas.length; i += BATCH_SIZE) {
            const batch = cartas.slice(i, i + BATCH_SIZE);
            
            // Inicia a transação POR LOTE (evita travar o banco)
            await conn.beginTransaction();

            try {
                // 1. UPSERT na tabela `carta`
                const placeholdersCarta = batch.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
                const valuesCarta = [];
                
                batch.forEach(c => {
                    const cor = (c.colors && c.colors.length) ? c.colors.join('') : 'C';
                    const identidade = (c.colorId && c.colorId.length) ? c.colorId.join('') : 'C';
                    const tipoConcatenado = (c.types && c.types.length) ? c.types.join(', ') : '';
                    const cmc = c.manaValue || 0; 

                    valuesCarta.push(c.name, c.uuid, cmc, tipoConcatenado, cor, identidade);
                });

                await conn.query(
                    `INSERT INTO carta (nome, codigo, cmc, tipo, cores, identidade)
                     VALUES ${placeholdersCarta}
                     ON DUPLICATE KEY UPDATE
                       nome = VALUES(nome),
                       cmc = VALUES(cmc),
                       tipo = VALUES(tipo),
                       cores = VALUES(cores),
                       identidade = VALUES(identidade)`,
                    valuesCarta
                );

                // 2. Recuperar os IDs das cartas do lote atual
                const codigosBatch = batch.map(c => c.uuid);
                const placeholdersSelect = codigosBatch.map(() => '?').join(', ');
                const [cartasDb] = await conn.query(
                    `SELECT id, codigo FROM carta WHERE codigo IN (${placeholdersSelect})`,
                    codigosBatch
                );
                
                const cartaMap = new Map();
                cartasDb.forEach(c => cartaMap.set(c.codigo, c.id));

                // 3. Preparar associações para `tipo_carta`
                const associacoes = [];
                batch.forEach(c => {
                    const cartaId = cartaMap.get(c.uuid);
                    if (!cartaId) return;

                    const tiposDaCarta = new Set();
                    (c.types || []).forEach(t => tiposDaCarta.add(t));
                    (c.subtypes || []).forEach(t => tiposDaCarta.add(t));
                    (c.supertypes || []).forEach(t => tiposDaCarta.add(t));

                    tiposDaCarta.forEach(t => {
                        const tipoId = tipoMap.get(t);
                        if (tipoId) {
                            associacoes.push([cartaId, tipoId]);
                        }
                    });
                });

                // 4. Inserir associações na tabela `tipo_carta`
                if (associacoes.length > 0) {
                    const placeholdersTipoCarta = associacoes.map(() => '(?, ?)').join(', ');
                    
                    // Constrói o array plano de valores de forma segura
                    const valuesTipoCarta = [];
                    associacoes.forEach(par => {
                        valuesTipoCarta.push(par[0], par[1]);
                    });

                    await conn.query(
                        `INSERT IGNORE INTO tipo_carta (fk_carta, fk_tipo) VALUES ${placeholdersTipoCarta}`,
                        valuesTipoCarta
                    );
                }

                // Confirma este lote no banco
                await conn.commit();
                
                const processadas = Math.min(i + BATCH_SIZE, cartas.length);
                process.stdout.write(`\rProcessadas ${processadas}/${cartas.length}`);
                
            } catch (errLote) {
                await conn.rollback();
                console.error(`\nErro no lote ${i}. Rollback deste lote efetuado.`);
                throw errLote; // Repassa o erro para o catch principal
            }
        }

        console.log('\nImportação concluída com sucesso!');
    } catch (err) {
        console.error('\nErro fatal na importação:');
        console.error(err);
        process.exitCode = 1;
    } finally {
        await conn.end();
    }
})();