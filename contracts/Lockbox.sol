// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Lockbox - Encrypted numeric notes vault using FHEVM
/// @notice Stores encrypted numeric notes and allows the owner to update and decrypt them
contract Lockbox is SepoliaConfig {
    struct Note {
        address owner;
        euint32 value;
    }

    uint256 private _nextNoteId;
    mapping(uint256 => Note) private _notes;

    event NoteCreated(uint256 indexed noteId, address indexed owner, string title);
    event NoteUpdated(uint256 indexed noteId, address indexed owner);

    /// @notice Creates a new encrypted numeric note
    /// @param inputEuint32 Encrypted initial value
    /// @param inputProof Input proof for the encrypted value
    /// @param title Human readable note title (stored only in the event)
    /// @return noteId Newly created note id
    function createNote(externalEuint32 inputEuint32, bytes calldata inputProof, string calldata title)
        external
        returns (uint256 noteId)
    {
        euint32 encryptedValue = FHE.fromExternal(inputEuint32, inputProof);

        noteId = _nextNoteId;
        _nextNoteId++;

        _notes[noteId] = Note({owner: msg.sender, value: encryptedValue});

        FHE.allowThis(encryptedValue);
        FHE.allow(encryptedValue, msg.sender);

        emit NoteCreated(noteId, msg.sender, title);
    }

    /// @notice Adds an encrypted delta to an existing note owned by the caller
    /// @param noteId Target note id
    /// @param inputEuint32 Encrypted delta value to add
    /// @param inputProof Input proof for the encrypted value
    function addToNote(uint256 noteId, externalEuint32 inputEuint32, bytes calldata inputProof) external {
        Note storage note = _notes[noteId];
        require(note.owner != address(0), "Lockbox: note does not exist");
        require(note.owner == msg.sender, "Lockbox: caller is not the note owner");

        euint32 encryptedDelta = FHE.fromExternal(inputEuint32, inputProof);

        note.value = FHE.add(note.value, encryptedDelta);

        FHE.allowThis(note.value);
        FHE.allow(note.value, msg.sender);

        emit NoteUpdated(noteId, msg.sender);
    }

    /// @notice Returns the encrypted value handle of a note
    /// @param noteId Target note id
    /// @return Encrypted value handle (euint32). Returns ZeroHash-like handle if note is not initialized
    function getNoteValue(uint256 noteId) external view returns (euint32) {
        Note storage note = _notes[noteId];
        return note.value;
    }

    /// @notice Returns the owner of a note
    /// @param noteId Target note id
    /// @return owner Address that owns the note
    function getNoteOwner(uint256 noteId) external view returns (address owner) {
        owner = _notes[noteId].owner;
    }
}
