

import * as credAppleSSO from "/Users/sohmert/tbd/credentials/appleSSO"

let appleID:any;

export function installAppleApi() {
    return new Promise(resolve => {
        if(typeof window !== 'undefined') {
            const scriptTag = window.document.createElement('script')
            scriptTag.type = 'text/javascript'
            scriptTag.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
            const onLoad = () => {
                scriptTag.removeEventListener('load', onLoad)
                const win:any = window
                appleID = win.AppleID
                console.log('loaded script and resolving AppleID as ', appleID)
                resolve(appleID)
            }
            scriptTag.addEventListener('load', onLoad)
            window.document.head.appendChild(scriptTag)
        } else {
            console.error('Window is not defined')
            resolve(null) // error
        }
    })
}
export function init() {
    appleID.auth.init({
        clientId: credAppleSSO.clientID,
        scope: 'name email',
        redirectURI: credAppleSSO.redirect_uri,
        state: 'sso init',
        nonce: credAppleSSO.nonce
    })
}