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
let grille = []; // grille[pos] = indexOriginal de la pièce
let groupes = []; // groupes[pos] = id du groupe (ou -1 si seule)
let verrouille = []; // verrouille[pos] = true si groupe à la bonne place
let taille = 5;
let selection = null; // { type: 'piece'|'groupe', index, groupeId, positions }
let nbEchanges = 0;
let taillePiece = 0;
let boardSize = 0;
let prochainGroupeId = 0;

// =====================
//  DÉMARRAGE
// =====================
document.addEventListener("DOMContentLoaded", () => afficherPuzzles());

inputFichier.addEventListener("change", (e) => {
  document.querySelector(".nom-fichier").textContent =
    e.target.files[0]?.name || "Aucun fichier choisi";
});

buttonPlus.addEventListener("click", () => popUp.classList.remove("hidden"));
buttonAnnuler.addEventListener("click", () => popUp.classList.add("hidden"));

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
    sauvegarderPuzzle({
      id: Date.now(),
      nom,
      image: e.target.result,
      taille: difficulte,
      date: new Date().toLocaleDateString("fr-FR"),
    });
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
  const p = getPuzzles();
  p.push(puzzle);
  localStorage.setItem("puzzles", JSON.stringify(p));
}
function getPuzzles() {
  return JSON.parse(localStorage.getItem("puzzles") || "[]");
}
function supprimerPuzzle(id) {
  localStorage.setItem(
    "puzzles",
    JSON.stringify(getPuzzles().filter((p) => p.id !== id)),
  );
  afficherPuzzles();
}

