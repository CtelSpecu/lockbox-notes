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

import { ExperimentLogABI } from "@/abi/ExperimentLogABI";
import { ExperimentLogAddresses } from "@/abi/ExperimentLogAddresses";

export type ExperimentType = {
  id: string;
  name: string;
  date: string;
  owner: string;
};

export type StepType = {
  id: string;
  experimentId: string;
  title: string;
  content: string;
  isEncrypted: boolean;
};

type ExperimentLogInfoType = {
  abi: typeof ExperimentLogABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

function getExperimentLogByChainId(chainId: number | undefined): ExperimentLogInfoType {
  if (!chainId) {
    return { abi: ExperimentLogABI.abi };
  }

  const entry =
    ExperimentLogAddresses[chainId.toString() as keyof typeof ExperimentLogAddresses];

  if (!("address" in entry) || entry.address === ethers.ZeroAddress) {
    return { abi: ExperimentLogABI.abi, chainId };
  }

  return {
    address: entry?.address as `0x${string}` | undefined,
    chainId: entry?.chainId ?? chainId,
    chainName: entry?.chainName,
    abi: ExperimentLogABI.abi,
  };
}

export const useExperimentLog = (parameters: {
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<
    (ethersSigner: ethers.JsonRpcSigner | undefined) => boolean
  >;
}) => {
  const {
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  const [experiments, setExperiments] = useState<ExperimentType[]>([]);
  const [steps, setSteps] = useState<Record<string, StepType[]>>({});
  const [isCreatingExperiment, setIsCreatingExperiment] = useState(false);
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [isUpdatingStep, setIsUpdatingStep] = useState(false);
  const [isDeletingStep, setIsDeletingStep] = useState(false);
  const [message, setMessage] = useState<string>("");

  const experimentLogRef = useRef<ExperimentLogInfoType | undefined>(undefined);
  const isCreatingExperimentRef = useRef<boolean>(isCreatingExperiment);
  const isAddingStepRef = useRef<boolean>(isAddingStep);
  const isUpdatingStepRef = useRef<boolean>(isUpdatingStep);
  const isDeletingStepRef = useRef<boolean>(isDeletingStep);

  const experimentLog = useMemo(() => {
    const c = getExperimentLogByChainId(chainId);
    experimentLogRef.current = c;

    if (!c.address) {
      setMessage(`ExperimentLog deployment not found for chainId=${chainId}.`);
    }

    return c;
  }, [chainId]);

  const isDeployed = useMemo(() => {
    if (!experimentLog) {
      return undefined;
    }
    return Boolean(experimentLog.address) && experimentLog.address !== ethers.ZeroAddress;
  }, [experimentLog]);

  const canCreateExperiment = useMemo(() => {
    return experimentLog.address && ethersSigner && !isCreatingExperiment;
  }, [experimentLog.address, ethersSigner, isCreatingExperiment]);

  const canAddStep = useMemo(() => {
    return experimentLog.address && ethersSigner && !isAddingStep;
  }, [experimentLog.address, ethersSigner, isAddingStep]);

  const canUpdateStep = useMemo(() => {
    return experimentLog.address && ethersSigner && !isUpdatingStep;
  }, [experimentLog.address, ethersSigner, isUpdatingStep]);

  const canDeleteStep = useMemo(() => {
    return experimentLog.address && ethersSigner && !isDeletingStep;
  }, [experimentLog.address, ethersSigner, isDeletingStep]);

  const createExperiment = useCallback(
    async (name: string): Promise<string | null> => {
      if (!canCreateExperiment || !experimentLog.address || !ethersSigner) {
        return null;
      }

      const thisChainId = chainId;
      const thisAddress = experimentLog.address;
      const thisSigner = ethersSigner;

      isCreatingExperimentRef.current = true;
      setIsCreatingExperiment(true);
      setMessage("Creating experiment...");

      try {
        const isStale = () =>
          thisAddress !== experimentLogRef.current?.address ||
          !sameChain.current?.(thisChainId) ||
          !sameSigner.current?.(thisSigner);

        const contract = new ethers.Contract(
          thisAddress,
          experimentLogRef.current?.abi ?? ExperimentLogABI.abi,
          thisSigner
        );

        const tx: ethers.TransactionResponse = await contract.createExperiment(name);
        const receipt = await tx.wait();

        if (isStale()) {
          setMessage("Ignore createExperiment");
          return null;
        }

        // Parse event to get experimentId
        const event = receipt?.logs
          .map((log) => {
            try {
              return contract.interface.parseLog(log);
            } catch {
              return null;
            }
          })
          .find((e) => e?.name === "ExperimentCreated");

        const experimentId = event?.args?.experimentId?.toString() || "0";
        
        setMessage("Experiment created successfully");
        return experimentId;
      } catch (e) {
        setMessage("createExperiment failed: " + String(e));
        return null;
      } finally {
        isCreatingExperimentRef.current = false;
        setIsCreatingExperiment(false);
      }
    },
    [canCreateExperiment, chainId, ethersSigner, experimentLog.address, sameChain, sameSigner]
  );

  const addStep = useCallback(
    async (
      experimentId: string,
      title: string,
      content: string,
      isEncrypted: boolean
    ): Promise<string | null> => {
      if (!canAddStep || !experimentLog.address || !ethersSigner) {
        return null;
      }

      const thisChainId = chainId;
      const thisAddress = experimentLog.address;
      const thisSigner = ethersSigner;

      isAddingStepRef.current = true;
      setIsAddingStep(true);
      setMessage("Adding step...");

      try {
        const isStale = () =>
          thisAddress !== experimentLogRef.current?.address ||
          !sameChain.current?.(thisChainId) ||
          !sameSigner.current?.(thisSigner);

        const contract = new ethers.Contract(
          thisAddress,
          experimentLogRef.current?.abi ?? ExperimentLogABI.abi,
          thisSigner
        );

        const tx: ethers.TransactionResponse = await contract.addStep(
          experimentId,
          title,
          content,
          isEncrypted
        );
        const receipt = await tx.wait();

        if (isStale()) {
          setMessage("Ignore addStep");
          return null;
        }

        // Parse event to get stepId
        const event = receipt?.logs
          .map((log) => {
            try {
              return contract.interface.parseLog(log);
            } catch {
              return null;
            }
          })
          .find((e) => e?.name === "StepAdded");

        const stepId = event?.args?.stepId?.toString() || "0";

        setMessage("Step added successfully");
        return stepId;
      } catch (e) {
        setMessage("addStep failed: " + String(e));
        return null;
      } finally {
        isAddingStepRef.current = false;
        setIsAddingStep(false);
      }
    },
    [canAddStep, chainId, ethersSigner, experimentLog.address, sameChain, sameSigner]
  );

  const updateStep = useCallback(
    async (
      stepId: string,
      title: string,
      content: string,
      isEncrypted: boolean
    ): Promise<boolean> => {
      if (!canUpdateStep || !experimentLog.address || !ethersSigner) {
        return false;
      }

      const thisChainId = chainId;
      const thisAddress = experimentLog.address;
      const thisSigner = ethersSigner;

      isUpdatingStepRef.current = true;
      setIsUpdatingStep(true);
      setMessage("Updating step...");

      try {
        const isStale = () =>
          thisAddress !== experimentLogRef.current?.address ||
          !sameChain.current?.(thisChainId) ||
          !sameSigner.current?.(thisSigner);

        const contract = new ethers.Contract(
          thisAddress,
          experimentLogRef.current?.abi ?? ExperimentLogABI.abi,
          thisSigner
        );

        const tx: ethers.TransactionResponse = await contract.updateStep(
          stepId,
          title,
          content,
          isEncrypted
        );
        await tx.wait();

        if (isStale()) {
          setMessage("Ignore updateStep");
          return false;
        }

        setMessage("Step updated successfully");
        return true;
      } catch (e) {
        setMessage("updateStep failed: " + String(e));
        return false;
      } finally {
        isUpdatingStepRef.current = false;
        setIsUpdatingStep(false);
      }
    },
    [canUpdateStep, chainId, ethersSigner, experimentLog.address, sameChain, sameSigner]
  );

  const deleteStep = useCallback(
    async (stepId: string): Promise<boolean> => {
      if (!canDeleteStep || !experimentLog.address || !ethersSigner) {
        return false;
      }

      const thisChainId = chainId;
      const thisAddress = experimentLog.address;
      const thisSigner = ethersSigner;

      isDeletingStepRef.current = true;
      setIsDeletingStep(true);
      setMessage("Deleting step...");

      try {
        const isStale = () =>
          thisAddress !== experimentLogRef.current?.address ||
          !sameChain.current?.(thisChainId) ||
          !sameSigner.current?.(thisSigner);

        const contract = new ethers.Contract(
          thisAddress,
          experimentLogRef.current?.abi ?? ExperimentLogABI.abi,
          thisSigner
        );

        const tx: ethers.TransactionResponse = await contract.deleteStep(stepId);
        await tx.wait();

        if (isStale()) {
          setMessage("Ignore deleteStep");
          return false;
        }

        setMessage("Step deleted successfully");
        return true;
      } catch (e) {
        setMessage("deleteStep failed: " + String(e));
        return false;
      } finally {
        isDeletingStepRef.current = false;
        setIsDeletingStep(false);
      }
    },
    [canDeleteStep, chainId, ethersSigner, experimentLog.address, sameChain, sameSigner]
  );

  const loadExperimentSteps = useCallback(
    async (experimentId: string): Promise<StepType[]> => {
      if (!experimentLog.address || !ethersReadonlyProvider) {
        return [];
      }

      try {
        const contract = new ethers.Contract(
          experimentLog.address,
          experimentLog.abi,
          ethersReadonlyProvider
        );

        const stepsData = await contract.getExperimentSteps(experimentId);
        
        const loadedSteps: StepType[] = stepsData.map((step: any) => ({
          id: step.id.toString(),
          experimentId: step.experimentId.toString(),
          title: step.title,
          content: step.content,
          isEncrypted: step.isEncrypted,
        }));

        return loadedSteps;
      } catch (e) {
        console.error("loadExperimentSteps failed:", e);
        return [];
      }
    },
    [experimentLog.address, experimentLog.abi, ethersReadonlyProvider]
  );

  return {
    contractAddress: experimentLog.address,
    isDeployed,
    experiments,
    steps,
    isCreatingExperiment,
    isAddingStep,
    isUpdatingStep,
    isDeletingStep,
    canCreateExperiment,
    canAddStep,
    canUpdateStep,
    canDeleteStep,
    createExperiment,
    addStep,
    updateStep,
    deleteStep,
    loadExperimentSteps,
    message,
    setExperiments,
    setSteps,
  };
};
