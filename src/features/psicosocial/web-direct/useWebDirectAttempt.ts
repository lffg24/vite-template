import { useReducer } from "react";

import type { WebDirectAssignedEvaluation, WebDirectDemographicValues, WebDirectForm } from "./types";
import { createWebDirectAttemptState, webDirectAttemptReducer } from "./webDirectAttempt";

export function useWebDirectAttempt(
  form: WebDirectForm,
  evaluations: WebDirectAssignedEvaluation[],
  initialDemographics: WebDirectDemographicValues = {},
) {
  return useReducer(
    webDirectAttemptReducer,
    { form, evaluations, initialDemographics },
    ({ form: initialForm, evaluations: initialEvaluations, initialDemographics: demographics }) => (
      createWebDirectAttemptState(initialForm, initialEvaluations, demographics)
    ),
  );
}
