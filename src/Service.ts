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

    callService(apiEndpoint:string, parameters:object, method='get') : Promise<ServiceResponse> {
        const request: any = {}
        request.method = method
        request.parameters = parameters
        request.endpoint = this.serviceRoot + apiEndpoint
        request.headers = {
            "Accept": "application/json",
            "X-TBD-Session-Id": this.sessionId
        }
        return this.app.MainApi.webSend(request).then((resp: any) => {
            // console.log(resp)
            const srvResp = new ServiceResponse()
            srvResp.code = resp.code
            srvResp.success = (resp.statusCode === 2)
            srvResp.headers = resp.headers
            if(srvResp.success) {
                // only update sessionId and report data return on success
                this.sessionId = resp.headers['X-TBD-Next-Session-Id']
                let body = resp.body
                let data
                if (body) { // if body is undefined, data is undefined
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