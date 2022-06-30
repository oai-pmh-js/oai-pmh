import {
  ListOptions,
  OaiPmhOptionsConstructor,
  RequestOptions,
  BaseOptions,
  VerbsAndFieldsForList,
} from './model/general';
import { OaiPmhParserInterface } from './model/oai-pmh-parser.interface';
import { default as fetch, AbortError } from 'node-fetch';
import { OaiPmhError } from './oai-pmh-error.js';

export class OaiPmh {
  private readonly oaiPmhXML: OaiPmhParserInterface;
  private readonly requestOptions: BaseOptions;
  private readonly identifyVerbURLParams = new URLSearchParams({
    verb: 'Identify',
  });

  constructor(options: OaiPmhOptionsConstructor) {
    this.oaiPmhXML = options.xmlParser;
    new URL(options.baseUrl);
    this.requestOptions = {
      baseUrl: options.baseUrl,
      userAgent: { 'User-Agent': options.userAgent || 'Node.js OAI-PMH' },
    };
  }

  private async request(
    searchParams?: URLSearchParams,
    options?: RequestOptions,
  ): Promise<string> {
    const abortController = options?.abortController || new AbortController();
    const searchURL = new URL(this.requestOptions.baseUrl);
    if (searchParams) searchURL.search = searchParams.toString();
    const promise = fetch(searchURL.toString(), {
      method: 'GET',
      signal: abortController.signal,
      headers: this.requestOptions.userAgent,
    });
    const timeout = options?.timeout;
    const timer = timeout
      ? setTimeout(() => abortController.abort(), timeout)
      : undefined;
    try {
      return (await promise).text();
    } catch (e: any) {
      if (e instanceof AbortError) throw e;
      if (options?.retry && options.retry > 0) {
        options.retry -= 1;
        return await this.request(searchParams, options);
      }
      throw new OaiPmhError(e.message);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async getRecord(identifier: string, metadataPrefix: string) {
    const xml = await this.request(
      new URLSearchParams({
        verb: 'GetRecord',
        identifier,
        metadataPrefix,
      }),
    );
    return await this.oaiPmhXML.ParseRecord(this.oaiPmhXML.ParseOaiPmhXml(xml));
  }

  async identify() {
    const xml = await this.request(this.identifyVerbURLParams);
    return await this.oaiPmhXML.ParseIdentify(
      this.oaiPmhXML.ParseOaiPmhXml(xml),
    );
  }

  async listMetadataFormats(identifier?: string) {
    const searchParams = new URLSearchParams({
      verb: 'ListMetadataFormats',
    });
    if (identifier) searchParams.set('identifier', identifier);
    const xml = await this.request(searchParams);
    return await this.oaiPmhXML.ParseMetadataFormats(
      this.oaiPmhXML.ParseOaiPmhXml(xml),
    );
  }

  private async *List<T extends keyof VerbsAndFieldsForList>(
    verb: T,
    field: VerbsAndFieldsForList[T],
    options?: ListOptions,
    requestOptions?: RequestOptions,
  ) {
    let JSO: { [k: string]: any };
    let resumptionToken: string | null;
    const xml = await this.request(
      new URLSearchParams({
        ...options,
        verb,
      }),
      requestOptions,
    );
    JSO = this.oaiPmhXML.ParseOaiPmhXml(xml);
    yield this.oaiPmhXML.ParseList(JSO, verb, field);
    while ((resumptionToken = this.oaiPmhXML.GetResumptionToken(JSO[verb]))) {
      const xml = await this.request(
        new URLSearchParams({
          verb,
          resumptionToken,
        }),
        requestOptions,
      );
      JSO = this.oaiPmhXML.ParseOaiPmhXml(xml);
      yield this.oaiPmhXML.ParseList(JSO, verb, field);
    }
  }

  listIdentifiers(options: ListOptions, requestOptions?: RequestOptions) {
    return this.List('ListIdentifiers', 'header', options, requestOptions);
  }

  listRecords(options: ListOptions, requestOptions?: RequestOptions) {
    return this.List('ListRecords', 'record', options, requestOptions);
  }

  listSets(requestOptions?: RequestOptions) {
    return this.List('ListSets', 'set', undefined, requestOptions);
  }
}
