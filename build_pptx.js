"use strict";
const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3" × 7.5"
pres.author = "Chef Khalil";
pres.title = "Menu 246 — Guide de Démonstration";

// ─────────────────────────────────────────────────────────────
// CAMPFIRE SCOUT THEME
// ─────────────────────────────────────────────────────────────
const C = {
  orange:      "E8621A",  // Flame Orange — primary accent
  green:       "2D6A4F",  // Herb Green — secondary
  parchment:   "F5F0E8",  // Parchment — card bg
  warmWhite:   "FFFEF9",  // Warm White — slide bg
  charcoal:    "1C1C1E",  // Charcoal — text / dark bg
  gray:        "6B7280",  // Ash Gray — muted text
  ember:       "FFEDDE",  // Ember — warm highlight
  brown:       "5C4033",  // Bark Brown — tertiary accent
  border:      "E5E0D5",  // Border Tan
  white:       "FFFFFF",
  greenLight:  "D1EAD8",
  blueLight:   "D5E8F5",
  purple:      "7C3AED",
  blue:        "1D4ED8",
  amber:       "D97706",
  orangeDark:  "C44E0D",
  codeGreen:   "5AF078",
};

const HEADER = "Georgia";
const BODY   = "Calibri";
const MONO   = "Consolas";

// Shadow factory — NEVER reuse options objects across calls
const mkShadow = () => ({
  type: "outer", blur: 5, offset: 2, angle: 135, color: "000000", opacity: 0.10,
});

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function accentBar(slide, color = C.orange) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 13.3, h: 0.07,
    fill: { color },
    line: { color, width: 0 },
  });
}

function card(slide, x, y, w, h, fill = C.parchment, withShadow = false) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: fill },
    line: { color: C.border, width: 1 },
    shadow: withShadow ? mkShadow() : undefined,
  });
}

function cardTopBar(slide, x, y, w, color) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h: 0.08,
    fill: { color },
    line: { color, width: 0 },
  });
}

function demoBadge(slide) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.8, w: 2.5, h: 0.38,
    fill: { color: C.green },
    line: { color: C.green, width: 0 },
  });
  slide.addText("🎬  DÉMO EN DIRECT", {
    x: 0.5, y: 0.8, w: 2.5, h: 0.38,
    fontFace: BODY, fontSize: 11, bold: true,
    color: C.white, align: "center", valign: "middle", margin: 0,
  });
}

function stepBreadcrumb(slide, active) {
  const steps = ["1 · Configurer", "2 · Planifier", "3 · Exporter"];
  let x = 3.2;
  steps.forEach((label, i) => {
    const isActive = i === active - 1;
    const bg  = isActive ? C.orange : C.border;
    const txt = isActive ? C.white  : C.gray;
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 0.82, w: 2.0, h: 0.36,
      fill: { color: bg },
      line: { color: bg, width: 0 },
    });
    slide.addText(label, {
      x, y: 0.82, w: 2.0, h: 0.36,
      fontFace: BODY, fontSize: 11, bold: isActive,
      color: txt, align: "center", valign: "middle", margin: 0,
    });
    x += 2.15;
  });
}

function screenshotBox(slide, x, y, w, h, label) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: C.border, transparency: 40 },
    line: { color: C.gray, width: 1, dashType: "dash" },
  });
  slide.addText("[ " + label + " ]", {
    x, y, w, h,
    fontFace: BODY, fontSize: 12, italic: true,
    color: C.gray, align: "center", valign: "middle", margin: 0,
  });
}

