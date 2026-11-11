import { useState } from 'react'

const modCalc=(s)=>Math.floor(((parseInt(s)||10)-10)/2)
const modStr=(s)=>{const m=modCalc(s);return m>=0?`+${m}`:`${m}`}
const ATRIBUTOS=[
  {key:'str',label:'FOR',full:'Força'},{key:'dex',label:'DES',full:'Destreza'},
  {key:'con',label:'CON',full:'Constituição'},{key:'int',label:'INT',full:'Inteligência'},
  {key:'wis',label:'SAB',full:'Sabedoria'},{key:'cha',label:'CAR',full:'Carisma'},
]
const PERICIAS=[
  {key:'acrobatics',label:'Acrobacia',attr:'dex'},{key:'adestramento',label:'Adestramento',attr:'cha'},
  {key:'atletismo',label:'Atletismo',attr:'str'},{key:'atuacao',label:'Atuação',attr:'cha'},
  {key:'cavalgar',label:'Cavalgar',attr:'dex'},{key:'conhecimento',label:'Conhecimento',attr:'int'},
  {key:'cura',label:'Cura',attr:'wis'},{key:'diplomacia',label:'Diplomacia',attr:'cha'},
  {key:'enganacao',label:'Enganação',attr:'cha'},{key:'fortitude',label:'Fortitude',attr:'con'},
  {key:'furtividade',label:'Furtividade',attr:'dex'},{key:'guerra',label:'Guerra',attr:'int'},
  {key:'iniciativa',label:'Iniciativa',attr:'dex'},{key:'intimidacao',label:'Intimidação',attr:'cha'},
  {key:'intuicao',label:'Intuição',attr:'wis'},{key:'investigacao',label:'Investigação',attr:'int'},
  {key:'jogatina',label:'Jogatina',attr:'cha'},{key:'ladinagem',label:'Ladinagem',attr:'dex'},
  {key:'luta',label:'Luta',attr:'str'},{key:'misticismo',label:'Misticismo',attr:'int'},
  {key:'nobreza',label:'Nobreza',attr:'int'},{key:'pilotagem',label:'Pilotagem',attr:'dex'},
  {key:'percepcao',label:'Percepção',attr:'wis'},{key:'pontaria',label:'Pontaria',attr:'dex'},
  {key:'reflexos',label:'Reflexos',attr:'dex'},{key:'religiao',label:'Religião',attr:'wis'},
  {key:'sobrevivencia',label:'Sobrevivência',attr:'wis'},{key:'vontade',label:'Vontade',attr:'wis'},
]
const defaultData={
  info:{characterName:'',playerName:'',race:'',background:'',class:'',level:1,divinity:'',experiencePoints:0},
  abilities:{str:10,dex:10,con:10,int:10,wis:10,cha:10},
  combat:{maxHp:1,currentHp:1,maxMp:0,currentMp:0,armorClass:10,speed:9,armorBonus:0,shieldBonus:0,armorPenalty:0},
  attacks:[{name:'',bonus:'',damage:'',critical:'',type:'',range:''},{name:'',bonus:'',damage:'',critical:'',type:'',range:''},{name:'',bonus:'',damage:'',critical:'',type:'',range:''}],
  skills:{},proficiencies:{text:''},racialFeatures:'',classFeatures:'',description:'',
  spells:{list:'',spellcastingAbility:'',spellSaveDC:0},notes:'',equipment:'',
}

const inp="w-full px-3 py-2 bg-light-secondary dark:bg-dark-secondary border border-light-border dark:border-dark-border rounded-[7px] text-light-text-1 dark:text-dark-text-1 text-sm focus:border-brand outline-none transition-colors"
const tex=`${inp} resize-y leading-relaxed`
const sT="text-xs font-bold uppercase tracking-widest text-brand-light border-b border-light-border dark:border-dark-border pb-2 mb-4"

function Field({label,children,col}){
  return(<div className="flex flex-col gap-1" style={col?{gridColumn:`span ${col}`}:{}}>{label&&<label className="text-[11px] font-semibold text-light-text-3 dark:text-dark-text-3 uppercase tracking-wide">{label}</label>}{children}</div>)
}

