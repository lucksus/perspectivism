import type { ExpressionUI as ExpressionUIInterface } from "../../acai/Language";
import Icon from './build/Icon.js'
import ConstructorIcon from './build/ConstructorIcon.js'

export class ExpressionUI implements ExpressionUIInterface {
    icon(): string {
        return Icon
    }

    constructorIcon(): string {
        return ConstructorIcon
    }
}