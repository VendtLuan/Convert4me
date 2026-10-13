export type GenesysEmailAttachment = {
  id?: string;
  name?: string;
  contentUri?: string;
  contentType?: string;
  contentLength?: number;
  inlineImage?: boolean;
};

export type GenesysEmailMessage = {
  id?: string;
  subject?: string;
  attachments?: GenesysEmailAttachment[];
  textBody?: string;
  htmlBody?: string;
  time?: string;
  state?: string;
  direction?: string;
  selfUri?: string;
};
