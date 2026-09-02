import { useAccount, useConnect, useDisconnect, useEnsName } from "wagmi";
import { injected } from "wagmi/connectors";

export default function ConnectButton({ className }) {
  const { address, isConnected } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    const displayAddress = ensName
      ? ensName
      : `${address.slice(0, 6)}...${address.slice(-4)}`;

    return (
      <button
        onClick={() => disconnect()}
        className={`btn-connect ${className}`}
        title="Click to disconnect"
      >
        {displayAddress}
      </button>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      className={`btn-connect ${className}`}
    >
      CONNECT WALLET
    </button>
  );
}
