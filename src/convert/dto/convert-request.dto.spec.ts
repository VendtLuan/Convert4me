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

  it('rejects missing or empty fields', async () => {
    const dto = new ConvertRequestDto();

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });
});
