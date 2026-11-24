function configurarImportacaoCSV() {
    const csvInput = document.getElementById('csv-file');

    // Parser CSV que respeita aspas e vírgulas internas
    function parseLinhaCSV(linha) {
        const campos = [];
        let atual = '';
        let dentroAspas = false;

        for (let i = 0; i < linha.length; i++) {
            const ch = linha[i];

            if (ch === '"') {
                if (dentroAspas && linha[i + 1] === '"') { // "" -> aspas literal
                    atual += '"';
                    i++;
                } else {
                    dentroAspas = !dentroAspas;
                }
            } else if (ch === ',' && !dentroAspas) {
                campos.push(atual);
                atual = '';
            } else {
                atual += ch;
            }
        }
        campos.push(atual);
        return campos.map(c => c.trim());
    }

    csvInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        
        reader.onload = async function (event) {
            let texto = event.target.result;
            if (texto.charCodeAt(0) === 0xFEFF) texto = texto.slice(1);
            
            const linhas = texto.split(/\r?\n/).filter(l => l.trim() !== '');
            const agregado = new Map(); // nome(lower) -> { nome, quantidade }
            let totalCartasLista = 0;
            const comandanteNome = (deckData.deck.commander || '').toLowerCase();
            
            for (const raw of linhas) {
                const linha = raw.trim();
                if (!linha) continue;
                
                const campos = parseLinhaCSV(linha);
                let qtd, nome;
                
                if (campos.length >= 2) {
                    // Formato "N,Nome" (CSV do arquivo)
                    qtd = parseInt(campos[0], 10);
                    nome = campos.slice(1).join(',').trim();
                } else {
                    // Fallback: "Nx Nome" ou só "Nome"
                    const m = linha.match(/^(\d+)[xX]?\s+(.+)$/);
                    qtd = m ? parseInt(m[1], 10) : 1;
                    nome = m ? m[2].trim() : linha;
                }
                
                if (!Number.isFinite(qtd) || qtd <= 0 || !nome) continue;
                if (nome.toLowerCase() === comandanteNome) continue; // ignora comandante ANTES de somar
                
                totalCartasLista += qtd;
                
                const key = nome.toLowerCase();
                const existente = agregado.get(key);
                console.log(key)
                if (existente) existente.quantidade += qtd;
                else agregado.set(key, { nome, quantidade: qtd });
            }

            if (totalCartasLista > 100) {
                mostrarModal('Limite Excedido',
                    `Sua lista possui ${totalCartasLista} cartas. O limite máximo é de 100 cartas.`);
                csvInput.value = '';
                return;
            }

            const cartasParaImportar = [...agregado.values()];
            const nomesParaBusca = cartasParaImportar.map(c => c.nome);

            try {
                atualizarStatus('salvando');

                const resultado = await api.buscarPorNomes(nomesParaBusca);
                const cartasValidas = [];

                resultado.encontradas.forEach(cartaDB => {
                    const chave = cartaDB.name.toLowerCase();
                    const cartaNoCSV = agregado.get(chave);
                    if (!cartaNoCSV) return;

                    cartasValidas.push({
                        ...cartaDB,
                        idCarta: cartaDB.id,
                        quantidade: cartaNoCSV.quantidade
                    });
                });

                if (resultado.naoEncontradas.length > 0) {
                    mostrarModal('Cartas não encontradas',
                        `Estas cartas não existem no banco e serão ignoradas:<br><br><i>${resultado.naoEncontradas.join(', ')}</i>`);
                }

                if (cartasValidas.length > 0) {
                    const loteParaAPI = cartasValidas.map(c => ({
                        idCarta: c.idCarta,
                        quantidade: c.quantidade
                    }));
                    await api.adicionarCartasLote(idDeck, loteParaAPI, 1, fkUsuario);

                    cartasValidas.forEach(cv => {
                        cv.colors = cv.colorsStr ? cv.colorsStr.split('') : [];
                        cv.colorsId = cv.identidade ? cv.identidade.split('') : [];

                        const existente = deckData.cartas.find(
                            x => x.idCarta === cv.idCarta && x.idBoard === 1
                        );
                        if (existente) existente.quantidade += cv.quantidade;
                        else deckData.cartas.push({ ...cv, idBoard: 1 });
                    });

                    atualizarInterface();
                }

                atualizarStatus('salvo');
            } catch (err) {
                console.error(err);
                atualizarStatus('erro');
                mostrarModal('Erro', 'Ocorreu um erro ao importar a lista.');
            } finally {
                csvInput.value = '';
            }
        };

        reader.readAsText(file, 'UTF-8');
    });
}