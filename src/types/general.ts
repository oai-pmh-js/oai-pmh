import { OaiPmhParserInterface } from '../interface/oai-pmh-parser.interface';
import { URL } from 'url';
import { Delays } from 'got';

type VerbsAndFields = {
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
  baseUrl: string | URL;
  retryMax: number;
  userAgent: string;
  retry: boolean;
  timeout: Delays;
};
type OaiPmhOptions = {
  xmlParser: OaiPmhParserInterface;
};
type OaiPmhOptionsConstructor = OaiPmhOptions &
  Partial<Omit<RequestOptions, 'baseUrl'>> &
  Required<Pick<RequestOptions, 'baseUrl' | 'timeout'>>;

export {
  ListOptions,
  OaiPmhOptionsConstructor,
  RequestOptions,
  VerbsAndFields,
};
