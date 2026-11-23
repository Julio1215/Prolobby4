import { useState } from 'react'

const mod = (s) => Math.floor((s-10)/2)
const modStr = (s) => { const m=mod(s); return m>=0 ? `+${m}` : `${m}` }
const ABILITIES = [
  {key:'str',label:'FOR',full:'Força'},{key:'dex',label:'DES',full:'Destreza'},
  {key:'con',label:'CON',full:'Constituição'},{key:'int',label:'INT',full:'Inteligência'},
  {key:'wis',label:'SAB',full:'Sabedoria'},{key:'cha',label:'CAR',full:'Carisma'},
]
const SKILLS = [
  {key:'acrobatics',label:'Acrobacia',ability:'dex'},{key:'animalHandling',label:'Adestrar Animais',ability:'wis'},
  {key:'arcana',label:'Arcanismo',ability:'int'},{key:'athletics',label:'Atletismo',ability:'str'},
  {key:'deception',label:'Enganação',ability:'cha'},{key:'history',label:'História',ability:'int'},
  {key:'insight',label:'Intuição',ability:'wis'},{key:'intimidation',label:'Intimidação',ability:'cha'},
  {key:'investigation',label:'Investigação',ability:'int'},{key:'medicine',label:'Medicina',ability:'wis'},
  {key:'nature',label:'Natureza',ability:'int'},{key:'perception',label:'Percepção',ability:'wis'},
  {key:'performance',label:'Performance',ability:'cha'},{key:'persuasion',label:'Persuasão',ability:'cha'},
  {key:'religion',label:'Religião',ability:'int'},{key:'sleightOfHand',label:'Prestidigitação',ability:'dex'},
  {key:'stealth',label:'Furtividade',ability:'dex'},{key:'survival',label:'Sobrevivência',ability:'wis'},
]
const PROF_BONUS = [0,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6,6]
const defaultData = {
  info:{characterName:'',playerName:'',class:'',level:1,background:'',race:'',alignment:'',experiencePoints:0},
  abilities:{str:10,dex:10,con:10,int:10,wis:10,cha:10},
  combat:{armorClass:10,initiative:0,speed:30,maxHp:10,currentHp:10,tempHp:0,hitDice:'1d8'},
  proficiencies:{skills:{},savingThrows:{}},
  attacks:[{name:'',bonus:'',damage:'',type:''}],
  features:'',equipment:'',
  personality:{traits:'',ideals:'',bonds:'',flaws:''},
  spells:{spellcastingClass:'',spellcastingAbility:'',spellSaveDC:8,spellAttackBonus:0,list:''},
  notes:'',
}

const inp = "w-full px-3 py-2 bg-light-secondary dark:bg-dark-secondary border border-light-border dark:border-dark-border rounded-[7px] text-light-text-1 dark:text-dark-text-1 text-sm focus:border-brand outline-none transition-colors"
const sel = `${inp} cursor-pointer`
const tex = `${inp} resize-y leading-relaxed`
const sectionTitle = "text-xs font-bold uppercase tracking-widest text-brand-light border-b border-light-border dark:border-dark-border pb-2 mb-4"

function Field({label,children,col}) {
  return (
    <div className="flex flex-col gap-1" style={col ? {gridColumn:`span ${col}`} : {}}>
      {label && <label className="text-[11px] font-semibold text-light-text-3 dark:text-dark-text-3 uppercase tracking-wide">{label}</label>}
      {children}
    </div>
  )
}

