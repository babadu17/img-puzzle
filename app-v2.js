// =====================
//  SÉLECTIONS HTML
// =====================
const buttonPlus = document.querySelector(".plus");
const buttonCreer = document.querySelector(".creer");
const buttonAnnuler = document.querySelector(".annuler");
const inputFichier = document.querySelector(".fichier");
const inputNom = document.querySelector(".nom-puzzle");
const popUp = document.querySelector(".pop-up");
const page1 = document.querySelector(".page-1");
const page2 = document.querySelector(".page-2");
const board = document.querySelector(".puzzle-board");
const titrePuzzle = document.querySelector(".titre-puzzle");
const compteur = document.querySelector(".compteur");
const victoireOverlay = document.querySelector(".victoire-overlay");
const victoireStats = document.querySelector(".victoire-stats");

// =====================
//  ÉTAT DU JEU
// =====================
let puzzleActuel = null;
let grille = [];
let taille = 5;
let selection = null;
let nbEchanges = 0;
let taillePiece = 0; // calculé une seule fois au lancement
let boardSize = 0; // calculé une seule fois au lancement

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
buttonPlus.addEventListener("click", () => {
  popUp.classList.remove("hidden");
});

buttonAnnuler.addEventListener("click", () => {
  popUp.classList.add("hidden");
});

// =====================
//  CRÉER UN PUZZLE
// =====================
buttonCreer.addEventListener("click", () => {
  const fichier = inputFichier.files[0];
  const nom = inputNom.value.trim();

  if (!fichier) {
    alert("Veuillez choisir une image.");
    return;
  }
  if (!nom) {
    alert("Veuillez entrer un nom pour le puzzle.");
    return;
  }

  const difficulte = parseInt(
    document.querySelector("input[name='diff']:checked").value,
  );

  const reader = new FileReader();
  reader.onload = (e) => {
    const imageBase64 = e.target.result;

    const puzzle = {
      id: Date.now(),
      nom: nom,
      image: imageBase64,
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
  const puzzles = getPuzzles();
  container.innerHTML = "";

  if (puzzles.length === 0) {
    container.innerHTML = `<p class="vide">Aucun puzzle sauvegardé. Cliquez sur + pour en créer un !</p>`;
    return;
  }

  puzzles.forEach((puzzle) => {
    const diffLabel = {
      5: "😊 Facile",
      10: "😐 Moyen",
      20: "😤 Difficile",
      30: "💀 Très difficile",
    };
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
  taille = puzzle.taille;
  nbEchanges = 0;
  selection = null;

  titrePuzzle.textContent = puzzle.nom;
  compteur.textContent = "0 échanges";

  page1.classList.add("hidden");
  page2.classList.remove("hidden");

  // Calculer taillePiece et boardSize une seule fois
  taillePiece = Math.min(Math.floor(500 / taille), 80);
  boardSize = taillePiece * taille;

  // Générer et mélanger la grille
  grille = Array.from({ length: taille * taille }, (_, i) => i);
  melangerGrille();

  // Créer toutes les pièces une seule fois
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
  board.style.width = boardSize + "px";
  board.style.height = boardSize + "px";

  for (let i = 0; i < grille.length; i++) {
    const piece = document.createElement("div");
    piece.classList.add("piece");
    piece.style.width = taillePiece + "px";
    piece.style.height = taillePiece + "px";
    piece.style.backgroundImage = `url(${imageUrl})`;
    piece.style.backgroundSize = `${boardSize}px ${boardSize}px`;

    // Appliquer la position visuelle depuis la grille
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
//  LOGIQUE DE JEU
// =====================
function clicPiece(index) {
  const pieces = board.children;

  if (selection === null) {
    // Premier clic : sélectionner
    selection = index;
    pieces[index].classList.add("selectionnee");
  } else {
    if (selection === index) {
      // Re-clic sur la même pièce : désélectionner
      pieces[index].classList.remove("selectionnee");
      selection = null;
      return;
    }

    // Deuxième clic : échanger dans la grille
    pieces[selection].classList.remove("selectionnee");

    [grille[selection], grille[index]] = [grille[index], grille[selection]];

    // Mettre à jour UNIQUEMENT les 2 pièces concernées (pas tout le board !)
    appliquerPosition(pieces[selection], grille[selection]);
    appliquerPosition(pieces[index], grille[index]);

    nbEchanges++;
    compteur.textContent = `${nbEchanges} échange${nbEchanges > 1 ? "s" : ""}`;
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
