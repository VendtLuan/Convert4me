export type AgendaBlockMetadata = {
  data: string;
  endereco: string;
  unidade: string;
  prestador: string;
  funcionamentoInicio: string;
  funcionamentoFim: string;
  agenda: string;
};

export type ScheduledPatientRow = AgendaBlockMetadata & {
  tpAtendPlano: string;
  convenio: string;
  procedimento: string;
  telefone: string;
  paciente: string;
  matricula: string;
  hora: string;
};
