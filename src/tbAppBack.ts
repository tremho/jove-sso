

/* This is the start module that kicks off the double-sided application
In an Electron app, this forms the body of the 'main' Node process of the application.
Any extension APIs that run in the Node process must be registered here.

In a Nativescript export, this will become the startup bootstrap and API extension gateway.

*/

import {targetPlatform} from '@tremho/jove-desktop'
import {registerApp, TBBackApp, FrameworkBackContext} from "@tremho/jove-common"

class TBTestApp implements TBBackApp {

    appStart(context: FrameworkBackContext) {
        console.log('Back App Start called', Date.now())

        // put your back processes startup code here
        // register any extensions at this point
    }

    appExit(context: FrameworkBackContext) {
        console.log('Back App Exit called')
    }
}

const ourApp = new TBTestApp()
registerApp(targetPlatform, ourApp)