export default function T20Sheet({initialData,onSave,saving,characterId,shareToken}){
  const [data,setData]=useState(()=>({...defaultData,...initialData}))
  const [isPublic,setIsPublic]=useState(!!shareToken)
  const [tab,setTab]=useState('main')
  const [msg,setMsg]=useState('')

  const set=(path,value)=>{setData(prev=>{const keys=path.split('.'),next={...prev};let cur=next;for(let i=0;i<keys.length-1;i++){cur[keys[i]]={...cur[keys[i]]};cur=cur[keys[i]]};cur[keys[keys.length-1]]=value;return next})}
  const setSkill=(key,field,value)=>setData(prev=>({...prev,skills:{...prev.skills,[key]:{...(prev.skills[key]||{}),[field]:value}}}))
  const onN=(path)=>(e)=>set(path,e.target.value)
  const onB=(path,fb,mn,mx)=>(e)=>{let n=parseInt(e.target.value);if(isNaN(n))n=fb;if(mn!==undefined)n=Math.max(mn,n);if(mx!==undefined)n=Math.min(mx,n);set(path,n)}
  const calcSkillTotal=(p)=>{
    const attrMod=modCalc(data.abilities[p.attr]||10),skill=data.skills[p.key]||{}
    const halfLvl=Math.floor((parseInt(data.info.level)||1)/2)
    return attrMod+(parseInt(skill.treino)||0)+(parseInt(skill.outros)||0)+halfLvl
  }

  const handleExportPdf=()=>{
    setMsg('Exportar PDF precisa de servidor — não disponível nesta versão só de frontend.')
    setTimeout(()=>setMsg(''),4000)
  }
  const shareLink=shareToken?`${window.location.origin}/rpg/share/${shareToken}`:null
  const copyLink=()=>{if(shareLink){navigator.clipboard.writeText(shareLink);setMsg('Link copiado!');setTimeout(()=>setMsg(''),2000)}}
  const tabs=[{key:'main',label:'📋 Principal'},{key:'combat',label:'⚔️ Combate'},{key:'skills',label:'🎯 Perícias'},{key:'spells',label:'✨ Magias'},{key:'bg',label:'📖 Histórico'}]
  const tC=(k)=>`px-4 py-3.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-all ${tab===k?'text-brand-light border-brand':'text-light-text-2 dark:text-dark-text-2 border-transparent hover:text-light-text-1 dark:hover:text-dark-text-1'}`

  return(
    <div className="flex flex-col bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-app-lg overflow-hidden">
      <div className="flex bg-light-secondary dark:bg-dark-secondary border-b border-light-border dark:border-dark-border overflow-x-auto">
        {tabs.map(t=><button key={t.key} className={tC(t.key)} onClick={()=>setTab(t.key)}>{t.label}</button>)}
      </div>

      {tab==='main'&&(
        <div className="p-7">
          <h2 className={sT}>Informações do Personagem</h2>
          <div className="grid grid-cols-6 gap-3 mb-7 max-sm:grid-cols-1">
            <Field label="Nome" col={3}><input value={data.info.characterName} onChange={e=>set('info.characterName',e.target.value)} placeholder="Ex: Thorin" className={inp}/></Field>
            <Field label="Jogador" col={3}><input value={data.info.playerName} onChange={e=>set('info.playerName',e.target.value)} className={inp}/></Field>
            <Field label="Raça" col={2}><input value={data.info.race} onChange={e=>set('info.race',e.target.value)} placeholder="Ex: Anão" className={inp}/></Field>
            <Field label="Origem" col={2}><input value={data.info.background} onChange={e=>set('info.background',e.target.value)} placeholder="Ex: Nobre" className={inp}/></Field>
            <Field label="Classe" col={1}><input value={data.info.class} onChange={e=>set('info.class',e.target.value)} placeholder="Ex: Guerreiro" className={inp}/></Field>
            <Field label="Nível" col={1}><input type="number" min="1" max="20" value={data.info.level} onChange={onN('info.level')} onBlur={onB('info.level',1,1,20)} className={inp}/></Field>
            <Field label="Divindade" col={2}><input value={data.info.divinity} onChange={e=>set('info.divinity',e.target.value)} placeholder="Ex: Valkaria" className={inp}/></Field>
            <Field label="XP" col={2}><input type="number" value={data.info.experiencePoints} onChange={onN('info.experiencePoints')} onBlur={onB('info.experiencePoints',0)} className={inp}/></Field>
          </div>
          <h2 className={sT}>Atributos</h2>
          <div className="grid grid-cols-6 gap-3 mb-7 max-sm:grid-cols-3">
            {ATRIBUTOS.map(ab=>(
              <div key={ab.key} className="flex flex-col items-center gap-1 p-3 bg-light-secondary dark:bg-dark-secondary border border-light-border dark:border-dark-border rounded-app text-center">
                <span className="text-[11px] font-bold text-brand-light tracking-widest">{ab.label}</span>
                <span className="text-xl font-extrabold text-light-text-1 dark:text-dark-text-1">{modStr(data.abilities[ab.key]||10)}</span>
                <input type="number" min="1" max="30" value={data.abilities[ab.key]??10} onChange={onN(`abilities.${ab.key}`)} onBlur={onB(`abilities.${ab.key}`,10,1,30)}
                  className="w-[52px] px-1 py-1 text-sm text-center bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-[6px] text-light-text-2 dark:text-dark-text-2 focus:border-brand outline-none"/>
                <span className="text-[10px] text-light-text-3 dark:text-dark-text-3">{ab.full}</span>
              </div>
            ))}
          </div>
          <h2 className={sT}>Ataques</h2>
          <div className="flex flex-col gap-2 mb-7">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-2 text-[11px] font-bold text-light-text-3 dark:text-dark-text-3 uppercase tracking-wide px-1 max-sm:hidden">
              <span>Nome</span><span>Bônus Atq</span><span>Dano</span><span>Crítico</span><span>Tipo</span><span>Alcance</span>
            </div>
            {data.attacks.map((atk,i)=>(
              <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-2 max-sm:grid-cols-1">
                {['name','bonus','damage','critical','type','range'].map(f=>(
                  <input key={f} value={atk[f]||''} onChange={e=>{const a=[...data.attacks];a[i]={...a[i],[f]:e.target.value};set('attacks',a)}}
                    placeholder={f==='name'?'Espada':f==='bonus'?'+5':f==='damage'?'1d8':f==='critical'?'20/x2':f==='type'?'Cortante':'Curto'} className={`${inp} min-w-0`}/>
                ))}
              </div>
            ))}
            <button onClick={()=>set('attacks',[...data.attacks,{name:'',bonus:'',damage:'',critical:'',type:'',range:''}])}
              className="py-2 border border-dashed border-light-border-lt dark:border-dark-border-lt rounded-[7px] text-light-text-3 dark:text-dark-text-3 text-sm hover:border-brand hover:text-brand-light transition-all mt-1 bg-transparent">+ Adicionar ataque</button>
          </div>
          <h2 className={sT}>Proficiências</h2>
          <textarea rows={4} value={data.proficiencies.text} onChange={e=>set('proficiencies.text',e.target.value)} placeholder="Liste suas proficiências..." className={tex}/>
        </div>
      )}

      {tab==='combat'&&(
        <div className="p-7">
          <h2 className={sT}>Combate</h2>
          <div className="grid grid-cols-3 gap-3 mb-5 max-sm:grid-cols-1">
            {[['Defesa (CA)','combat.armorClass',10],['Deslocamento','combat.speed',9],['Pen. Armadura','combat.armorPenalty',0]].map(([l,p,fb])=>(
              <div key={p} className="flex flex-col items-center gap-2 p-5 bg-light-secondary dark:bg-dark-secondary border border-light-border dark:border-dark-border rounded-app text-center">
                <label className="text-[11px] font-bold text-light-text-3 dark:text-dark-text-3 uppercase tracking-wide">{l}</label>
                <input type="number" value={data.combat[p.split('.')[1]]??fb} onChange={onN(p)} onBlur={onB(p,fb)}
                  className="w-20 px-2 py-2 text-center text-2xl font-bold text-light-text-1 dark:text-dark-text-1 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-[7px] focus:border-brand outline-none"/>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-3 mb-7 max-sm:grid-cols-2">
            {[['PV Máximos','combat.maxHp',1],['PV Atuais','combat.currentHp',0],['PM Máximos','combat.maxMp',0],['PM Atuais','combat.currentMp',0]].map(([l,p,fb])=>(
              <div key={p} className="flex flex-col gap-1.5"><label className="text-[11px] font-bold text-light-text-3 dark:text-dark-text-3 uppercase">{l}</label>
              <input type="number" value={data.combat[p.split('.')[1]]??fb} onChange={onN(p)} onBlur={onB(p,fb)} className={`${inp} text-center`}/></div>
            ))}
          </div>
          <h2 className={sT}>Armadura e Escudo</h2>
          <div className="grid grid-cols-6 gap-3 mb-7 max-sm:grid-cols-1">
            <Field label="Bônus Armadura" col={2}><input type="number" value={data.combat.armorBonus??0} onChange={onN('combat.armorBonus')} onBlur={onB('combat.armorBonus',0)} className={inp}/></Field>
            <Field label="Bônus Escudo" col={2}><input type="number" value={data.combat.shieldBonus??0} onChange={onN('combat.shieldBonus')} onBlur={onB('combat.shieldBonus',0)} className={inp}/></Field>
            <Field label="Outros" col={2}><input type="number" value={data.combat.otherDefBonus??0} onChange={onN('combat.otherDefBonus')} onBlur={onB('combat.otherDefBonus',0)} className={inp}/></Field>
          </div>
          <h2 className={sT}>Equipamento</h2>
          <textarea rows={6} value={data.equipment} onChange={e=>set('equipment',e.target.value)} placeholder="Liste seus itens e equipamentos..." className={tex}/>
        </div>
      )}

      {tab==='skills'&&(
        <div className="p-7">
          <h2 className={sT}>Perícias</h2>
          <p className="text-xs text-light-text-3 dark:text-dark-text-3 mb-3.5">Nível ½ ({Math.floor((parseInt(data.info.level)||1)/2)}) somado automaticamente.</p>
          <div className="grid grid-cols-2 gap-1.5 max-sm:grid-cols-1">
            {PERICIAS.map(p=>{
              const skill=data.skills[p.key]||{},total=calcSkillTotal(p),ab=ATRIBUTOS.find(a=>a.key===p.attr)
              return(
                <div key={p.key} className="flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] bg-light-secondary dark:bg-dark-secondary text-[13px]">
                  <span className="font-bold text-brand-light w-8 text-right shrink-0">{total>=0?`+${total}`:total}</span>
                  <span className="flex-1 text-light-text-1 dark:text-dark-text-1">{p.label}</span>
                  <span className="text-[11px] text-light-text-3 dark:text-dark-text-3 w-8 shrink-0">({ab?.label})</span>
                  {['treino','outros'].map(f=>(
                    <input key={f} type="number" placeholder={f==='treino'?'Treino':'Outros'} value={skill[f]??''}
                      onChange={e=>setSkill(p.key,f,e.target.value)} onBlur={e=>{let n=parseInt(e.target.value);if(isNaN(n))n=0;setSkill(p.key,f,n)}}
                      className="w-12 px-1 py-1 text-center text-xs bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-[5px] text-light-text-1 dark:text-dark-text-1 focus:border-brand outline-none"/>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab==='spells'&&(
        <div className="p-7">
          <h2 className={sT}>Conjuração</h2>
          <div className="grid grid-cols-6 gap-3 mb-6 max-sm:grid-cols-1">
            <Field label="Atributo-Chave" col={2}>
              <select value={data.spells.spellcastingAbility} onChange={e=>set('spells.spellcastingAbility',e.target.value)} className={inp}>
                <option value="">—</option>{ATRIBUTOS.map(a=><option key={a.key} value={a.key}>{a.full}</option>)}
              </select>
            </Field>
            <Field label="Teste de Resistência" col={2}><input type="number" value={data.spells.spellSaveDC} onChange={onN('spells.spellSaveDC')} onBlur={onB('spells.spellSaveDC',0)} className={inp}/></Field>
          </div>
          <h2 className={sT}>Lista de Magias</h2>
          <textarea rows={12} value={data.spells.list} onChange={e=>set('spells.list',e.target.value)} placeholder="Escola | Execução | Alcance | Área | Duração | Efeito" className={tex}/>
        </div>
      )}

      {tab==='bg'&&(
        <div className="p-7">
          <h2 className={sT}>Habilidades de Raça e Origem</h2>
          <textarea rows={5} value={data.racialFeatures} onChange={e=>set('racialFeatures',e.target.value)} placeholder="Habilidades raciais e de origem..." className={`${tex} mb-6`}/>
          <h2 className={sT}>Habilidades de Classe e Poderes</h2>
          <textarea rows={5} value={data.classFeatures} onChange={e=>set('classFeatures',e.target.value)} placeholder="Habilidades de classe e poderes especiais..." className={`${tex} mb-6`}/>
          <h2 className={sT}>Descrição</h2>
          <textarea rows={4} value={data.description} onChange={e=>set('description',e.target.value)} placeholder="Aparência, personalidade..." className={`${tex} mb-6`}/>
          <h2 className={sT}>Anotações</h2>
          <textarea rows={4} value={data.notes} onChange={e=>set('notes',e.target.value)} placeholder="Histórico, aliados, tesouros..." className={tex}/>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3 px-7 py-4 bg-light-secondary dark:bg-dark-secondary border-t border-light-border dark:border-dark-border">
        <label className="flex items-center gap-2 text-sm text-light-text-2 dark:text-dark-text-2 cursor-pointer">
          <input type="checkbox" checked={isPublic} onChange={e=>setIsPublic(e.target.checked)} className="accent-brand w-4 h-4"/>Tornar pública
        </label>
        {msg&&<span className="text-sm text-brand-light">{msg}</span>}
        {shareLink&&<button onClick={copyLink} className="px-4 py-2.5 border border-brand rounded-app text-brand-light text-sm hover:bg-brand/10 transition-colors">🔗 Copiar link</button>}
        <button onClick={handleExportPdf} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-60 rounded-app text-white text-sm font-semibold transition-colors">📄 Exportar PDF</button>
        <button onClick={()=>onSave(data,isPublic)} disabled={saving} className="px-7 py-2.5 bg-brand hover:bg-brand-light disabled:opacity-60 rounded-app text-white text-sm font-semibold transition-colors">{saving?'Salvando...':'💾 Salvar'}</button>
      </div>
    </div>
  )
}
