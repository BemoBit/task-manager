import { Injectable, Logger } from '@nestjs/common';
import { PipelineState, PhaseState } from '../interfaces/pipeline.interface';

/**
 * State Machine Service
 * Manages state transitions for pipeline and phase states
 */
@Injectable()
export class StateMachineService {
  private readonly logger = new Logger(StateMachineService.name);

  // Valid pipeline state transitions
  private readonly pipelineTransitions: Map<PipelineState, PipelineState[]> = new Map([
    [PipelineState.IDLE, [PipelineState.INITIALIZING, PipelineState.FAILED]],
    [
      PipelineState.INITIALIZING,
      [PipelineState.DECOMPOSING, PipelineState.FAILED, PipelineState.PAUSED],
    ],
    [
      PipelineState.DECOMPOSING,
      [PipelineState.ENRICHING, PipelineState.FAILED, PipelineState.PAUSED],
    ],
    [
      PipelineState.ENRICHING,
      [PipelineState.GENERATING_PROMPTS, PipelineState.FAILED, PipelineState.PAUSED],
    ],
    [
      PipelineState.GENERATING_PROMPTS,
      [PipelineState.COMPLETED, PipelineState.FAILED, PipelineState.PAUSED],
    ],
    [
      PipelineState.PAUSED,
      [
        PipelineState.DECOMPOSING,
        PipelineState.ENRICHING,
        PipelineState.GENERATING_PROMPTS,
        PipelineState.FAILED,
        PipelineState.ROLLED_BACK,
      ],
    ],
    [PipelineState.FAILED, [PipelineState.ROLLED_BACK, PipelineState.IDLE]],
    [PipelineState.COMPLETED, [PipelineState.IDLE]],
    [PipelineState.ROLLED_BACK, [PipelineState.IDLE]],
  ]);

  // Valid phase state transitions
  private readonly phaseTransitions: Map<PhaseState, PhaseState[]> = new Map([
    [PhaseState.PENDING, [PhaseState.RUNNING, PhaseState.SKIPPED]],
    [
      PhaseState.RUNNING,
      [PhaseState.COMPLETED, PhaseState.FAILED, PhaseState.RETRYING, PhaseState.SKIPPED],
    ],
    [PhaseState.FAILED, [PhaseState.RETRYING, PhaseState.SKIPPED]],
    [PhaseState.RETRYING, [PhaseState.RUNNING, PhaseState.FAILED]],
    [PhaseState.COMPLETED, []],
    [PhaseState.SKIPPED, []],
  ]);

  /**
   * Check if pipeline state transition is valid
   */
  canTransitionPipeline(
    from: PipelineState,
    to: PipelineState,
  ): { valid: boolean; reason?: string } {
    const allowedTransitions = this.pipelineTransitions.get(from);

    if (!allowedTransitions) {
      return {
        valid: false,
        reason: `Unknown pipeline state: ${from}`,
      };
    }

    if (!allowedTransitions.includes(to)) {
      return {
        valid: false,
        reason: `Invalid transition from ${from} to ${to}. Allowed: ${allowedTransitions.join(', ')}`,
      };
    }

    return { valid: true };
  }

  /**
   * Check if phase state transition is valid
   */
  canTransitionPhase(from: PhaseState, to: PhaseState): { valid: boolean; reason?: string } {
    const allowedTransitions = this.phaseTransitions.get(from);

    if (!allowedTransitions) {
      return {
        valid: false,
        reason: `Unknown phase state: ${from}`,
      };
    }

    if (!allowedTransitions.includes(to)) {
      return {
        valid: false,
        reason: `Invalid transition from ${from} to ${to}. Allowed: ${allowedTransitions.join(', ')}`,
      };
    }

    return { valid: true };
  }

  /**
   * Transition pipeline to new state with validation
   */
  transitionPipeline(
    currentState: PipelineState,
    newState: PipelineState,
    pipelineId: string,
  ): PipelineState {
    const validation = this.canTransitionPipeline(currentState, newState);

    if (!validation.valid) {
      this.logger.error(`Pipeline ${pipelineId}: ${validation.reason}`, StateMachineService.name);
      throw new Error(validation.reason);
    }

    this.logger.log(`Pipeline ${pipelineId}: Transitioning from ${currentState} to ${newState}`);

    return newState;
  }

  /**
   * Transition phase to new state with validation
   */
  transitionPhase(currentState: PhaseState, newState: PhaseState, phaseId: string): PhaseState {
    const validation = this.canTransitionPhase(currentState, newState);

    if (!validation.valid) {
      this.logger.error(`Phase ${phaseId}: ${validation.reason}`, StateMachineService.name);
      throw new Error(validation.reason);
    }

    this.logger.log(`Phase ${phaseId}: Transitioning from ${currentState} to ${newState}`);

    return newState;
  }

  /**
   * Get next valid states for pipeline
   */
  getValidPipelineTransitions(state: PipelineState): PipelineState[] {
    return this.pipelineTransitions.get(state) || [];
  }

  /**
   * Get next valid states for phase
   */
  getValidPhaseTransitions(state: PhaseState): PhaseState[] {
    return this.phaseTransitions.get(state) || [];
  }

  /**
   * Check if pipeline is in terminal state
   */
  isPipelineTerminal(state: PipelineState): boolean {
    return [PipelineState.COMPLETED, PipelineState.FAILED, PipelineState.ROLLED_BACK].includes(
      state,
    );
  }

  /**
   * Check if phase is in terminal state
   */
  isPhaseTerminal(state: PhaseState): boolean {
    return [PhaseState.COMPLETED, PhaseState.SKIPPED].includes(state);
  }

  /**
   * Get pipeline state from string
   */
  getPipelineStateFromString(state: string): PipelineState {
    const upperState = state.toUpperCase();
    if (Object.values(PipelineState).includes(upperState as PipelineState)) {
      return upperState as PipelineState;
    }
    throw new Error(`Invalid pipeline state: ${state}`);
  }

  /**
   * Get phase state from string
   */
  getPhaseStateFromString(state: string): PhaseState {
    const upperState = state.toUpperCase();
    if (Object.values(PhaseState).includes(upperState as PhaseState)) {
      return upperState as PhaseState;
    }
    throw new Error(`Invalid phase state: ${state}`);
  }
}
