"use client";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { useMemo, PropsWithChildren } from "react";

export default function WalletContextProvider({ children }: PropsWithChildren) {
  // Use 'localnet' as a string for compatibility
  const endpoint = useMemo(() => "https://api.devnet.solana.com", []);
  // Let wallet adapter auto-detect standard wallets
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
