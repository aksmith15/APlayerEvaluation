# useSurveyNavigation

React hook for managing survey state, navigation, and session persistence in the evaluation survey interface.

## Purpose

`useSurveyNavigation` provides comprehensive survey state management including navigation between different survey phases, response collection, progress tracking, and automatic session persistence. It handles the complex survey flow of base questions → scoring → conditional questions across multiple performance attributes.

## Signature

```typescript
function useSurveyNavigation(
  assignment: EvaluationAssignmentWithDetails | null,
  token: string | undefined
): SurveyNavigationState & SurveyNavigationActions
```

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `assignment` | `EvaluationAssignmentWithDetails \| null` | Yes | The evaluation assignment containing survey details |
| `token` | `string \| undefined` | Yes | Unique survey token for session identification |

## Returns

The hook returns a combined object containing both state and actions:

### State Properties

| Name | Type | Description |
|------|------|-------------|
| `currentPhase` | `SurveyPhase` | Current survey phase: 'intro' \| 'base_questions' \| 'scoring' \| 'conditional_questions' \| 'complete' |
| `currentAttributeIndex` | `number` | Index of current attribute being evaluated (0-based) |
| `currentScore` | `number \| null` | Current score selected for the attribute (1-10 scale) |
| `baseResponses` | `Record<string, Record<string, any>>` | Responses to base questions, keyed by attribute and question ID |
| `conditionalResponses` | `Record<string, Record<string, any>>` | Responses to conditional questions, keyed by attribute and question ID |
| `submissionId` | `string \| null` | Database submission ID once created |
| `session` | `EnhancedSurveySession \| null` | Complete session data for persistence |

### Action Functions

| Name | Type | Description |
|------|------|-------------|
| `startSurvey` | `() => void` | Begins the survey by transitioning from intro to base questions |
| `nextPhase` | `() => void` | Advances to the next survey phase or attribute |
| `previousPhase` | `() => void` | Returns to the previous survey phase or attribute |
| `setScore` | `(score: number) => void` | Sets the score for the current attribute |
| `updateBaseResponse` | `(questionId: string, value: any) => void` | Updates a base question response |
| `updateConditionalResponse` | `(questionId: string, value: any) => void` | Updates a conditional question response |
| `saveSession` | `() => void` | Manually saves current session to localStorage |
| `loadSession` | `() => void` | Manually loads session from localStorage |
| `resetSurvey` | `() => void` | Completely resets survey state and clears session |

## Usage Example

```typescript
// Initialize the survey navigation hook
const {
  currentPhase,
  currentAttributeIndex,
  currentScore,
  baseResponses,
  conditionalResponses,
  startSurvey,
  nextPhase,
  previousPhase,
  setScore,
  updateBaseResponse,
  updateConditionalResponse,
  resetSurvey
} = useSurveyNavigation(assignment, token);

// Handle survey progression
const handleStartSurvey = () => {
  startSurvey();
};

const handleScoreSelection = (score: number) => {
  setScore(score);
  setTimeout(() => nextPhase(), 500); // Brief delay for user feedback
};

// Handle question responses
const handleBaseQuestionResponse = (questionId: string, value: any) => {
  updateBaseResponse(questionId, value);
};

// Phase-specific rendering
const renderCurrentPhase = () => {
  switch (currentPhase) {
    case 'intro':
      return <SurveyIntro onStart={handleStartSurvey} />;
      
    case 'base_questions':
      return (
        <BaseQuestionForm
          attribute={PERFORMANCE_ATTRIBUTES[currentAttributeIndex]}
          responses={baseResponses}
          onResponse={handleBaseQuestionResponse}
          onNext={nextPhase}
          onPrevious={previousPhase}
        />
      );
      
    case 'scoring':
      return (
        <ScoringForm
          attribute={PERFORMANCE_ATTRIBUTES[currentAttributeIndex]}
          currentScore={currentScore}
          onScoreSelect={handleScoreSelection}
          onPrevious={previousPhase}
        />
      );
      
    case 'conditional_questions':
      return (
        <ConditionalQuestionForm
          attribute={PERFORMANCE_ATTRIBUTES[currentAttributeIndex]}
          score={currentScore}
          responses={conditionalResponses}
          onResponse={updateConditionalResponse}
          onNext={nextPhase}
          onPrevious={previousPhase}
        />
      );
      
    case 'complete':
      return <SurveyComplete onReset={resetSurvey} />;
      
    default:
      return <LoadingSpinner />;
  }
};
```