// ─────────────────────────────────────────────────────────────
// SLIDE 0 — TITRE (dark, dramatic)
// ─────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.charcoal };

  // Flame orange left band
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 4.6, h: 7.5,
    fill: { color: C.orange },
    line: { color: C.orange, width: 0 },
  });

  // Decorative ember circle (bottom of orange band)
  s.addShape(pres.shapes.OVAL, {
    x: -0.8, y: 5.2, w: 4.0, h: 4.0,
    fill: { color: C.orangeDark, transparency: 55 },
    line: { color: C.orangeDark, width: 0 },
  });

  // Campfire emoji on orange band
  s.addText("🔥", {
    x: 0.2, y: 1.1, w: 4.2, h: 1.3,
    fontFace: BODY, fontSize: 72,
    align: "center", margin: 0,
  });

  // App name
  s.addText([
    { text: "Menu", options: { breakLine: true } },
    { text: "246" },
  ], {
    x: 0.1, y: 2.35, w: 4.4, h: 2.8,
    fontFace: HEADER, fontSize: 68, bold: true,
    color: C.white, align: "center", valign: "top", margin: 0,
  });

  // Right side — tagline
  s.addText([
    { text: "Planifiez vos repas de camp", options: { breakLine: true } },
    { text: "— simplement." },
  ], {
    x: 5.1, y: 1.6, w: 7.7, h: 1.6,
    fontFace: HEADER, fontSize: 26, italic: true,
    color: C.parchment, align: "left", valign: "top", margin: 0,
  });

  s.addText("Guide de démonstration pour chefs scouts", {
    x: 5.1, y: 3.4, w: 7.7, h: 0.45,
    fontFace: BODY, fontSize: 16,
    color: C.gray, align: "left", margin: 0,
  });

  // Green badge
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 4.1, w: 3.8, h: 0.44,
    fill: { color: C.green },
    line: { color: C.green, width: 0 },
  });
  s.addText("🏕️  Pour les chefs scouts", {
    x: 5.1, y: 4.1, w: 3.8, h: 0.44,
    fontFace: BODY, fontSize: 13, bold: true,
    color: C.white, align: "center", valign: "middle", margin: 0,
  });

  // Footer
  s.addText("Chef Khalil  ·  Menu 246  ·  2026", {
    x: 5.1, y: 6.9, w: 7.7, h: 0.38,
    fontFace: BODY, fontSize: 12,
    color: C.gray, align: "left", margin: 0,
  });

  s.addNotes(
    "Bienvenue ! Présentez-vous et l'objectif de la démo : montrer comment Menu 246 simplifie la planification des repas de camp en 3 étapes rapides. Durée totale : ~15 min incluant démo live."
  );
}

// ─────────────────────────────────────────────────────────────
// SLIDE 1 — AVANT MENU 246 (problèmes)
// ─────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.warmWhite };
  accentBar(s);

  s.addText("Avant Menu 246…", {
    x: 0.5, y: 0.22, w: 12.3, h: 0.65,
    fontFace: HEADER, fontSize: 32, bold: true,
    color: C.charcoal, align: "left", margin: 0,
  });
  s.addText("On connaît tous ces situations", {
    x: 0.5, y: 0.85, w: 12.3, h: 0.38,
    fontFace: BODY, fontSize: 15,
    color: C.gray, align: "left", margin: 0,
  });

  const problems = [
    { icon: "🗂️", title: "Tableaux Excel interminables",  desc: "Difficile à partager, toujours à refaire depuis le début" },
    { icon: "📝", title: "Listes d'épicerie manuelles",    desc: "Calculs à la main = erreurs et oublis garantis" },
    { icon: "😵", title: "Ingrédients oubliés au camp",    desc: "On arrive... et il manque un ingrédient clé" },
    { icon: "📞", title: "Mauvaise communication",          desc: "\"T'as apporté quoi comme nourriture ?\"" },
  ];

  problems.forEach((p, i) => {
    const y = 1.48 + i * 1.32;
    card(s, 0.5, y, 12.3, 1.08);
    s.addText(p.icon, {
      x: 0.7, y: y + 0.14, w: 0.9, h: 0.8,
      fontFace: BODY, fontSize: 30,
      align: "center", margin: 0,
    });
    s.addText(p.title, {
      x: 1.75, y: y + 0.1, w: 10.8, h: 0.38,
      fontFace: BODY, fontSize: 15, bold: true,
      color: C.charcoal, align: "left", margin: 0,
    });
    s.addText(p.desc, {
      x: 1.75, y: y + 0.5, w: 10.8, h: 0.35,
      fontFace: BODY, fontSize: 13,
      color: C.gray, align: "left", margin: 0,
    });
  });

  s.addNotes(
    "Demandez si les chefs reconnaissent ces situations. Cette slide valide leur vécu avant de montrer la solution."
  );
}

