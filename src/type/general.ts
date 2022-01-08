import { IOaiPmhParser } from '../interface/IOaiPmhParser';
import { URL } from 'url';

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
};
type OaiPmhOptions = {
  xmlParser: IOaiPmhParser;
};
type OaiPmhOptionsConstructor = OaiPmhOptions &
  Partial<Omit<RequestOptions, 'baseUrl'>> &
  Required<Pick<RequestOptions, 'baseUrl'>>;

export { ListOptions, OaiPmhOptionsConstructor, RequestOptions };
