import { useState } from 'react'

const ATRIBUTOS = [
  {key:'agi',label:'AGI',full:'Agilidade'},{key:'for',label:'FOR',full:'Força'},
  {key:'int',label:'INT',full:'Intelecto'},{key:'pre',label:'PRE',full:'Presença'},
  {key:'vig',label:'VIG',full:'Vigor'},
]
const PERICIAS = [
  {key:'acrobacia',label:'Acrobacia',attr:'agi'},{key:'adestramento',label:'Adestramento',attr:'pre'},
  {key:'artes',label:'Artes',attr:'pre'},{key:'atletismo',label:'Atletismo',attr:'for'},
  {key:'atualidades',label:'Atualidades',attr:'int'},{key:'ciencias',label:'Ciências',attr:'int'},
  {key:'crime',label:'Crime',attr:'agi'},{key:'diplomacia',label:'Diplomacia',attr:'pre'},
  {key:'enganacao',label:'Enganação',attr:'pre'},{key:'fortitude',label:'Fortitude',attr:'vig'},
  {key:'furtividade',label:'Furtividade',attr:'agi'},{key:'iniciativa',label:'Iniciativa',attr:'agi'},
  {key:'intimidacao',label:'Intimidação',attr:'pre'},{key:'intuicao',label:'Intuição',attr:'pre'},
  {key:'investigacao',label:'Investigação',attr:'int'},{key:'luta',label:'Luta',attr:'for'},
  {key:'medicina',label:'Medicina',attr:'int'},{key:'ocultismo',label:'Ocultismo',attr:'int'},
  {key:'percepcao',label:'Percepção',attr:'pre'},{key:'pilotagem',label:'Pilotagem',attr:'agi'},
  {key:'pontaria',label:'Pontaria',attr:'agi'},{key:'reflexos',label:'Reflexos',attr:'agi'},
  {key:'religiao',label:'Religião',attr:'pre'},{key:'sobrevivencia',label:'Sobrevivência',attr:'int'},
  {key:'tatica',label:'Tática',attr:'int'},{key:'tecnologia',label:'Tecnologia',attr:'int'},
  {key:'vontade',label:'Vontade',attr:'pre'},
]
const NEX = ['5%','10%','15%','20%','25%','30%','35%','40%','45%','50%','55%','60%','65%','70%','75%','80%','85%','90%','95%','99%']
const defaultData = {
  info:{characterName:'',playerName:'',background:'',class:'',trilha:'',nex:'5%'},
  abilities:{agi:1,for:1,int:1,pre:1,vig:1},
  combat:{maxHp:1,currentHp:1,maxPe:1,currentPe:1,pePerRound:1,speed:9,defense:10,defEquip:0,defOther:0,maxSanity:20,sanity:20,protection:'',resistances:''},
  attacks:[{name:'',bonus:'',damage:'',special:''},{name:'',bonus:'',damage:'',special:''},{name:'',bonus:'',damage:'',special:''}],
  skills:{},features:'',rituals:[],appearance:'',personality:'',background_text:'',objective:'',
}

const inp = "w-full px-3 py-2 bg-light-secondary dark:bg-dark-secondary border border-light-border dark:border-dark-border rounded-[7px] text-light-text-1 dark:text-dark-text-1 text-sm focus:border-brand outline-none transition-colors"
const tex = `${inp} resize-y leading-relaxed`
const sT  = "text-xs font-bold uppercase tracking-widest text-brand-light border-b border-light-border dark:border-dark-border pb-2 mb-4"

function Field({label,children,col}){
  return(
    <div className="flex flex-col gap-1" style={col?{gridColumn:`span ${col}`}:{}}>
      {label&&<label className="text-[11px] font-semibold text-light-text-3 dark:text-dark-text-3 uppercase tracking-wide">{label}</label>}
      {children}
    </div>
  )
}

