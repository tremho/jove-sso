
import {ExtOpen} from "./ExtOpen";

export const extensionInfo = {
    name: 'ExtOpen',
    version: '1.0.0'
}

let thisOpen:ExtOpen

export function initContext(abr:any, fbc:any) {
    if(!thisOpen) {
        thisOpen = new ExtOpen()
    }
    return thisOpen.initContext(abr, fbc)
}

export function open(location:string) {
    return thisOpen.open(location)
}
