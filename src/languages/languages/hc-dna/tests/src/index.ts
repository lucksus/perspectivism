import { Orchestrator, Config, InstallAgentsHapps, TransportConfigType } from "@holochain/tryorama";
import path from "path";

const network = {
  transport_pool: [{
    type: TransportConfigType.Quic,
  }],
  bootstrap_service: "https://bootstrap.holo.host"
}
const conductorConfig = Config.gen({network});
const languages = path.join(__dirname, "../../languages.dna.gz");
const installation: InstallAgentsHapps = [
  // agent 0
  [
    // happ 0
    [languages],
  ],
];

const ZOME = "anchored-expression"

const orchestrator = new Orchestrator();

orchestrator.registerScenario("create a code", async (s, t) => {
  const [alice] = await s.players([conductorConfig]);
  const [[anchored_expression]] = await alice.installAgentsHapps(installation);

  const agent = {
    did: "did:test:test",
    name: "Testy Tester",
    email: "tt@probing.inc"
  }

  const proof = {
    signature: "asdfasdfasdf",
    key: "did:test:test#primary"
  }

  const expression = {
    agent,
    timestamp: "now",
    data: [0,1,2],
    proof
  }

  await anchored_expression.cells[0].call(
    ZOME,
    "store_expression",
    {
        key: "test-key",
        expression
    }
  );
  

  const result = await anchored_expression.cells[0].call(
    ZOME,
    "get_expressions",
    {
      key: "test-key"
    }
  )

  t.ok(result)
  t.ok(result.expressions)
  t.equal(result.expressions.length, 1)
  t.deepEqual(result.expressions[0], expression)
});

orchestrator.run();
