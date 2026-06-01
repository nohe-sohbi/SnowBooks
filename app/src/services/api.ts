// Single entry point for the audio processing API.
// In demo mode (VITE_DEMO_MODE=true, e.g. the GitHub Pages build) consumers get
// a 100% client-side implementation; otherwise the real backend-backed one.
import { audioProcessingAPI as realAPI } from './audioProcessingAPI';
import { demoAudioProcessingAPI } from './demoAudioProcessingAPI';

// Public surface shared by both implementations.
export type AudioProcessingApi = Pick<
  typeof realAPI,
  | 'uploadZip'
  | 'getJobStatus'
  | 'startProcessing'
  | 'cancelJob'
  | 'deleteJob'
  | 'downloadResult'
  | 'getDownloadInfo'
  | 'subscribeToProgress'
  | 'disconnect'
  | 'healthCheck'
>;

const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

// Compile-time parity check: the demo MUST satisfy the real public surface.
// If a method is missing or its signature drifts, tsc fails here.
const demo: AudioProcessingApi = demoAudioProcessingAPI;

export const audioProcessingAPI: AudioProcessingApi = isDemo ? demo : realAPI;
export default audioProcessingAPI;

// Re-export the type/enum surface so consumers import everything from one place.
export { JobStatus } from './audioProcessingAPI';
export type {
  MP3FileInfo,
  JobData,
  JobProgress,
  ProcessingConfig,
  UploadResponse,
  ProgressUpdate,
  JobCompletion,
  JobError,
} from './audioProcessingAPI';
