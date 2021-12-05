<script lang="ts">
    import { getContext } from 'svelte';
    import { Ad4mClient, Literal } from '@perspect3vism/ad4m'
    import DataTable, {Body, Row, Cell} from '@smui/data-table';
    import Textfield from '@smui/textfield'
    import Button, {Label} from '@smui/button';
    import Card, {Content, PrimaryAction, Media, MediaContent, Actions, ActionButtons, ActionIcons} from '@smui/card';
    import emailValidator from 'email-validator'
    import md5 from 'md5'

    const ad4m: Ad4mClient = getContext('ad4mClient')

    const AGENT_PERSPECTIVE_NAME = '__agent_public_perspective'

    let did = "loading..."
    let firstName = "loading..."
    let lastName = "loading..."
    let email = "loading..."

    let agentPerspective

    async function populateUiFromPerspective() {
      try {
        firstName = Literal.fromUrl(await agentPerspective.getSingleTarget({source: did, predicate: 'foaf://givenName'})).get()
      }catch(e) {
        firstName = "<not set>"
      }

      try {
        lastName = Literal.fromUrl(await agentPerspective.getSingleTarget({source: did, predicate: 'foaf://familyName'})).get()
      }catch(e) {
        lastName = "<not set>"
      }

      try {
        email = Literal.fromUrl(await agentPerspective.getSingleTarget({source: did, predicate: 'foaf://mbox'})).get()
      }catch(e) {
        email = "<not set>"
      }
    }

    async function init() {
      const me = await ad4m.agent.me()
      did = me.did
      const allPerspectives = await ad4m.perspective.all()
      console.log("ALL Perspectives:", allPerspectives)
      agentPerspective = allPerspectives.find(p => p.name === AGENT_PERSPECTIVE_NAME)
      if(!agentPerspective) {
        agentPerspective = await ad4m.perspective.add(AGENT_PERSPECTIVE_NAME)
        agentPerspective.loadSnapshot(me.perspective)
      }

      await populateUiFromPerspective()

      //await ad4m.agent.addUpdatedListener(populateUiFromPerspective)

    }

    async function save() {
      await agentPerspective.setSingleTarget({source: did, predicate: 'foaf://givenName', target: Literal.from(firstName).toUrl()})
      await agentPerspective.setSingleTarget({source: did, predicate: 'foaf://familyName', target: Literal.from(lastName).toUrl()})
      await agentPerspective.setSingleTarget({source: did, predicate: 'foaf://mbox', target: Literal.from(email).toUrl()})
    }

    async function publish() {
      const snapshot = await agentPerspective.snapshot()
      console.log("Publishing perspective: ", snapshot)
      await ad4m.agent.updatePublicPerspective(snapshot)
    }

    init()
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
                    <Cell>First name:</Cell>
                    <Cell><Textfield bind:value={firstName} label="First name" /></Cell>
                </Row>
                <Row>
                  <Cell>Last name:</Cell>
                  <Cell><Textfield bind:value={lastName} label="Last name" /></Cell>
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
        <Button on:click={publish}>
          <Label>Publish</Label>
      </Button>
      </ActionButtons>
    </Actions>
  </Card>


  