// ─────────────────────────────────────────────────────────────
// SLIDE 2 — SOLUTION EN 3 ÉTAPES
// ─────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.warmWhite };
  accentBar(s);

  s.addText("En 3 étapes simples", {
    x: 0.5, y: 0.22, w: 12.3, h: 0.65,
    fontFace: HEADER, fontSize: 32, bold: true,
    color: C.charcoal, align: "left", margin: 0,
  });
  s.addText("De zéro à la liste d'épicerie complète", {
    x: 0.5, y: 0.85, w: 12.3, h: 0.38,
    fontFace: BODY, fontSize: 15,
    color: C.gray, align: "left", margin: 0,
  });

  const steps = [
    {
      num: "1", icon: "⚙️", title: "Configurer",
      desc: ["Nom du camp, dates", "et nombre de participants"],
      color: C.orange,
    },
    {
      num: "2", icon: "🍽️", title: "Planifier",
      desc: ["Choisir les recettes", "et les assigner à chaque repas"],
      color: C.green,
    },
    {
      num: "3", icon: "📄", title: "Exporter",
      desc: ["Liste d'épicerie et menus", "générés automatiquement"],
      color: C.purple,
    },
  ];

  const colW = 3.95;
  const colH = 5.6;
  steps.forEach((step, i) => {
    const x = 0.5 + i * (colW + 0.22);
    const y = 1.5;
    card(s, x, y, colW, colH, C.white, true);
    cardTopBar(s, x, y, colW, step.color);

    // Step number (top-left corner of card)
    s.addText(step.num, {
      x: x + 0.18, y: y + 0.14, w: 0.45, h: 0.45,
      fontFace: HEADER, fontSize: 20, bold: true,
      color: step.color, align: "center", valign: "middle", margin: 0,
    });

    s.addText(step.icon, {
      x, y: y + 0.22, w: colW, h: 1.1,
      fontFace: BODY, fontSize: 52,
      align: "center", margin: 0,
    });
    s.addText(step.title, {
      x: x + 0.2, y: y + 1.42, w: colW - 0.4, h: 0.55,
      fontFace: HEADER, fontSize: 20, bold: true,
      color: C.charcoal, align: "center", margin: 0,
    });
    s.addText([
      { text: step.desc[0], options: { breakLine: true } },
      { text: step.desc[1] },
    ], {
      x: x + 0.2, y: y + 2.0, w: colW - 0.4, h: 0.75,
      fontFace: BODY, fontSize: 13,
      color: C.gray, align: "center", margin: 0,
    });
    screenshotBox(s, x + 0.2, y + 2.9, colW - 0.4, 2.45, "Capture étape " + step.num);
  });

  s.addNotes(
    "Vue d'ensemble avant la démo. Survolez rapidement les 3 étapes — 30 secondes suffisent avant de plonger dans la démo live."
  );
}

// ─────────────────────────────────────────────────────────────
// SLIDE 3 — DÉMO : ÉTAPE 1 — CONFIGURATION
// ─────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.warmWhite };
  accentBar(s, C.orange);
  demoBadge(s);
  stepBreadcrumb(s, 1);

  s.addText("Étape 1 — Configurer votre camp", {
    x: 0.5, y: 1.38, w: 12.3, h: 0.58,
    fontFace: HEADER, fontSize: 28, bold: true,
    color: C.charcoal, align: "left", margin: 0,
  });

  const fields = [
    { icon: "🏕️", label: "Nom du camp",          hint: "Ex : Camp Été 2025 — facultatif" },
    { icon: "📅", label: "Dates de début / fin",  hint: "Le nombre de jours est calculé automatiquement" },
    { icon: "👥", label: "Participants",           hint: "Les quantités s'adaptent à ce chiffre" },
  ];

  fields.forEach((f, i) => {
    const y = 2.18 + i * 1.0;
    card(s, 0.5, y, 6.0, 0.84);
    s.addText(f.icon, {
      x: 0.65, y: y + 0.12, w: 0.65, h: 0.6,
      fontFace: BODY, fontSize: 26,
      align: "center", margin: 0,
    });
    s.addText(f.label, {
      x: 1.45, y: y + 0.08, w: 4.85, h: 0.36,
      fontFace: BODY, fontSize: 14, bold: true,
      color: C.charcoal, align: "left", margin: 0,
    });
    s.addText(f.hint, {
      x: 1.45, y: y + 0.46, w: 4.85, h: 0.28,
      fontFace: BODY, fontSize: 12,
      color: C.gray, align: "left", margin: 0,
    });
  });

  // Tip box
  card(s, 0.5, 5.38, 6.0, 0.75, C.greenLight);
  s.addText("💡  Conseil : Entrez d'abord les dates — l'app calcule le nombre de jours automatiquement.", {
    x: 0.7, y: 5.45, w: 5.6, h: 0.62,
    fontFace: BODY, fontSize: 12,
    color: C.green, align: "left", margin: 0,
  });

  // Screenshot right
  screenshotBox(s, 6.8, 2.08, 6.0, 4.18, "Capture : écran de configuration");

  s.addNotes(
    "DÉMO : Ouvrez l'app. Entrez les dates du camp, ajustez le nombre de participants. Montrez comment le nombre de jours se calcule seul. Donnez un vrai nom de camp pour rendre ça concret."
  );
}

