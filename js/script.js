(() => {
  const $ = (id) => document.getElementById(id);
  const characters = {
    jao: { name: "Jão", world: "MUNDO DO JÃO", runner: "assets/jao-run.png", preview: "assets/jao-preview.png", worldClass: "world-jao" },
    pedro: { name: "Pedro", world: "MUNDO DO PEDRO", runner: "assets/pedro-run.gif", preview: "assets/pedro-preview.png", worldClass: "world-pedro" }
  };
  let selected = "jao", playerName = "Jogador", score = 0, gameTimer = null, scoreTimer = null, isJumping = false, ended = false;
  const screens = ["homeScreen", "gameScreen", "resultScreen"];
  const rankingKey = "pixelRunRankingV1";

  function showScreen(id) {
    screens.forEach(screen => $(screen).classList.toggle("active", screen === id));
  }
  function getRanking() {
    try { return JSON.parse(localStorage.getItem(rankingKey) || "[]"); } catch { return []; }
  }
  function saveResult() {
    const ranking = getRanking();
    ranking.push({ name: playerName, character: characters[selected].name, score, date: new Date().toLocaleDateString("pt-BR") });
    ranking.sort((a, b) => b.score - a.score);
    localStorage.setItem(rankingKey, JSON.stringify(ranking.slice(0, 5)));
    renderRanking();
  }
  function renderRanking() {
    const list = $("rankingList"), ranking = getRanking();
    list.innerHTML = "";
    if (!ranking.length) {
      const li = document.createElement("li"); li.textContent = "Ainda sem pontuações."; list.appendChild(li); return;
    }
    ranking.forEach((entry, index) => {
      const li = document.createElement("li");
      const strong = document.createElement("strong"); strong.textContent = `${index + 1}. ${entry.name}`;
      const details = document.createElement("small"); details.textContent = ` · ${entry.character} · ${entry.date}`;
      const points = document.createElement("span"); points.textContent = `${entry.score} pts`;
      li.append(strong, details, points); list.appendChild(li);
    });
  }
  function updateBest() {
    const best = getRanking().reduce((max, entry) => Math.max(max, Number(entry.score) || 0), 0);
    $("bestScore").textContent = best;
  }
  function chooseCharacter(id) {
    if (!characters[id]) return;
    selected = id;
    document.querySelectorAll(".character-card").forEach(card => {
      const active = card.dataset.character === selected;
      card.classList.toggle("selected", active);
      card.setAttribute("aria-pressed", String(active));
    });
  }
  function applyWorld() {
    const character = characters[selected];
    $("gameWorld").classList.remove("world-jao", "world-pedro");
    $("gameWorld").classList.add(character.worldClass);
    $("runnerImage").src = character.runner;
    $("runnerImage").alt = `${character.name} correndo`;
    $("worldLabel").textContent = character.world;
    $("currentCharacter").textContent = character.name;
  }
  function jump() {
    if (!$("gameScreen").classList.contains("active") || isJumping || ended) return;
    isJumping = true;
    $("gameCharacter").classList.add("jumping");
    setTimeout(() => {
      $("gameCharacter").classList.remove("jumping");
      isJumping = false;
    }, 650);
  }
  function stopTimers() {
    clearInterval(gameTimer); clearInterval(scoreTimer);
    gameTimer = null; scoreTimer = null;
    $("obstacle").style.animationPlayState = "paused";
  }
  function startGame() {
    playerName = $("playerName").value.trim() || "Jogador";
    score = 0; ended = false; isJumping = false;
    $("liveScore").textContent = "0"; $("gameScore").textContent = "0";
    $("currentPlayer").textContent = playerName;
    $("gameCharacter").classList.remove("jumping");
    $("obstacle").style.animation = "none";
    void $("obstacle").offsetWidth;
    $("obstacle").style.animation = "";
    $("obstacle").style.animationPlayState = "running";
    applyWorld(); showScreen("gameScreen");
    clearInterval(gameTimer); clearInterval(scoreTimer);
    gameTimer = setInterval(checkCollision, 40);
    scoreTimer = setInterval(() => {
      if (ended) return;
      score += 1;
      $("liveScore").textContent = score;
      $("gameScore").textContent = score;
      if (score >= 100) finishGame(true);
    }, 180);
  }
  function checkCollision() {
    if (ended || isJumping) return;
    const runner = $("gameCharacter").getBoundingClientRect();
    const obstacle = $("obstacle").getBoundingClientRect();
    const overlap = runner.right - 20 > obstacle.left + 5 && runner.left + 20 < obstacle.right - 5 &&
                    runner.bottom - 8 > obstacle.top + 4 && runner.top + 12 < obstacle.bottom;
    if (overlap) finishGame(false);
  }
  function finishGame(won) {
    if (ended) return;
    ended = true; stopTimers(); saveResult(); updateBest();
    $("resultIcon").textContent = won ? "🏆" : "💫";
    $("resultEyebrow").textContent = won ? "MISSÃO CONCLUÍDA" : "FIM DE JOGO";
    $("resultTitle").textContent = won ? "Você conseguiu!" : "Quase lá!";
    $("resultMessage").textContent = won
      ? `${playerName}, você completou a fase com ${characters[selected].name}!`
      : `${playerName}, um obstáculo apareceu no caminho. Tente mais uma vez!`;
    $("finalScore").textContent = score;
    showScreen("resultScreen");
  }
  function backToMenu() {
    stopTimers(); ended = true; showScreen("homeScreen"); updateBest();
  }

  document.querySelectorAll(".character-card").forEach(card => card.addEventListener("click", () => chooseCharacter(card.dataset.character)));
  $("startButton").addEventListener("click", startGame);
  $("retryButton").addEventListener("click", startGame);
  $("backButton").addEventListener("click", backToMenu);
  $("quitButton").addEventListener("click", backToMenu);
  $("mobileJump").addEventListener("click", jump);
  document.addEventListener("keydown", event => {
    if (event.code === "Space" || event.code === "ArrowUp") {
      if ($("gameScreen").classList.contains("active")) { event.preventDefault(); jump(); }
      else if ($("homeScreen").classList.contains("active") && event.code === "Space") { /* no-op on menu */ }
    }
    if (event.code === "Escape" && $("gameScreen").classList.contains("active")) backToMenu();
  });
  $("gameWorld").addEventListener("pointerdown", event => { if (event.target.id !== "quitButton") jump(); });
  renderRanking(); updateBest();
})();