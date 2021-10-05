/**
 * encapsulates data returned from a service call.
 * success will be true if response statusType is Ok.
 * code will hold the actual status code returned.
 * The property `data`, if present, will always be an object.
 * It will not be present if no data was returned in the body.
 * if raw service response did not form a JSON object, then
 * the value will be found in data.default.
 * data will not be present if success is false.
 *
 * so a caller can test for data before proceeding without
 * necessarily checking for other error conditions unless those
 * are relevant.
 *
 */
import {AppCore} from "@tremho/jove-common";

export class ServiceResponse {
    code:number = 0
    success: boolean = false
    headers:object = {}
    data?:any
}

/**
 * Instantiates a service handler for a given domain
 * Maintains the session exchange with that server
 *
 */
export class Service {
    serviceRoot:string = ''
    sessionId:string = ''
    app:any

    constructor(app:any, service?:string) {
        this.app = app
        if(service) this.serviceRoot = service
    }

    callService(apiEndpoint:string, parameters:object = {}, method='get') : Promise<ServiceResponse> {
        const request: any = {}
        request.method = method
        request.parameters = parameters
        request.endpoint = this.serviceRoot + apiEndpoint
        request.headers = {
            "Accept": "application/json",
            "x-tbd-session-id": this.sessionId
        }
        return this.app.MainApi.webSend(request).then((resp: any) => {
            // console.log(resp)
            const srvResp = new ServiceResponse()
            srvResp.code = resp.code
            srvResp.success = (resp.statusType === 2)
            srvResp.headers = resp.headers
            if(srvResp.success) {
                // only update sessionId and report data return on success
                this.sessionId = resp.headers['x-tbd-next-session-id']
                let body = resp.body
                let data
                if (body) { // if body is undefined, data is undefined
                    if(typeof body.toString === 'function') {
                        // response from NS has some extraction functions
                        try {
                            body = body.toString()
                        } catch(e) {
                            console.error(`Parsing response body from ${request.endpoint}`, e)
                        }
                    }
                    if (typeof body === 'object') {
                        data = body                         // js Object expected
                    } else {
                        try {
                            data = JSON.parse(body)         // otherwise, parse it into one
                        } catch (e) {
                            data = {default: body}          // if that fails, data default is the value returned
                        }
                    }
                }
                srvResp.data = data
            }
            return srvResp
        })
    }

    /**
     * Saves the session in a file named '.session' in the current directory

     * @param {AppCore} app The application doing the persist
     */
    persist(app:AppCore) {
        app.MainApi.writeFileText('.session', JSON.stringify(this.toPersist()))

    }

    /**
     * Restores a session where it last left off when persist was called
     * This can restore a session after an indeterminate and unbounded amount of time
     * It is up to the app to determine sensible timeouts for invalid data within a session,
     * such as when to require a refreshed login.
     *
     * @param {AppCore} app The application doing the restore
     */
    restore(app:AppCore) {
        app.MainApi.readFileText('.session').then((pstr:string) => {
            let pst:any = {}
            try {
                if(pstr) {
                    pst = JSON.parse(pstr)
                }
            } catch(e) {
            }
            if(pst.name === 'Service') {
                if(pst.serviceRoot === this.serviceRoot) {
                    this.sessionId = pst.sessionId
                }
            }
        })
    }

    /**
     * Encapsulate into a persistable object that keeps our session id
     */
    toPersist() {
        const pst:any = {}
        pst.name = 'Service'
        pst.serviceRoot = this.serviceRoot
        pst.sessionId = this.sessionId
        return pst
    }

    /**
     * Restore from a persisted object to resume a session.
     * can also start a new one if pst is undefined
     *
     * @param app - our app instance
     * @param pst - the persisted saved service object
     * @param altRoot - the serviceRoot if pst is undefined.
     */
    static fromPersist(app:any, pst:any, altRoot:string) : Service {
        const sr = (pst && pst.serviceRoot) || altRoot
        const srv = new Service(app, sr)
        srv.sessionId = pst.sessionId
        return srv
    }
}