import { jsPDF } from 'jspdf'

const ABILITIES = [
  { key: 'str', label: 'FOR', full: 'Forca' },
  { key: 'dex', label: 'DES', full: 'Destreza' },
  { key: 'con', label: 'CON', full: 'Constituicao' },
  { key: 'int', label: 'INT', full: 'Inteligencia' },
  { key: 'wis', label: 'SAB', full: 'Sabedoria' },
  { key: 'cha', label: 'CAR', full: 'Carisma' },
]

const SKILLS = [
  { key: 'acrobatics',     label: 'Acrobacia',       ability: 'dex' },
  { key: 'animalHandling', label: 'Adestrar Animais', ability: 'wis' },
  { key: 'arcana',         label: 'Arcanismo',        ability: 'int' },
  { key: 'athletics',      label: 'Atletismo',        ability: 'str' },
  { key: 'deception',      label: 'Enganacao',        ability: 'cha' },
  { key: 'history',        label: 'Historia',         ability: 'int' },
  { key: 'insight',        label: 'Intuicao',         ability: 'wis' },
  { key: 'intimidation',   label: 'Intimidacao',      ability: 'cha' },
  { key: 'investigation',  label: 'Investigacao',     ability: 'int' },
  { key: 'medicine',       label: 'Medicina',         ability: 'wis' },
  { key: 'nature',         label: 'Natureza',         ability: 'int' },
  { key: 'perception',     label: 'Percepcao',        ability: 'wis' },
  { key: 'performance',    label: 'Performance',      ability: 'cha' },
  { key: 'persuasion',     label: 'Persuasao',        ability: 'cha' },
  { key: 'religion',       label: 'Religiao',         ability: 'int' },
  { key: 'sleightOfHand',  label: 'Prestidigitacao',  ability: 'dex' },
  { key: 'stealth',        label: 'Furtividade',      ability: 'dex' },
  { key: 'survival',       label: 'Sobrevivencia',    ability: 'wis' },
]

const PROF_BONUS = [0,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6,6]

const modCalc = (score) => Math.floor((score - 10) / 2)
const modStr  = (score) => { const m = modCalc(score); return m >= 0 ? '+' + m : '' + m }

// Paleta de cores
const C = {
  red:   [139, 0,   0  ],
  dark:  [30,  30,  30 ],
  gray:  [100, 100, 100],
  lgray: [220, 220, 220],
  white: [255, 255, 255],
  cream: [250, 245, 235],
  wred:  [255, 200, 200],
}

