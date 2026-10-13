import { validate } from 'class-validator';
import { ConvertRequestDto } from './convert-request.dto';

describe('ConvertRequestDto', () => {
  it('accepts conversationId and messageId', async () => {
    const dto = Object.assign(new ConvertRequestDto(), {
      conversationId: 'conv-1',
      messageId: 'msg-1',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('accepts empty body when PDF is sent via multipart', async () => {
    const dto = new ConvertRequestDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects empty string when field is present', async () => {
    const dto = Object.assign(new ConvertRequestDto(), {
      conversationId: '',
      messageId: 'msg-1',
    });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'conversationId')).toBe(true);
  });
});
