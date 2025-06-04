import { useExampleSignetOrder } from "@/src/hooks/useExampleSignetOrder";
import { useWeb3Status } from "@/src/hooks/useWeb3Status";
import { sendSignedOrder } from "@/src/utils/signet";
import Inner from "../../sharedComponents/ui/Inner";
import SwitchNetwork from "./SwitchNetwork";
import PrimaryButton from "../../sharedComponents/ui/PrimaryButton";

export const Home = () => {
  const { isWalletConnected } = useWeb3Status();
  return (
    <>
      <SwitchNetwork />
      <Inner>{isWalletConnected && <CreateOrder />}</Inner>
    </>
  );
};

const CreateOrder = () => {
  const { createSignedOrder, signedOrder } = useExampleSignetOrder();

  return (
    <div>
      {!signedOrder ? (
        <PrimaryButton
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
        </PrimaryButton>
      ) : (
        <PrimaryButton
          onClick={() =>
            signedOrder &&
            sendSignedOrder(signedOrder).then((data: any) => {
              console.log(data);
            })
          }
        >
          Send to RPC
        </PrimaryButton>
      )}
    </div>
  );
};