export default function DndSheet({initialData,onSave,saving,characterId,shareToken}) {
  const [data,setData] = useState(() => ({...defaultData,...initialData}))
  const [isPublic,setIsPublic] = useState(!!shareToken)
  const [tab,setTab] = useState('main')

  const set = (path,value) => {
    setData(prev => {
      const keys=path.split('.'), next={...prev}; let cur=next
      for(let i=0;i<keys.length-1;i++){cur[keys[i]]={...cur[keys[i]]};cur=cur[keys[i]]}
      cur[keys[keys.length-1]]=value; return next
    })
  }
  const onNumChange = (path) => (e) => set(path, e.target.value)
  const onNumBlur = (path,fallback,min,max) => (e) => {
    let n=parseInt(e.target.value); if(isNaN(n)) n=fallback
    if(min!==undefined) n=Math.max(min,n); if(max!==undefined) n=Math.min(max,n); set(path,n)
  }

  const profBonus = PROF_BONUS[data.info.level] || 2
  const skillMod = (skill) => {
    const base=mod(data.abilities[skill.ability]||10), prof=data.proficiencies.skills[skill.key]
    if(prof==='expert') return base+profBonus*2; if(prof==='prof') return base+profBonus; return base
  }
  const saveMod = (abilKey) => {
    const base=mod(data.abilities[abilKey]||10)
    return data.proficiencies.savingThrows[abilKey] ? base+profBonus : base
  }

  const handleExportPdf = () => {
    alert('Exportar PDF precisa de um servidor pra gerar o arquivo — não disponível nesta versão só de frontend.')
  }

  const shareLink = shareToken ? `${window.location.origin}/rpg/share/${shareToken}` : null
  const copyLink = () => {if(shareLink){navigator.clipboard.writeText(shareLink);alert('Link copiado!')}}

  const tabs = [{key:'main',label:'Principal'},{key:'combat',label:'Combate'},{key:'skills',label:'Perícias'},{key:'spells',label:'Magias'},{key:'bg',label:'Histórico'}]
  const tabCls = (k) => `px-5 py-3.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-all ${tab===k ? 'text-brand-light border-brand' : 'text-light-text-2 dark:text-dark-text-2 border-transparent hover:text-light-text-1 dark:hover:text-dark-text-1'}`
  const abilityKeys = Object.keys(data.abilities)

  return (
    <div className="flex flex-col bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-app-lg overflow-hidden transition-colors">
      {/* Tabs */}
      <div className="flex bg-light-secondary dark:bg-dark-secondary border-b border-light-border dark:border-dark-border overflow-x-auto">
        {tabs.map(t => <button key={t.key} className={tabCls(t.key)} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {/* PRINCIPAL */}
      {tab==='main' && (
        <div className="p-7">
          <h2 className={sectionTitle}>Informações do Personagem</h2>
          <div className="grid grid-cols-6 gap-3 max-sm:grid-cols-1">
            <Field label="Nome do Personagem" col={3}><input value={data.info.characterName} onChange={e => set('info.characterName',e.target.value)} placeholder="Ex: Aragorn" className={inp} /></Field>
            <Field label="Classe" col={2}><input value={data.info.class} onChange={e => set('info.class',e.target.value)} placeholder="Ex: Guerreiro" className={inp} /></Field>
            <Field label="Nível"><input type="number" min="1" max="20" value={data.info.level} onChange={onNumChange('info.level')} onBlur={onNumBlur('info.level',1,1,20)} className={inp} /></Field>
            <Field label="Raça" col={2}><input value={data.info.race} onChange={e => set('info.race',e.target.value)} placeholder="Ex: Humano" className={inp} /></Field>
            <Field label="Antecedente" col={2}><input value={data.info.background} onChange={e => set('info.background',e.target.value)} placeholder="Ex: Soldado" className={inp} /></Field>
            <Field label="Tendência" col={2}>
              <select value={data.info.alignment} onChange={e => set('info.alignment',e.target.value)} className={sel}>
                <option value="">-</option>
                {['Leal Bom','Neutro Bom','Caótico Bom','Leal Neutro','Neutro','Caótico Neutro','Leal Mau','Neutro Mau','Caótico Mau'].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="XP" col={2}><input type="number" value={data.info.experiencePoints} onChange={onNumChange('info.experiencePoints')} onBlur={onNumBlur('info.experiencePoints',0)} className={inp} /></Field>
          </div>

          <h2 className={`${sectionTitle} mt-7`}>Atributos</h2>
          <div className="grid grid-cols-6 gap-3 max-sm:grid-cols-3">
            {ABILITIES.map(ab => (
              <div key={ab.key} className="flex flex-col items-center gap-1 p-3.5 bg-light-secondary dark:bg-dark-secondary border border-light-border dark:border-dark-border rounded-app text-center">
                <span className="text-[11px] font-bold text-brand-light tracking-widest">{ab.label}</span>
                <span className="text-2xl font-extrabold text-light-text-1 dark:text-dark-text-1">{modStr(data.abilities[ab.key]||10)}</span>
                <input type="number" min="1" max="30" value={data.abilities[ab.key]??10}
                  onChange={onNumChange(`abilities.${ab.key}`)} onBlur={onNumBlur(`abilities.${ab.key}`,10,1,30)}
                  className="w-[52px] px-1 py-1 text-sm text-center bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-[6px] text-light-text-2 dark:text-dark-text-2 focus:border-brand outline-none" />
                <span className="text-[10px] text-light-text-3 dark:text-dark-text-3">{ab.full}</span>
              </div>
            ))}
          </div>

          <h2 className={`${sectionTitle} mt-7`}>Ataques e Magias</h2>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[2fr_1fr_2fr] gap-2.5 text-[11px] font-bold text-light-text-3 dark:text-dark-text-3 uppercase tracking-wide px-1 max-sm:hidden">
              <span>Nome</span><span>Bônus</span><span>Dano / Tipo</span>
            </div>
            {data.attacks.map((atk,i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_2fr] gap-2.5 max-sm:grid-cols-1">
                <input value={atk.name} onChange={e => {const a=[...data.attacks];a[i]={...a[i],name:e.target.value};set('attacks',a)}} placeholder="Ex: Espada Longa" className={inp} />
                <input value={atk.bonus} onChange={e => {const a=[...data.attacks];a[i]={...a[i],bonus:e.target.value};set('attacks',a)}} placeholder="+5" className={inp} />
                <input value={atk.damage} onChange={e => {const a=[...data.attacks];a[i]={...a[i],damage:e.target.value};set('attacks',a)}} placeholder="1d8+3 cortante" className={inp} />
              </div>
            ))}
            <button onClick={() => set('attacks',[...data.attacks,{name:'',bonus:'',damage:'',type:''}])}
              className="py-2 bg-transparent border border-dashed border-light-border-lt dark:border-dark-border-lt rounded-[7px] text-light-text-3 dark:text-dark-text-3 text-sm hover:border-brand hover:text-brand-light transition-all mt-1">
              + Adicionar ataque
            </button>
          </div>
        </div>
      )}

      {/* COMBATE */}
      {tab==='combat' && (
        <div className="p-7">
          <h2 className={sectionTitle}>Combate</h2>
          <div className="grid grid-cols-3 gap-3.5 mb-5 max-sm:grid-cols-1">
            {[['Classe de Armadura','combat.armorClass'],['Iniciativa','combat.initiative'],['Deslocamento','combat.speed']].map(([l,p]) => (
              <div key={p} className="flex flex-col items-center gap-2 p-5 bg-light-secondary dark:bg-dark-secondary border border-light-border dark:border-dark-border rounded-app text-center">
                <label className="text-[11px] font-bold text-light-text-3 dark:text-dark-text-3 uppercase tracking-wide">{l}</label>
                <input type="number" value={data.combat[p.split('.')[1]]??0} onChange={onNumChange(p)} onBlur={onNumBlur(p,0)}
                  className="w-20 px-2 py-2 text-center text-2xl font-bold text-light-text-1 dark:text-dark-text-1 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-[7px] focus:border-brand outline-none" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-3 mb-5 max-sm:grid-cols-2">
            {[['HP Máximo','maxHp'],['HP Atual','currentHp'],['HP Temporário','tempHp']].map(([l,k]) => (
              <div key={k} className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-light-text-3 dark:text-dark-text-3 uppercase">{l}</label>
                <input type="number" value={data.combat[k]??0} onChange={onNumChange(`combat.${k}`)} onBlur={onNumBlur(`combat.${k}`,0)} className={`${inp} text-center text-base`} />
              </div>
            ))}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-light-text-3 dark:text-dark-text-3 uppercase">Dado de Vida</label>
              <select value={data.combat.hitDice} onChange={e => set('combat.hitDice',e.target.value)} className={sel}>
                {['1d6','1d8','1d10','1d12'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3.5 bg-brand/10 border border-brand/30 rounded-app mb-6">
            <span className="text-sm text-light-text-2 dark:text-dark-text-2">Bônus de Proficiência</span>
            <span className="text-2xl font-extrabold text-brand-light">+{profBonus}</span>
            <span className="text-xs text-light-text-3 dark:text-dark-text-3">(Nível {data.info.level})</span>
          </div>
          <h2 className={sectionTitle}>Testes de Resistência</h2>
          <div className="grid grid-cols-3 gap-2 mb-6 max-sm:grid-cols-2">
            {ABILITIES.map(ab => (
              <div key={ab.key} className="flex items-center gap-2 text-sm text-light-text-1 dark:text-dark-text-1">
                <input type="checkbox" checked={!!data.proficiencies.savingThrows[ab.key]} onChange={e => set(`proficiencies.savingThrows.${ab.key}`,e.target.checked)} className="accent-brand w-4 h-4" />
                <span className="font-bold w-7 text-brand-light">{saveMod(ab.key)>=0?`+${saveMod(ab.key)}`:saveMod(ab.key)}</span>
                <span>{ab.full}</span>
              </div>
            ))}
          </div>
          <h2 className={sectionTitle}>Equipamentos</h2>
          <textarea rows={6} value={data.equipment} onChange={e => set('equipment',e.target.value)} placeholder="Liste seus equipamentos..." className={tex} />
        </div>
      )}

      {/* PERÍCIAS */}
      {tab==='skills' && (
        <div className="p-7">
          <h2 className={sectionTitle}>Perícias</h2>
          <p className="text-xs text-light-text-3 dark:text-dark-text-3 mb-3.5">Clique uma vez para proficiente, duas para expertise, três para remover.</p>
          <div className="grid grid-cols-2 gap-1 max-sm:grid-cols-1">
            {SKILLS.map(skill => {
              const prof=data.proficiencies.skills[skill.key]||''
              const cycle = () => set(`proficiencies.skills.${skill.key}`,prof===''?'prof':prof==='prof'?'expert':'')
              const total=skillMod(skill), ab=ABILITIES.find(a => a.key===skill.ability)
              return (
                <div key={skill.key} onClick={cycle} className="flex items-center gap-2.5 px-2.5 py-2 rounded-[6px] cursor-pointer hover:bg-light-hover dark:hover:bg-dark-hover text-[13px] transition-colors">
                  <div className={`w-3 h-3 rounded-full border-2 shrink-0 transition-all ${prof==='expert' ? 'bg-yellow-400 border-yellow-400' : prof==='prof' ? 'bg-brand border-brand' : 'border-light-border-lt dark:border-dark-border-lt'}`} />
                  <span className="font-bold w-7 text-right text-brand-light">{total>=0?`+${total}`:total}</span>
                  <span className="flex-1 text-light-text-1 dark:text-dark-text-1">{skill.label}</span>
                  <span className="text-[11px] text-light-text-3 dark:text-dark-text-3">({ab?.label})</span>
                  {prof==='expert' && <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">EXP</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* MAGIAS */}
      {tab==='spells' && (
        <div className="p-7">
          <h2 className={sectionTitle}>Conjuração</h2>
          <div className="grid grid-cols-6 gap-3 mb-6 max-sm:grid-cols-1">
            <Field label="Classe de Conjuração" col={2}><input value={data.spells.spellcastingClass} onChange={e => set('spells.spellcastingClass',e.target.value)} placeholder="Ex: Mago" className={inp} /></Field>
            <Field label="Atributo" col={2}>
              <select value={data.spells.spellcastingAbility} onChange={e => set('spells.spellcastingAbility',e.target.value)} className={sel}>
                <option value="">-</option>{ABILITIES.map(a => <option key={a.key} value={a.key}>{a.full}</option>)}
              </select>
            </Field>
            <Field label="CD de Magia" col={1}><input type="number" value={data.spells.spellSaveDC} onChange={onNumChange('spells.spellSaveDC')} onBlur={onNumBlur('spells.spellSaveDC',8)} className={inp} /></Field>
            <Field label="Bônus Ataque" col={1}><input type="number" value={data.spells.spellAttackBonus} onChange={onNumChange('spells.spellAttackBonus')} onBlur={onNumBlur('spells.spellAttackBonus',0)} className={inp} /></Field>
          </div>
          <h2 className={sectionTitle}>Lista de Magias</h2>
          <textarea rows={10} value={data.spells.list} onChange={e => set('spells.list',e.target.value)} placeholder="Truques: Luz&#10;1º Nível: Míssil Mágico" className={tex} />
        </div>
      )}

      {/* HISTÓRICO */}
      {tab==='bg' && (
        <div className="p-7">
          <h2 className={sectionTitle}>Traços de Personalidade</h2>
          <div className="grid grid-cols-2 gap-3.5 mb-6 max-sm:grid-cols-1">
            {[['Traços','personality.traits'],['Ideais','personality.ideals'],['Vínculos','personality.bonds'],['Fraquezas','personality.flaws']].map(([l,p]) => (
              <div key={p} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-light-text-3 dark:text-dark-text-3 uppercase tracking-wide">{l}</label>
                <textarea rows={3} value={data[p.split('.')[0]][p.split('.')[1]]||''} onChange={e => set(p,e.target.value)} className={tex} />
              </div>
            ))}
          </div>
          <h2 className={sectionTitle}>Habilidades e Talentos</h2>
          <textarea rows={6} value={data.features} onChange={e => set('features',e.target.value)} placeholder="Habilidades especiais, traços raciais..." className={`${tex} mb-6`} />
          <h2 className={sectionTitle}>Anotações</h2>
          <textarea rows={6} value={data.notes} onChange={e => set('notes',e.target.value)} placeholder="Anotações extras..." className={tex} />
        </div>
      )}

      {/* SAVE BAR */}
      <div className="flex items-center justify-between flex-wrap gap-3 px-7 py-4 bg-light-secondary dark:bg-dark-secondary border-t border-light-border dark:border-dark-border">
        <label className="flex items-center gap-2 text-sm text-light-text-2 dark:text-dark-text-2 cursor-pointer">
          <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="accent-brand w-4 h-4" />
          Tornar pública
        </label>
        {shareLink && <button onClick={copyLink} className="px-4 py-2.5 border border-brand rounded-app text-brand-light text-sm font-medium hover:bg-brand/10 transition-colors">Copiar link</button>}
        <button onClick={handleExportPdf} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-60 rounded-app text-white text-sm font-semibold transition-colors">
          Exportar PDF
        </button>
        <button onClick={() => onSave(data,isPublic)} disabled={saving} className="px-7 py-2.5 bg-brand hover:bg-brand-light disabled:opacity-60 rounded-app text-white text-sm font-semibold transition-colors">
          {saving ? 'Salvando...' : 'Salvar Ficha'}
        </button>
      </div>
    </div>
  )
}
