import { OaiPmhParserInterface } from './oai-pmh-parser.interface';

type VerbsAndFieldsForList = {
  ListIdentifiers: 'header';
  ListRecords: 'record';
  ListSets: 'set';
};

type ListOptions = {
  from?: string;
  until?: string;
  set?: string;
  metadataPrefix: string;
};

type RequestOptions = {
  timeout?: number | null;
  abortSignal?: AbortSignal;
  retry?: number;
};

type BaseOptions = {
  baseUrl: string;
  userAgent: { 'User-Agent': string };
};
type OaiPmhOptionsConstructor = {
  baseUrl: string;
  userAgent: string;
  xmlParser: OaiPmhParserInterface;
};

export {
  BaseOptions,
  ListOptions,
  OaiPmhOptionsConstructor,
  RequestOptions,
  VerbsAndFieldsForList,
};
