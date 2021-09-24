
/* application code for main-page */
import {AppCore} from "@tremho/jove-common";

const service = 'https://tremho.com'
// const service = 'http://localhost:8081'

const appId="com.tremho.jove-sso"

let app:AppCore
export function pageStart(pApp:AppCore) {
    console.log('main page started')
    app = pApp
}
function webSendTest() {
    const request:any = {}
    request.method = 'get'
    request.endpoint = service+'/hello'
    request.headers = {"Accept":"application/json"}
    app.MainApi.webSend(request).then((resp:any) => {
        console.log(resp)
    })

}

export function runTest() {

    signInStartAndGetSiaToken().then(siaToken => {
        if(siaToken) {
            launchSignInWindow(siaToken)
        } else {
            console.error('failed to get siaToken! (are we online?)')
        }
    })
}

export function runSession() {
    app.navigateToPage('session')
}

// ================
let pollTimerId:any

function signInStartAndGetSiaToken(): Promise<string> {
    clearTimeout(pollTimerId)
    console.log('signInStartAndGetSiaToken')
    const request:any = {}
    request.method = 'get'
    request.endpoint = service+'/sign-in-start'
    request.headers = {"Accept":"application/json"}
    request.parameters = {appId}
    return app.MainApi.webSend(request).then((resp:any) => {
        console.log(resp)
        if(resp.code === 200) {
            if(typeof resp.body === 'string') resp.body = JSON.parse(resp.body) // if server sends text instead of JSON
            let {siaToken} = resp.body
            console.log('retrieved siaToken', siaToken)
            return siaToken
        }
    })
}
function launchSignInWindow(siaToken:string) {
    if(typeof window !== "undefined") {
        console.log('launching SSO window')
        const ep =service+'/sign-in?sia='+siaToken+'&appId='+appId
        app.callExtension('extopen', 'open', ep).then(() => {
            console.log('extBrowser promise resolves...')
        })

        pollTimerId = setTimeout(() => {
            console.log('first poll')
            pollProcess(siaToken)
        }, 5000)
    }
}
let pollCount = 0;
const maxPending = 30;
function pollProcess(siaToken:string) {
    clearTimeout(pollTimerId)
    console.log('polling...')
    const request:any = {}
    request.method = 'get'
    request.parameters= {appId, siaToken}
    request.endpoint = service+'/sign-in-check'
    request.headers = {"Accept":"application/json"}
    return app.MainApi.webSend(request).then((resp:any) => {
        console.log(resp)
        if(resp.code === 200) {
            if(typeof resp.body === 'string') resp.body = JSON.parse(resp.body) // if server sends text instead of JSON
            let {status, message, code, data} = resp.body
            if(status === 'pending') {
                if(++pollCount < maxPending) {
                    pollTimerId = setTimeout(() => {
                        pollProcess(siaToken)
                    }, 1000)
                    return;
                } else {
                    console.error('pollProcess Max Timeout')
                    pollCount = 0;
                }
            }
            else if(status === 'error') {
                console.error('pollProcess Error:', code, message)
            }
            else if(status === 'complete') {
                console.log('successful login transfer of data:', data)
                // now do whatever: resolving a promise seems like a good idea
                console.log('Voila!')
            }
        }
        pollTimerId = undefined
    })
}
