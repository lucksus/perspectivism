import type { SettingsUI } from "../../ad4m/Language";
import SettingsIcon from './build/SettingsIcon.js'

export class GunSettingsUI implements SettingsUI {
    settingsIcon(): string {
        return SettingsIcon
    }
}