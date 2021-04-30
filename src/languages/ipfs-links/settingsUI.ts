import type { SettingsUI } from "@perspect3vism/ad4m/Language";
import SettingsIcon from './build/SettingsIcon.js'

export class GunSettingsUI implements SettingsUI {
    settingsIcon(): string {
        return SettingsIcon
    }
}