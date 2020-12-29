import type { SettingsUI } from "../../acai/Language";
import SettingsIcon from './build/SettingsIcon.js';
import type LanguageContext from '../../acai/LanguageContext'

export class JuntoSettingsUI implements SettingsUI {
    settingsIcon(): string {
        return SettingsIcon
    }
}