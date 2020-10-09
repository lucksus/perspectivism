import type { SettingsUI } from "../../acai/Language";
import SettingsIcon from './build/SettingsIcon.js'

export class GunSettingsUI implements SettingsUI {
    settingsIcon(): string {
        return SettingsIcon
    }
}