import { NgModule } from '@angular/core'
import { TerminalDecorator } from 'tabby-terminal'
import { SettingsTabProvider } from 'tabby-settings'

import { WebAuthHandlerDecorator } from 'components/WebAuthHandler.TerminalDecorator'
import { WebAuthHandlerSettingsTabProvider } from 'components/SettingsProvider/WebAuthHandler.SettingsProvider'

@NgModule({
  providers: [
    {
      provide: TerminalDecorator,
      useClass: WebAuthHandlerDecorator,
      multi: true
    },
    {
      provide: SettingsTabProvider,
      useClass: WebAuthHandlerSettingsTabProvider,
      multi: true
    }
  ],
})
export default class MyModule { }