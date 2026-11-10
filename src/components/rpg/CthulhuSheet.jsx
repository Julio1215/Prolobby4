import { useState } from 'react'

const ATRIBUTOS = [
  {key:'str',label:'FOR',full:'Força'},{key:'dex',label:'DES',full:'Destreza'},
  {key:'pow',label:'POD',full:'Poder'},{key:'con',label:'CON',full:'Constituição'},
  {key:'app',label:'APA',full:'Aparência'},{key:'edu',label:'EDU',full:'Educação'},
  {key:'siz',label:'TAM',full:'Tamanho'},{key:'int',label:'INT',full:'Inteligência'},
]
const PERICIAS = [
  {key:'antropologia',label:'Antropologia',base:1},{key:'armasFogo',label:'Armas de Fogo (Pist.)',base:20},
  {key:'armasRifle',label:'Armas de Fogo (Rifle)',base:25},{key:'arqueologia',label:'Arqueologia',base:1},
  {key:'arremessar',label:'Arremessar',base:20},{key:'arteOficio',label:'Arte/Ofício',base:5},
  {key:'avaliacao',label:'Avaliação',base:5},{key:'cavalgar',label:'Cavalgar',base:5},
  {key:'charme',label:'Charme',base:15},{key:'chaveiro',label:'Chaveiro',base:1},
  {key:'ciencia',label:'Ciência',base:1},{key:'consertosElet',label:'Consertos Elétricos',base:10},
  {key:'consertosMec',label:'Consertos Mecânicos',base:5},{key:'contabilidade',label:'Contabilidade',base:5},
  {key:'direito',label:'Direito',base:5},{key:'dirigirAuto',label:'Dirigir Auto',base:20},
  {key:'disfarce',label:'Disfarce',base:5},{key:'encontrar',label:'Encontrar',base:25},
  {key:'escutar',label:'Escutar',base:20},{key:'escalar',label:'Escalar',base:20},
  {key:'esquivar',label:'Esquivar',base:null},{key:'furtividade',label:'Furtividade',base:20},
  {key:'historia',label:'História',base:5},{key:'intimidacao',label:'Intimidação',base:15},
  {key:'labia',label:'Lábia',base:5},{key:'linguaNatural',label:'Língua Natural',base:null},
  {key:'linguaOutra',label:'Língua (Outra)',base:1},{key:'lutarBrigar',label:'Lutar (Brigar)',base:25},
  {key:'medicina',label:'Medicina',base:1},{key:'mythosCthulhu',label:'Mythos de Cthulhu',base:0},
  {key:'mundoNatural',label:'Mundo Natural',base:10},{key:'natacao',label:'Natação',base:20},
  {key:'navegacao',label:'Navegação',base:10},{key:'nivelCredito',label:'Nível de Crédito',base:0},
  {key:'ocultismo',label:'Ocultismo',base:5},{key:'operMaquinario',label:'Operar Maquinário',base:1},
  {key:'persuasao',label:'Persuasão',base:10},{key:'pilotar',label:'Pilotar',base:1},
  {key:'prestidigitacao',label:'Prestidigitação',base:10},{key:'primeirosSoc',label:'Primeiros Socorros',base:30},
  {key:'psicanalise',label:'Psicanálise',base:1},{key:'psicologia',label:'Psicologia',base:10},
  {key:'saltar',label:'Saltar',base:20},{key:'rastrear',label:'Rastrear',base:10},
  {key:'sobrevivencia',label:'Sobrevivência',base:10},{key:'usarBiblioteca',label:'Usar Biblioteca',base:20},
]
const defaultData = {
  info:{characterName:'',playerName:'',occupation:'',age:'',gender:'',residence:'',birthplace:''},
  abilities:{str:50,dex:50,pow:50,con:50,app:50,edu:60,siz:50,int:60},
  combat:{maxHp:10,currentHp:10,maxSanity:50,sanity:50,luck:50,magicPoints:10,damageBonus:'',build:0,dodge:25},
  attacks:[{name:'',regular:'',hard:'',extreme:'',damage:''},{name:'',regular:'',hard:'',extreme:'',damage:''}],
  skills:{},
  description:'',characteristics:'',ideologies:'',injuries:'',significantPeople:'',
  phobiasManias:'',importantPlaces:'',arcaneTomes:'',cherished:'',strangeEncounters:'',
  equipment:'',wealth:'',spendingLevel:'',cash:'',
}

