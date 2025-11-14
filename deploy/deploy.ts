import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // This file is kept for compatibility but does nothing
  // All deployments are now in numbered deploy scripts (e.g., 02_deploy_ExperimentLog.ts)
  console.log("Skipping deploy.ts - using numbered deployment scripts instead");
};

export default func;
func.tags = ["legacy"];
