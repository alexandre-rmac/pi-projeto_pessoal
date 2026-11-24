const fs = require('fs');
const path = require('path');
const ac_path = '../../bulkdata/';
const INPUT_FILE = path.join(__dirname, ac_path, 'AtomicCards.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'cards-index.json');

if (!fs.existsSync(INPUT_FILE)) {
    console.error('AtomicCards.json não encontrado. Baixe de https://mtgjson.com/downloads/all-files/#atomiccards');
    process.exit(1);
}

console.log('Lendo AtomicCards.json...');
const atomicCards = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
const cardsMap = atomicCards.data || atomicCards;

const index = [];
const ignoradasList = [];

for (const [key, rawList] of Object.entries(cardsMap)) {
    const cardList = Array.isArray(rawList) ? rawList : [rawList];
    const front = cardList[0];

    if (!front || !front.name) {
        ignoradasList.push(front);
        continue;
    }

    const uuid = front.identifiers?.scryfallOracleId;
    if (!uuid) {
        ignoradasList.push(front);
        continue;
    }

    if (front.isFunny) {
        ignoradasList.push(front);
        continue;
    }

    const rank = Number(front.edhrecRank * front.edhrecSaltiness);
    const edhRank = rank > 0 ? rank : 0;

    index.push({
        // --- campos agregados da carta física (face 0) ---
        name: front.name,
        uuid,
        layout: front.layout || 'normal',
        manaCost: front.manaCost || '',
        manaValue: Number(front.manaValue) || 0,
        type: front.type || '',
        text: front.text || '',
        power: front.power || '',
        loyalty: front.loyalty || '',
        toughness: front.toughness || '',
        colors: front.colors || [],
        colorId: front.colorIdentity || [],
        keywords: front.keywords || [],
        types: front.types || [],
        subtypes: front.subtypes || [],
        supertypes: front.supertypes || [],
        edhRank,

        // --- faces (só populado quando há mais de uma) ---
        faces: cardList.map((f, i) => ({
            ordem: i,
            side: f.side || null,
            nome: f.name,
            custo_mana: f.manaCost || '',
            tipo_linha: f.type || '',
            texto: f.text || '',
            poder: f.power || '',
            resistencia: f.toughness || ''
        }))
    });
}

console.log(`Processadas ${index.length} cartas.\nIgnoradas ${ignoradasList.length} cartas.`);
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index), 'utf8');
console.log('Índice gerado em data/cards-index.json');