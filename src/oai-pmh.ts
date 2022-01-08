import {
  ListOptions,
  OaiPmhOptionsConstructor,
  RequestOptions,
} from './type/general';
import { IOaiPmhParser } from './interface/IOaiPmhParser';
import got from 'got';
import { OaiPmhError } from './oai-pmh-error';

export class OaiPmh {
  private readonly oaiPmhXML: IOaiPmhParser;
  private readonly requestOptions: RequestOptions;

  constructor(options: OaiPmhOptionsConstructor) {
    this.oaiPmhXML = options.xmlParser;
    this.requestOptions = {
      baseUrl: options.baseUrl,
      retry: (options && options.retry) ?? true,
      retryMax: (options && options.retryMax) ?? 600000,
      userAgent: (options && options.userAgent) || 'Node.js OAI-PMH',
    };
  }

  private async request(searchParams?: Record<string, string>) {
    try {
      return await got.get(this.requestOptions.baseUrl, {
        searchParams: searchParams,
        headers: { 'User-Agent': this.requestOptions.userAgent },
        retry: this.requestOptions.retry
          ? { maxRetryAfter: this.requestOptions.retryMax }
          : undefined,
      });
    } catch (error: any) {
      throw new OaiPmhError(
        error.response.statusCode
          ? `Unexpected status code ${error.response.statusCode} (expected 200).`
          : 'Unknown error',
      );
    }
  }

  public async getRecord(identifier: string, metadataPrefix: string) {
    const res = await this.request({
      verb: 'GetRecord',
      identifier,
      metadataPrefix,
    });
    return await this.oaiPmhXML.ParseRecord(res.body);
  }

  public async identify() {
    const res = await this.request({ verb: 'Identify' });
    return await this.oaiPmhXML.ParseIdentify(res.body);
  }

  private async *List(verb: string, field: string, options?: ListOptions) {
    let JSO: { [p: string]: any };
    let resumptionToken: string | null;
    const { body } = await this.request({
      ...options,
      verb,
    });
    JSO = this.oaiPmhXML.ParseOaiPmhXml(body);
    yield this.oaiPmhXML.ParseList(JSO, verb, field);
    while ((resumptionToken = this.oaiPmhXML.GetResumptionToken(JSO))) {
      const { body } = await this.request({
        verb,
        resumptionToken,
      });
      JSO = this.oaiPmhXML.ParseOaiPmhXml(body);
      yield this.oaiPmhXML.ParseList(JSO, verb, field);
    }
  }

  public async listMetadataFormats(identifier?: string) {
    const searchParams = { verb: 'ListMetadataFormats' };
    if (identifier) Object.assign(searchParams, { identifier });
    const res = await this.request(searchParams);
    return await this.oaiPmhXML.ParseMetadataFormats(res.body);
  }

  public listIdentifiers(options: ListOptions) {
    return this.List('ListIdentifiers', 'header', options);
  }

  public listRecords(options: ListOptions) {
    return this.List('ListRecords', 'record', options);
  }

  public listSets() {
    return this.List('ListSets', 'set');
  }
}
