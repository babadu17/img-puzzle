// =====================
//  SÉLECTIONS HTML
// =====================
const buttonPlus      = document.querySelector(".plus");
const buttonCreer     = document.querySelector(".creer");
const buttonAnnuler   = document.querySelector(".annuler");
const inputFichier    = document.querySelector(".fichier");
const inputNom        = document.querySelector(".nom-puzzle");
const popUp           = document.querySelector(".pop-up");
const page1           = document.querySelector(".page-1");
const page2           = document.querySelector(".page-2");
const board           = document.querySelector(".puzzle-board");
const titrePuzzle     = document.querySelector(".titre-puzzle");
const compteur        = document.querySelector(".compteur");
const victoireOverlay = document.querySelector(".victoire-overlay");
const victoireStats   = document.querySelector(".victoire-stats");

// =====================
//  ÉTAT DU JEU
// =====================
let puzzleActuel = null;
let grille       = [];   // grille[posActuelle] = indexOriginal de la pièce
let verrouille   = [];   // verrouille[posActuelle] = true/false
let taille       = 5;
let selection    = null;
let nbEchanges   = 0;
let taillePiece  = 0;
let boardSize    = 0;

// =====================
//  DÉMARRAGE
// =====================
document.addEventListener("DOMContentLoaded", () => {
    afficherPuzzles();
});

// =====================
//  AFFICHAGE NOM FICHIER
// =====================
inputFichier.addEventListener("change", (e) => {
    const nom = e.target.files[0]?.name || "Aucun fichier choisi";
    document.querySelector(".nom-fichier").textContent = nom;
});

// =====================
//  POP-UP
// =====================
buttonPlus.addEventListener("click", () => popUp.classList.remove("hidden"));
buttonAnnuler.addEventListener("click", () => popUp.classList.add("hidden"));

// =====================
//  CRÉER UN PUZZLE
// =====================
buttonCreer.addEventListener("click", () => {
    const fichier = inputFichier.files[0];
    const nom     = inputNom.value.trim();

    if (!fichier) { alert("Veuillez choisir une image."); return; }
    if (!nom)     { alert("Veuillez entrer un nom pour le puzzle."); return; }

    const difficulte = parseInt(document.querySelector("input[name='diff']:checked").value);

    const reader = new FileReader();
    reader.onload = (e) => {
        const puzzle = {
            id: Date.now(),
            nom: nom,
            image: e.target.result,
            taille: difficulte,
            date: new Date().toLocaleDateString("fr-FR"),
        };
        sauvegarderPuzzle(puzzle);
        afficherPuzzles();
        inputFichier.value = "";
        inputNom.value = "";
        document.querySelector(".nom-fichier").textContent = "Aucun fichier choisi";
        popUp.classList.add("hidden");
    };
    reader.readAsDataURL(fichier);
});

// =====================
//  LOCALSTORAGE
// =====================
function sauvegarderPuzzle(puzzle) {
    const puzzles = getPuzzles();
    puzzles.push(puzzle);
    localStorage.setItem("puzzles", JSON.stringify(puzzles));
}

function getPuzzles() {
    const data = localStorage.getItem("puzzles");
    return data ? JSON.parse(data) : [];
}

function supprimerPuzzle(id) {
    const puzzles = getPuzzles().filter((p) => p.id !== id);
    localStorage.setItem("puzzles", JSON.stringify(puzzles));
    afficherPuzzles();
}