## Side Effects

### LocalStorage Operations
- **Session Persistence**: Automatically saves survey state to localStorage on every state change
- **Session Restoration**: Loads saved session on component mount
- **Storage Key**: Uses `survey_session_${token}` as the storage key

### Automatic State Management
- **Auto-save**: Session is automatically saved whenever survey state changes (except during intro phase)
- **Progress Tracking**: Maintains current position in multi-attribute survey flow
- **Session Cleanup**: Removes localStorage data when survey is reset

## Dependencies

### React Hooks
- `React.useState` - Managing complex survey state
- `React.useEffect` - Handling auto-save and session loading
- `React.useCallback` - Memoizing action functions

### Application Constants
- **`PERFORMANCE_ATTRIBUTES`** (from `../../../constants/attributes`)
  - Array of performance attributes to evaluate
  - Determines survey flow and current attribute context

### Type Definitions
- **`EvaluationAssignmentWithDetails`** (from `../../../types/database`)
  - Assignment information including evaluatee and evaluator details
- **`EnhancedSurveySession`** (from `../../../types/database`)
  - Complete session data structure for persistence

## Error Handling & Retries

### Session Loading Protection
```typescript
try {
  const parsedSession: EnhancedSurveySession = JSON.parse(savedSession);
  setState(prev => ({
    ...prev,
    session: parsedSession,
    // ... restore state
  }));
} catch (error) {
  console.error('Failed to load saved session:', error);
  // Continue with default state if session is corrupted
}
```

### Graceful Degradation
- **Missing Token**: Hook functions safely when token is undefined
- **Corrupted Session**: Falls back to default state if localStorage data is invalid
- **Missing Assignment**: Continues to function with null assignment for testing

## Performance Notes

### Memoization Strategy
```typescript
const saveSession = useCallback(() => {
  // Session saving logic
}, [token, assignment?.id, state, currentAttribute]);

const loadSession = useCallback(() => {
  // Session loading logic  
}, [token]);
```

### Automatic Optimization
- **Conditional Auto-save**: Only saves session after intro phase to avoid unnecessary storage operations
- **Stable References**: All action functions are memoized to prevent unnecessary re-renders
- **Minimal Re-renders**: State updates are batched where possible

### Memory Management
- **Session Cleanup**: `resetSurvey()` removes localStorage data
- **Garbage Collection**: Old session data is overwritten with new sessions

## Survey Flow Logic

### Phase Transitions
```typescript
const nextPhase = () => {
  switch (currentPhase) {
    case 'intro': → 'base_questions'
    case 'base_questions': → 'scoring'  
    case 'scoring': → 'conditional_questions'
    case 'conditional_questions': 
      if (isLastAttribute): → 'complete'
      else: → 'base_questions' (next attribute)
  }
};
```

### Navigation States
- **Forward Navigation**: Always advances to logical next step
- **Backward Navigation**: Supports returning to previous phases with context preservation
- **Cross-Attribute Navigation**: Handles transitions between different performance attributes

### Data Structure
```typescript
// Response storage pattern
baseResponses: {
  "competence": {
    "question_1": "response_value",
    "question_2": ["multiple", "values"]
  },
  "character": {
    "question_1": "response_value"
  }
}
```

## Session Persistence Schema

### EnhancedSurveySession Structure
```typescript
interface EnhancedSurveySession {
  assignment_id: string;
  current_attribute: string;
  current_attribute_index: number;
  current_score?: number;
  base_responses: Record<string, Record<string, any>>;
  conditional_responses: Record<string, Record<string, any>>;
  submission_id?: string;
  completed_attributes: string[];
  start_time: string;
  last_activity: string;
  is_complete: boolean;
}
```

---

**📁 File Location:** `a-player-dashboard/src/components/ui/survey/useSurveyNavigation.ts`  
**🔗 Related:** [Survey Components](../components/survey/), [EvaluationSurvey](../components/EvaluationSurvey.md)


