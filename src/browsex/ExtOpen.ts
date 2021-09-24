
let shell:any;

export class ExtOpen {

    initContext(abr:any) {
        console.log('initContext', abr)
        shell = abr.electron.shell
    }

    open(location:string):Promise<void> {
        return shell.openExternal(location, {activate:true})
    }

}