import { Injectable } from '@angular/core'
import { PlatformService } from 'tabby-core'
import { KeyboardInteractivePrompt } from 'tabby-ssh/typings/session/ssh';
import { TerminalDecorator, BaseTerminalTabComponent, XTermFrontend } from 'tabby-terminal'

interface ExtendedTerminalTabComponent extends BaseTerminalTabComponent<any> {
  _activeKIPrompt: any
  _activeKIPromptListener: boolean

  _activePopupWindow: any
  _originalLoadURL: string | null
}

@Injectable()
export class WebAuthHandlerDecorator extends TerminalDecorator {
  constructor(
    private platform: PlatformService
  ) {
    super()
  }

  log(...args: any[]) {
    console.log('%c[WebAuthHandler]', 'color: #aaa', ...args)
  }

  attach(tab: ExtendedTerminalTabComponent): void {
    // Clone the tab object so we can log it without it being mutated
    this.log('Attaching to tab', tab)

    if (!(tab.frontend instanceof XTermFrontend)) {
      // not xterm
      this.log('Detaching from tab. reason: not xterm')
      return
    }

    if (tab.profile.type !== 'ssh') {
      // not ssh
      this.log('Detaching from tab. reason: not ssh')
      return
    }

    this.createActiveKIPromptListener(tab)

    // When data is output to the terminal, remove the listener because the session has connected
    const outputListener = tab.output$.subscribe(() => {
      this.log('Detaching from tab. reason: output')
      this.removeActiveKIPromptListener(tab)
      outputListener.unsubscribe()
    })

    // When sessionChanged is emitted, create a new listener for activeKIPrompt 
    tab.sessionChanged$.subscribe(() => {
      this.sessionChanged(tab)
    })
  }

  detach(tab: ExtendedTerminalTabComponent): void {
    this.log('Detaching from tab. reason: tab closed')
    if (tab._activePopupWindow) {
      this.log('Closing popup window. reason: tab closed')
      tab._activePopupWindow.close()
    }
  }

  sessionChanged(tab: ExtendedTerminalTabComponent): void {
    if (!tab._activeKIPromptListener) {
      this.log('Creating listener for activeKIPrompt. reason: session changed')
      this.createActiveKIPromptListener(tab)

      // When data is output to the terminal, remove the listener because the session has connected
      const outputListener = tab.output$.subscribe(() => {
        this.log('Detaching from tab. reason: output')
        this.removeActiveKIPromptListener(tab)
        outputListener.unsubscribe()
      })
    }
  }

  createActiveKIPromptListener(tab: ExtendedTerminalTabComponent): void {
    this.log('Creating listener for activeKIPrompt')
    tab._activeKIPromptListener = true

    const activeKIPromptChanged = this.activeKIPromptChanged.bind(this)
    Object.defineProperty(tab, 'activeKIPrompt', {
      get: function () {
        return tab._activeKIPrompt
      },
      set: function (value) {
        if (typeof value !== 'undefined' && value !== null) {
          activeKIPromptChanged(value, tab)
        }
        tab._activeKIPrompt = value
      },
    })
  }

  removeActiveKIPromptListener(tab: ExtendedTerminalTabComponent): void {
    this.log('Removing listener for activeKIPrompt')
    tab._activeKIPromptListener = false

    // Still define the property, but don't do anything when it changes.
    Object.defineProperty(tab, 'activeKIPrompt', {
      get: function () {
        return tab._activeKIPrompt
      },
      set: function (value) {
        tab._activeKIPrompt = value
      }
    })
  }

  activeKIPromptChanged(kiPrompt: KeyboardInteractivePrompt, tab: ExtendedTerminalTabComponent): void {
    this.log('activeKIPrompt changed')
    const promptText = kiPrompt.name + kiPrompt.instruction;

    // Regular expression to match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    // Find URLs in the promptText
    const urls = promptText.match(urlRegex);

    // If there are any URLs, log them
    if (!urls) {
      this.log('ActiveKIPrompt does not contain any URLs')
    }

    // If there are multiple URLs, log them all
    if (urls.length > 1) {
      this.log('ActiveKIPrompt contains multiple URLs', urls)

      return
    }

    // If there is a popup window already open, send an alert
    if (tab._activePopupWindow) {
      this.log('ActiveKIPrompt popup window already open')

      if (tab._originalLoadURL === tab._activePopupWindow.webContents.getURL()) {
        this.log('Popup window URL has not changed. Reopening URL.')
        tab._activePopupWindow.close()
      } else {
        this.log('Popup window URL has changed. Leaving URL as is.')
        return
      }

    }

    //@ts-expect-error - Expect electron to be avaiable but not provided by types
    tab._activePopupWindow = new this.platform.electron.BrowserWindow({
      width: 800,
      height: 900,
    })
    tab._activePopupWindow.loadURL(urls[0])
    tab._originalLoadURL = urls[0]

    tab._activePopupWindow.on('closed', () => {
      this.log('authPopup closed')
      tab._activePopupWindow = null
      // Respond to the prompt if asked "Press Enter when done: "

      // Automatically respond to the prompt if it asks "Press Enter when done: "
      // Warpgate asks this question when using the "Browser Authentication" feature
      if (kiPrompt.prompts[0].prompt === 'Press Enter when done: ') {
        kiPrompt.respond()
      }
    })
  }
}