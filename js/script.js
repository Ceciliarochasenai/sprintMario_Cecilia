/**
 * Super Mario Jump - Lógica do Jogo e Integração com Ranking MySQL (Laragon)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Elementos do Jogo
    const mario = document.querySelector('.mario');
    const pipe = document.querySelector('.pipe');
    const gameBoard = document.getElementById('game-board');
    const hudPlayerName = document.getElementById('hud-player-name');
    const scoreDisplay = document.getElementById('score-display');
    const jumpTip = document.getElementById('jump-tip');

    // Modais e Telas
    const startModal = document.getElementById('start-modal');
    const startForm = document.getElementById('start-form');
    const playerInput = document.getElementById('player-input');
    const btnViewRanking = document.getElementById('btn-view-ranking');

    // Tela de escolha dos personagens
    const characterModal = document.getElementById('character-modal');
    const characterPlayerLabel = document.getElementById('character-player-label');
    const characterOptions = document.querySelectorAll('.character-option');

    const gameoverModal = document.getElementById('gameover-modal');
    const finalScoreValue = document.getElementById('final-score-value');
    const saveStatusMsg = document.getElementById('save-status-msg');
    const rankingBody = document.getElementById('ranking-body');
    const btnRestart = document.getElementById('btn-restart');
    const btnChangePlayer = document.getElementById('btn-change-player');

    // Variáveis de Estado
    let currentPlayer = '';
    let currentCharacter = 'mario.gif';
    let currentObstacle = 'pipe.png';
    let score = 0;
    let isPlaying = false;
    let gameLoop = null;
    let scoreLoop = null;

    // Recupera último nome utilizado caso exista
    const savedName = localStorage.getItem('mario_jump_player');
    if (savedName && playerInput) {
        playerInput.value = savedName;
    }

    /**
     * Inicia uma nova rodada
     */
    function startGame() {
        // Limpa loops anteriores se existirem
        clearInterval(gameLoop);
        clearInterval(scoreLoop);

        // Reseta posições e visuais
        resetElements();

        isPlaying = true;
        score = 0;
        scoreDisplay.textContent = '0';
        hudPlayerName.textContent = currentPlayer || 'Jogador';

        // Ativa animações CSS do jogo
        gameBoard.classList.add('running');

        // Loop de pontuação progressiva (1 ponto a cada 100ms)
        scoreLoop = setInterval(() => {
            if (isPlaying) {
                score += 1;
                scoreDisplay.textContent = score;
            }
        }, 100);

        // Loop de colisão
        gameLoop = setInterval(checkCollision, 10);
    }


    function resetElements() {
        // Reseta cano
        pipe.style.animation = '';
        pipe.style.left = '';

        // Reseta Mario
        mario.src = 'assets/' + currentCharacter;
        pipe.src = 'assets/' + currentObstacle;
        mario.style.animation = '';
        mario.style.bottom = '0px';
        mario.style.width = '';
        mario.style.marginLeft = '';
        mario.classList.remove('jump');

        if (jumpTip) {
            jumpTip.style.opacity = '1';
        }
    }

    function jump() {
        if (!isPlaying) return;
        if (mario.classList.contains('jump')) return;

        mario.classList.add('jump');

        if (jumpTip) {
            jumpTip.style.opacity = '0';
        }

        setTimeout(() => {
            mario.classList.remove('jump');
        }, 500);
    }

    function checkCollision() {
        if (!isPlaying) return;

        const pipePosition = pipe.offsetLeft;
        const marioPosition = +window.getComputedStyle(mario).bottom.replace('px', '');

        // Tolerância de colisão: quando o cano está na faixa de contato com o Mario
        if (pipePosition <= 120 && pipePosition > 0 && marioPosition < 80) {
            triggerGameOver(pipePosition, marioPosition);
        }
    }

    function triggerGameOver(pipePosition, marioPosition) {
     if (!isPlaying) return;

    // Para o jogo
    isPlaying = false;
    clearInterval(gameLoop);
    clearInterval(scoreLoop);

    gameBoard.classList.remove('running');

    // Para todas as animações do personagem e do obstáculo
    mario.style.animation = 'none';
    mario.classList.remove('jump');

    pipe.style.animation = 'none';
    pipe.style.left = `${pipePosition}px`;

    // Congela o obstáculo
    pipe.style.animation = 'none';
    pipe.style.left = `${pipePosition}px`;

    // Mostra a imagem de derrota
    mario.style.animation = 'none';
    mario.style.bottom = `${marioPosition}px`;

    // Escolhe a imagem de derrota de cada personagem
    const imagensDeDerrota = {
    'roberto.gif': 'roberto-gameover.png',
    'daniel.gif': 'daniel-gameover.png',
    'pedroTofanni.gif': 'pedro-gameover.png',
    'jaoMp.gif': 'jaoMp-gameover.png',
    'jaoSuper.gif': 'jaoSuper-gameover.png'
};

    // Troca para a imagem de derrota correspondente
    mario.src = 'assets/' + (
    imagensDeDerrota[currentCharacter] || 'game-over.png'
);
    mario.style.width = '75px';
    mario.style.marginLeft = '50px';

    // Atualiza a pontuação
    finalScoreValue.textContent = score;
    saveStatusMsg.textContent = 'Salvando pontuação no banco...';
    saveStatusMsg.style.color = '#ffcc00';

    // Fecha as outras telas
    startModal.classList.remove('active');
    characterModal.classList.remove('active');

    // Mostra a tela de Game Over
    gameoverModal.style.display = 'flex';
    gameoverModal.classList.add('active');

    // Salva a pontuação
    saveScore(currentPlayer, score);
}


    function saveScore(playerName, finalScore) {
        fetch('salvar_ranking.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nome: playerName,
                pontos: finalScore
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                saveStatusMsg.textContent = 'Pontuação registrada no banco!';
                saveStatusMsg.style.color = '#10b981';
                if (data.ranking) {
                    renderRanking(data.ranking, playerName, finalScore);
                }
            } else {
                saveStatusMsg.textContent = '⚠️ ' + (data.message || 'Erro ao registrar.');
                saveStatusMsg.style.color = '#ef4444';
            }
        })
        .catch(err => {
            console.error('Erro na requisição:', err);
            saveStatusMsg.textContent = '⚠️ Erro ao conectar ao servidor Laragon.';
            saveStatusMsg.style.color = '#ef4444';
        });
    }

    /**
     * Busca o ranking atualizado no banco
     */
    function fetchRanking() {
        fetch('obter_ranking.php')
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success' && data.ranking) {
                    renderRanking(data.ranking);
                }
            })
            .catch(err => console.error('Erro ao buscar ranking:', err));
    }

    /**
     * Atualiza a tabela HTML do ranking
     */
    function renderRanking(list, highlightName = null, highlightScore = null) {
        if (!rankingBody) return;
        rankingBody.innerHTML = '';

        if (!list || list.length === 0) {
            rankingBody.innerHTML = '<tr><td colspan="3" class="loading-cell">Nenhuma pontuação gravada ainda. Jogue para ser o 1º!</td></tr>';
            return;
        }

        let highlighted = false;

        list.forEach((item, index) => {
            const tr = document.createElement('tr');

            // Destaca a pontuação atual recém-salva se coincidir
            if (!highlighted && highlightName && item.nome === highlightName && parseInt(item.pontos, 10) === highlightScore) {
                tr.classList.add('highlight-current');
                highlighted = true;
            }

            let medal = `${index + 1}º`;
            if (index === 0) medal = '🥇 1º';
            else if (index === 1) medal = '🥈 2º';
            else if (index === 2) medal = '🥉 3º';

            tr.innerHTML = `
                <td class="ranking-pos">${medal}</td>
                <td><strong>${escapeHtml(item.nome)}</strong></td>
                <td>${parseInt(item.pontos, 10)} pts</td>
            `;

            rankingBody.appendChild(tr);
        });
    }

    /** Função auxiliar para sanitizar strings no HTML **/
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Escolhe o obstáculo e as cores de cada personagem
    function applyCharacterTheme(characterFile) {
    // Remove o tema anterior
    gameBoard.classList.remove(
        'theme-jaomp',
        'theme-jaosuper',
        'theme-pedro'
    );

    // Define o obstáculo de acordo com o personagem
    if (characterFile === 'jaoMp.gif') {
        currentObstacle = 'florPipe.jpg';
        gameBoard.classList.add('theme-jaomp');

    } else if (characterFile === 'jaoSuper.gif') {
        currentObstacle = 'fogueiraPipe.jpg';
        gameBoard.classList.add('theme-jaosuper');

    } else if (characterFile === 'pedroTofanni.gif') {
        currentObstacle = 'trofeuPipe.jpg';
        gameBoard.classList.add('theme-pedro');

    } else {
        // Roberto e Daniel usam o obstáculo padrão
        currentObstacle = 'pipe.png';
    }
}

    // Começa o jogo com o personagem escolhido
    function beginWithCharacter(characterFile) {
    currentCharacter = characterFile;

    applyCharacterTheme(characterFile);

    characterModal.classList.remove('active');
    startModal.classList.remove('active');

    startGame();
   }

    // Recebe o nome do jogador
    startForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameValue = playerInput.value.trim();

    if (!nameValue) {
        playerInput.focus();
        return;
    }

    currentPlayer = nameValue;
    localStorage.setItem('mario_jump_player', currentPlayer);

    // Compara o nome sem diferenciar maiúsculas e minúsculas
    const normalizedName = nameValue.toLocaleLowerCase('pt-BR');

    if (normalizedName === 'roberto') {
        beginWithCharacter('roberto.gif');

    } else if (normalizedName === 'daniel') {
        beginWithCharacter('daniel.gif');

    } else {
        // Para outros nomes, mostra a escolha de personagem
        characterPlayerLabel.textContent =
            'Olá, ' + currentPlayer + '! Escolha seu personagem.';

        startModal.classList.remove('active');
        characterModal.classList.add('active');
    }
  });

    // Quando a pessoa clica em um personagem
    characterOptions.forEach((button) => {
    button.addEventListener('click', () => {
        const characterFile = button.dataset.character;
        beginWithCharacter(characterFile);
    });
  });

    // Botão "VER RANKING" na tela inicial
    btnViewRanking.addEventListener('click', () => {
        fetchRanking();
        finalScoreValue.textContent = '---';
        saveStatusMsg.textContent = '';
        startModal.classList.remove('active');
        gameoverModal.classList.add('active');
    });

    // Botão "JOGAR NOVAMENTE" no Game Over
    btnRestart.addEventListener('click', () => {
        gameoverModal.classList.remove('active');
        if (!currentPlayer) {
            startModal.classList.add('active');
            playerInput.focus();
        } else {
            startGame();
        }
    });

    // 4. Botão "TROCAR JOGADOR" no Game Over
    btnChangePlayer.addEventListener('click', () => {
        gameoverModal.classList.remove('active');
        resetElements();
        startModal.classList.add('active');
        playerInput.value = '';
        playerInput.focus();
    });

    // 5. Controle do Pulo por Teclado (Espaço ou Seta para Cima)
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp') {
            if (isPlaying) {
                e.preventDefault();
                jump();
            }
        }
    });
});