// ─────────────────────────────────────────────────────────────
// SLIDE 4 — DÉMO : ÉTAPE 2 — PLANIFIER
// ─────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.warmWhite };
  accentBar(s, C.green);
  demoBadge(s);
  stepBreadcrumb(s, 2);

  s.addText("Étape 2 — Planifier les repas", {
    x: 0.5, y: 1.38, w: 12.3, h: 0.58,
    fontFace: HEADER, fontSize: 28, bold: true,
    color: C.charcoal, align: "left", margin: 0,
  });

  const steps = [
    "Cherchez une recette dans la barre de recherche",
    "Cliquez sur la recette — elle se sélectionne (bordure orange)",
    "Cliquez sur une cellule du calendrier — la recette est placée",
    "Survolez une recette placée pour voir la liste d'ingrédients",
  ];

  steps.forEach((text, i) => {
    const y = 2.18 + i * 0.92;
    // Orange numbered circle
    s.addShape(pres.shapes.OVAL, {
      x: 0.5, y: y + 0.1, w: 0.44, h: 0.44,
      fill: { color: C.orange },
      line: { color: C.orange, width: 0 },
    });
    s.addText(String(i + 1), {
      x: 0.5, y: y + 0.1, w: 0.44, h: 0.44,
      fontFace: BODY, fontSize: 14, bold: true,
      color: C.white, align: "center", valign: "middle", margin: 0,
    });
    s.addText(text, {
      x: 1.1, y, w: 6.0, h: 0.64,
      fontFace: BODY, fontSize: 13,
      color: C.charcoal, align: "left", valign: "middle", margin: 0,
    });
  });

  // Meal type legend
  const meals = [
    { label: "🌅 Déjeuner",   color: C.amber  },
    { label: "☀️ Dîner",     color: C.green  },
    { label: "🌙 Souper",    color: C.blue   },
    { label: "🍎 Collation", color: C.purple },
  ];
  s.addText("Types de repas :", {
    x: 0.5, y: 5.9, w: 1.6, h: 0.36,
    fontFace: BODY, fontSize: 11, bold: true,
    color: C.gray, align: "left", valign: "middle", margin: 0,
  });
  let mx = 2.2;
  meals.forEach(m => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: mx, y: 5.9, w: 1.65, h: 0.36,
      fill: { color: m.color },
      line: { color: m.color, width: 0 },
    });
    s.addText(m.label, {
      x: mx, y: 5.9, w: 1.65, h: 0.36,
      fontFace: BODY, fontSize: 11, bold: true,
      color: C.white, align: "center", valign: "middle", margin: 0,
    });
    mx += 1.78;
  });

  // Screenshots right
  screenshotBox(s, 7.3, 2.08, 5.65, 3.2, "Capture : grille de planification");
  screenshotBox(s, 7.3, 5.45, 5.65, 1.45, "Capture : infobulle ingrédients");

  s.addNotes(
    "DÉMO : Cherchez 'poulet', cliquez sur une recette pour la sélectionner, placez-la dans le lunch du mardi. Survolez pour montrer les ingrédients avec portions. Montrez la barre de progression en bas."
  );
}

// ─────────────────────────────────────────────────────────────
// SLIDE 5 — DÉMO : ÉTAPE 3 — EXPORTER
// ─────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.warmWhite };
  accentBar(s, C.purple);
  demoBadge(s);
  stepBreadcrumb(s, 3);

  s.addText("Étape 3 — Générer liste d'épicerie & menus", {
    x: 0.5, y: 1.38, w: 12.3, h: 0.58,
    fontFace: HEADER, fontSize: 28, bold: true,
    color: C.charcoal, align: "left", margin: 0,
  });

  const exports = [
    {
      icon: "📊", title: "Liste d'épicerie",
      desc: ["Quantités × participants", "Groupées par section (viandes, légumes…)"],
      color: C.orange,
    },
    {
      icon: "🛒", title: "Liste imprimable",
      desc: ["Cochez les items en faisant", "vos courses au camp"],
      color: C.green,
    },
    {
      icon: "📅", title: "Menu visuel",
      desc: ["Tableau élégant par jour et repas", "Affichez en cuisine de camp"],
      color: C.blue,
    },
    {
      icon: "📋", title: "Menu détaillé",
      desc: ["Recettes complètes avec quantités", "par personne et pour le groupe"],
      color: C.purple,
    },
  ];

  const colW = 2.95;
  const colH = 3.2;
  const startX = (13.3 - (exports.length * colW + (exports.length - 1) * 0.2)) / 2;

  exports.forEach((exp, i) => {
    const x = startX + i * (colW + 0.2);
    const y = 2.15;
    card(s, x, y, colW, colH, C.white, true);
    cardTopBar(s, x, y, colW, exp.color);
    s.addText(exp.icon, {
      x, y: y + 0.18, w: colW, h: 0.9,
      fontFace: BODY, fontSize: 40,
      align: "center", margin: 0,
    });
    s.addText(exp.title, {
      x: x + 0.1, y: y + 1.12, w: colW - 0.2, h: 0.45,
      fontFace: BODY, fontSize: 13, bold: true,
      color: C.charcoal, align: "center", margin: 0,
    });
    s.addText([
      { text: exp.desc[0], options: { breakLine: true } },
      { text: exp.desc[1] },
    ], {
      x: x + 0.1, y: y + 1.6, w: colW - 0.2, h: 0.82,
      fontFace: BODY, fontSize: 11,
      color: C.gray, align: "center", margin: 0,
    });
    s.addText("🖥 Ouvrir  ·  ⬇ PDF", {
      x: x + 0.1, y: y + 2.8, w: colW - 0.2, h: 0.3,
      fontFace: BODY, fontSize: 10, italic: true,
      color: C.gray, align: "center", margin: 0,
    });
  });

  // Campfire tip
  card(s, 0.5, 5.6, 12.3, 0.7, C.ember);
  s.addText("🔥  Les quantités sont automatiquement multipliées par le nombre de participants — zéro calcul manuel !", {
    x: 0.7, y: 5.67, w: 11.9, h: 0.56,
    fontFace: BODY, fontSize: 13,
    color: C.brown, align: "left", margin: 0,
  });

  s.addNotes(
    "DÉMO : Cliquez sur Générer. Montrez la liste d'épicerie interactive avec les cases à cocher. Exportez le menu visuel en PDF. Insistez sur les quantités calculées automatiquement — c'est le wow moment."
  );
}

