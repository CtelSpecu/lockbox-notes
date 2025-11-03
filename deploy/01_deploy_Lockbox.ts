import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedLockbox = await deploy("Lockbox", {
    from: deployer,
    log: true,
    // Avoid redeploy if same bytecode already deployed (prevents duplicate nonces)
    skipIfAlreadyDeployed: true,
  });

  console.log("Lockbox contract:", deployedLockbox.address);
};

export default func;
func.id = "deploy_lockbox"; // id required to prevent reexecution
func.tags = ["Lockbox"];
