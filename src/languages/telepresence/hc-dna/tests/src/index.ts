import { Orchestrator, Config, InstallAgentsHapps, TransportConfigType } from "@holochain/tryorama";
import path from "path";

const network = {
  transport_pool: [{
    type: TransportConfigType.Quic,
  }],
  bootstrap_service: "https://bootstrap.holo.host"
}
const conductorConfig = Config.gen({network});
const telepresence = path.join(__dirname, "../../telepresence.dna.gz");
const installation: InstallAgentsHapps = [
  // agent 0
  [
    // happ 0
    [telepresence],
  ],
  // agent 1
  [
    // happ 0
    [telepresence],
  ],
];

const ZOME = "anchored-expression"

const orchestrator = new Orchestrator();

orchestrator.registerScenario("create a code", async (s, t) => {
  const [alice, bob] = await s.players([conductorConfig]);
  const [[alice_tp]] = await alice.installAgentsHapps(installation);
  const [[bob_tp]] = await bob.installAgentsHapps(installation);

  const [[telepresence]] = await alice.installAgentsHapps(installation);

  await telepresence.cells[0].call(
    ZOME,
    "set_online_status",
    {
        did: "did:test:1",
        status: "available",
        datetime: "2021-02-10T07:20:50.52Z"
    }
  );
  

  const result = await telepresence.cells[0].call(
    ZOME,
    "get_online_agents",
    {
      datetime: "2021-02-10T07:20:50.52Z"
    }
  )

  t.ok(result)
  t.ok(result.status)
  t.equal(result.status.length, 1)
  t.equal(result.status[0].did, "did:test:1")
  t.equal(result.status[0].status, "available")
});

orchestrator.run();
