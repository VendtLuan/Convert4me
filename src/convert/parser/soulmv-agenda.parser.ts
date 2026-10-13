import type {
  AgendaBlockMetadata,
  ScheduledPatientRow,
} from '../types/scheduled-patient-row';

const DATE_LINE = /^(\d{2}\/\d{2}\/\d{4})\tData:\s*$/;
const TIME = /^\d{2}:\d{2}$/;
const MATRICULA = /^\d+$/;
const PAGE_MARKER = /^-- \d+ of \d+ --$/;

function splitTabPair(line: string): [string, string] {
  const tab = line.indexOf('\t');
  if (tab === -1) {
    return [line.trim(), ''];
  }
  return [line.slice(0, tab).trim(), line.slice(tab + 1).trim()];
}

function isTableHeader(line: string): boolean {
  return line.includes('Tp. Atend. Plano') && line.includes('Hora');
}

function isNoiseLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) {
    return true;
  }
  if (PAGE_MARKER.test(trimmed)) {
    return true;
  }
  if (trimmed.startsWith('SOULMV')) {
    return true;
  }
  if (trimmed.startsWith('Período de ')) {
    return true;
  }
  if (trimmed === 'Em:' || trimmed === 'Emitido por:') {
    return true;
  }
  if (trimmed.startsWith('Lista de Pacientes Agendados')) {
    return true;
  }
  if (trimmed.startsWith('Página:')) {
    return true;
  }
  if (trimmed.startsWith('HOSPITAL E MATERNIDADE')) {
    return true;
  }
  if (/Total Geral de Pacientes:/.test(trimmed)) {
    return true;
  }
  if (trimmed === 'Unid.:\tSetor:' || trimmed === 'Recurso:\tPrestador:') {
    return true;
  }
  if (trimmed === '/\tFuncionamento:' || trimmed === 'Agenda:') {
    return true;
  }
  if (/^\d+$/.test(trimmed) && trimmed.length <= 2) {
    return true;
  }
  if (/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/.test(trimmed)) {
    return true;
  }
  if (trimmed === '/' || trimmed.startsWith('IGOR.')) {
    return true;
  }
  return false;
}

function isPatientRow(line: string): boolean {
  if (!line.startsWith('Ambulatorio')) {
    return false;
  }
  const parts = line.split('\t');
  if (parts.length < 6) {
    return false;
  }
  const hora = parts[parts.length - 1]?.trim();
  const matricula = parts[parts.length - 2]?.trim();
  return TIME.test(hora ?? '') && MATRICULA.test(matricula ?? '');
}

function parsePatientColumns(
  line: string,
): Omit<ScheduledPatientRow, keyof AgendaBlockMetadata> {
  const parts = line.split('\t').map((p) => p.trim());
  const hora = parts[parts.length - 1] ?? '';
  const matricula = parts[parts.length - 2] ?? '';

  if (parts.length >= 7) {
    return {
      tpAtendPlano: parts[0] ?? '',
      convenio: parts[1] ?? '',
      procedimento: parts[2] ?? '',
      telefone: parts[3] ?? '',
      paciente: parts[4] ?? '',
      matricula,
      hora,
    };
  }

  return {
    tpAtendPlano: parts[0] ?? '',
    convenio: parts[1] ?? '',
    procedimento: parts[2] ?? '',
    telefone: '',
    paciente: parts[3] ?? '',
    matricula,
    hora,
  };
}

function readBlockMetadata(
  lines: string[],
  startIndex: number,
): { block: AgendaBlockMetadata; nextIndex: number } | null {
  const dateLine = lines[startIndex]?.trim() ?? '';
  const match = DATE_LINE.exec(dateLine);
  if (!match) {
    return null;
  }

  const enderecoLine = lines[startIndex + 1] ?? '';
  const [endereco, unidade] = splitTabPair(enderecoLine);
  const prestador = (lines[startIndex + 2] ?? '').trim();
  const [funcionamentoFim, funcionamentoInicio] = splitTabPair(
    lines[startIndex + 3] ?? '',
  );
  const agenda = (lines[startIndex + 4] ?? '').trim();

  let nextIndex = startIndex + 5;
  while (nextIndex < lines.length && !isTableHeader(lines[nextIndex] ?? '')) {
    nextIndex++;
  }

  return {
    block: {
      data: match[1] ?? '',
      endereco,
      unidade,
      prestador,
      funcionamentoInicio,
      funcionamentoFim,
      agenda,
    },
    nextIndex,
  };
}

export function parseSoulmvAgendaText(text: string): ScheduledPatientRow[] {
  const lines = text.split(/\r?\n/);
  const rows: ScheduledPatientRow[] = [];
  let currentBlock: AgendaBlockMetadata | null = null;
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? '';

    if (DATE_LINE.test(line.trim())) {
      const parsed = readBlockMetadata(lines, index);
      if (parsed) {
        currentBlock = parsed.block;
        index = parsed.nextIndex + 1;
        continue;
      }
    }

    if (isTableHeader(line)) {
      index++;
      continue;
    }

    if (isNoiseLine(line)) {
      index++;
      continue;
    }

    if (currentBlock && isPatientRow(line)) {
      rows.push({
        ...currentBlock,
        ...parsePatientColumns(line),
      });
    }

    index++;
  }

  return rows;
}
