# Architecture Documentation

## System Overview

The **ai-avatar-system** is a Next.js-based web application that generates AI-powered training videos by combining OpenAI's Text-to-Speech (TTS) API with D-ID's avatar video generation API. The system is built with autonomous development capabilities through the Miyabi framework.

## High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend - Next.js App Router"
        A[Script Management UI]
        B[Video Player UI]
        C[Progress Component]
    end

    subgraph "Backend - API Routes"
        D[/api/generate-video]
    end

    subgraph "Services Layer"
        E[VideoGenerationService]
        F[Validation Utils]
        G[Retry Utils]
    end

    subgraph "External APIs"
        H[OpenAI TTS API]
        I[D-ID Avatar API]
        J[Supabase Database]
    end

    subgraph "Miyabi Framework"
        K[IssueAgent]
        L[CodeGenAgent]
        M[ReviewAgent]
        N[CoordinatorAgent]
    end

    A --> D
    D --> E
    E --> F
    E --> G
    E --> H
    E --> I
    E --> J
    C -.Progress Updates.-> E

    N --> K
    K --> L
    L --> M

    style H fill:#10a37f
    style I fill:#6366f1
    style J fill:#3ecf8e
```

## Component Architecture

### 1. Frontend Layer

#### Next.js App Router Structure

\`\`\`
src/app/
├── page.tsx                 # Home page
├── layout.tsx              # Root layout with providers
├── scripts/
│   ├── page.tsx           # Script list view
│   └── [id]/page.tsx      # Script detail & edit
├── videos/
│   └── [id]/page.tsx      # Video player page
└── api/
    └── generate-video/
        └── route.ts       # Video generation endpoint
\`\`\`

**Key Components**:

- **VideoGenerationProgress.tsx**: Real-time progress indicator
  - Shows 4 steps: Validation → Audio → Video → Complete
  - Displays progress percentage (0-100%)
  - Error state handling with detailed messages
  - Step indicators: ○ (pending), ● (current), ✓ (completed), ✕ (error)

#### State Management (Zustand)

\`\`\`typescript
// src/lib/store.ts
interface AppState {
  scripts: Script[];
  videos: Video[];
  currentProgress: ProgressState | null;
  setProgress: (progress: ProgressState) => void;
}
\`\`\`

### 2. Services Layer

#### VideoGenerationService

**Location**: \`src/services/videoGenerationService.ts\`

**Responsibilities**:
1. Orchestrate the entire video generation pipeline
2. Call OpenAI TTS API for audio generation
3. Call D-ID API for avatar video creation
4. Track and report progress to UI
5. Handle errors with automatic retry

**Architecture**:

\`\`\`mermaid
sequenceDiagram
    participant UI
    participant Service as VideoGenerationService
    participant Validator
    participant Retry
    participant OpenAI
    participant DID

    UI->>Service: generateVideo(script)
    Service->>Validator: validateScriptOrThrow(script)
    Validator-->>Service: ✓ Valid

    Service->>UI: Progress: VALIDATING (10%)

    Service->>Retry: withRetry(callOpenAIAPI)
    Retry->>OpenAI: Create TTS
    OpenAI-->>Retry: audioUrl
    Retry-->>Service: { audioUrl }

    Service->>UI: Progress: GENERATING_AUDIO (30%)

    Service->>Retry: withRetry(callDIDAPI)
    Retry->>DID: Create avatar video
    DID-->>Retry: videoUrl
    Retry-->>Service: { videoUrl }

    Service->>UI: Progress: GENERATING_VIDEO (70%)
    Service->>UI: Progress: COMPLETED (100%)
    Service-->>UI: { videoUrl, audioUrl, duration }
\`\`\`

**Constructor Options**:
\`\`\`typescript
interface VideoGenerationServiceConfig {
  openaiApiKey: string;
  didApiKey: string;
  onProgress?: (progress: ProgressState) => void;
}
\`\`\`

**Public API**:
\`\`\`typescript
async generateVideo(script: string): Promise<VideoGenerationResult>
\`\`\`

### 3. Utilities Layer

#### Validation Module (\`src/utils/validation.ts\`)

**Purpose**: Validate user input before processing

**Constraints**:
- Minimum length: 10 characters
- Maximum length: 5,000 characters
- Not empty or whitespace-only

**API**:
\`\`\`typescript
// Returns result object
validateScript(script: string): ValidationResult

// Throws VideoGenerationError if invalid
validateScriptOrThrow(script: string): void
\`\`\`

#### Retry Module (\`src/utils/retry.ts\`)

**Purpose**: Implement resilient API calls with exponential backoff

**Configuration**:
\`\`\`typescript
interface RetryConfig {
  maxRetries: number;           // Default: 3
  retryDelay: number;           // Default: 1000ms
  exponentialBackoff: boolean;  // Default: true
}
\`\`\`

**Retry Schedule** (with exponential backoff):
- Attempt 1: Immediate
- Attempt 2: Wait 1s (1000ms)
- Attempt 3: Wait 2s (2000ms)
- Attempt 4: Wait 4s (4000ms)

### 4. Type System

#### Error Types (\`src/types/errors.ts\`)

**Error Classification**:

\`\`\`typescript
type ApiErrorType =
  | 'OPENAI_ERROR'         // OpenAI API failures (retryable)
  | 'DID_ERROR'            // D-ID API failures (retryable)
  | 'NETWORK_ERROR'        // Network issues (retryable)
  | 'CREDIT_INSUFFICIENT'  // No API credits (non-retryable)
  | 'VALIDATION_ERROR'     // Bad input (non-retryable)
  | 'UNKNOWN_ERROR'        // Unexpected (retryable)
\`\`\`

#### Progress Types (\`src/types/progress.ts\`)

**Progress Steps**:
\`\`\`typescript
type ProgressStep =
  | 'VALIDATING'        // 0-20%
  | 'GENERATING_AUDIO'  // 20-50%
  | 'GENERATING_VIDEO'  // 50-90%
  | 'COMPLETED'         // 100%
  | 'ERROR'             // 0% with error message
\`\`\`

## Data Flow

### Video Generation Pipeline

\`\`\`mermaid
stateDiagram-v2
    [*] --> Validating: User submits script
    Validating --> GeneratingAudio: Input valid
    Validating --> Error: Validation failed

    GeneratingAudio --> GeneratingVideo: Audio created
    GeneratingAudio --> Retry: API error

    GeneratingVideo --> Completed: Video created
    GeneratingVideo --> Retry: API error

    Retry --> GeneratingAudio: Retry audio (< 3)
    Retry --> GeneratingVideo: Retry video (< 3)
    Retry --> Error: Max retries exceeded

    Completed --> [*]
    Error --> [*]

    note right of Retry
        Exponential backoff:
        1s → 2s → 4s
    end note
\`\`\`

## External API Integration

### OpenAI TTS API

**Endpoint**: \`https://api.openai.com/v1/audio/speech\`

**Request**:
\`\`\`typescript
{
  model: "tts-1",
  input: script,
  voice: "alloy"
}
\`\`\`

**Response**:
\`\`\`typescript
{
  audioUrl: string  // MP3 audio file URL
}
\`\`\`

### D-ID Avatar API

**Endpoint**: \`https://api.d-id.com/talks\`

**Request**:
\`\`\`typescript
{
  script: {
    type: "audio",
    audio_url: audioUrl
  },
  source_url: avatarImageUrl,
  config: {
    fluent: true,
    pad_audio: 0.0
  }
}
\`\`\`

**Response**:
\`\`\`typescript
{
  videoUrl: string,
  duration: number  // Video length in seconds
}
\`\`\`

## Miyabi Framework Integration

### Agent Architecture

\`\`\`mermaid
graph TB
    subgraph "GitHub"
        A[Issue Created]
        B[PR Created]
        C[PR Merged]
    end

    subgraph "Miyabi Agents"
        D[IssueAgent]
        E[CoordinatorAgent]
        F[CodeGenAgent]
        G[TestAgent]
        H[ReviewAgent]
        I[PRAgent]
        J[DeploymentAgent]
    end

    subgraph "Anthropic Claude"
        K[Sonnet 4]
    end

    A --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H -->|Score ≥ 80| I
    H -->|Score < 80| F
    I --> B
    C --> J

    D -.Uses.-> K
    E -.Uses.-> K
    F -.Uses.-> K
    H -.Uses.-> K

    style K fill:#d4a276
\`\`\`

### Agent Responsibilities

**1. IssueAgent**: Analyzes issues and applies 65-label classification

**2. CoordinatorAgent**: Breaks down tasks into DAG structure

**3. CodeGenAgent**: Generates production code with quality scoring

**4. ReviewAgent**: Static analysis and security scanning

**5. TestAgent**: Test execution and coverage reporting

**6. PRAgent**: Automatic Draft PR creation

**7. DeploymentAgent**: CI/CD automation with health checks

---

**Last Updated**: 2025-12-06 | **Version**: 1.0.0 | **Maintained by**: Miyabi Agents