export default function OrdemSheet({initialData,onSave,saving,characterId,shareToken}){
  const [data,setData]=useState(()=>({...defaultData,...initialData}))
  const [isPublic,setIsPublic]=useState(!!shareToken)
  const [tab,setTab]=useState('main')
  const [msg,setMsg]=useState('')

  const set=(path,value)=>{setData(prev=>{const keys=path.split('.'),next={...prev};let cur=next;for(let i=0;i<keys.length-1;i++){cur[keys[i]]={...cur[keys[i]]};cur=cur[keys[i]]};cur[keys[keys.length-1]]=value;return next})}
  const setSkill=(key,field,value)=>setData(prev=>({...prev,skills:{...prev.skills,[key]:{...(prev.skills[key]||{}),[field]:value}}}))
  const onN=(path)=>(e)=>set(path,e.target.value)
  const onB=(path,fb,mn,mx)=>(e)=>{let n=parseInt(e.target.value);if(isNaN(n))n=fb;if(mn!==undefined)n=Math.max(mn,n);if(mx!==undefined)n=Math.min(mx,n);set(path,n)}
  const calcSkillTotal=(p)=>{
    const attrVal=data.abilities[p.attr]||1,skill=data.skills[p.key]||{}
    return attrVal+(parseInt(skill.bonus)||0)+(parseInt(skill.outros)||0)
  }

  const handleExportPdf=()=>{
    setMsg('Exportar PDF precisa de servidor — não disponível nesta versão só de frontend.')
    setTimeout(()=>setMsg(''),4000)
  }

  const shareLink=shareToken?`${window.location.origin}/rpg/share/${shareToken}`:null
  const copyLink=()=>{if(shareLink){navigator.clipboard.writeText(shareLink);setMsg('Link copiado!');setTimeout(()=>setMsg(''),2000)}}

  const tabs=[{key:'main',label:'📋 Principal'},{key:'combat',label:'⚔️ Combate'},{key:'skills',label:'🎯 Perícias'},{key:'rituals',label:'🔮 Rituais'},{key:'bg',label:'📖 Descrição'}]
  const tC=(k)=>`px-4 py-3.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-all ${tab===k?'text-brand-light border-brand':'text-light-text-2 dark:text-dark-text-2 border-transparent hover:text-light-text-1 dark:hover:text-dark-text-1'}`

  return(
    <div className="flex flex-col bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-app-lg overflow-hidden">
      <div className="flex bg-light-secondary dark:bg-dark-secondary border-b border-light-border dark:border-dark-border overflow-x-auto">
        {tabs.map(t=><button key={t.key} className={tC(t.key)} onClick={()=>setTab(t.key)}>{t.label}</button>)}
      </div>

      {tab==='main'&&(
        <div className="p-7">
          <h2 className={sT}>Ficha de Agente</h2>
          <div className="grid grid-cols-6 gap-3 mb-7 max-sm:grid-cols-1">
            <Field label="Nome do Personagem" col={3}><input value={data.info.characterName} onChange={e=>set('info.characterName',e.target.value)} placeholder="Ex: Klaus Lennox" className={inp}/></Field>
            <Field label="Jogador" col={3}><input value={data.info.playerName} onChange={e=>set('info.playerName',e.target.value)} className={inp}/></Field>
            <Field label="Origem" col={2}><input value={data.info.background} onChange={e=>set('info.background',e.target.value)} placeholder="Ex: Cultista Julgado" className={inp}/></Field>
            <Field label="Classe" col={2}><input value={data.info.class} onChange={e=>set('info.class',e.target.value)} placeholder="Ex: Especialista" className={inp}/></Field>
            <Field label="Trilha" col={1}><input value={data.info.trilha} onChange={e=>set('info.trilha',e.target.value)} placeholder="Ex: Técnico" className={inp}/></Field>
            <Field label="NEX" col={1}><select value={data.info.nex} onChange={e=>set('info.nex',e.target.value)} className={inp}>{NEX.map(n=><option key={n} value={n}>{n}</option>)}</select></Field>
          </div>
          <h2 className={sT}>Atributos</h2>
          <div className="grid grid-cols-5 gap-3 mb-7 max-sm:grid-cols-3">
            {ATRIBUTOS.map(ab=>(
              <div key={ab.key} className="flex flex-col items-center gap-1.5 p-3 bg-light-secondary dark:bg-dark-secondary border border-light-border dark:border-dark-border rounded-app text-center">
                <span className="text-[11px] font-bold text-brand-light tracking-widest">{ab.label}</span>
                <input type="number" min="1" max="5" value={data.abilities[ab.key]??1} onChange={onN(`abilities.${ab.key}`)} onBlur={onB(`abilities.${ab.key}`,1,1,5)}
                  className="w-[52px] px-1 py-1 text-lg font-bold text-center bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-[6px] text-light-text-1 dark:text-dark-text-1 focus:border-brand outline-none"/>
                <span className="text-[10px] text-light-text-3 dark:text-dark-text-3">{ab.full}</span>
              </div>
            ))}
          </div>
          <h2 className={sT}>Habilidades</h2>
          <textarea rows={8} value={data.features} onChange={e=>set('features',e.target.value)} placeholder="Liste suas habilidades de origem, classe e poderes..." className={`${tex} mb-7`}/>
          <h2 className={sT}>Ataques</h2>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[2fr_1fr_1fr_2fr] gap-2 text-[11px] font-bold text-light-text-3 dark:text-dark-text-3 uppercase tracking-wide px-1 max-sm:hidden">
              <span>Ataque</span><span>Teste</span><span>Dano</span><span>Especial</span>
            </div>
            {data.attacks.map((atk,i)=>(
              <div key={i} className="grid grid-cols-[2fr_1fr_1fr_2fr] gap-2 max-sm:grid-cols-1">
                {['name','bonus','damage','special'].map(f=>(
                  <input key={f} value={atk[f]||''} onChange={e=>{const a=[...data.attacks];a[i]={...a[i],[f]:e.target.value};set('attacks',a)}}
                    placeholder={f==='name'?'Nome':f==='bonus'?'+5':f==='damage'?'1d6':'-'} className={`${inp} min-w-0`}/>
                ))}
              </div>
            ))}
            <button onClick={()=>set('attacks',[...data.attacks,{name:'',bonus:'',damage:'',special:''}])}
              className="py-2 border border-dashed border-light-border-lt dark:border-dark-border-lt rounded-[7px] text-light-text-3 dark:text-dark-text-3 text-sm hover:border-brand hover:text-brand-light transition-all mt-1 bg-transparent">+ Adicionar ataque</button>
          </div>
        </div>
      )}

      {tab==='combat'&&(
        <div className="p-7">
          <h2 className={sT}>Pontos de Vida e Esforço</h2>
          <div className="grid grid-cols-4 gap-3 mb-5 max-sm:grid-cols-2">
            {[['PV Máximo','combat.maxHp',1],['PV Atual','combat.currentHp',1],['PE Máximo','combat.maxPe',1],['PE Atual','combat.currentPe',1]].map(([l,p,fb])=>(
              <div key={p} className="flex flex-col gap-1.5"><label className="text-[11px] font-bold text-light-text-3 dark:text-dark-text-3 uppercase">{l}</label>
              <input type="number" value={data.combat[p.split('.')[1]]??fb} onChange={onN(p)} onBlur={onB(p,fb)} className={`${inp} text-center`}/></div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 mb-7 max-sm:grid-cols-1">
            {[['PE / Rodada','combat.pePerRound',1],['Deslocamento','combat.speed',9],['Defesa','combat.defense',10]].map(([l,p,fb])=>(
              <div key={p} className="flex flex-col items-center gap-2 p-5 bg-light-secondary dark:bg-dark-secondary border border-light-border dark:border-dark-border rounded-app text-center">
                <label className="text-[11px] font-bold text-light-text-3 dark:text-dark-text-3 uppercase tracking-wide">{l}</label>
                <input type="number" value={data.combat[p.split('.')[1]]??fb} onChange={onN(p)} onBlur={onB(p,fb)}
                  className="w-20 px-2 py-2 text-center text-2xl font-bold text-light-text-1 dark:text-dark-text-1 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-[7px] focus:border-brand outline-none"/>
              </div>
            ))}
          </div>
          <h2 className={sT}>Sanidade</h2>
          <div className="grid grid-cols-2 gap-3 mb-7 max-sm:grid-cols-1">
            {[['SAN Máxima','combat.maxSanity',20],['SAN Atual','combat.sanity',20]].map(([l,p,fb])=>(
              <div key={p} className="flex flex-col gap-1.5"><label className="text-[11px] font-bold text-light-text-3 dark:text-dark-text-3 uppercase">{l}</label>
              <input type="number" value={data.combat[p.split('.')[1]]??fb} onChange={onN(p)} onBlur={onB(p,fb)} className={`${inp} text-center`}/></div>
            ))}
          </div>
          <h2 className={sT}>Proteção e Resistências</h2>
          <div className="grid grid-cols-6 gap-3 max-sm:grid-cols-1">
            <Field label="Proteção" col={3}><input value={data.combat.protection} onChange={e=>set('combat.protection',e.target.value)} placeholder="Ex: 2 (colete)" className={inp}/></Field>
            <Field label="Resistências" col={3}><input value={data.combat.resistances} onChange={e=>set('combat.resistances',e.target.value)} placeholder="Ex: Fogo 5" className={inp}/></Field>
          </div>
        </div>
      )}

      {tab==='skills'&&(
        <div className="p-7">
          <h2 className={sT}>Perícias</h2>
          <p className="text-xs text-light-text-3 dark:text-dark-text-3 mb-3.5">Em Ordem Paranormal os atributos vão de 1 a 5. Total = Atributo + Bônus + Outros.</p>
          <div className="grid grid-cols-2 gap-1.5 max-sm:grid-cols-1">
            {PERICIAS.map(p=>{
              const skill=data.skills[p.key]||{},total=calcSkillTotal(p),ab=ATRIBUTOS.find(a=>a.key===p.attr)
              return(
                <div key={p.key} className="flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] bg-light-secondary dark:bg-dark-secondary text-[13px]">
                  <span className="font-bold text-brand-light w-6 text-right shrink-0">{total}</span>
                  <span className="flex-1 text-light-text-1 dark:text-dark-text-1">{p.label}</span>
                  <span className="text-[11px] text-light-text-3 dark:text-dark-text-3 w-8 shrink-0">({ab?.label})</span>
                  {['bonus','outros'].map(f=>(
                    <input key={f} type="number" placeholder={f==='bonus'?'Bônus':'Outros'} value={skill[f]??''}
                      onChange={e=>setSkill(p.key,f,e.target.value)} onBlur={e=>{let n=parseInt(e.target.value);if(isNaN(n))n=0;setSkill(p.key,f,n)}}
                      className="w-11 px-1 py-1 text-center text-xs bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-[5px] text-light-text-1 dark:text-dark-text-1 focus:border-brand outline-none"/>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab==='rituals'&&(
        <div className="p-7">
          <h2 className={sT}>Rituais</h2>
          {(data.rituals||[]).map((r,i)=>(
            <div key={i} className="bg-light-secondary dark:bg-dark-secondary border border-light-border dark:border-dark-border rounded-app p-4 mb-3">
              <div className="grid grid-cols-6 gap-3 mb-2 max-sm:grid-cols-1">
                <Field label="Nome do Ritual" col={3}><input value={r.name||''} onChange={e=>{const rs=[...data.rituals];rs[i]={...rs[i],name:e.target.value};set('rituals',rs)}} className={inp}/></Field>
                <Field label="Círculo" col={1}><select value={r.circle||'1'} onChange={e=>{const rs=[...data.rituals];rs[i]={...rs[i],circle:e.target.value};set('rituals',rs)}} className={inp}>{['1','2','3','4'].map(c=><option key={c} value={c}>{c}°</option>)}</select></Field>
                <Field label="Custo PE" col={1}><input value={r.cost||''} onChange={e=>{const rs=[...data.rituals];rs[i]={...rs[i],cost:e.target.value};set('rituals',rs)}} className={inp}/></Field>
                <Field label="Execução" col={1}><input value={r.execution||''} onChange={e=>{const rs=[...data.rituals];rs[i]={...rs[i],execution:e.target.value};set('rituals',rs)}} placeholder="Padrão" className={inp}/></Field>
                <Field label="Alcance" col={2}><input value={r.range||''} onChange={e=>{const rs=[...data.rituals];rs[i]={...rs[i],range:e.target.value};set('rituals',rs)}} className={inp}/></Field>
                <Field label="Duração" col={2}><input value={r.duration||''} onChange={e=>{const rs=[...data.rituals];rs[i]={...rs[i],duration:e.target.value};set('rituals',rs)}} className={inp}/></Field>
                <Field label="Resistência" col={2}><input value={r.resistance||''} onChange={e=>{const rs=[...data.rituals];rs[i]={...rs[i],resistance:e.target.value};set('rituals',rs)}} className={inp}/></Field>
                <Field label="Efeito" col={6}><textarea rows={2} value={r.effect||''} onChange={e=>{const rs=[...data.rituals];rs[i]={...rs[i],effect:e.target.value};set('rituals',rs)}} className={tex}/></Field>
              </div>
              <button onClick={()=>set('rituals',data.rituals.filter((_,j)=>j!==i))} className="text-xs px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-[6px] text-red-400 hover:bg-red-500/20 transition-colors">Remover</button>
            </div>
          ))}
          <button onClick={()=>set('rituals',[...(data.rituals||[]),{name:'',circle:'1',cost:'',execution:'',range:'',duration:'',resistance:'',effect:''}])}
            className="w-full py-2 border border-dashed border-light-border-lt dark:border-dark-border-lt rounded-[7px] text-light-text-3 dark:text-dark-text-3 text-sm hover:border-brand hover:text-brand-light transition-all bg-transparent">+ Adicionar Ritual</button>
        </div>
      )}

      {tab==='bg'&&(
        <div className="p-7">
          <div className="grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
            {[['Aparência','appearance'],['Personalidade','personality'],['Histórico','background_text'],['Objetivo','objective']].map(([l,k])=>(
              <div key={k} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-light-text-3 dark:text-dark-text-3 uppercase tracking-wide">{l}</label>
                <textarea rows={4} value={data[k]||''} onChange={e=>set(k,e.target.value)} className={tex}/>
              </div>
            ))}
          </div>
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
