import { useExampleSignetOrder } from "@/src/hooks/useExampleSignetOrder";
import Button from "../../sharedComponents/ui/Button";
import { useWeb3Status } from "@/src/hooks/useWeb3Status";
import { ConnectWalletButton } from "@/src/providers/Web3Provider";
import { sendSignedOrder } from "@/src/utils/signet";

export const Home = () => {
  const { isWalletConnected } = useWeb3Status();
  return (
    <div>{isWalletConnected ? <CreateOrder /> : <ConnectWalletButton />}</div>
  );
};

const CreateOrder = () => {
  const { createSignedOrder, signedOrder } = useExampleSignetOrder();

  return (
    <div>
      {!signedOrder ? (
        <Button
          onClick={() =>
            createSignedOrder(
              "0xdAC17F958D2ee523a2206206994597C13D831ec7",
              "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            ).then((data: any) => {
              console.log(data);
            })
          }
        >
          Create Order
        </Button>
      ) : (
        <Button
          onClick={() =>
            signedOrder &&
            sendSignedOrder(signedOrder).then((data: any) => {
              console.log(data);
            })
          }
        >
          Send to RPC
        </Button>
      )}
    </div>
  );
};
