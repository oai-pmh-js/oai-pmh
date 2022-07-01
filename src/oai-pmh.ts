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

  private static cleanOptionsOfUndefined(options: ListOptions) {
    for (const key of Object.keys(options)) {
      const forcedKey = <keyof ListOptions>key;
      if (options[forcedKey] === undefined) delete options[forcedKey];
    }
    return options;
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

  async getRecord(
    identifier: string,
    metadataPrefix: string,
    requestOptions?: RequestOptions,
  ) {
    const xml = await this.request(
      new URLSearchParams({
        verb: 'GetRecord',
        identifier,
        metadataPrefix,
      }),
      requestOptions,
    );
    return await this.oaiPmhXML.parseRecord(this.oaiPmhXML.parseOaiPmhXml(xml));
  }

  async identify(requestOptions?: RequestOptions) {
    const xml = await this.request(this.identifyVerbURLParams, requestOptions);
    return await this.oaiPmhXML.parseIdentify(
      this.oaiPmhXML.parseOaiPmhXml(xml),
    );
  }

  async listMetadataFormats(
    identifier?: string,
    requestOptions?: RequestOptions,
  ) {
    const searchParams = new URLSearchParams({
      verb: 'ListMetadataFormats',
    });
    if (identifier) searchParams.set('identifier', identifier);
    const xml = await this.request(searchParams, requestOptions);
    return await this.oaiPmhXML.parseMetadataFormats(
      this.oaiPmhXML.parseOaiPmhXml(xml),
    );
  }

  private async *List<T extends keyof VerbsAndFieldsForList>(
    verb: T,
    field: VerbsAndFieldsForList[T],
    options?: ListOptions,
    requestOptions?: RequestOptions,
  ) {
    const xml = await this.request(
      new URLSearchParams({
        ...options,
        verb,
      }),
      requestOptions,
    );
    let parsedXml = this.oaiPmhXML.parseOaiPmhXml(xml);
    yield this.oaiPmhXML.parseList(parsedXml, verb, field);
    let resumptionToken: string | null;
    while (
      (resumptionToken = this.oaiPmhXML.parseResumptionToken(parsedXml, verb))
    ) {
      const xml = await this.request(
        new URLSearchParams({ verb, resumptionToken }),
        requestOptions,
      );
      parsedXml = this.oaiPmhXML.parseOaiPmhXml(xml);
      yield this.oaiPmhXML.parseList(parsedXml, verb, field);
    }
  }

  listIdentifiers(options: ListOptions, requestOptions?: RequestOptions) {
    return this.List(
      'ListIdentifiers',
      'header',
      OaiPmh.cleanOptionsOfUndefined(options),
      requestOptions,
    );
  }

  listRecords(options: ListOptions, requestOptions?: RequestOptions) {
    return this.List(
      'ListRecords',
      'record',
      OaiPmh.cleanOptionsOfUndefined(options),
      requestOptions,
    );
  }

  listSets(requestOptions?: RequestOptions) {
    return this.List('ListSets', 'set', undefined, requestOptions);
  }
}
