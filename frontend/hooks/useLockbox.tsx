"use client";

import { ethers } from "ethers";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";
import { LockboxABI } from "@/abi/LockboxABI";
import { LockboxAddresses } from "@/abi/LockboxAddresses";

export type LockboxClearValueType = {
  handle: string;
  clear: string | bigint | boolean;
};

type LockboxInfoType = {
  abi: typeof LockboxABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

function getLockboxByChainId(chainId: number | undefined): LockboxInfoType {
  if (!chainId) {
    return { abi: LockboxABI.abi };
  }

  const entry =
    LockboxAddresses[chainId.toString() as keyof typeof LockboxAddresses];

  if (!("address" in entry) || entry.address === ethers.ZeroAddress) {
    return { abi: LockboxABI.abi, chainId };
  }

  return {
    address: entry?.address as `0x${string}` | undefined,
    chainId: entry?.chainId ?? chainId,
    chainName: entry?.chainName,
    abi: LockboxABI.abi,
  };
}

export const useLockbox = (parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<
    (ethersSigner: ethers.JsonRpcSigner | undefined) => boolean
  >;
}) => {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  const [activeNoteId, setActiveNoteId] = useState<number | undefined>(0);
  const [handle, setHandle] = useState<string | undefined>(undefined);
  const [clear, setClear] = useState<LockboxClearValueType | undefined>(
    undefined,
  );
  const clearRef = useRef<LockboxClearValueType>(undefined);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<string>("");

  const [initialValueInput, setInitialValueInput] = useState<string>("0");
  const [titleInput, setTitleInput] = useState<string>("");
  const [deltaInput, setDeltaInput] = useState<string>("0");

  const lockboxRef = useRef<LockboxInfoType | undefined>(undefined);
  const isRefreshingRef = useRef<boolean>(isRefreshing);
  const isDecryptingRef = useRef<boolean>(isDecrypting);
  const isCreatingRef = useRef<boolean>(isCreating);
  const isAddingRef = useRef<boolean>(isAdding);

  const isDecrypted = handle && handle === clear?.handle;

  const lockbox = useMemo(() => {
    const c = getLockboxByChainId(chainId);
    lockboxRef.current = c;

    if (!c.address) {
      setMessage(`Lockbox deployment not found for chainId=${chainId}.`);
    }

    return c;
  }, [chainId]);

  const isDeployed = useMemo(() => {
    if (!lockbox) {
      return undefined;
    }
    return Boolean(lockbox.address) && lockbox.address !== ethers.ZeroAddress;
  }, [lockbox]);

  const canRefresh = useMemo(() => {
    return (
      typeof activeNoteId === "number" &&
      lockbox.address &&
      ethersReadonlyProvider &&
      !isRefreshing
    );
  }, [activeNoteId, lockbox.address, ethersReadonlyProvider, isRefreshing]);

  const refreshNote = useCallback(() => {
    if (!canRefresh || activeNoteId === undefined) {
      return;
    }

    if (
      !lockboxRef.current?.chainId ||
      !lockboxRef.current?.address ||
      !ethersReadonlyProvider
    ) {
      setHandle(undefined);
      return;
    }

    isRefreshingRef.current = true;
    setIsRefreshing(true);

    const thisChainId = lockboxRef.current.chainId;
    const thisAddress = lockboxRef.current.address;

    const contract = new ethers.Contract(
      thisAddress,
      lockboxRef.current.abi,
      ethersReadonlyProvider,
    );

    contract
      .getNoteValue(activeNoteId)
      .then((value: string) => {
        if (
          sameChain.current(thisChainId) &&
          thisAddress === lockboxRef.current?.address
        ) {
          setHandle(value);
        }
      })
      .catch((e: unknown) => {
        setMessage("Lockbox.getNoteValue() failed: " + String(e));
      })
      .finally(() => {
        isRefreshingRef.current = false;
        setIsRefreshing(false);
      });
  }, [activeNoteId, ethersReadonlyProvider, sameChain]); // Removed canRefresh to avoid cycle

  useEffect(() => {
    refreshNote();
  }, [refreshNote]);

  const canDecrypt = useMemo(() => {
    return (
      lockbox.address &&
      instance &&
      ethersSigner &&
      !isRefreshing &&
      !isDecrypting &&
      handle &&
      handle !== ethers.ZeroHash &&
      handle !== clear?.handle
    );
  }, [
    lockbox.address,
    instance,
    ethersSigner,
    isRefreshing,
    isDecrypting,
    handle,
    clear,
  ]);

  const decryptNote = useCallback(() => {
    if (isRefreshingRef.current || isDecryptingRef.current) {
      return;
    }

    if (!lockbox.address || !instance || !ethersSigner) {
      return;
    }

    if (handle === clearRef.current?.handle) {
      return;
    }

    if (!handle) {
      setClear(undefined);
      clearRef.current = undefined;
      return;
    }

    if (handle === ethers.ZeroHash) {
      setClear({ handle, clear: BigInt(0) });
      clearRef.current = { handle, clear: BigInt(0) };
      return;
    }

    const thisChainId = chainId;
    const thisAddress = lockbox.address;
    const thisHandle = handle;
    const thisSigner = ethersSigner;

    isDecryptingRef.current = true;
    setIsDecrypting(true);
    setMessage("Start decrypt");

    const run = async () => {
      const isStale = () =>
        thisAddress !== lockboxRef.current?.address ||
        !sameChain.current(thisChainId) ||
        !sameSigner.current(thisSigner);

      try {
        const sig = await FhevmDecryptionSignature.loadOrSign(
          instance,
          [lockbox.address as `0x${string}`],
          ethersSigner,
          fhevmDecryptionSignatureStorage,
        );

        if (!sig) {
          setMessage("Unable to build FHEVM decryption signature");
          return;
        }

        if (isStale()) {
          setMessage("Ignore FHEVM decryption");
          return;
        }

        const res = await instance.userDecrypt(
          [{ handle: thisHandle, contractAddress: thisAddress }],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays,
        );

        if (isStale()) {
          setMessage("Ignore FHEVM decryption");
          return;
        }

        setClear({ handle: thisHandle, clear: res[thisHandle] });
        clearRef.current = { handle: thisHandle, clear: res[thisHandle] };
      } finally {
        isDecryptingRef.current = false;
        setIsDecrypting(false);
      }
    };

    run();
  }, [
    chainId,
    ethersSigner,
    fhevmDecryptionSignatureStorage,
    handle,
    instance,
    lockbox.address,
    sameChain,
    sameSigner,
  ]);

  const canCreate = useMemo(() => {
    const value = Number(initialValueInput);
    return (
      lockbox.address &&
      instance &&
      ethersSigner &&
      !isCreating &&
      Number.isFinite(value)
    );
  }, [lockbox.address, instance, ethersSigner, isCreating, initialValueInput]);

  const createNote = useCallback(() => {
    if (!canCreate) return;

    if (!lockbox.address || !instance || !ethersSigner) return;

    const value = Number(initialValueInput);

    isCreatingRef.current = true;
    setIsCreating(true);
    setMessage("Creating note...");

    const thisChainId = chainId;
    const thisAddress = lockbox.address;
    const thisSigner = ethersSigner;

    const run = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const isStale = () =>
        thisAddress !== lockboxRef.current?.address ||
        !sameChain.current(thisChainId) ||
        !sameSigner.current(thisSigner);

      try {
        const input = instance.createEncryptedInput(
          thisAddress,
          thisSigner.address,
        );
        input.add32(value);

        const enc = await input.encrypt();

        if (isStale()) {
          setMessage("Ignore createNote");
          return;
        }

        const contract = new ethers.Contract(
          thisAddress,
          lockboxRef.current?.abi ?? LockboxABI.abi,
          thisSigner,
        );

        const tx: ethers.TransactionResponse = await contract.createNote(
          enc.handles[0],
          enc.inputProof,
          titleInput,
        );

        await tx.wait();
        setMessage("Note created");
        setActiveNoteId(0);
        refreshNote();
      } catch (e) {
        setMessage("createNote failed: " + String(e));
      } finally {
        isCreatingRef.current = false;
        setIsCreating(false);
      }
    };

    run();
  }, [
    canCreate,
    chainId,
    ethersSigner,
    initialValueInput,
    instance,
    lockbox.address,
    refreshNote,
    sameChain,
    sameSigner,
    titleInput,
  ]);

  const canAdd = useMemo(() => {
    const value = Number(deltaInput);
    return (
      typeof activeNoteId === "number" &&
      lockbox.address &&
      instance &&
      ethersSigner &&
      !isAdding &&
      Number.isFinite(value) &&
      value !== 0
    );
  }, [
    activeNoteId,
    deltaInput,
    ethersSigner,
    instance,
    isAdding,
    lockbox.address,
  ]);

  const addToNote = useCallback(() => {
    if (!canAdd || activeNoteId === undefined) return;

    if (!lockbox.address || !instance || !ethersSigner) return;

    const value = Number(deltaInput);

    isAddingRef.current = true;
    setIsAdding(true);
    setMessage("Adding to note...");

    const thisChainId = chainId;
    const thisAddress = lockbox.address;
    const thisSigner = ethersSigner;

    const run = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const isStale = () =>
        thisAddress !== lockboxRef.current?.address ||
        !sameChain.current(thisChainId) ||
        !sameSigner.current(thisSigner);

      try {
        const input = instance.createEncryptedInput(
          thisAddress,
          thisSigner.address,
        );
        input.add32(Math.abs(value));

        const enc = await input.encrypt();

        if (isStale()) {
          setMessage("Ignore addToNote");
          return;
        }

        const contract = new ethers.Contract(
          thisAddress,
          lockboxRef.current?.abi ?? LockboxABI.abi,
          thisSigner,
        );

        const tx: ethers.TransactionResponse = await contract.addToNote(
          activeNoteId,
          enc.handles[0],
          enc.inputProof,
        );

        await tx.wait();
        setMessage("Note updated");
        refreshNote();
      } catch (e) {
        setMessage("addToNote failed: " + String(e));
      } finally {
        isAddingRef.current = false;
        setIsAdding(false);
      }
    };

    run();
  }, [
    activeNoteId,
    canAdd,
    chainId,
    deltaInput,
    ethersSigner,
    instance,
    lockbox.address,
    refreshNote,
    sameChain,
    sameSigner,
  ]);

  return {
    contractAddress: lockbox.address,
    isDeployed,
    activeNoteId,
    handle,
    clear: clear?.clear,
    isDecrypted,
    isRefreshing,
    isDecrypting,
    isCreating,
    isAdding,
    canDecrypt,
    canRefresh,
    canCreate,
    canAdd,
    decryptNote,
    refreshNote,
    createNote,
    addToNote,
    initialValueInput,
    setInitialValueInput,
    deltaInput,
    setDeltaInput,
    titleInput,
    setTitleInput,
    message,
  };
};
