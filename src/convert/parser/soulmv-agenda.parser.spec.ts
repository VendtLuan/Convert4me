import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseSoulmvAgendaText } from './soulmv-agenda.parser';

const fixturePath = join(
  __dirname,
  '../../../test/fixtures/soulmv-agenda.sample.txt',
);

describe('parseSoulmvAgendaText', () => {
  it('extrai 48 pacientes em 3 datas distintas', () => {
    const text = readFileSync(fixturePath, 'utf8');
    const rows = parseSoulmvAgendaText(text);

    expect(rows).toHaveLength(48);

    const dates = [...new Set(rows.map((r) => r.data))].sort();
    expect(dates).toEqual(['07/10/2026', '14/10/2026', '21/10/2026']);

    expect(rows[0]).toMatchObject({
      data: '07/10/2026',
      endereco: 'RUA GUILHERME MARCONI, 440',
      unidade: 'AMBULATORIO CLINICA E DIAG',
      prestador: 'ANNA LUIZA SCALON PRATES',
      funcionamentoInicio: '07:00',
      funcionamentoFim: '11:30',
      agenda: '2134927',
      paciente: 'KAMILLY VICTORIA RAMALHO LIRA',
      matricula: '2308968',
      hora: '07:00',
    });
  });

  it('preenche telefone vazio quando ausente na linha', () => {
    const text = readFileSync(fixturePath, 'utf8');
    const rows = parseSoulmvAgendaText(text);
    const withoutPhone = rows.find((r) => r.paciente.includes('JANAINA DUCA'));

    expect(withoutPhone?.telefone).toBe('');
    expect(withoutPhone?.matricula).toBe('28346433');
  });
});
