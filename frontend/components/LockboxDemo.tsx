"use client";

import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useLockbox } from "@/hooks/useLockbox";
import { errorNotDeployed } from "./ErrorNotDeployed";

export const LockboxDemo = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  const lockbox = useLockbox({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const buttonClass =
    "btn btn-primary rounded-xl px-6 py-3 font-semibold text-white disabled:opacity-50 disabled:pointer-events-none";

  const titleClass = "font-semibold text-lg mt-4";

  if (!isConnected) {
    return (
      <div className="mx-auto">
        <button className={buttonClass} disabled={isConnected} onClick={connect}>
          <span className="text-xl">Connect Wallet</span>
        </button>
      </div>
    );
  }

  if (lockbox.isDeployed === false) {
    return errorNotDeployed(chainId);
  }

  return (
    <div className="w-full space-y-6">
      <div className="w-full rounded-2xl bg-base-100 shadow-lg border border-base-300 p-6">
        <h1 className="text-3xl font-bold mb-2">Lockbox Notes</h1>
        <p className="text-base-content/70">
          Encrypted numeric notes stored on-chain using Zama FHEVM. Only you can decrypt your notes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        <div className="col-span-2 rounded-2xl bg-base-100 shadow-lg border border-base-300 p-6 space-y-4">
          <p className={titleClass}>Current Note</p>
          <p className="text-sm text-base-content/70">
            Active note id: <span className="font-mono font-semibold">{lockbox.activeNoteId ?? "-"}</span>
          </p>
          <p className="text-sm text-base-content/70">
            Encrypted handle: <span className="font-mono break-all">{lockbox.handle ?? "-"}</span>
          </p>
          <p className="text-sm text-base-content/70">
            Clear value: <span className="font-mono font-semibold">{lockbox.isDecrypted ? String(lockbox.clear) : "Not decrypted"}</span>
          </p>

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              className={buttonClass}
              disabled={!lockbox.canDecrypt}
              onClick={lockbox.decryptNote}
            >
              {lockbox.canDecrypt
                ? "Decrypt value"
                : lockbox.isDecrypting
                ? "Decrypting..."
                : "Nothing to decrypt"}
            </button>
            <button
              className={buttonClass}
              disabled={!lockbox.canRefresh}
              onClick={lockbox.refreshNote}
            >
              Refresh note
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-base-100 shadow-lg border border-base-300 p-6 space-y-4">
          <p className={titleClass}>Actions</p>
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Initial value</span>
            </label>
            <input
              type="number"
              className="input input-bordered w-full"
              value={lockbox.initialValueInput}
              onChange={(e) => lockbox.setInitialValueInput(e.target.value)}
            />
          </div>
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Title</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={lockbox.titleInput}
              onChange={(e) => lockbox.setTitleInput(e.target.value)}
            />
          </div>
          <button
            className={buttonClass + " w-full mt-2"}
            disabled={!lockbox.canCreate}
            onClick={lockbox.createNote}
          >
            {lockbox.isCreating ? "Creating..." : "Create encrypted note"}
          </button>

          <div className="divider" />

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Delta to add</span>
            </label>
            <input
              type="number"
              className="input input-bordered w-full"
              value={lockbox.deltaInput}
              onChange={(e) => lockbox.setDeltaInput(e.target.value)}
            />
          </div>
          <button
            className={buttonClass + " w-full mt-2"}
            disabled={!lockbox.canAdd}
            onClick={lockbox.addToNote}
          >
            {lockbox.isAdding ? "Updating..." : "Add to note"}
          </button>
        </div>
      </div>

      <div className="w-full rounded-2xl bg-base-100 shadow-lg border border-base-300 p-6">
        <p className={titleClass}>Status</p>
        <p className="text-sm text-base-content/70 mb-1">
          FHEVM: <span className="font-mono">{fhevmStatus}</span>
        </p>
        <p className="text-sm text-base-content/70 mb-1">
          Error: <span className="font-mono">{fhevmError ? String(fhevmError) : "None"}</span>
        </p>
        <p className="text-sm text-base-content/70 mb-1">
          Message: <span className="font-mono">{lockbox.message ?? ""}</span>
        </p>
      </div>
    </div>
  );
};