// ─────────────────────────────────────────────────────────────
// SLIDE 6 — FONCTIONNALITÉS CLÉS
// ─────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.warmWhite };
  accentBar(s, C.green);

  s.addText("Fonctionnalités clés", {
    x: 0.5, y: 0.22, w: 12.3, h: 0.65,
    fontFace: HEADER, fontSize: 32, bold: true,
    color: C.charcoal, align: "left", margin: 0,
  });
  s.addText("Tout ce qu'il faut pour planifier sereinement", {
    x: 0.5, y: 0.85, w: 12.3, h: 0.38,
    fontFace: BODY, fontSize: 15,
    color: C.gray, align: "left", margin: 0,
  });

  const features = [
    {
      icon: "⚡",
      title: "Sauvegarde automatique",
      desc: "Progression sauvegardée toutes les 30 secondes. Fermez et rouvrez — votre menu vous attend.",
      color: C.green,
    },
    {
      icon: "💾",
      title: "Exporter / Importer",
      desc: "Exportez le menu en fichier .json et envoyez à vos co-organisateurs. Ils importent et voient instantanément votre planification.",
      color: C.orange,
    },
    {
      icon: "📚",
      title: "Bibliothèque partagée",
      desc: "Ajoutez une recette → visible par toute l'équipe en temps réel via Firebase. Modifiez, masquez ou supprimez à tout moment.",
      color: C.purple,
    },
    {
      icon: "📶",
      title: "Mode hors-ligne",
      desc: "Fonctionne sans internet après la première visite. Idéal en pleine forêt, loin du Wi-Fi !",
      color: C.blue,
    },
  ];

  const cw = 5.95;
  const ch = 2.2;
  const positions = [
    [0.5,  1.48],
    [6.85, 1.48],
    [0.5,  3.9],
    [6.85, 3.9],
  ];

  features.forEach((f, i) => {
    const [x, y] = positions[i];
    card(s, x, y, cw, ch, C.white, true);
    // Colored left accent bar
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.07, h: ch,
      fill: { color: f.color },
      line: { color: f.color, width: 0 },
    });
    s.addText(f.icon, {
      x: x + 0.22, y: y + 0.22, w: 0.65, h: 0.65,
      fontFace: BODY, fontSize: 28,
      align: "center", margin: 0,
    });
    s.addText(f.title, {
      x: x + 1.0, y: y + 0.18, w: cw - 1.15, h: 0.42,
      fontFace: BODY, fontSize: 15, bold: true,
      color: C.charcoal, align: "left", margin: 0,
    });
    s.addText(f.desc, {
      x: x + 0.22, y: y + 0.82, w: cw - 0.4, h: 1.22,
      fontFace: BODY, fontSize: 12,
      color: C.gray, align: "left", margin: 0,
    });
  });

  s.addNotes(
    "Montrez rapidement la sauvegarde auto et la bibliothèque partagée — ce sont les fonctionnalités qui surprennent le plus les nouveaux utilisateurs."
  );
}

