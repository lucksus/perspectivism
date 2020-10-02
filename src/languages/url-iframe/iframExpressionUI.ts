import type { ExpressionUI } from "../../acai/Language";
import Icon from './build/Icon.js'
import ConstructorIcon from './build/ConstructorIcon.js'

export class IframeExpressionUI implements ExpressionUI {
    icon(): string {
        return Icon
    }

    constructorIcon(): string {
        return ConstructorIcon
    }
}