export const exportDndPdf = (charData, charName) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const H = 297
  const M = 10 // margin

  // --- helpers ---
  const setFont = (size, style, color) => {
    doc.setFontSize(size)
    doc.setFont('helvetica', style || 'normal')
    doc.setTextColor(color[0], color[1], color[2])
  }

  const fillColor = (c) => doc.setFillColor(c[0], c[1], c[2])
  const drawColor = (c) => doc.setDrawColor(c[0], c[1], c[2])

  const box = (x, y, w, h, fill, stroke) => {
    fillColor(fill  || C.white)
    drawColor(stroke || C.lgray)
    doc.setLineWidth(0.3)
    doc.rect(x, y, w, h, 'FD')
  }

  const lbl = (text, x, y, size, color) => {
    setFont(size || 6, 'bold', color || C.gray)
    doc.text((text || '').toUpperCase(), x, y)
  }

  const val = (text, x, y, size, align) => {
    setFont(size || 10, 'normal', C.dark)
    doc.text(String(text == null ? '-' : text), x, y, { align: align || 'left' })
  }

  const hline = (y) => {
    drawColor(C.lgray)
    doc.setLineWidth(0.2)
    doc.line(M, y, W - M, y)
  }

  const circle = (x, y, r, fill) => {
    fillColor(fill)
    doc.circle(x, y, r, 'F')
  }

  // =====================
  // FUNDO
  // =====================
  fillColor(C.cream)
  doc.rect(0, 0, W, H, 'F')

  // =====================
  // CABECALHO
  // =====================
  fillColor(C.red)
  doc.rect(0, 0, W, 22, 'F')
  setFont(18, 'bold', C.white)
  doc.text('DUNGEONS & DRAGONS', W / 2, 9, { align: 'center' })
  setFont(9, 'normal', C.wred)
  doc.text('FICHA DE PERSONAGEM - 5a EDICAO', W / 2, 16, { align: 'center' })

  // =====================
  // INFO PERSONAGEM
  // =====================
  const info = charData.info || {}
  let y = 28

  box(M, y, W - M * 2, 10, C.white, C.red)
  setFont(14, 'bold', C.red)
  doc.text(info.characterName || 'Sem nome', W / 2, y + 7, { align: 'center' })
  y += 13

  const infoFields = [
    ['Classe',       info.class],
    ['Nivel',        info.level],
    ['Raca',         info.race],
    ['Antecedente',  info.background],
    ['Tendencia',    info.alignment],
    ['XP',           info.experiencePoints],
  ]
  const colW = (W - M * 2) / 3
  infoFields.forEach(function(f, i) {
    const col = i % 3
    const row = Math.floor(i / 3)
    const bx = M + col * colW
    const by = y + row * 12
    box(bx, by, colW - 1, 11, C.white, C.lgray)
    lbl(f[0], bx + 2, by + 4)
    val(f[1] != null ? f[1] : '-', bx + 2, by + 9, 9)
  })
  y += 27

  // =====================
  // ATRIBUTOS
  // =====================
  const abilities = charData.abilities || {}
  const combat    = charData.combat    || {}
  const profBonus = PROF_BONUS[info.level] || 2
  const ablW = 28

  ABILITIES.forEach(function(ab, i) {
    var bx = M + i * (ablW + 1)
    box(bx, y, ablW, 20, C.white, C.red)
    setFont(6, 'bold', C.red)
    doc.text(ab.label, bx + ablW / 2, y + 4, { align: 'center' })
    setFont(12, 'bold', C.dark)
    doc.text(modStr(abilities[ab.key] || 10), bx + ablW / 2, y + 12, { align: 'center' })
    setFont(7, 'normal', C.gray)
    doc.text(String(abilities[ab.key] || 10), bx + ablW / 2, y + 17, { align: 'center' })
  })
  y += 24

  // =====================
  // COMBATE
  // =====================
  const combatFields = [
    ['CA',         combat.armorClass],
    ['Iniciativa', combat.initiative],
    ['Desloc.',    (combat.speed || 30) + 'ft'],
    ['HP Max',     combat.maxHp],
    ['HP Atual',   combat.currentHp],
    ['HP Temp',    combat.tempHp],
    ['Dado Vida',  combat.hitDice],
    ['Prof.Bonus', '+' + profBonus],
  ]
  const cW = (W - M * 2) / 4
  combatFields.forEach(function(f, i) {
    var col = i % 4
    var row = Math.floor(i / 4)
    var bx = M + col * cW
    var by = y + row * 13
    box(bx, by, cW - 1, 12, C.white, C.lgray)
    lbl(f[0], bx + 2, by + 4)
    setFont(10, 'bold', C.dark)
    doc.text(String(f[1] != null ? f[1] : '-'), bx + cW / 2, by + 10, { align: 'center' })
  })
  y += 30
  hline(y); y += 4

  // =====================
  // SAVES + PERICIAS (lado a lado)
  // =====================
  const prof   = charData.proficiencies || {}
  const saves  = prof.savingThrows      || {}
  const skills = prof.skills            || {}

  const c1 = M       // coluna saves
  const c2 = M + 48  // coluna pericias
  const startY = y

  // Testes de Resistencia
  setFont(7, 'bold', C.red)
  doc.text('TESTES DE RESISTENCIA', c1, y); y += 4

  ABILITIES.forEach(function(ab) {
    var hasSave = saves[ab.key]
    var total = modCalc(abilities[ab.key] || 10) + (hasSave ? profBonus : 0)
    if (hasSave) { fillColor(C.red) } else { fillColor(C.lgray) }
    doc.circle(c1 + 2, y - 1, 1.2, 'F')
    setFont(7, 'normal', C.dark)
    doc.text((total >= 0 ? '+' : '') + total + '  ' + ab.full, c1 + 5, y)
    y += 4.5
  })
  y += 2

  box(c1, y, 38, 8, C.white, C.lgray)
  lbl('Percepcao Passiva', c1 + 2, y + 3.5)
  var passPerc = 10 + modCalc(abilities.wis || 10) + (skills.perception === 'prof' ? profBonus : skills.perception === 'expert' ? profBonus * 2 : 0)
  setFont(8, 'bold', C.dark)
  doc.text(String(passPerc), c1 + 36, y + 6, { align: 'right' })
  y += 10

  // Pericias
  var sy = startY
  setFont(7, 'bold', C.red)
  doc.text('PERICIAS', c2, sy); sy += 4

  SKILLS.forEach(function(skill) {
    var profLevel = skills[skill.key] || ''
    var base  = modCalc(abilities[skill.ability] || 10)
    var bonus = profLevel === 'expert' ? profBonus * 2 : profLevel === 'prof' ? profBonus : 0
    var total = base + bonus

    if (profLevel === 'expert' || profLevel === 'prof') {
      fillColor(C.red)
    } else {
      fillColor(C.lgray)
    }
    doc.circle(c2 + 2, sy - 1, 1.2, 'F')

    setFont(6.5, 'normal', C.dark)
    doc.text((total >= 0 ? '+' : '') + total + '  ' + skill.label, c2 + 6, sy)
    sy += 4.2
  })

  y = Math.max(y, sy) + 4
  hline(y); y += 4

  // =====================
  // ATAQUES
  // =====================
  setFont(7, 'bold', C.red)
  doc.text('ATAQUES E MAGIAS', M, y); y += 4

  box(M,       y, 70, 6, C.lgray, C.lgray)
  box(M + 71,  y, 30, 6, C.lgray, C.lgray)
  box(M + 102, y, 60, 6, C.lgray, C.lgray)
  setFont(6, 'bold', C.gray)
  doc.text('NOME',          M + 2,   y + 4)
  doc.text('BONUS ATAQUE',  M + 73,  y + 4)
  doc.text('DANO / TIPO',   M + 104, y + 4)
  y += 7

  var attacks = charData.attacks || []
  attacks.slice(0, 5).forEach(function(atk) {
    box(M,       y, 70, 7, C.white, C.lgray)
    box(M + 71,  y, 30, 7, C.white, C.lgray)
    box(M + 102, y, 60, 7, C.white, C.lgray)
    setFont(8, 'normal', C.dark)
    doc.text(atk.name   || '', M + 2,   y + 5)
    doc.text(atk.bonus  || '', M + 86,  y + 5, { align: 'center' })
    doc.text(atk.damage || '', M + 104, y + 5)
    y += 8
  })
  y += 4

  // =====================
  // EQUIPAMENTOS
  // =====================
  if (charData.equipment) {
    hline(y); y += 4
    setFont(7, 'bold', C.red)
    doc.text('EQUIPAMENTOS', M, y); y += 4
    box(M, y, W - M * 2, 24, C.white, C.lgray)
    setFont(7, 'normal', C.dark)
    var eqLines = doc.splitTextToSize(charData.equipment, W - M * 2 - 4)
    doc.text(eqLines.slice(0, 6), M + 2, y + 5)
    y += 28
  }

  // =====================
  // PERSONALIDADE
  // =====================
  var personality = charData.personality || {}
  var bgFields = [
    ['Tracos de Personalidade', personality.traits],
    ['Ideais',   personality.ideals],
    ['Vinculos', personality.bonds],
    ['Fraquezas',personality.flaws],
  ]

  if (y < H - 60) {
    hline(y); y += 4
    setFont(7, 'bold', C.red)
    doc.text('PERSONALIDADE', M, y); y += 4
    bgFields.forEach(function(f) {
      if (!f[1]) return
      box(M, y, W - M * 2, 13, C.white, C.lgray)
      lbl(f[0], M + 2, y + 4)
      setFont(7, 'normal', C.dark)
      var lines = doc.splitTextToSize(f[1], W - M * 2 - 4)
      doc.text(lines.slice(0, 2), M + 2, y + 9)
      y += 15
    })
  }

  // Rodape pagina 1
  fillColor(C.red)
  doc.rect(0, H - 8, W, 8, 'F')
  setFont(6, 'normal', C.white)
  doc.text('HUB GAMER - Ficha D&D 5e gerada automaticamente', W / 2, H - 3, { align: 'center' })

  // =====================
  // PAGINA 2 — Magias + Habilidades
  // =====================
  var spells   = charData.spells   || {}
  var features = charData.features || ''
  var notes    = charData.notes    || ''

  if (spells.list || features || notes) {
    doc.addPage()
    fillColor(C.cream)
    doc.rect(0, 0, W, H, 'F')

    fillColor(C.red)
    doc.rect(0, 0, W, 14, 'F')
    setFont(12, 'bold', C.white)
    doc.text((info.characterName || 'Personagem') + ' - Magias & Habilidades', W / 2, 9, { align: 'center' })

    var py = 20

    if (spells.spellcastingClass) {
      var spellInfo = [
        ['Classe de Conjuracao', spells.spellcastingClass],
        ['CD de Magia',          spells.spellSaveDC],
        ['Bonus de Ataque',      '+' + spells.spellAttackBonus],
      ]
      spellInfo.forEach(function(f, i) {
        var bx = M + i * 63
        box(bx, py, 61, 10, C.white, C.lgray)
        lbl(f[0], bx + 2, py + 4)
        val(String(f[1] || '-'), bx + 2, py + 9, 9)
      })
      py += 14
    }

    if (spells.list) {
      setFont(7, 'bold', C.red)
      doc.text('LISTA DE MAGIAS', M, py); py += 4
      box(M, py, W - M * 2, 70, C.white, C.lgray)
      setFont(7, 'normal', C.dark)
      var sLines = doc.splitTextToSize(spells.list, W - M * 2 - 4)
      doc.text(sLines.slice(0, 20), M + 2, py + 5)
      py += 74
    }

    if (features) {
      setFont(7, 'bold', C.red)
      doc.text('TRACOS E HABILIDADES', M, py); py += 4
      box(M, py, W - M * 2, 50, C.white, C.lgray)
      setFont(7, 'normal', C.dark)
      var fLines = doc.splitTextToSize(features, W - M * 2 - 4)
      doc.text(fLines.slice(0, 14), M + 2, py + 5)
      py += 54
    }

    if (notes) {
      setFont(7, 'bold', C.red)
      doc.text('ANOTACOES', M, py); py += 4
      box(M, py, W - M * 2, 40, C.white, C.lgray)
      setFont(7, 'normal', C.dark)
      var nLines = doc.splitTextToSize(notes, W - M * 2 - 4)
      doc.text(nLines.slice(0, 10), M + 2, py + 5)
    }

    fillColor(C.red)
    doc.rect(0, H - 8, W, 8, 'F')
    setFont(6, 'normal', C.white)
    doc.text('HUB GAMER - Ficha D&D 5e gerada automaticamente', W / 2, H - 3, { align: 'center' })
  }

  var fileName = (info.characterName || 'personagem').replace(/\s+/g, '_') + '_dnd5e.pdf'
  doc.save(fileName)
}