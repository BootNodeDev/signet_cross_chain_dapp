import Eth from "@/src/components/pageComponents/home/Examples/demos/assets/Eth";
import Optimism from "@/src/components/pageComponents/home/Examples/demos/assets/Optimism";
import BaseSwitchNetwork, {
  type Networks,
} from "@/src/components/sharedComponents/SwitchNetwork";
import { useWeb3Status } from "@/src/hooks/useWeb3Status";
import { ConnectWalletButton } from "@/src/providers/Web3Provider";
import { holeskyPecorino, signetPecorino } from "@/src/lib/networks.config";

const SwitchNetwork = () => {
  const { isWalletConnected } = useWeb3Status();
  const networks: Networks = [
    {
      icon: <Eth />,
      id: signetPecorino.id,
      label: signetPecorino.name,
    },
    {
      icon: <Optimism />,
      id: holeskyPecorino.id,
      label: holeskyPecorino.name,
    },
  ];

  return isWalletConnected ? (
    <BaseSwitchNetwork networks={networks} />
  ) : (
    <ConnectWalletButton label="Connect to switch network" />
  );
};

export default SwitchNetwork;
