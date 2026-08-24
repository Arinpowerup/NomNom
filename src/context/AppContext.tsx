import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AppData, Language } from '../types'
import { loadData, saveData } from '../lib/db'

type Value={data:AppData|null; setData:(next:AppData)=>void; language:Language; setLanguage:(v:Language)=>void; currentRoleId:string;setCurrentRoleId:(v:string)=>void}
const Context=createContext<Value|null>(null)
export function AppProvider({children}:{children:ReactNode}){ const[data,setState]=useState<AppData|null>(null); const[language,setLang]=useState<Language>(()=>(localStorage.getItem('language') as Language)||'zh'); const[currentRoleId,setRole]=useState(()=>localStorage.getItem('currentRole')||'role-me'); useEffect(()=>{loadData().then(setState)},[]); const setData=(next:AppData)=>{setState(next);void saveData(next)}; const setLanguage=(v:Language)=>{setLang(v);localStorage.setItem('language',v)}; const setCurrentRoleId=(v:string)=>{setRole(v);localStorage.setItem('currentRole',v)}; const value=useMemo(()=>({data,setData,language,setLanguage,currentRoleId,setCurrentRoleId}),[data,language,currentRoleId]); return <Context.Provider value={value}>{children}</Context.Provider> }
export function useApp(){ const value=useContext(Context); if(!value)throw new Error('Missing AppProvider'); return value }