const inp = "w-full px-3 py-2 bg-light-secondary dark:bg-dark-secondary border border-light-border dark:border-dark-border rounded-[7px] text-light-text-1 dark:text-dark-text-1 text-sm focus:border-brand outline-none transition-colors"
const tex = `${inp} resize-y leading-relaxed`
const sT  = "text-xs font-bold uppercase tracking-widest text-brand-light border-b border-light-border dark:border-dark-border pb-2 mb-4"

function Field({label,children,col}){
  return (
    <div className="flex flex-col gap-1" style={col?{gridColumn:`span ${col}`}:{}}>
      {label && <label className="text-[11px] font-semibold text-light-text-3 dark:text-dark-text-3 uppercase tracking-wide">{label}</label>}
      {children}
    </div>
  )
}

export default function CthulhuSheet({initialData,onSave,saving,characterId,shareToken}){
  const [data,setData]       = useState(()=>({...defaultData,...initialData}))
  const [isPublic,setIsPublic] = useState(!!shareToken)
  const [tab,setTab]         = useState('main')
  const [msg,setMsg]         = useState('')

  const set=(path,value)=>{setData(prev=>{const keys=path.split('.'),next={...prev};let cur=next;for(let i=0;i<keys.length-1;i++){cur[keys[i]]={...cur[keys[i]]};cur=cur[keys[i]]};cur[keys[keys.length-1]]=value;return next})}
  const setSkill=(key,value)=>setData(prev=>({...prev,skills:{...prev.skills,[key]:value}}))
  const onN=(path)=>(e)=>set(path,e.target.value)
  const onB=(path,fb,mn,mx)=>(e)=>{let n=parseInt(e.target.value);if(isNaN(n))n=fb;if(mn!==undefined)n=Math.max(mn,n);if(mx!==undefined)n=Math.min(mx,n);set(path,n)}

  const calcDerived=()=>{
    const str=parseInt(data.abilities.str)||50,siz=parseInt(data.abilities.siz)||50
    const con=parseInt(data.abilities.con)||50,pow=parseInt(data.abilities.pow)||50,dex=parseInt(data.abilities.dex)||50
    const sum=str+siz; let db=''
    if(sum<=64)db='-2';else if(sum<=84)db='-1';else if(sum<=124)db='0';else if(sum<=164)db='+1d4';else if(sum<=204)db='+1d6';else db='+2d6'
    return{db,hp:Math.floor((con+siz)/10),mp:Math.floor(pow/5),san:pow,dodge:Math.floor(dex/2)}
  }
  const dv=calcDerived()

  const handleExportPdf=()=>{
    setMsg('Exportar PDF precisa de servidor — não disponível nesta versão só de frontend.')
    setTimeout(()=>setMsg(''),4000)
  }

  const shareLink=shareToken?`${window.location.origin}/rpg/share/${shareToken}`:null
  const copyLink=()=>{if(shareLink){navigator.clipboard.writeText(shareLink);setMsg('Link copiado!');setTimeout(()=>setMsg(''),2000)}}

  const tabs=[{key:'main',label:'📋 Principal'},{key:'combat',label:'⚔️ Combate'},{key:'skills',label:'🎯 Perícias'},{key:'bg',label:'📖 Histórico'}]
  const tabCls=(k)=>`px-4 py-3.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-all ${tab===k?'text-brand-light border-brand':'text-light-text-2 dark:text-dark-text-2 border-transparent hover:text-light-text-1 dark:hover:text-dark-text-1'}`

  return(
    <div className="flex flex-col bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-app-lg overflow-hidden">
      <div className="flex bg-light-secondary dark:bg-dark-secondary border-b border-light-border dark:border-dark-border overflow-x-auto">
        {tabs.map(t=><button key={t.key} className={tabCls(t.key)} onClick={()=>setTab(t.key)}>{t.label}</button>)}
      </div>

      {tab==='main'&&(
        <div className="p-7">
          <h2 className={sT}>Investigador — Década de 1920</h2>
          <div className="grid grid-cols-6 gap-3 mb-7 max-sm:grid-cols-1">
            <Field label="Nome" col={3}><input value={data.info.characterName} onChange={e=>set('info.characterName',e.target.value)} placeholder="Nome do investigador" className={inp}/></Field>
            <Field label="Jogador" col={3}><input value={data.info.playerName} onChange={e=>set('info.playerName',e.target.value)} className={inp}/></Field>
            <Field label="Ocupação" col={3}><input value={data.info.occupation} onChange={e=>set('info.occupation',e.target.value)} placeholder="Ex: Detetive Particular" className={inp}/></Field>
            <Field label="Idade" col={1}><input value={data.info.age} onChange={e=>set('info.age',e.target.value)} className={inp}/></Field>
            <Field label="Sexo" col={2}><input value={data.info.gender} onChange={e=>set('info.gender',e.target.value)} className={inp}/></Field>
            <Field label="Residência" col={3}><input value={data.info.residence} onChange={e=>set('info.residence',e.target.value)} placeholder="Ex: Arkham, MA" className={inp}/></Field>
            <Field label="Nascimento" col={3}><input value={data.info.birthplace} onChange={e=>set('info.birthplace',e.target.value)} className={inp}/></Field>
          </div>
          <h2 className={sT}>Características</h2>
          <div className="grid grid-cols-4 gap-3 mb-5 max-sm:grid-cols-2">
            {ATRIBUTOS.map(ab=>(
              <div key={ab.key} className="flex flex-col items-center gap-1 p-3 bg-light-secondary dark:bg-dark-secondary border border-light-border dark:border-dark-border rounded-app text-center">
                <span className="text-[11px] font-bold text-brand-light tracking-widest">{ab.label}</span>
                <span className="text-sm font-bold text-light-text-1 dark:text-dark-text-1">{Math.floor((data.abilities[ab.key]||50)/2)}</span>
                <input type="number" min="1" max="99" value={data.abilities[ab.key]??50} onChange={onN(`abilities.${ab.key}`)} onBlur={onB(`abilities.${ab.key}`,50,1,99)}
                  className="w-[52px] px-1 py-1 text-sm text-center bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-[6px] text-light-text-2 dark:text-dark-text-2 focus:border-brand outline-none"/>
                <span className="text-[10px] text-light-text-3 dark:text-dark-text-3">{ab.full}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4 p-3.5 bg-brand/10 border border-brand/30 rounded-app mb-7">
            {[['HP Base',dv.hp],['PM Base',dv.mp],['SAN Base',dv.san],['Bônus de Dano',dv.db]].map(([l,v])=>(
              <span key={l} className="flex items-center gap-2"><span className="text-sm text-light-text-2 dark:text-dark-text-2">{l}</span><span className="text-xl font-extrabold text-brand-light">{v}</span></span>
            ))}
          </div>
          <h2 className={sT}>Armas</h2>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 text-[11px] font-bold text-light-text-3 dark:text-dark-text-3 uppercase tracking-wide px-1 max-sm:hidden">
              <span>Arma</span><span>Regular</span><span>Difícil</span><span>Extremo</span><span>Dano</span>
            </div>
            {data.attacks.map((atk,i)=>(
              <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 max-sm:grid-cols-1">
                {['name','regular','hard','extreme','damage'].map(f=>(
                  <input key={f} value={atk[f]||''} onChange={e=>{const a=[...data.attacks];a[i]={...a[i],[f]:e.target.value};set('attacks',a)}}
                    placeholder={f==='name'?'Ex: .38 Revólver':f==='damage'?'1d8+db':''} className={`${inp} min-w-0`}/>
                ))}
              </div>
            ))}
            <button onClick={()=>set('attacks',[...data.attacks,{name:'',regular:'',hard:'',extreme:'',damage:''}])}
              className="py-2 bg-transparent border border-dashed border-light-border-lt dark:border-dark-border-lt rounded-[7px] text-light-text-3 dark:text-dark-text-3 text-sm hover:border-brand hover:text-brand-light transition-all mt-1">+ Adicionar arma</button>
          </div>
        </div>
      )}

      {tab==='combat'&&(
        <div className="p-7">
          <h2 className={sT}>Pontos de Vida e Sanidade</h2>
          <div className="grid grid-cols-4 gap-3 mb-3 max-sm:grid-cols-2">
            {[['HP Máximo','combat.maxHp',10],['HP Atual','combat.currentHp',10],['Sanidade Máx','combat.maxSanity',50],['Sanidade Atual','combat.sanity',50]].map(([l,p,fb])=>(
              <div key={p} className="flex flex-col gap-1.5"><label className="text-[11px] font-bold text-light-text-3 dark:text-dark-text-3 uppercase">{l}</label>
              <input type="number" value={data.combat[p.split('.')[1]]??fb} onChange={onN(p)} onBlur={onB(p,fb)} className={`${inp} text-center`}/></div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-3 mb-7 max-sm:grid-cols-2">
            {[['Sorte','combat.luck',50],['Pts de Magia','combat.magicPoints',10]].map(([l,p,fb])=>(
              <div key={p} className="flex flex-col gap-1.5"><label className="text-[11px] font-bold text-light-text-3 dark:text-dark-text-3 uppercase">{l}</label>
              <input type="number" value={data.combat[p.split('.')[1]]??fb} onChange={onN(p)} onBlur={onB(p,fb)} className={`${inp} text-center`}/></div>
            ))}
            <div className="flex flex-col gap-1.5"><label className="text-[11px] font-bold text-light-text-3 dark:text-dark-text-3 uppercase">Bônus de Dano</label>
            <input value={data.combat.damageBonus} onChange={e=>set('combat.damageBonus',e.target.value)} placeholder={dv.db} className={inp}/></div>
            <div className="flex flex-col gap-1.5"><label className="text-[11px] font-bold text-light-text-3 dark:text-dark-text-3 uppercase">Esquiva</label>
            <input type="number" value={data.combat.dodge} onChange={onN('combat.dodge')} onBlur={e=>{let n=parseInt(e.target.value);if(isNaN(n))n=dv.dodge;set('combat.dodge',n)}} className={`${inp} text-center`}/></div>
          </div>
          <h2 className={sT}>Equipamento e Riqueza</h2>
          <div className="grid grid-cols-6 gap-3 max-sm:grid-cols-1">
            <Field label="Equipamentos" col={4}><textarea rows={6} value={data.equipment} onChange={e=>set('equipment',e.target.value)} placeholder="Liste seus equipamentos..." className={tex}/></Field>
            <Field label="Nível de Gastos" col={2}><input value={data.spendingLevel} onChange={e=>set('spendingLevel',e.target.value)} placeholder="Ex: Padrão" className={inp}/></Field>
            <Field label="Dinheiro em Mãos" col={2}><input value={data.cash} onChange={e=>set('cash',e.target.value)} className={inp}/></Field>
            <Field label="Patrimônio" col={2}><input value={data.wealth} onChange={e=>set('wealth',e.target.value)} className={inp}/></Field>
          </div>
        </div>
      )}

      {tab==='skills'&&(
        <div className="p-7">
          <h2 className={sT}>Perícias do Investigador</h2>
          <p className="text-xs text-light-text-3 dark:text-dark-text-3 mb-3.5">Digite o valor total. Metade e quinto calculados automaticamente.</p>
          <div className="grid grid-cols-2 gap-1.5 max-sm:grid-cols-1">
            {PERICIAS.map(p=>{
              const val=parseInt(data.skills[p.key])||(p.base||0),half=Math.floor(val/2),fifth=Math.floor(val/5)
              return(
                <div key={p.key} className="flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] bg-light-secondary dark:bg-dark-secondary text-[13px]">
                  <input type="number" min="0" max="99" value={data.skills[p.key]!==undefined?data.skills[p.key]:(p.base||'')}
                    onChange={e=>setSkill(p.key,e.target.value)} onBlur={e=>{let n=parseInt(e.target.value);if(isNaN(n))n=p.base||0;setSkill(p.key,Math.max(0,Math.min(99,n)))}}
                    className="w-12 px-1.5 py-1 text-center text-[13px] font-bold text-brand-light bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-[5px] focus:border-brand outline-none"/>
                  <span className="flex-1 text-light-text-1 dark:text-dark-text-1">{p.label}</span>
                  <span className="text-[11px] text-light-text-3 dark:text-dark-text-3">{half}/{fifth}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab==='bg'&&(
        <div className="p-7">
          <h2 className={sT}>Antecedentes</h2>
          <div className="grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
            {[['Descrição Pessoal','description','Como é fisicamente...'],['Características','characteristics','Traços marcantes...'],['Ideologias e Crenças','ideologies',''],['Ferimentos e Cicatrizes','injuries',''],['Pessoas Significativas','significantPeople',''],['Fobias e Manias','phobiasManias',''],['Locais Importantes','importantPlaces',''],['Tomos Arcanos e Feitiços','arcaneTomes',''],['Pertences Queridos','cherished',''],['Encontros com Entidades','strangeEncounters','']].map(([l,k,ph])=>(
              <div key={k} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-light-text-3 dark:text-dark-text-3 uppercase tracking-wide">{l}</label>
                <textarea rows={3} value={data[k]} onChange={e=>set(k,e.target.value)} placeholder={ph} className={tex}/>
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
        {shareLink&&<button onClick={copyLink} className="px-4 py-2.5 border border-brand rounded-app text-brand-light text-sm font-medium hover:bg-brand/10 transition-colors">🔗 Copiar link</button>}
        <button onClick={handleExportPdf} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-60 rounded-app text-white text-sm font-semibold transition-colors">📄 Exportar PDF</button>
        <button onClick={()=>onSave(data,isPublic)} disabled={saving} className="px-7 py-2.5 bg-brand hover:bg-brand-light disabled:opacity-60 rounded-app text-white text-sm font-semibold transition-colors">{saving?'Salvando...':'💾 Salvar'}</button>
      </div>
    </div>
  )
}
