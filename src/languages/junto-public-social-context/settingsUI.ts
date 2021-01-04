import type { SettingsUI } from "../../acai/Language";
import SettingsIcon from './build/SettingsIcon.js'

export class JuntoSettingsUI implements SettingsUI {
    settingsIcon(): string {
        return SettingsIcon
    }
}