// ─────────────────────────────────────────────────────────────
// SLIDE 7 — DISPONIBLE PARTOUT
// ─────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.warmWhite };
  accentBar(s);

  s.addText("Disponible partout", {
    x: 0.5, y: 0.22, w: 12.3, h: 0.65,
    fontFace: HEADER, fontSize: 32, bold: true,
    color: C.charcoal, align: "left", margin: 0,
  });
  s.addText("Choisissez selon votre contexte", {
    x: 0.5, y: 0.85, w: 12.3, h: 0.38,
    fontFace: BODY, fontSize: 15,
    color: C.gray, align: "left", margin: 0,
  });

  const platforms = [
    {
      icon: "💻",
      title: "Application Desktop",
      sub: "Windows + Mac",
      features: [
        "Mises à jour automatiques",
        "Fonctionne hors-ligne",
        "Idéal pour la planification",
        "Grille calendrier complète",
        "Interface souris & clavier optimisée",
      ],
      color: C.orange,
      x: 0.5,
    },
    {
      icon: "📱",
      title: "Web / Mobile",
      sub: "Tout navigateur, tout téléphone",
      features: [
        "Aucune installation requise",
        "Fonctionne hors-ligne (après 1ère visite)",
        "Idéal pour consulter au camp",
        "Installe sur l'écran d'accueil",
        "Mises à jour silencieuses automatiques",
      ],
      color: C.green,
      x: 6.85,
    },
  ];

  platforms.forEach(p => {
    const cw = 5.95;
    const y = 1.48;
    const ch = 5.7;
    card(s, p.x, y, cw, ch, C.white, true);
    cardTopBar(s, p.x, y, cw, p.color);

    s.addText(p.icon, {
      x: p.x, y: y + 0.18, w: cw, h: 0.9,
      fontFace: BODY, fontSize: 48,
      align: "center", margin: 0,
    });
    s.addText(p.title, {
      x: p.x + 0.2, y: y + 1.18, w: cw - 0.4, h: 0.5,
      fontFace: HEADER, fontSize: 18, bold: true,
      color: C.charcoal, align: "center", margin: 0,
    });
    s.addText(p.sub, {
      x: p.x + 0.2, y: y + 1.68, w: cw - 0.4, h: 0.35,
      fontFace: BODY, fontSize: 13,
      color: C.gray, align: "center", margin: 0,
    });

    const featureRuns = p.features.map((f, j) => ({
      text: "✅  " + f,
      options: { breakLine: j < p.features.length - 1 },
    }));
    s.addText(featureRuns, {
      x: p.x + 0.3, y: y + 2.18, w: cw - 0.6, h: 2.1,
      fontFace: BODY, fontSize: 13,
      color: C.charcoal, align: "left",
    });

    screenshotBox(s, p.x + 0.3, y + 4.4, cw - 0.6, 1.1, "Capture " + (p.icon === "💻" ? "desktop" : "mobile"));
  });

  s.addNotes(
    "Desktop pour la planification initiale (grand écran, clavier). Mobile pour consulter les recettes et cocher la liste d'épicerie directement au camp."
  );
}