// =====================
//  PAGE 1 — LISTE
// =====================
function afficherPuzzles() {
    const container = document.querySelector(".container");
    const puzzles   = getPuzzles();
    container.innerHTML = "";

    if (puzzles.length === 0) {
        container.innerHTML = `<p class="vide">Aucun puzzle sauvegardé. Cliquez sur + pour en créer un !</p>`;
        return;
    }

    puzzles.forEach((puzzle) => {
        const diffLabel = { 5: "😊 Facile", 10: "😐 Moyen", 20: "😤 Difficile", 30: "💀 Très difficile" };
        const carte = document.createElement("div");
        carte.classList.add("carte-puzzle");
        carte.innerHTML = `
            <img src="${puzzle.image}" alt="${puzzle.nom}" />
            <div class="carte-info">
                <span class="carte-nom">${puzzle.nom}</span>
                <span class="carte-diff">${diffLabel[puzzle.taille] || puzzle.taille + "×" + puzzle.taille}</span>
                <span class="carte-date">${puzzle.date}</span>
            </div>
            <button class="btn-supprimer" onclick="event.stopPropagation(); supprimerPuzzle(${puzzle.id})">✕</button>
        `;
        carte.addEventListener("click", () => lancerPuzzle(puzzle));
        container.appendChild(carte);
    });
}

// =====================
//  PAGE 2 — JOUER
// =====================
function lancerPuzzle(puzzle) {
    puzzleActuel = puzzle;
    taille       = puzzle.taille;
    nbEchanges   = 0;
    selection    = null;

    titrePuzzle.textContent = puzzle.nom;
    compteur.textContent    = "0 échanges";

    page1.classList.add("hidden");
    page2.classList.remove("hidden");

    const wrapper = document.querySelector(".puzzle-wrapper");
    const maxW = wrapper.clientWidth - 20;
    const maxH = wrapper.clientHeight - 20;
    const maxBoard = Math.min(maxW, maxH, 800);
    taillePiece = Math.max(Math.floor(maxBoard / taille), 2);
    boardSize   = taillePiece * taille;

    // Initialiser la grille et le tableau de verrouillage
    grille     = Array.from({ length: taille * taille }, (_, i) => i);
    verrouille = new Array(taille * taille).fill(false);
    melangerGrille();
    initialiserBoard(puzzle.image);
}

function melangerGrille() {
    for (let i = grille.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [grille[i], grille[j]] = [grille[j], grille[i]];
    }
}

// Crée les pièces DOM une seule fois
function initialiserBoard(imageUrl) {
    board.innerHTML = "";
    board.style.gridTemplateColumns = `repeat(${taille}, ${taillePiece}px)`;
    board.style.width  = boardSize + "px";
    board.style.height = boardSize + "px";

    for (let i = 0; i < grille.length; i++) {
        const piece = document.createElement("div");
        piece.classList.add("piece");
        piece.style.width           = taillePiece + "px";
        piece.style.height          = taillePiece + "px";
        piece.style.backgroundImage = `url(${imageUrl})`;
        piece.style.backgroundSize  = `${boardSize}px ${boardSize}px`;
        appliquerPosition(piece, grille[i]);
        piece.addEventListener("click", () => clicPiece(i));
        board.appendChild(piece);
    }
}

// Met à jour uniquement le backgroundPosition d'une pièce
function appliquerPosition(pieceEl, indexOriginal) {
    const col = indexOriginal % taille;
    const row = Math.floor(indexOriginal / taille);
    pieceEl.style.backgroundPosition = `-${col * taillePiece}px -${row * taillePiece}px`;
}

// =====================
//  VERROUILLAGE
// =====================

// Vérifie si 2 pièces sont voisines ET correctement placées l'une par rapport à l'autre
function sontVoisinesBienPlacees(posA, posB) {
    const origA = grille[posA];
    const origB = grille[posB];

    const colPos  = posA % taille,  rowPos  = Math.floor(posA / taille);
    const colPosB = posB % taille,  rowPosB = Math.floor(posB / taille);
    const colOrig = origA % taille, rowOrig = Math.floor(origA / taille);
    const colOrigB= origB % taille, rowOrigB= Math.floor(origB / taille);

    // Décalage en position actuelle
    const dCol = colPosB - colPos;
    const dRow = rowPosB - rowPos;

    // Décalage en position originale
    const dColOrig = colOrigB - colOrig;
    const dRowOrig = rowOrigB - rowOrig;

    // Elles sont voisines si le décalage est identique dans les 2 espaces
    return dCol === dColOrig && dRow === dRowOrig;
}

