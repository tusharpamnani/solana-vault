"use client";
import { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import vaultIdl from "@/utils/idl/vault.json";

const WalletButtonClient = dynamic(() => import("@/components/WalletButtonClient"), { ssr: false });

const PROGRAM_ID = new PublicKey(vaultIdl.address);

function getPDAs(user: PublicKey) {
  const [vaultStatePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("state"), user.toBytes()],
    PROGRAM_ID
  );
  const [vaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), vaultStatePDA.toBytes()],
    PROGRAM_ID
  );
  return { vaultStatePDA, vaultPDA };
}

function truncate(str: string, n = 12) {
  if (!str) return "";
  if (str.length <= n * 2 + 3) return str;
  return str.slice(0, n) + "..." + str.slice(-n);
}

export default function Home() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected } = useWallet();
  const [provider, setProvider] = useState<anchor.AnchorProvider | null>(null);
  const [program, setProgram] = useState<anchor.Program | null>(null);
  const [vaultBalance, setVaultBalance] = useState<number | null>(null);
  const [vaultInitialized, setVaultInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(0.1);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!publicKey) return;
    const anchorProvider = new anchor.AnchorProvider(
      connection,
      // @ts-ignore
      { publicKey, signTransaction },
      { preflightCommitment: "processed" }
    );
    setProvider(anchorProvider);
    setProgram(
      new anchor.Program(vaultIdl as anchor.Idl, anchorProvider)
    );
  }, [publicKey, connection, signTransaction]);

  const fetchVaultState = async () => {
    if (!publicKey) return;
    const { vaultStatePDA, vaultPDA } = getPDAs(publicKey);
    // Check if vault_state PDA exists
    const stateInfo = await connection.getAccountInfo(vaultStatePDA);
    setVaultInitialized(!!stateInfo);
    if (stateInfo) {
      const bal = await connection.getBalance(vaultPDA);
      setVaultBalance(bal / LAMPORTS_PER_SOL);
    } else {
      setVaultBalance(null);
    }
  };

  useEffect(() => {
    if (!connected) return;
    fetchVaultState(); // initial fetch
    const interval = setInterval(() => {
      fetchVaultState();
    }, 3000); // poll every 3 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [connected, publicKey]);

  // Helper to refresh state with a small delay for RPC consistency
  const refreshVaultState = async () => {
    await new Promise(res => setTimeout(res, 1000));
    await fetchVaultState();
  };

  const handleInitialize = async () => {
    if (!program || !publicKey) return;
    setLoading(true);
    setMessage("");
    const { vaultStatePDA, vaultPDA } = getPDAs(publicKey);
    try {
      const tx = await program.methods
        .initialize()
        .accounts({
          user: publicKey,
          vaultState: vaultStatePDA,
          vault: vaultPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setMessage(`✅ Vault initialized! TX: ${truncate(tx, 8)}`);
      await fetchVaultState();
    } catch (e: any) {
      if (e.message && e.message.includes('already in use')) {
        setMessage('❌ Vault already initialized for this wallet.');
      } else {
        setMessage(`❌ ${e.message || e.toString()}`);
      }
    }
    setLoading(false);
  };

  const handleDeposit = async () => {
    if (!program || !publicKey) return;
    setLoading(true);
    setMessage("");
    const { vaultStatePDA, vaultPDA } = getPDAs(publicKey);
    try {
      const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
      const tx = await program.methods
        .deposit(new anchor.BN(lamports))
        .accounts({
          user: publicKey,
          vaultState: vaultStatePDA,
          vault: vaultPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setMessage(`✅ Deposited! TX: ${truncate(tx, 8)}`);
      await fetchVaultState();
    } catch (e: any) {
      setMessage(`❌ ${e.message || e.toString()}`);
    }
    setLoading(false);
  };

  const handleWithdraw = async () => {
    if (!program || !publicKey) return;
    setLoading(true);
    setMessage("");
    const { vaultStatePDA, vaultPDA } = getPDAs(publicKey);
    try {
      const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
      const tx = await program.methods
        .withdraw(new anchor.BN(lamports))
        .accounts({
          user: publicKey,
          vaultState: vaultStatePDA,
          vault: vaultPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setMessage(`✅ Withdrawn! TX: ${truncate(tx, 8)}`);
      await fetchVaultState();
    } catch (e: any) {
      setMessage(`❌ ${e.message || e.toString()}`);
    }
    setLoading(false);
  };

  const handleClose = async () => {
    if (!program || !publicKey) return;
    setLoading(true);
    setMessage("");
    const { vaultStatePDA, vaultPDA } = getPDAs(publicKey);
    try {
      const tx = await program.methods
        .close()
        .accounts({
          user: publicKey,
          vaultState: vaultStatePDA,
          vault: vaultPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setMessage(`✅ Vault closed! TX: ${truncate(tx, 8)}`);
      await fetchVaultState();
    } catch (e: any) {
      setMessage(`❌ ${e.message || e.toString()}`);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
    <div className="w-full max-w-lg">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-4 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Solana Vault</h1>
        <p className="text-slate-400">Secure storage for your SOL tokens</p>
      </div>

      {/* Main Card */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 space-y-6">
        
        {/* Wallet Connection */}
        <div className="space-y-4">
          <WalletButtonClient className="w-full !bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 !text-white !font-semibold !py-4 !rounded-xl !transition-all !duration-200 !shadow-lg hover:!shadow-xl !border-0" />
        </div>

        {connected && (
          <>
            {/* Vault Status */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Vault Status</h3>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${vaultInitialized ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                  {vaultInitialized ? 'Active' : 'Not Initialized'}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  {vaultBalance === null ? (vaultInitialized ? "0" : "—") : vaultBalance.toFixed(4)}
                </div>
                <div className="text-slate-400 font-medium">SOL</div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              {/* Initialize Button */}
              <button
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                onClick={handleInitialize}
                disabled={loading || vaultInitialized}
              >
                {loading && !vaultInitialized ? (
                  <div className="animate-spin mr-3 w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )}
                Initialize Vault
              </button>

              {/* Amount Input & Deposit/Withdraw */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Amount (SOL)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={e => setAmount(Number(e.target.value))}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="0.1"
                      disabled={loading || !vaultInitialized}
                    />
                    <div className="absolute right-3 top-3 text-slate-400 font-medium">SOL</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    onClick={handleDeposit}
                    disabled={loading || !vaultInitialized}
                  >
                    {loading && vaultInitialized ? (
                      <div className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                    Deposit
                  </button>

                  <button
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    onClick={handleWithdraw}
                    disabled={loading || !vaultInitialized || !vaultBalance || vaultBalance <= 0}
                  >
                    {loading && vaultInitialized ? (
                      <div className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    )}
                    Withdraw
                  </button>
                </div>
              </div>

              {/* Close Vault Button */}
              <button
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                onClick={handleClose}
                disabled={loading || !vaultInitialized}
              >
                {loading && vaultInitialized ? (
                  <div className="animate-spin mr-3 w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
                Close Vault
              </button>
            </div>
          </>
        )}

        {/* Status Message */}
        {message && (
          <div className={`text-center p-4 rounded-xl border font-medium ${
            message.startsWith('✅') 
              ? 'bg-green-500/10 border-green-500/30 text-green-300' 
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-8">
        <p className="text-slate-500 text-sm">Powered by Solana • Built with Anchor</p>
      </div>
    </div>
  </main>
  );
}
