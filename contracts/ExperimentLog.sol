// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ExperimentLog - On-chain experiment and step management
/// @notice Stores experiments and their steps on-chain, requiring wallet signatures for all write operations
contract ExperimentLog {
    struct Experiment {
        uint256 id;
        address owner;
        string name;
        uint256 createdAt;
        bool exists;
    }

    struct Step {
        uint256 id;
        uint256 experimentId;
        string title;
        string content;
        bool isEncrypted;
        bool exists;
    }

    uint256 private _nextExperimentId;
    uint256 private _nextStepId;

    mapping(uint256 => Experiment) private _experiments;
    mapping(uint256 => uint256[]) private _experimentSteps;
    mapping(uint256 => Step) private _steps;

    event ExperimentCreated(uint256 indexed experimentId, address indexed owner, string name, uint256 createdAt);
    event StepAdded(uint256 indexed stepId, uint256 indexed experimentId, string title);
    event StepUpdated(uint256 indexed stepId, uint256 indexed experimentId);
    event StepDeleted(uint256 indexed stepId, uint256 indexed experimentId);

    /// @notice Creates a new experiment
    /// @param name The name of the experiment
    /// @return experimentId The ID of the newly created experiment
    function createExperiment(string calldata name) external returns (uint256 experimentId) {
        require(bytes(name).length > 0, "ExperimentLog: name cannot be empty");

        experimentId = _nextExperimentId;
        _nextExperimentId++;

        _experiments[experimentId] = Experiment({
            id: experimentId,
            owner: msg.sender,
            name: name,
            createdAt: block.timestamp,
            exists: true
        });

        emit ExperimentCreated(experimentId, msg.sender, name, block.timestamp);
    }

    /// @notice Adds a step to an experiment
    /// @param experimentId The ID of the experiment
    /// @param title The title of the step
    /// @param content The content of the step
    /// @param isEncrypted Whether the step is marked as encrypted
    /// @return stepId The ID of the newly created step
    function addStep(
        uint256 experimentId,
        string calldata title,
        string calldata content,
        bool isEncrypted
    ) external returns (uint256 stepId) {
        Experiment storage experiment = _experiments[experimentId];
        require(experiment.exists, "ExperimentLog: experiment does not exist");
        require(experiment.owner == msg.sender, "ExperimentLog: caller is not the experiment owner");
        require(bytes(title).length > 0, "ExperimentLog: title cannot be empty");

        stepId = _nextStepId;
        _nextStepId++;

        _steps[stepId] = Step({
            id: stepId,
            experimentId: experimentId,
            title: title,
            content: content,
            isEncrypted: isEncrypted,
            exists: true
        });

        _experimentSteps[experimentId].push(stepId);

        emit StepAdded(stepId, experimentId, title);
    }

    /// @notice Updates an existing step
    /// @param stepId The ID of the step to update
    /// @param title The new title
    /// @param content The new content
    /// @param isEncrypted The new encryption status
    function updateStep(
        uint256 stepId,
        string calldata title,
        string calldata content,
        bool isEncrypted
    ) external {
        Step storage step = _steps[stepId];
        require(step.exists, "ExperimentLog: step does not exist");

        Experiment storage experiment = _experiments[step.experimentId];
        require(experiment.owner == msg.sender, "ExperimentLog: caller is not the experiment owner");
        require(bytes(title).length > 0, "ExperimentLog: title cannot be empty");

        step.title = title;
        step.content = content;
        step.isEncrypted = isEncrypted;

        emit StepUpdated(stepId, step.experimentId);
    }

    /// @notice Deletes a step from an experiment
    /// @param stepId The ID of the step to delete
    function deleteStep(uint256 stepId) external {
        Step storage step = _steps[stepId];
        require(step.exists, "ExperimentLog: step does not exist");

        Experiment storage experiment = _experiments[step.experimentId];
        require(experiment.owner == msg.sender, "ExperimentLog: caller is not the experiment owner");

        uint256 experimentId = step.experimentId;
        step.exists = false;

        // Remove from experiment's step list
        uint256[] storage steps = _experimentSteps[experimentId];
        for (uint256 i = 0; i < steps.length; i++) {
            if (steps[i] == stepId) {
                steps[i] = steps[steps.length - 1];
                steps.pop();
                break;
            }
        }

        emit StepDeleted(stepId, experimentId);
    }

    /// @notice Gets experiment details
    /// @param experimentId The ID of the experiment
    /// @return experiment The experiment details
    function getExperiment(uint256 experimentId) external view returns (Experiment memory experiment) {
        experiment = _experiments[experimentId];
        require(experiment.exists, "ExperimentLog: experiment does not exist");
    }

    /// @notice Gets step details
    /// @param stepId The ID of the step
    /// @return step The step details
    function getStep(uint256 stepId) external view returns (Step memory step) {
        step = _steps[stepId];
        require(step.exists, "ExperimentLog: step does not exist");
    }

    /// @notice Gets all step IDs for an experiment
    /// @param experimentId The ID of the experiment
    /// @return stepIds Array of step IDs
    function getExperimentStepIds(uint256 experimentId) external view returns (uint256[] memory stepIds) {
        require(_experiments[experimentId].exists, "ExperimentLog: experiment does not exist");
        stepIds = _experimentSteps[experimentId];
    }

    /// @notice Gets all steps for an experiment
    /// @param experimentId The ID of the experiment
    /// @return steps Array of steps
    function getExperimentSteps(uint256 experimentId) external view returns (Step[] memory steps) {
        require(_experiments[experimentId].exists, "ExperimentLog: experiment does not exist");
        
        uint256[] memory stepIds = _experimentSteps[experimentId];
        steps = new Step[](stepIds.length);
        
        for (uint256 i = 0; i < stepIds.length; i++) {
            steps[i] = _steps[stepIds[i]];
        }
    }

    /// @notice Gets the total number of experiments created
    /// @return count The total experiment count
    function getExperimentCount() external view returns (uint256 count) {
        count = _nextExperimentId;
    }

    /// @notice Gets the total number of steps created
    /// @return count The total step count
    function getStepCount() external view returns (uint256 count) {
        count = _nextStepId;
    }
}
