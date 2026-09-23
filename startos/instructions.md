# LDK Node

LDK Node runs a Lightning node built on the Lightning Dev Kit, using your Bitcoin node for the
chain. You manage it from a web dashboard, which also has an assistant you can ask about the node.

## Before you start

- Bitcoin must be installed, running and fully synced.
- After installing, run the **Set Admin Password** task. It shows the dashboard's username and
  password once: save them in your password manager. Run the action again at any time to replace
  the password.

## Using the dashboard

1. Start the service and wait for **Web Interface** to report ready. The first start creates
   the wallet and can take several minutes.
2. Open the **Dashboard** interface and sign in with the username and password from the action.
3. The dashboard connects to the node on its own. From there you can fund the on-chain wallet,
   open channels, and send and receive payments.

To use the assistant, open it from the dashboard and sign in to an AI provider from its panel.
Your sign-ins stay on this server.

## Backups — read this

StartOS backups keep the node's **seed**, not its **channel state**. Restoring an old copy of the
channel state can lose the money in those channels, so it is left out on purpose. If you restore
from a backup, the node comes back with its on-chain wallet but no channels; your peers close the
old channels and that money returns to the on-chain wallet once the closes confirm (a peer that is
offline can delay this by days).

## Limitations

- Mainnet only.
- No Tor yet: the node cannot connect to `.onion`-only peers, and it does not announce an address,
  so other nodes cannot find it to open channels to you. Open channels from your side.