// ─────────────────────────────────────────────────────────────
// SLIDE 8 — TÉLÉCHARGEMENTS
// ─────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.warmWhite };
  accentBar(s);

  s.addText("Prêt à commencer ? 🚀", {
    x: 0.5, y: 0.2, w: 12.3, h: 0.62,
    fontFace: HEADER, fontSize: 32, bold: true,
    color: C.charcoal, align: "left", margin: 0,
  });
  s.addText("Téléchargez selon votre appareil :", {
    x: 0.5, y: 0.8, w: 12.3, h: 0.38,
    fontFace: BODY, fontSize: 15,
    color: C.gray, align: "left", margin: 0,
  });

  const downloads = [
    {
      icon: "🌐",
      title: "Web / Mobile",
      sub: "Tout appareil, tout navigateur",
      file: "menu-246.netlify.app",
      action: "Ouvrir dans le navigateur",
      color: C.green,
    },
    {
      icon: "🪟",
      title: "Windows",
      sub: "PC Windows 10 ou 11",
      file: "Setup-1.3.1.exe",
      action: "Installer et lancer",
      color: C.orange,
    },
    {
      icon: "🍎",
      title: "Mac Apple Silicon",
      sub: "MacBook M1, M2, M3, M4",
      file: "1.3.1-arm64.dmg",
      action: "Glisser dans Applications",
      color: C.purple,
    },
    {
      icon: "🍎",
      title: "Mac Intel",
      sub: "MacBook avant 2020 (Intel)",
      file: "1.3.1.dmg",
      action: "Glisser dans Applications",
      color: C.blue,
    },
  ];

  const cw = 2.9;
  const gap = 0.2;
  const totalW = downloads.length * cw + (downloads.length - 1) * gap;
  const startX = (13.3 - totalW) / 2;

  downloads.forEach((d, i) => {
    const x = startX + i * (cw + gap);
    const y = 1.38;
    const ch = 3.75;
    card(s, x, y, cw, ch, C.white, true);
    cardTopBar(s, x, y, cw, d.color);

    s.addText(d.icon, {
      x, y: y + 0.16, w: cw, h: 0.78,
      fontFace: BODY, fontSize: 38,
      align: "center", margin: 0,
    });
    s.addText(d.title, {
      x: x + 0.1, y: y + 0.98, w: cw - 0.2, h: 0.44,
      fontFace: BODY, fontSize: 13, bold: true,
      color: C.charcoal, align: "center", margin: 0,
    });
    s.addText(d.sub, {
      x: x + 0.1, y: y + 1.42, w: cw - 0.2, h: 0.36,
      fontFace: BODY, fontSize: 11,
      color: C.gray, align: "center", margin: 0,
    });
    // Dark code box for filename
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.1, y: y + 1.9, w: cw - 0.2, h: 0.55,
      fill: { color: C.charcoal },
      line: { color: C.charcoal, width: 0 },
    });
    s.addText(d.file, {
      x: x + 0.1, y: y + 1.9, w: cw - 0.2, h: 0.55,
      fontFace: MONO, fontSize: 9, bold: true,
      color: C.codeGreen, align: "center", valign: "middle", margin: 0,
    });
    s.addText(d.action, {
      x: x + 0.1, y: y + 2.6, w: cw - 0.2, h: 0.35,
      fontFace: BODY, fontSize: 10, italic: true,
      color: C.gray, align: "center", margin: 0,
    });
  });

  // GitHub link
  s.addText([
    {
      text: "⬇  Toutes les versions : github.com/LilKslm/menu-246/releases/tag/v1.3.1",
      options: { hyperlink: { url: "https://github.com/LilKslm/menu-246/releases/tag/v1.3.1" } },
    },
  ], {
    x: 0.5, y: 5.38, w: 12.3, h: 0.36,
    fontFace: BODY, fontSize: 12,
    color: C.gray, align: "center", margin: 0,
  });

  // Bottom campfire band
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.92, w: 13.3, h: 1.58,
    fill: { color: C.orange },
    line: { color: C.orange, width: 0 },
  });
  s.addText("Des questions ou des idées ?", {
    x: 0.5, y: 5.99, w: 12.3, h: 0.48,
    fontFace: HEADER, fontSize: 18, bold: true,
    color: C.white, align: "center", margin: 0,
  });
  s.addText("Cliquez sur 💬 Avis dans l'app pour nous écrire directement.", {
    x: 0.5, y: 6.48, w: 12.3, h: 0.38,
    fontFace: BODY, fontSize: 13,
    color: C.ember, align: "center", margin: 0,
  });
  s.addText("Fait par Chef Khalil  ·  Menu 246  ·  2026", {
    x: 0.5, y: 6.9, w: 12.3, h: 0.3,
    fontFace: BODY, fontSize: 11,
    color: C.ember, align: "center", margin: 0,
  });

  s.addNotes(
    "Partagez ce lien avant la fin de la réunion. Encouragez l'installation directe pendant la réunion — aidez ceux qui ont des questions."
  );
}

