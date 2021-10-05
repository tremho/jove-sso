
let opener:any;

export class ExtOpen {

    initContext(injections:any, fbc:any) {
        console.log('initContext', injections, fbc)
        opener = injections && injections.electron && injections.electron.shell && injections.electron.shell.openExternal
        if(!opener) {
            if (injections && injections.nscore && injections.nscore.Utils) {
                opener = injections.nscore.Utils.openUrl
            }
        }
    }

    open(location:string):Promise<void> {
        return opener && opener(location, {activate:true})
    }

}