<script lang="ts">
    import DataTable, {Body, Row, Cell} from '@smui/data-table';
    import { mutation, getClient } from "svelte-apollo";
    import { AGENT, UPDATE_AGENT_PROFILE } from './graphql_queries';
    import Textfield from '@smui/textfield'
    import Button, {Label} from '@smui/button';
    import { gql } from '@apollo/client';
    import Card, {Content, PrimaryAction, Media, MediaContent, Actions, ActionButtons, ActionIcons} from '@smui/card';
    import emailValidator from 'email-validator'
    import md5 from 'md5'

    const QGL_CLIENT = getClient()
    const M_UPDATE_AGENT_PROFILE = mutation(UPDATE_AGENT_PROFILE)

    let did = "loading..."
    let name = "loading..."
    let email = "loading..."

    function update() {
        QGL_CLIENT.query({query: AGENT}).then(result => {
            if(result.error) {
                console.error(result)
            } else {
                const agent = result.data.agent.agent
                did = agent.did
                name = agent.name ? agent.name : ""
                email = agent.email ? agent.email : ""
            }
        })
    }

    QGL_CLIENT.subscribe({
          query: gql`
              subscription {
                  agentUpdated {
                    did
                  }
              }   
          `}).subscribe({
              next: () => update(),
              error: (e) => console.error(e)
          })


    function save() {
        M_UPDATE_AGENT_PROFILE({
            variables: { name, email }
        })
    }

    update()
</script>

<Card style="width: 360px;">
    <div style="padding: 20px">
        <h2 class="mdc-typography--headline6" style="margin: 0;">Your Agent Profile</h2>
        <div class="mdc-typography--subtitle2" style="margin: 0; overflow-wrap: anywhere;">{did}</div>
    </div>
    <hr>
    <PrimaryAction>
      <Media aspectRatio="square" >
        <MediaContent>
          {#if !emailValidator.validate(email) }
            <div>Enter email for gravatar image</div>
          {:else}
            <img src="http://www.gravatar.com/avatar/{md5(email)}?s=360" alt="gravatar">
          {/if}
        </MediaContent>
      </Media>
      <Content class="mdc-typography--body2">
        <DataTable>
            <Body>
                <Row>
                    <Cell>Name:</Cell>
                    <Cell><Textfield bind:value={name} label="Name" /></Cell>
                </Row>
                <Row>
                    <Cell>Email:</Cell>
                    <Cell><Textfield bind:value={email} label="Email" /></Cell>
                </Row>
            </Body>
        </DataTable>
      </Content>
    </PrimaryAction>
    <Actions>
      <ActionButtons>
        <Button on:click={save}>
            <Label>Save</Label>
        </Button>
      </ActionButtons>
    </Actions>
  </Card>

