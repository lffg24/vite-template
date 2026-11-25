export type WebDirectResponsible = {
  name: string;
  email?: string | null;
  phone?: string | null;
};

export type WebDirectCompanyContact = {
  name: string;
  email?: string | null;
  phone?: string | null;
};

export type WebDirectApplicationContext = {
  applicationName?: string | null;
  responsible?: WebDirectResponsible | null;
  company?: WebDirectCompanyContact | null;
};

export type WebDirectIdentification = {
  documentType: string;
  documentNumber: string;
  birthDate: string;
};

export type WebDirectConsentDocument = {
  id: string;
  title: string;
  description: string;
  version: string;
  href: string;
};

export type WebDirectForm = "A" | "B";

export type WebDirectInstrumentCode =
  | "PSICO_INTRA_A"
  | "PSICO_INTRA_B"
  | "PSICO_EXTRA"
  | "PSICO_ESTRES";

export type WebDirectJourneyCode = WebDirectInstrumentCode | "DATOS_GENERALES";

export type WebDirectStageStatus = "pending" | "current" | "completed";

export type WebDirectAssignedEvaluation = {
  evaluationId: number;
  instrumentCode: WebDirectInstrumentCode;
  name: string;
  totalQuestions: number;
  status: WebDirectStageStatus;
};

export type WebDirectJourneyStage = {
  code: WebDirectJourneyCode;
  evaluationId?: number;
  title: string;
  description: string;
  totalQuestions?: number;
  status: WebDirectStageStatus;
};

export type WebDirectQuestionOption = {
  label: string;
  value: string;
};

export type WebDirectQuestion = {
  questionId: number;
  order: number;
  text: string;
  helpText?: string | null;
  options: WebDirectQuestionOption[];
  required?: boolean;
  dimensionCode?: string | null;
  dimensionLabel?: string | null;
  domainCode?: string | null;
  domainLabel?: string | null;
};

export type WebDirectConditionalRule = {
  code: string;
  label?: string;
  questionOrders: number[];
  answer?: boolean | null;
};

export type WebDirectAnswer = {
  questionId: number;
  order: number;
  value: string;
  instrumentCode: WebDirectInstrumentCode;
  dimensionCode?: string | null;
  domainCode?: string | null;
};

export type WebDirectDemographicOption = {
  label: string;
  value: string;
};

export type WebDirectDemographicField = {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "municipality";
  required?: boolean;
  placeholder?: string;
  options?: WebDirectDemographicOption[];
  autoComplete?: string;
  min?: number;
  max?: number;
  readOnly?: boolean;
  departmentFieldId?: string;
};

export type WebDirectMunicipality = {
  id: number;
  municipio: string;
  departamento?: string | null;
};

export type WebDirectDemographicSection = {
  id: string;
  title: string;
  description?: string;
  fields: WebDirectDemographicField[];
};

export type WebDirectDemographicValues = Record<string, string>;
