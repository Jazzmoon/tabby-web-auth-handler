import { NgModule, Injectable } from '@angular/core'
import { PlatformService } from 'tabby-core'
import { TerminalDecorator, BaseTerminalTabComponent, XTermFrontend } from 'tabby-terminal'

@Injectable()
export class OpenWebAuth extends TerminalDecorator {
  constructor(
    private platform: PlatformService,
  ) {
    super()
  }

  attach(tab: BaseTerminalTabComponent<any>): void {
    console.log('attach', tab)

    this.activeKIPromptChanged(tab)

    tab.sessionChanged$.subscribe(() => {
      this.activeKIPromptChanged(tab)
    })
  }

  activeKIPromptChanged(tab: BaseTerminalTabComponent<any>): void {
    console.log('activeKIPromptChanged', tab)

    if (!(tab.frontend instanceof XTermFrontend)) {
      // not xterm
      return
    }

    if (tab.profile.options!.auth !== "keyboardInteractive") {
      // not keyboardInteractive
      return
    }

    console.log('activeKIPrompt', 'waiting')

    setTimeout(() => {
      // @ts-expect-error
      const activeKIPrompt = tab.activeKIPrompt

      if (!activeKIPrompt) {
        return
      }

      console.log('activeKIPrompt', activeKIPrompt)

      // Make sure prompt contains "Warpgate authentication:"
      if (activeKIPrompt.name.indexOf('Warpgate authentication:') === -1) {
        return
      }

      // Pull out the URL from the prompt
      const url = activeKIPrompt.name.split('URL in your browser:\n')[1].split('\n')[0]

      console.log('url', url)

      // Create a new popup window
      // @ts-expect-error
      const authPopup = new this.platform.electron.remote.BrowserWindow({
        width: 800,
        height: 900,
      })

      // Load the URL
      authPopup.loadURL(url)

      authPopup.on('closed', (e) => {
        console.log('close', e)

        activeKIPrompt.respond()
      })
    }, 1000)
  }
}

@NgModule({
  providers: [
    {
      provide: TerminalDecorator,
      useClass: OpenWebAuth,
      multi: true
    }
  ],
})
export default class MyModule { }