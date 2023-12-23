import { Injectable } from '@angular/core'
import { SettingsTabProvider } from 'tabby-settings'

import { WebAuthHandlerSettingsTabComponent } from './WebAuthHandler.SettingsTab.component'

/** @hidden */
@Injectable()
export class WebAuthHandlerSettingsTabProvider extends SettingsTabProvider {
  id = 'web-auth-handler'
  icon = 'lock'
  title = 'Web Auth Handler'

  getComponentType(): any {
    return WebAuthHandlerSettingsTabComponent
  }
}