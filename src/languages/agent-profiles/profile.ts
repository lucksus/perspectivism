import type LanguageContext from "@perspect3vism/ad4m-language-context/LanguageContext"
import type Agent from "@perspect3vism/ad4m/Agent"
import type Expression from "@perspect3vism/ad4m/Expression"

export const PERSPECTIVISM_PROFILE = "PERSPECTIVISM_PROFILE"

export function agentFromExpression(expr: Expression): Promise<Agent|void> {
    if(!expr) {
        return null
    }

    if(!expr.data) {
        return null
    }

    if(!expr.data['profile']) {
        return null
    }

    if(!expr.data['profile'][PERSPECTIVISM_PROFILE]) {
        return null
    }

    const agent = JSON.parse(expr.data['profile'][PERSPECTIVISM_PROFILE])
    return agent
}

export function profileExpressionFromAgent(agent: Agent, context: LanguageContext) {
    const profile = { PERSPECTIVISM_PROFILE: JSON.stringify(agent)}
    const signed_agent = agent.did

    const expression = context.agent.createSignedExpression({
        signed_agent,
        profile,
        '@context': {}
    })
    
    return expression
}