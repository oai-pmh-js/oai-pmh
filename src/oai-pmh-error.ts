import { Response } from 'node-fetch';

export class OaiPmhError extends Error {
  private readonly response: Response;

  constructor(response: Response) {
    super(`HTTP Error Response: ${response.status} ${response.statusText}`);
    this.response = response;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
