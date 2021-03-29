import type { SettingsUI } from "../../ad4m/Language";
import SettingsIcon from './build/SettingsIcon.js';
import type LanguageContext from '../../ad4m/LanguageContext'

export class JuntoSettingsUI implements SettingsUI {
    settingsIcon(): string {
        return SettingsIcon
    }
}