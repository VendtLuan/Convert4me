import type {
  AgendaBlockMetadata,
  ScheduledPatientRow,
} from '../types/scheduled-patient-row';

const DATE_LINE = /^(\d{2}\/\d{2}\/\d{4})\tData:\s*$/;
const TIME = /^\d{2}:\d{2}$/;
const RECORD_NUMBER = /^\d+$/;
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
  const appointmentTime = parts[parts.length - 1]?.trim();
  const medicalRecordId = parts[parts.length - 2]?.trim();
  return (
    TIME.test(appointmentTime ?? '') &&
    RECORD_NUMBER.test(medicalRecordId ?? '')
  );
}

function parsePatientColumns(
  line: string,
): Omit<ScheduledPatientRow, keyof AgendaBlockMetadata> {
  const parts = line.split('\t').map((p) => p.trim());
  const appointmentTime = parts[parts.length - 1] ?? '';
  const medicalRecordId = parts[parts.length - 2] ?? '';

  if (parts.length >= 7) {
    return {
      planType: parts[0] ?? '',
      insurance: parts[1] ?? '',
      procedure: parts[2] ?? '',
      phone: parts[3] ?? '',
      patient: parts[4] ?? '',
      medicalRecordId,
      appointmentTime,
    };
  }

  return {
    planType: parts[0] ?? '',
    insurance: parts[1] ?? '',
    procedure: parts[2] ?? '',
    phone: '',
    patient: parts[3] ?? '',
    medicalRecordId,
    appointmentTime,
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

  const addressLine = lines[startIndex + 1] ?? '';
  const [address, unit] = splitTabPair(addressLine);
  const provider = (lines[startIndex + 2] ?? '').trim();
  const [scheduleEnd, scheduleStart] = splitTabPair(
    lines[startIndex + 3] ?? '',
  );
  const scheduleId = (lines[startIndex + 4] ?? '').trim();

  let nextIndex = startIndex + 5;
  while (nextIndex < lines.length && !isTableHeader(lines[nextIndex] ?? '')) {
    nextIndex++;
  }

  return {
    block: {
      appointmentDate: match[1] ?? '',
      address,
      unit,
      provider,
      scheduleStart,
      scheduleEnd,
      scheduleId,
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
