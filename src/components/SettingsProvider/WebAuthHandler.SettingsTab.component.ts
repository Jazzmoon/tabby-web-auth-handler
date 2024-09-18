import { Component } from '@angular/core'
import { PlatformService } from 'tabby-core'

/** @hidden */
@Component({
    template: require('./WebAuthHandler.SettingsTab.component.pug'),
})
export class WebAuthHandlerSettingsTabComponent {
    constructor(
        private platform: PlatformService
    ) { }

    openBrowser() {
        //@ts-expect-error - Expect electron to be avaiable but not provided by types
        const win = new this.platform.electron.BrowserWindow({
            width: 800,
            height: 900
        })

        // Pull the url from the input field
        let url = (document.getElementById('wah-url') as HTMLInputElement).value || 'https://google.com'

        // If the url does not contain a protocol, add https://
        if (!url.includes('://')) {
            url = 'https://' + url
        }

        // Load the url in the popup window
        win.loadURL(url)
    }
}