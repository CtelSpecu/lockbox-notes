import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { Lockbox, Lockbox__factory } from "../types";

interface Signers {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
}

async function deployFixture() {
  const factory = (await ethers.getContractFactory("Lockbox")) as Lockbox__factory;
  const lockboxContract = (await factory.deploy()) as Lockbox;
  const lockboxAddress = await lockboxContract.getAddress();

  return { lockboxContract, lockboxAddress };
}

describe("Lockbox", function () {
  let signers: Signers;
  let lockboxContract: Lockbox;
  let lockboxAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      // This test suite is meant to run only on the local FHEVM mock (hardhat node)
      this.skip();
    }

    ({ lockboxContract, lockboxAddress } = await deployFixture());
  });

  it("should create an encrypted note with initial value", async function () {
    const clearInitialValue = 5;

    const encryptedInitial = await fhevm
      .createEncryptedInput(lockboxAddress, signers.alice.address)
      .add32(clearInitialValue)
      .encrypt();

    const tx = await lockboxContract
      .connect(signers.alice)
      .createNote(encryptedInitial.handles[0], encryptedInitial.inputProof, "First note");
    const receipt = await tx.wait();
    expect(receipt?.status).to.eq(1n);

    const encryptedValue = await lockboxContract.getNoteValue(0);

    const clearValue = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedValue,
      lockboxAddress,
      signers.alice,
    );

    expect(clearValue).to.eq(clearInitialValue);
  });

  it("should allow the owner to add to the encrypted note", async function () {
    const clearInitialValue = 10;
    const clearDelta = 7;

    // Create initial note as Alice
    const encryptedInitial = await fhevm
      .createEncryptedInput(lockboxAddress, signers.alice.address)
      .add32(clearInitialValue)
      .encrypt();

    let tx = await lockboxContract
      .connect(signers.alice)
      .createNote(encryptedInitial.handles[0], encryptedInitial.inputProof, "Updatable note");
    await tx.wait();

    // Add delta to the note as Alice
    const encryptedDelta = await fhevm
      .createEncryptedInput(lockboxAddress, signers.alice.address)
      .add32(clearDelta)
      .encrypt();

    tx = await lockboxContract
      .connect(signers.alice)
      .addToNote(0, encryptedDelta.handles[0], encryptedDelta.inputProof);
    await tx.wait();

    const encryptedValue = await lockboxContract.getNoteValue(0);
    const clearValue = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedValue,
      lockboxAddress,
      signers.alice,
    );

    expect(clearValue).to.eq(clearInitialValue + clearDelta);
  });

  it("should revert when a non-owner tries to update a note", async function () {
    const clearInitialValue = 3;
    const clearDelta = 2;

    // Create initial note as Alice
    const encryptedInitial = await fhevm
      .createEncryptedInput(lockboxAddress, signers.alice.address)
      .add32(clearInitialValue)
      .encrypt();

    let tx = await lockboxContract
      .connect(signers.alice)
      .createNote(encryptedInitial.handles[0], encryptedInitial.inputProof, "Protected note");
    await tx.wait();

    // Bob tries to update Alice's note
    const encryptedDelta = await fhevm
      .createEncryptedInput(lockboxAddress, signers.bob.address)
      .add32(clearDelta)
      .encrypt();

    await expect(
      lockboxContract
        .connect(signers.bob)
        .addToNote(0, encryptedDelta.handles[0], encryptedDelta.inputProof),
    ).to.be.revertedWith("Lockbox: caller is not the note owner");
  });
});
