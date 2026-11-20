function configurarImportacaoCSV() {
    const csvInput = document.getElementById('csv-file');
    
    csvInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async function(event) {
            const linhas = event.target.result.split('\n').filter(l => l.trim() !== '');
            const cartasParaImportar = [];
            let totalCartasLista = 0;
            const nomesParaBusca = [];
            const regex = /^(\d+)[xX]?\s+(.+)$/;

            for (let linha of linhas) {
                linha = linha.trim();
                if (!linha) continue;
                
                let match = linha.match(regex);
                let qtd = match ? parseInt(match[1]) : 1;
                let nome = match ? match[2].trim() : linha;

                totalCartasLista += qtd;
                nomesParaBusca.push(nome);
                cartasParaImportar.push({ nome, quantidade: qtd });
            }

            if (totalCartasLista > 100) {
                mostrarModal('Limite Excedido', `Sua lista possui ${totalCartasLista} cartas. O limite máximo é de 100 cartas.`);
                this.value = '';
                return;
            }

            try {
                atualizarStatus('salvando');
                const resultado = await api.buscarPorNomes(nomesParaBusca);
                const comandanteNome = deckData.deck.commander.toLowerCase();
                let cartasValidas = [];

                resultado.encontradas.forEach(cartaDB => {
                    if (cartaDB.name.toLowerCase() === comandanteNome) return;

                    const cartaNoCSV = cartasParaImportar.find(c => c.nome.toLowerCase() === cartaDB.name.toLowerCase());
                    if (cartaNoCSV) {
                        cartasValidas.push({ 
                            ...cartaDB, 
                            idCarta: cartaDB.id,
                            quantidade: cartaNoCSV.quantidade
                        });
                    }
                });

                if (resultado.naoEncontradas.length > 0) {
                    mostrarModal('Cartas não encontradas', `Estas cartas não existem no banco e serão ignoradas:<br><br><i>${resultado.naoEncontradas.join(', ')}</i>`);
                }

                if (cartasValidas.length > 0) {
                    const loteParaAPI = cartasValidas.map(c => ({ idCarta: c.idCarta, quantidade: c.quantidade }));
                    await api.adicionarCartasLote(idDeck, loteParaAPI, 1, fkUsuario);
                    
                    cartasValidas.forEach(cv => {
                        cv.colors = cv.colorsStr ? cv.colorsStr.split('') : [];
                        cv.colorsId = cv.identidade ? cv.identidade.split('') : [];

                        let existente = deckData.cartas.find(x => x.idCarta === cv.idCarta && x.idBoard === 1);
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
                this.value = '';
            }
        };
        reader.readAsText(file);
    });
}