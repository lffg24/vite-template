import { useReducer } from "react";

import type { WebDirectAssignedEvaluation, WebDirectForm } from "./types";
import { createWebDirectAttemptState, webDirectAttemptReducer } from "./webDirectAttempt";

export function useWebDirectAttempt(
  form: WebDirectForm,
  evaluations: WebDirectAssignedEvaluation[],
) {
  return useReducer(
    webDirectAttemptReducer,
    { form, evaluations },
    ({ form: initialForm, evaluations: initialEvaluations }) => (
      createWebDirectAttemptState(initialForm, initialEvaluations)
    ),
  );
}