// =====================
//  PAGE 1
// =====================
function afficherPuzzles() {
  const container = document.querySelector(".container");
  const puzzles = getPuzzles();
  container.innerHTML = "";
  if (puzzles.length === 0) {
    container.innerHTML = `<p class="vide">Aucun puzzle sauvegardé. Cliquez sur + pour en créer un !</p>`;
    return;
  }
  const diffLabel = {
    5: "😊 Facile",
    10: "😐 Moyen",
    20: "😤 Difficile",
    30: "💀 Très difficile",
  };
  puzzles.forEach((puzzle) => {
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
//  PAGE 2 — LANCER
// =====================
function lancerPuzzle(puzzle) {
  puzzleActuel = puzzle;
  taille = puzzle.taille;
  nbEchanges = 0;
  selection = null;
  prochainGroupeId = 0;

  titrePuzzle.textContent = puzzle.nom;
  compteur.textContent = "0 échanges";

  page1.classList.add("hidden");
  page2.classList.remove("hidden");

  const wrapper = document.querySelector(".puzzle-wrapper");
  const maxBoard = Math.min(
    wrapper.clientWidth - 20,
    wrapper.clientHeight - 20,
    800,
  );
  taillePiece = Math.max(Math.floor(maxBoard / taille), 2);
  boardSize = taillePiece * taille;

  grille = Array.from({ length: taille * taille }, (_, i) => i);
  groupes = new Array(taille * taille).fill(-1);
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
    appliquerPosition(piece, grille[i]);
    piece.addEventListener("click", () => clicPiece(i));
    board.appendChild(piece);
  }
}

function appliquerPosition(pieceEl, indexOriginal) {
  const col = indexOriginal % taille;
  const row = Math.floor(indexOriginal / taille);
  pieceEl.style.backgroundPosition = `-${col * taillePiece}px -${row * taillePiece}px`;
}

// =====================
//  GROUPES
// =====================

// 2 pièces voisines sont-elles alignées entre elles (peu importe où sur le plateau) ?
function sontAlignees(posA, posB) {
  const dCol = (posB % taille) - (posA % taille);
  const dRow = Math.floor(posB / taille) - Math.floor(posA / taille);
  if (Math.abs(dCol) + Math.abs(dRow) !== 1) return false; // pas voisines directes
  const dColOrig = (grille[posB] % taille) - (grille[posA] % taille);
  const dRowOrig =
    Math.floor(grille[posB] / taille) - Math.floor(grille[posA] / taille);
  return dCol === dColOrig && dRow === dRowOrig;
}

// Retourne toutes les positions du groupe d'une case (BFS sur pièces alignées)
function getPositionsGroupe(pos) {
  const gid = groupes[pos];
  if (gid === -1) return new Set([pos]);
  const result = new Set();
  for (let i = 0; i < grille.length; i++) {
    if (groupes[i] === gid) result.add(i);
  }
  return result;
}

// Fusionne les groupes de posA et posB en un seul
function fusionnerGroupes(posA, posB) {
  const gidA = groupes[posA];
  const gidB = groupes[posB];
  if (gidA !== -1 && gidA === gidB) return; // déjà dans le même groupe

  // Nouveau groupe ou fusion
  const newId = prochainGroupeId++;
  const aFusionner = new Set([posA, posB]);

  // Ajouter tous les membres des groupes existants
  for (let i = 0; i < groupes.length; i++) {
    if (
      (gidA !== -1 && groupes[i] === gidA) ||
      (gidB !== -1 && groupes[i] === gidB)
    ) {
      aFusionner.add(i);
    }
  }
  for (const p of aFusionner) groupes[p] = newId;
}

// Après un échange : recalcule les groupes des 2 pièces et leurs voisins
function mettreAJourGroupes(posA, posB) {
  const pieces = board.children;
  const aVerifier = new Set([posA, posB]);

  for (const pos of [posA, posB]) {
    const col = pos % taille,
      row = Math.floor(pos / taille);
    if (col > 0) aVerifier.add(pos - 1);
    if (col < taille - 1) aVerifier.add(pos + 1);
    if (row > 0) aVerifier.add(pos - taille);
    if (row < taille - 1) aVerifier.add(pos + taille);
  }

  // Dissoudre les groupes des pièces déplacées (elles peuvent ne plus être alignées)
  // On recalcule tout proprement via BFS
  // 1. Retirer posA et posB de leurs anciens groupes
  for (const pos of [posA, posB]) {
    const oldGid = groupes[pos];
    if (oldGid !== -1) {
      // Reconstruire le groupe sans cette pièce
      groupes[pos] = -1;
      // Vérifier si les autres membres restent connectés entre eux
      reconstruireGroupe(oldGid, pos);
    }
  }

  // 2. Vérifier les nouvelles connexions
  for (const pos of aVerifier) {
    if (verrouille[pos]) continue;
    const col = pos % taille,
      row = Math.floor(pos / taille);
    const voisins = [];
    if (col > 0) voisins.push(pos - 1);
    if (col < taille - 1) voisins.push(pos + 1);
    if (row > 0) voisins.push(pos - taille);
    if (row < taille - 1) voisins.push(pos + taille);

    for (const v of voisins) {
      if (!verrouille[v] && sontAlignees(pos, v)) {
        fusionnerGroupes(pos, v);
      }
    }
  }

  // 3. Mettre à jour l'affichage des groupes
  rafraichirAffichageGroupes();

  // 4. Vérifier si des groupes sont maintenant à la bonne place
  verifierVerrouillage();
}

// Reconstruit les sous-groupes après qu'une pièce a été retirée d'un groupe
function reconstruireGroupe(oldGid, posRetiree) {
  // Trouver tous les membres restants de ce groupe
  const membres = [];
  for (let i = 0; i < groupes.length; i++) {
    if (groupes[i] === oldGid) membres.add ? null : membres.push(i);
  }
  // Les dissoudre et laisser mettreAJourGroupes les recréer
  for (const m of membres) groupes[m] = -1;
  // Reconstruire par BFS entre membres
  for (const m of membres) {
    const col = m % taille,
      row = Math.floor(m / taille);
    const voisins = [];
    if (col > 0) voisins.push(m - 1);
    if (col < taille - 1) voisins.push(m + 1);
    if (row > 0) voisins.push(m - taille);
    if (row < taille - 1) voisins.push(m + taille);
    for (const v of voisins) {
      if (membres.includes(v) && sontAlignees(m, v)) {
        fusionnerGroupes(m, v);
      }
    }
  }
}

function rafraichirAffichageGroupes() {
  const pieces = board.children;
  for (let i = 0; i < grille.length; i++) {
    if (verrouille[i]) continue;
    pieces[i].classList.toggle("en-groupe", groupes[i] !== -1);
  }
}

// Un groupe est à la bonne place si TOUTES ses pièces sont à grille[pos] === pos
function verifierVerrouillage() {
  const pieces = board.children;
  const traites = new Set();

  for (let pos = 0; pos < grille.length; pos++) {
    if (verrouille[pos] || traites.has(pos)) continue;

    const gid = groupes[pos];
    const membres = gid === -1 ? [pos] : [...getPositionsGroupe(pos)];

    // Vérifier si toutes les pièces du groupe sont à leur bonne place
    const toutBienPlace = membres.every((m) => grille[m] === m);
    // Un groupe solo ne se verrouille que s'il est adjacent à un verrouillé
    const estSolo = membres.length === 1;
    const aVoisinVerrouille =
      estSolo &&
      (() => {
        const col = pos % taille,
          row = Math.floor(pos / taille);
        return (
          (col > 0 && verrouille[pos - 1] && sontAlignees(pos, pos - 1)) ||
          (col < taille - 1 &&
            verrouille[pos + 1] &&
            sontAlignees(pos, pos + 1)) ||
          (row > 0 &&
            verrouille[pos - taille] &&
            sontAlignees(pos, pos - taille)) ||
          (row < taille - 1 &&
            verrouille[pos + taille] &&
            sontAlignees(pos, pos + taille))
        );
      })();

    if (toutBienPlace && (!estSolo || aVoisinVerrouille)) {
      for (const m of membres) {
        verrouille[m] = true;
        groupes[m] = -1;
        pieces[m].classList.add("verrouillee");
        pieces[m].classList.remove("en-groupe", "selectionnee", "groupe-selec");
        traites.add(m);
      }
    }

    for (const m of membres) traites.add(m);
  }
}

// =====================
//  DÉPLACER UN GROUPE
// =====================
function getBoundingBox(positions) {
  let minCol = Infinity,
    maxCol = -Infinity,
    minRow = Infinity,
    maxRow = -Infinity;
  for (const pos of positions) {
    const col = pos % taille,
      row = Math.floor(pos / taille);
    minCol = Math.min(minCol, col);
    maxCol = Math.max(maxCol, col);
    minRow = Math.min(minRow, row);
    maxRow = Math.max(maxRow, row);
  }
  return {
    minCol,
    maxCol,
    minRow,
    maxRow,
    largeur: maxCol - minCol + 1,
    hauteur: maxRow - minRow + 1,
  };
}

function tenterDeplacerGroupe(positions, ciblePos) {
  const bbox = getBoundingBox(positions);
  const cibleRow = Math.floor(ciblePos / taille);
  const cibleCol = ciblePos % taille;

  // Centrer le groupe sur la case cliquée
  const targetRow = Math.max(
    0,
    Math.min(taille - bbox.hauteur, cibleRow - Math.floor(bbox.hauteur / 2)),
  );
  const targetCol = Math.max(
    0,
    Math.min(taille - bbox.largeur, cibleCol - Math.floor(bbox.largeur / 2)),
  );

  const offRow = targetRow - bbox.minRow;
  const offCol = targetCol - bbox.minCol;

  // Calculer le mapping src → dst
  const mapping = new Map();
  for (const pos of positions) {
    const newRow = Math.floor(pos / taille) + offRow;
    const newCol = (pos % taille) + offCol;
    if (newRow < 0 || newRow >= taille || newCol < 0 || newCol >= taille)
      return false;
    const dst = newRow * taille + newCol;
    if (verrouille[dst] && !positions.has(dst)) return false;
    mapping.set(pos, dst);
  }

  // Copie temporaire pour éviter les corruptions
  const tmpGrille = [...grille];
  const tmpGroupes = [...groupes];

  // Cases sources libérées (pas dans les destinations)
  const dsts = new Set(mapping.values());
  const srcsLiberees = [...positions].filter((s) => !dsts.has(s));
  const dstsLibres = [...dsts].filter((d) => !positions.has(d));

  // Écrire les pièces du groupe à leurs nouvelles positions
  for (const [src, dst] of mapping) {
    grille[dst] = tmpGrille[src];
    groupes[dst] = tmpGroupes[src];
  }

  // Mettre les pièces libres déplacées dans les cases libérées
  for (let i = 0; i < srcsLiberees.length; i++) {
    const src = srcsLiberees[i];
    if (i < dstsLibres.length) {
      grille[src] = tmpGrille[dstsLibres[i]];
      groupes[src] = tmpGroupes[dstsLibres[i]];
    } else {
      grille[src] = src;
      groupes[src] = -1;
    }
  }

  // Mettre à jour l'affichage
  const pieces = board.children;
  const touchees = new Set([...positions, ...dsts, ...srcsLiberees]);
  for (const pos of touchees) {
    appliquerPosition(pieces[pos], grille[pos]);
    pieces[pos].classList.remove("groupe-selec", "selectionnee", "en-groupe");
  }

  nbEchanges++;
  compteur.textContent = `${nbEchanges} échange${nbEchanges > 1 ? "s" : ""}`;

  // Recalculer groupes et verrouillage sur les cases touchées
  rafraichirAffichageGroupes();
  verifierVerrouillage();
  return true;
}

// =====================
//  LOGIQUE DE JEU — CLIC
// =====================
function deselectionnerTout() {
  const pieces = board.children;
  if (selection) {
    if (selection.type === "piece") {
      pieces[selection.index].classList.remove("selectionnee");
    } else {
      for (const pos of selection.positions)
        pieces[pos].classList.remove("groupe-selec");
    }
    selection = null;
  }
}

function clicPiece(index) {
  const pieces = board.children;

  // ── Un GROUPE est sélectionné ──
  if (selection && selection.type === "groupe") {
    // Re-clic sur le groupe → désélectionner
    if (selection.positions.has(index)) {
      deselectionnerTout();
      return;
    }

    // Clic sur une case non verrouillée → déplacer
    if (!verrouille[index]) {
      const ok = tenterDeplacerGroupe(selection.positions, index);
      if (!ok) {
        pieces[index].classList.add("erreur");
        setTimeout(() => pieces[index].classList.remove("erreur"), 400);
      }
      deselectionnerTout();
      if (verifierVictoire()) setTimeout(() => afficherVictoire(), 300);
      return;
    }
    deselectionnerTout();
    return;
  }

  // ── Une PIÈCE LIBRE est sélectionnée ──
  if (selection && selection.type === "piece") {
    if (selection.index === index) {
      deselectionnerTout();
      return;
    }

    if (!verrouille[index] && groupes[index] === -1) {
      // Échanger 2 pièces libres (sans groupe)
      const selIdx = selection.index;
      pieces[selIdx].classList.remove("selectionnee");
      [grille[selIdx], grille[index]] = [grille[index], grille[selIdx]];
      [groupes[selIdx], groupes[index]] = [-1, -1];
      appliquerPosition(pieces[selIdx], grille[selIdx]);
      appliquerPosition(pieces[index], grille[index]);
      nbEchanges++;
      compteur.textContent = `${nbEchanges} échange${nbEchanges > 1 ? "s" : ""}`;
      selection = null;
      mettreAJourGroupes(selIdx, index);
      if (verifierVictoire()) setTimeout(() => afficherVictoire(), 300);
      return;
    }
    deselectionnerTout();
  }

  // ── Rien de sélectionné ──
  if (verrouille[index]) return;

  if (groupes[index] !== -1) {
    // Sélectionner le groupe entier
    const positions = getPositionsGroupe(index);
    selection = { type: "groupe", positions };
    for (const pos of positions) pieces[pos].classList.add("groupe-selec");
  } else {
    // Sélectionner une pièce libre
    selection = { type: "piece", index };
    pieces[index].classList.add("selectionnee");
  }
}

// =====================
//  VICTOIRE
// =====================
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
  deselectionnerTout();
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
