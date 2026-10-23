import {createContext} from 'react'
export type DiagramState={slideId:string;open:boolean;step:number;track:number;fraction:number;playing:boolean}
export const DiagramSyncContext=createContext<{readonly?:boolean;state?:DiagramState;onChange?:(state:DiagramState)=>void}>({})