// Propage le verrouillage : trouve tout le groupe connecté autour d'un index
function calculerGroupeVerrouille(startPos) {
    const visited = new Set();
    const queue   = [startPos];

    while (queue.length > 0) {
        const pos = queue.shift();
        if (visited.has(pos)) continue;
        visited.add(pos);

        const col = pos % taille;
        const row = Math.floor(pos / taille);

        // Voisins haut/bas/gauche/droite
        const voisins = [];
        if (col > 0)         voisins.push(pos - 1);
        if (col < taille - 1) voisins.push(pos + 1);
        if (row > 0)         voisins.push(pos - taille);
        if (row < taille - 1) voisins.push(pos + taille);

        for (const v of voisins) {
            if (!visited.has(v) && sontVoisinesBienPlacees(pos, v)) {
                queue.push(v);
            }
        }
    }
    return visited;
}

// Après chaque échange, vérifie et verrouille les groupes formés
function mettreAJourVerrouillage(indexA, indexB) {
    const pieces = board.children;

    // Vérifier les 2 pièces échangées et leurs voisins directs
    const aVerifier = new Set([indexA, indexB]);
    for (const pos of [indexA, indexB]) {
        const col = pos % taille;
        const row = Math.floor(pos / taille);
        if (col > 0)          aVerifier.add(pos - 1);
        if (col < taille - 1) aVerifier.add(pos + 1);
        if (row > 0)          aVerifier.add(pos - taille);
        if (row < taille - 1) aVerifier.add(pos + taille);
    }

    for (const pos of aVerifier) {
        if (verrouille[pos]) continue;

        // Une pièce seule est-elle à sa bonne place ?
        if (grille[pos] === pos) {
            // Calculer tout le groupe connecté
            const groupe = calculerGroupeVerrouille(pos);
            // Verrouiller tout le groupe
            for (const membre of groupe) {
                verrouille[membre] = true;
                pieces[membre].classList.add("verrouillee");
                pieces[membre].classList.remove("selectionnee");
            }
        }
    }
}

// =====================
//  LOGIQUE DE JEU
// =====================
function clicPiece(index) {
    const pieces = board.children;

    // Ignorer les pièces verrouillées
    if (verrouille[index]) return;

    if (selection === null) {
        selection = index;
        pieces[index].classList.add("selectionnee");

    } else {
        if (selection === index) {
            pieces[index].classList.remove("selectionnee");
            selection = null;
            return;
        }

        // Ignorer si la 2e pièce est verrouillée
        if (verrouille[index]) return;

        pieces[selection].classList.remove("selectionnee");

        // Échanger
        [grille[selection], grille[index]] = [grille[index], grille[selection]];
        appliquerPosition(pieces[selection], grille[selection]);
        appliquerPosition(pieces[index],     grille[index]);

        nbEchanges++;
        compteur.textContent = `${nbEchanges} échange${nbEchanges > 1 ? "s" : ""}`;

        // Vérifier les verrouillages après l'échange
        mettreAJourVerrouillage(selection, index);

        selection = null;

        if (verifierVictoire()) {
            setTimeout(() => afficherVictoire(), 300);
        }
    }
}

function verifierVictoire() {
    return grille.every((val, idx) => val === idx);
}

function afficherVictoire() {
    victoireStats.textContent = `Résolu en ${nbEchanges} échange${nbEchanges > 1 ? "s" : ""} !`;
    victoireOverlay.classList.remove("hidden");
}

// =====================
//  BOUTONS PAGE 2
// =====================
document.querySelector(".retour").addEventListener("click", () => {
    page2.classList.add("hidden");
    page1.classList.remove("hidden");
    victoireOverlay.classList.add("hidden");
});

document.querySelector(".btn-rejouer").addEventListener("click", () => {
    victoireOverlay.classList.add("hidden");
    lancerPuzzle(puzzleActuel);
});

document.querySelector(".btn-accueil").addEventListener("click", () => {
    victoireOverlay.classList.add("hidden");
    page2.classList.add("hidden");
    page1.classList.remove("hidden");
});