// ─────────────────────────────────────────────────────────────
// SLIDE 9 — MAC : PREMIER LANCEMENT
// ─────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.warmWhite };
  accentBar(s, C.charcoal);

  s.addText("Mac : Ouvrir l'app pour la première fois", {
    x: 0.5, y: 0.22, w: 12.3, h: 0.65,
    fontFace: HEADER, fontSize: 28, bold: true,
    color: C.charcoal, align: "left", margin: 0,
  });
  s.addText("macOS bloque les apps non signées — voici comment contourner ça", {
    x: 0.5, y: 0.85, w: 12.3, h: 0.35,
    fontFace: BODY, fontSize: 14,
    color: C.gray, align: "left", margin: 0,
  });

  const cw = 5.9;

  // LEFT CARD — Méthode
  card(s, 0.5, 1.42, cw, 4.35, C.white);
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.42, w: 0.07, h: 4.35,
    fill: { color: C.green },
    line: { color: C.green, width: 0 },
  });
  s.addText("Méthode — La plus simple", {
    x: 0.72, y: 1.54, w: cw - 0.28, h: 0.44,
    fontFace: BODY, fontSize: 14, bold: true,
    color: C.charcoal, align: "left", margin: 0,
  });

  // Steps 1-3
  const macSteps1 = [
    "Téléchargez le .dmg et glissez l'app dans Applications",
    "Ouvrez Terminal (Cmd+Espace → tapez \"Terminal\" → Entrée)",
    "Copiez-collez cette commande :",
  ];
  macSteps1.forEach((txt, i) => {
    const y = 2.1 + i * 0.52;
    s.addShape(pres.shapes.OVAL, {
      x: 0.72, y: y + 0.06, w: 0.32, h: 0.32,
      fill: { color: C.orange },
      line: { color: C.orange, width: 0 },
    });
    s.addText(String(i + 1), {
      x: 0.72, y: y + 0.06, w: 0.32, h: 0.32,
      fontFace: BODY, fontSize: 10, bold: true,
      color: C.white, align: "center", valign: "middle", margin: 0,
    });
    s.addText(txt, {
      x: 1.14, y, w: cw - 0.7, h: 0.44,
      fontFace: BODY, fontSize: 12,
      color: C.charcoal, align: "left", margin: 0,
    });
  });

  // Command box
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.72, y: 3.72, w: cw - 0.3, h: 0.52,
    fill: { color: C.charcoal },
    line: { color: C.charcoal, width: 0 },
  });
  s.addText('xattr -cr "/Applications/Menu246arm64.app"', {
    x: 0.82, y: 3.74, w: cw - 0.5, h: 0.48,
    fontFace: MONO, fontSize: 11, bold: true,
    color: C.codeGreen, align: "left", valign: "middle", margin: 0,
  });

  // Steps 4-5
  const macSteps2 = [
    "Appuyez sur Entrée",
    "Double-cliquez sur l'app — elle s'ouvre !",
  ];
  macSteps2.forEach((txt, i) => {
    const y = 4.36 + i * 0.52;
    s.addShape(pres.shapes.OVAL, {
      x: 0.72, y: y + 0.06, w: 0.32, h: 0.32,
      fill: { color: C.orange },
      line: { color: C.orange, width: 0 },
    });
    s.addText(String(i + 4), {
      x: 0.72, y: y + 0.06, w: 0.32, h: 0.32,
      fontFace: BODY, fontSize: 10, bold: true,
      color: C.white, align: "center", valign: "middle", margin: 0,
    });
    s.addText(txt, {
      x: 1.14, y, w: cw - 0.7, h: 0.44,
      fontFace: BODY, fontSize: 12,
      color: C.charcoal, align: "left", margin: 0,
    });
  });

  // RIGHT CARD — Explication
  card(s, 6.9, 1.42, cw, 4.35, C.white);
  s.addShape(pres.shapes.RECTANGLE, {
    x: 6.9, y: 1.42, w: 0.07, h: 4.35,
    fill: { color: C.green },
    line: { color: C.green, width: 0 },
  });
  s.addText("Pourquoi cette commande ?", {
    x: 7.12, y: 1.54, w: cw - 0.28, h: 0.44,
    fontFace: BODY, fontSize: 14, bold: true,
    color: C.charcoal, align: "left", margin: 0,
  });

  const explanations = [
    "macOS ajoute un attribut 'quarantaine' aux apps téléchargées depuis internet",
    "La commande xattr -cr supprime cet attribut de sécurité",
    "L'app est entièrement sûre — c'est juste la protection Apple hors App Store",
    "Nécessaire une seule fois — ensuite l'app s'ouvre normalement",
  ];
  explanations.forEach((txt, i) => {
    const y = 2.12 + i * 0.82;
    s.addText("→  " + txt, {
      x: 7.12, y, w: cw - 0.28, h: 0.68,
      fontFace: BODY, fontSize: 12,
      color: C.charcoal, align: "left", margin: 0,
    });
  });

  // Bottom info box
  card(s, 0.5, 5.95, 12.3, 1.25, C.blueLight);
  s.addText("⚠️  Pourquoi ça arrive ?", {
    x: 0.7, y: 6.04, w: 12.0, h: 0.36,
    fontFace: BODY, fontSize: 13, bold: true,
    color: C.blue, align: "left", margin: 0,
  });
  s.addText("macOS exige des apps signées (programme payant Apple). Menu 246 est un outil interne gratuit — non signé. L'app est entièrement sécurisée.", {
    x: 0.7, y: 6.42, w: 12.0, h: 0.55,
    fontFace: BODY, fontSize: 12,
    color: C.blue, align: "left", margin: 0,
  });

  s.addNotes(
    "Envoyez ces instructions à l'avance aux utilisateurs Mac. La commande xattr est la méthode la plus fiable — montrez-la sur votre écran si quelqu'un bloque."
  );
}

// ─────────────────────────────────────────────────────────────
// SAVE
// ─────────────────────────────────────────────────────────────
pres.writeFile({ fileName: "PresentationMenu.pptx" })
  .then(() => console.log("✅  PresentationMenu.pptx généré avec succès !"))
  .catch(err => { console.error("❌  Erreur :", err); process.exit(1); });
