import { createConfig, http } from "wagmi";
import { coinbaseWallet } from "wagmi/connectors";
import { base } from "wagmi/chains";

const appName = "Daily Orbit";

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName
    })
  ],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org")
  },
  ssr: true
});
