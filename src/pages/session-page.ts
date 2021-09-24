import {AppCore, EventData} from "@tremho/jove-common";

import {Service} from "../Service";
let service:Service
const appId = 'com.tremho.jove-sso'

// we'll use this page to run through a session and track it
// use our Service module for api exchanges
// keep local copy of session

// service getSessionInfo() will return our service data
// we'll update it with stuff (sort of like the sessionManager test does at tremho-services)
// this should stay persistent across different runs until we clear the session id (with a button)

// we can extend from there to log in, and we should then have userId in the session, so we
// should be able to get the user data and show it too

// const serviceHost = 'http://localhost:8081'
const serviceHost = 'https://tremho.com'

const description = `
This page demonstrates a maintained session using the Service module.
It also demonstrates how to handle log-in for a login-required service feature,
in this case, the 'ramble' feature.
The session is persisted in this example as well, meaning you can exit the
app and resume your session where you left off after an arbitrary amount of time.
Clearing the session or logging in as a different user will break the session
and force a new log-in to access 'ramble'.

This page is pointed at ${serviceHost}

`

const pageName = 'session-page'
let app:AppCore
export function pageStart(pApp:AppCore) {
    console.log('session page started')
    app = pApp
    if(!service) {
        service = new Service(pApp, serviceHost)
        app.setPageData(pageName, {
            sessionId: null,
            sessionData: '',
            description: description
        })
        console.log('service created')
        app.updatePage(pageName)
        restoreSession()
    }

}

function saveSession() {
    service.persist(app)
}
function restoreSession() {
    service.restore(app)
}

export function clearSession(ed:EventData) {
    service.sessionId = ''
    ed.app.setPageData(pageName, 'sessionData', '\n\n   ((Session Cleared))')
    ed.app.updatePage(pageName)
    saveSession()
}

function formatResponse(data:any) {
    if(data.data.ramble) {
        data.data.ramble = data.data.ramble.split('\n')
    }
    let str = JSON.stringify(data,null, 2)
    // str = str.replace(/\n/g, '<br/>')
    return str
}

export async function newCount(ed:EventData) {
    if(ed.app) {
        const response = await service.callService('/newCount', {appId})
        ed.app.setPageData(pageName, 'sessionData', formatResponse(response.data))
        ed.app.updatePage(pageName)
        saveSession()
    }
}
export async function newRandomNumber(ed:EventData) {
    if(ed.app) {
        const response = await service.callService('/newRandomNumber', {appId})
        ed.app.setPageData(pageName, 'sessionData', formatResponse(response.data))
        ed.app.updatePage(pageName)
        saveSession()
    }
}

export async function newRamble(ed:EventData) {
    if(ed.app) {
        const response = await service.callService('/newRamble', {appId})
        const loginRequired = (response.code == 403)
        // if response says we need to login, do that now
        if(loginRequired) {
            await login(ed, (rt:any) => {
                const {appId, userId} = rt // logged in userID is stored in session server-side now, we don't actually use it here
                newRamble(ed) // call again, now that session has a user
            })
        } else {
            ed.app.setPageData(pageName, 'sessionData', formatResponse(response.data))
            ed.app.updatePage(pageName)
            saveSession()
        }
    }
}
let loginCallback:any = null
export async function login(ed:EventData, cb?:any) {

    if(cb) loginCallback = cb

    if(ed.app) {
        const response = await service.callService('/sign-in-start', {appId})
        console.log('sign-in started')
        const {siaToken} = response.data
        if(siaToken) {
            launchSignInWindow(siaToken)
        } else {
            console.error('failed to get siaToken! (are we online?)')
        }
    }
}
function launchSignInWindow(siaToken:string) {
    if(typeof window !== "undefined") {
        console.log('launching SSO window')
        let ep = service.serviceRoot+'/sign-in?sia='+siaToken+'&appId='+appId
        app.callExtension('extopen', 'open', ep).then(() => {
            console.log('extBrowser promise resolves...')
        })

        pollTimerId = setTimeout(() => {
            console.log('first poll')
            pollProcess(siaToken)
        }, 5000)
    }
}
let pollTimerId:any
let pollCount = 0;
const maxPending = 9; // each pending poll lasts 20-seconds at server, so this is a 180 second (3 minute) wait
function pollProcess(siaToken:string) {
    clearTimeout(pollTimerId)
    console.log('polling...')
    const request:any = {}
    request.method = 'get'
    request.parameters= {appId, siaToken}
    request.endpoint = service.serviceRoot+'/sign-in-check'
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

                const userId = data.userId
                service.callService('/userSession', {appId, userId}).then((session:any)=> {
                    if(loginCallback) loginCallback({appId, userId})
                })
            }
        }
        pollTimerId = undefined
    })
}
